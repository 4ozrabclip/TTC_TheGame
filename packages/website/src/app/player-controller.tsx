import { Vector3, Quaternion, ImportMeshAsync, Scene, PhysicsCharacterController, CharacterSupportedState, PointerEventTypes, KeyboardEventTypes, Camera, FreeCamera, Vector } from "@babylonjs/core";
const ZOOM = 20;

export const PlayerController = (scene: Scene, camera: FreeCamera, startPoint: Vector3) => {


    var state: any = "IN_AIR";

    var inAirSpeed = 8.0;
    var onGroundSpeed = 10.0;
    var jumpHeight = 1.5;

    var wantJump = false;
    var inputDirection = new Vector3(0, 0, 0);
    var forwardLocalSpace = new Vector3(0, 0, 1);
    let characterOrientation = Quaternion.Identity();
    let characterGravity = new Vector3(0, -9.81, 0);



    ImportMeshAsync("Adventurer.fixed.glb", scene).then(({ transformNodes, meshes, animationGroups }) => {
        const character = meshes[0]; // Assuming root mesh
        character.position = startPoint;

        character.scaling = new Vector3(1.8, 1.8, 1.8);
        // character.checkCollisions = true;


        console.log({animationGroups})
        animationGroups.map((x) => x.stop())

        const idleAnim = animationGroups.find((group) => {
            return group.name == "CharacterArmature|Idle_Neutral"
        })

        scene.stopAnimation(character.skeleton)

        const walkingAnim = animationGroups.find((group) => {
            return group.name == "CharacterArmature|Run"
        })

        const jumpingAnim = animationGroups.find((group) => {
            return group.name == "CharacterArmature|Roll"
        })
        console.log({idleAnim})

        idleAnim?.start(true);

        // new PhysicsAggregate(transformNodes[0], PhysicsShapeType.BOX, { mass: 0.1 }, scene)

        // character.physicsBody?.setAngularDamping(1);

        // character.physicsImpostor?.physicsBody.setAngularFactor(new Vector3(0, 0, 0))
        // character.physicsImpostor = new PhysicsImpostor(
        //     character, 
        //     PhysicsImpostor.BoxImpostor, 
        //     {mass: 0.1, }, 
        //     scene);

        // (character.physicsImpostor as any).setAngularFactor(new Vector3(0, 0, 0));
        // character.gravi


        const controller = new PhysicsCharacterController(
            startPoint,
            {
                capsuleHeight: 1.8,
                capsuleRadius: 0.6
            },
            scene
        )

        // controller.keepContactTolerance = 1;

        // controller.keepDistance = 1;

        // controller.maxSlopeCosine = Math.cos(Math.PI * (90 / 180.0));


        // controller.maxStep

        camera.setTarget(
            startPoint
        );

        // State handling
        // depending on character state and support, set the new state
        var getNextState = function (supportInfo: any) {
            // console.log(state)
            if (state == "IN_AIR") {
                if (supportInfo.supportedState == CharacterSupportedState.SUPPORTED) {
                    return "ON_GROUND";
                }
                return "IN_AIR";
            } else if (state == "ON_GROUND") {
                if (supportInfo.supportedState != CharacterSupportedState.SUPPORTED) {
                    return "IN_AIR";
                }

                if (wantJump) {
                    return "START_JUMP";
                }
                return "ON_GROUND";
            } else if (state == "START_JUMP") {
                return "IN_AIR";
            }
        }

        var getDesiredVelocity = function (deltaTime: any, supportInfo: any, characterOrientation: any, currentVelocity: any) {
            let nextState = getNextState(supportInfo);
            if (nextState != state) {
                state = nextState;
            }

            let upWorld = characterGravity.normalizeToNew();
            upWorld.scaleInPlace(-1.0);
            let forwardWorld = forwardLocalSpace.applyRotationQuaternion(characterOrientation);
            if (state == "IN_AIR") {
                let desiredVelocity = inputDirection.scale(inAirSpeed).applyRotationQuaternion(characterOrientation);
                let outputVelocity = controller.calculateMovement(deltaTime, forwardWorld, upWorld, currentVelocity, Vector3.ZeroReadOnly, desiredVelocity, upWorld);
                // Restore to original vertical component
                outputVelocity.addInPlace(upWorld.scale(-outputVelocity.dot(upWorld)));
                outputVelocity.addInPlace(upWorld.scale(currentVelocity.dot(upWorld)));
                // Add gravity
                outputVelocity.addInPlace(characterGravity.scale(deltaTime));
                return outputVelocity;
            } else if (state == "ON_GROUND") {
                // Move character relative to the surface we're standing on
                // Correct input velocity to apply instantly any changes in the velocity of the standing surface and this way
                // avoid artifacts caused by filtering of the output velocity when standing on moving objects.
                let desiredVelocity = inputDirection.scale(onGroundSpeed).applyRotationQuaternion(characterOrientation);

                let outputVelocity = controller.calculateMovement(deltaTime, forwardWorld, supportInfo.averageSurfaceNormal, currentVelocity, supportInfo.averageSurfaceVelocity, desiredVelocity, upWorld);
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
            } else if (state == "START_JUMP") {
                let u = Math.sqrt(2 * characterGravity.length() * jumpHeight);
                let curRelVel = currentVelocity.dot(upWorld);



                return currentVelocity.add(upWorld.scale(u - curRelVel));
            }
            return Vector3.Zero();
        }




        scene.onBeforeRenderObservable.add((scene) => {
            character.position.copyFrom(controller.getPosition());

            // character.rotation.y = characterOrientation.toEulerAngles().y * 180;

            // character.rotate(Vector3.Up(), characterOrientation.toEulerAngles().y);
            // camera following
            var cameraDirection = camera.getDirection(new Vector3(0, 0, 1));

            cameraDirection.y = 0;
            cameraDirection.normalize();

            camera.setTarget(Vector3.Lerp(camera.getTarget(), character.position, 0.1));

            var dist = Vector3.Distance(camera.position, character.position);
            const amount = (Math.min(dist - (ZOOM - 4), 0) + Math.max(dist - (ZOOM + 4), 0)) * 0.04;
            cameraDirection.scaleAndAddToRef(amount, camera.position);

            camera.position.y += (character.position.y + 10 - camera.position.y) * 0.04;
        });

        // After physics update, compute and set new velocity, update the character controller state
        scene.onAfterPhysicsObservable.add((_) => {
            if (scene.deltaTime == undefined) return;
            let dt = scene.deltaTime / 1000.0;
            if (dt == 0) return;

            let down = new Vector3(0, -1, 0);
            let support = controller.checkSupport(dt, down);

            Quaternion.FromEulerAnglesToRef(0, camera.rotation.y, 0, characterOrientation);

            let desiredLinearVelocity = getDesiredVelocity(dt, support, characterOrientation, controller.getVelocity());

            character.rotationQuaternion?.copyFrom(characterOrientation);

            controller.setVelocity(desiredLinearVelocity);

            controller.integrate(dt, support, characterGravity);

        });

        let isMouseDown = false;
        scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERWHEEL:
                    break;
                case PointerEventTypes.POINTERDOWN:
                    isMouseDown = true;
                    break;

                case PointerEventTypes.POINTERUP:
                    isMouseDown = false;
                    break;

                case PointerEventTypes.POINTERMOVE:
                    if (isMouseDown) {
                        var tgt = camera.getTarget().clone();
                        camera.position.addInPlace(camera.getDirection(Vector3.Right()).scale(pointerInfo.event.movementX * -0.05));
                        camera.setTarget(tgt);
                    }
                    break;
            }
        });
        // Input to direction
        // from keys down/up, update the Vector3 inputDirection to match the intended direction. Jump with space
        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    if (kbInfo.event.key == 'w' || kbInfo.event.key == 'ArrowUp') {
                        inputDirection.z = 1;
                        // idleAnim?.stop();
                        walkingAnim?.start(true);
                    } else if (kbInfo.event.key == 's' || kbInfo.event.key == 'ArrowDown') {
                        inputDirection.z = -1;
                    } else if (kbInfo.event.key == 'a' || kbInfo.event.key == 'ArrowLeft') {
                        inputDirection.x = -1;
                        // character.rotate(new Vector3(0, 1, 0), 1);
                    } else if (kbInfo.event.key == 'd' || kbInfo.event.key == 'ArrowRight') {
                        inputDirection.x = 1;
                    } else if (kbInfo.event.key == ' ') {
                        wantJump = true;
                        jumpingAnim?.start();
                    }
                    break;
                case KeyboardEventTypes.KEYUP:
                    if (kbInfo.event.key == 'w' || kbInfo.event.key == 's' || kbInfo.event.key == 'ArrowUp' || kbInfo.event.key == 'ArrowDown') {
                        inputDirection.z = 0;
                        // walkingAnim?.stop()

                        idleAnim?.start(true)
                        walkingAnim?.stop()

                    }
                    if (kbInfo.event.key == 'a' || kbInfo.event.key == 'd' || kbInfo.event.key == 'ArrowLeft' || kbInfo.event.key == 'ArrowRight') {
                        inputDirection.x = 0;
                    } else if (kbInfo.event.key == ' ') {
                        wantJump = false;
                    }
                    break;
            }
        });
        // setupThirdPersonControls(scene, character);
        // setupFollowCamera(scene, character);
    });

}