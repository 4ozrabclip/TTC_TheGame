import { CharacterShapeOptions, CharacterSupportedState, Color3, Mesh, MeshBuilder, PhysicsCharacterController, Quaternion, Ray, RayHelper, Scene, Space, Vector3 } from "@babylonjs/core";
import { GameState } from "../../state";

let characterGravity = new Vector3(0, -9.81, 0);

var inAirSpeed = 3;
var onGroundSpeed = 5.0;
var jumpHeight = 1.5;

export abstract class BaseObject {

    type: string = 'base';

    supported = "IN_AIR";

    mesh: Mesh;

    position: Vector3;
    inputDirection = new Vector3(0, 0, 0);
    characterOrientation: Quaternion = Quaternion.Identity();

    velocity: number;
    rotationVelocity: number

    genes: { [key: string]: any } = {};

    controller: PhysicsCharacterController;

    scene: Scene;
    gameState: GameState;

    private forwardLocalSpace = new Vector3(0, 0, 1);

    constructor(scene: Scene, gameState: GameState, mesh: Mesh, position: Vector3, velocity: number = 0.05) {
        this.mesh = mesh;
        this.gameState = gameState;
        this.scene = scene;
        this.position = position;
        this.velocity = velocity;
        this.rotationVelocity = 0.1;

        this.controller = new PhysicsCharacterController(
            this.position,
            {
                capsuleHeight: 1,
                capsuleRadius: 0.5,
            },
            scene
        )

        // this.controller.maxCastIterations = 25;
        // const root = MeshBuilder.CreateCapsule('root', {
        //     height: 1,
        //     radius: 0.5
        // })

        // root.parent = mesh

        // this.controller.keepContactTolerance = 1;
        // this.controller.keepDistance = 1;
        // this.controller.staticFriction = 0.2;

        this.controller.maxSlopeCosine = Math.cos(Math.PI * (90 / 180.0));
    }

    //reproduction
    clone(mate?: BaseObject) {
        if (mate) {
            if (mate.type = this.type) {

            }
        }
    }


    getNextPosition() {
        // this.direction.sc
        return this.position.add(this.characterOrientation.scale(this.velocity))
    }

    getNextState(supportInfo: any) {
        if (this.supported == "IN_AIR") {
            if (supportInfo.supportedState == CharacterSupportedState.SUPPORTED) {
                return "ON_GROUND";
            }
        } else if (this.supported == "ON_GROUND") {
            if (supportInfo.supportedState != CharacterSupportedState.SUPPORTED) {
                return "IN_AIR";
            }
        }
        return this.supported;
    }


    getDesiredVelocity (deltaTime: any, supportInfo: any, characterOrientation: any, currentVelocity: any) {
        let nextState = this.getNextState(supportInfo);
        if (nextState != this.supported) {
            this.supported = nextState;
        }

        let upWorld = characterGravity.normalizeToNew();
        upWorld.scaleInPlace(-1.0);
        let forwardWorld = this.forwardLocalSpace.applyRotationQuaternion(characterOrientation);

        if (this.supported == "IN_AIR") {
            let desiredVelocity = this.inputDirection.scale(inAirSpeed).applyRotationQuaternion(characterOrientation);
            let outputVelocity = this.controller.calculateMovement(deltaTime, forwardWorld, upWorld, currentVelocity, Vector3.ZeroReadOnly, desiredVelocity, upWorld);
            // Restore to original vertical component
            outputVelocity.addInPlace(upWorld.scale(-outputVelocity.dot(upWorld)));
            outputVelocity.addInPlace(upWorld.scale(currentVelocity.dot(upWorld)));
            // Add gravity
            outputVelocity.addInPlace(characterGravity.scale(deltaTime));
            return outputVelocity;
        } else if (this.supported == "ON_GROUND") {
            // Move character relative to the surface we're standing on
            // Correct input velocity to apply instantly any changes in the velocity of the standing surface and this way
            // avoid artifacts caused by filtering of the output velocity when standing on moving objects.
            let desiredVelocity = this.inputDirection.scale(onGroundSpeed).applyRotationQuaternion(characterOrientation);

            // return desiredVelocity
            let outputVelocity = this.controller.calculateMovement(deltaTime, forwardWorld, supportInfo.averageSurfaceNormal, currentVelocity, supportInfo.averageSurfaceVelocity, desiredVelocity, upWorld);
            // Horizontal projection
            {
                outputVelocity.subtractInPlace(supportInfo.averageSurfaceVelocity);
                let inv1k = 1e-3;
                if (outputVelocity.dot(upWorld) > inv1k) {
                    let velLen = outputVelocity.length();
                    outputVelocity.normalizeFromLength(velLen);

                    // Get the desired length in the horizontal direction
                    let horizLen = velLen / supportInfo.averageSurfaceNormal.dot(upWorld);

                    // Re project the velocity onto the horizontal plane
                    let c = supportInfo.averageSurfaceNormal.cross(outputVelocity);
                    outputVelocity = c.cross(upWorld);
                    outputVelocity.scaleInPlace(horizLen);
                }
                outputVelocity.addInPlace(supportInfo.averageSurfaceVelocity);
                return outputVelocity;
            }
        } else if (this.supported == "START_JUMP") {
            let u = Math.sqrt(2 * characterGravity.length() * jumpHeight);
            let curRelVel = currentVelocity.dot(upWorld);

            return currentVelocity.add(upWorld.scale(u - curRelVel));
        }
        return Vector3.Zero();
    }

    beforeNextFrame(){

    }


    beforeRender() {
        let dt = this.scene.deltaTime / 1000.0;

        // console.log({dt})
        // console.log(this.state)


        // const support = this.controller.checkSupport(this.scene.deltaTime / 1000, Vector3.Down());
        // this.state = this.getNextState(support);

        const position = this.getNextPosition();
        if(dt == 0)
            this.controller.setPosition(position)

        // console.log("NEXT", { position, old: this.position })
        this.mesh.position.copyFrom(this.controller.getPosition());
        // this.mesh.position.y -= 2;
        this.position = position; //this.controller.getPosition();

        if(this.scene.deltaTime % 2 == 0)
            this.beforeNextFrame();

        // let rotation = Math.atan2(this.characterOrientation.x, this.characterOrientation.z) + Math.PI;
        // let amount = (rotation - this.mesh.rotation.y);
        // if (amount > this.rotationVelocity) {
        //     amount = this.rotationVelocity;
        // }
        // this.mesh.rotation = new Vector3(this.mesh.rotation.x, this.mesh.rotation.y + amount, this.mesh.rotation.z);


    }

    afterPhysics() {
        let dt = this.scene.deltaTime / 1000.0;
        if (dt == 0) return;

        let down = new Vector3(0, -1, 0);
        let support = this.controller.checkSupport(dt, characterGravity);


        // const ray = new Ray(this.mesh.position, Vector3.Down(), 2);
        // const hit = this.scene.pickWithRay(ray);

        // if (hit?.pickedMesh) {
        //     support.supportedState = 2
        //     // console.log("Ground detected at", hit.pickedPoint?.y);
        // } else {
        //     // hit.
        //     console.log("No ground contact", this.mesh.position);
        //     RayHelper.CreateAndShow(ray, this.scene, Color3.Green());
        // }


        
        let desiredLinearVelocity = this.getDesiredVelocity(dt, support, this.characterOrientation, this.controller.getVelocity());

        const correction = Quaternion.RotationAxis(new Vector3(0, 1, 0), Math.PI);

        this.mesh.rotationQuaternion = correction.multiply(this.characterOrientation);

        // if(this.mesh.rotationQuaternion)
        //     this.mesh.rotationQuaternion.addInPlace(Quaternion.FromEulerAngles(0, Math.PI, 0));

        this.controller.setVelocity(desiredLinearVelocity);

        this.controller.integrate(dt, support, characterGravity)
    }

}