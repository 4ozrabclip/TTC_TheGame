import { AnimationGroup, Bone, Color3, Mesh, Quaternion, Ray, RayHelper, Scene, Vector3 } from "@babylonjs/core";
import { BaseObject } from "./base-class";
import { worldToHex } from "../../world-generator";
import { GameState } from "../../state";

export class Cow extends BaseObject {

    animations: AnimationGroup[];

    state = "IDLE";

    wantsIdle = false;
    wantsFood = false;

    changeDirection: any;

    currentAnim : any;

    hunger = 0;

    constructor(scene: Scene, gameState: GameState, mesh: Mesh, animations: AnimationGroup[], position: Vector3, velocity: number){
        super(scene, gameState, mesh, position, velocity);

            mesh.skeleton = mesh.skeleton?.clone('anim-skeleton') as any
            
            this.animations = animations; //.map((x) => x.clone(`anim-${x.name}`));
            // this.animations.map((x) => x.setWeightForAllAnimatables(0.5));
            // , (oldTarget) => {
            //     // if (oldTarget === mesh) return mesh;
            //     if (oldTarget instanceof Bone) {
            //         const boneIndex: any = mesh.skeleton?.bones.indexOf(oldTarget);
            //         return mesh.skeleton?.bones[boneIndex] ?? oldTarget;
            //     }
            //     return oldTarget;
            // }));

        // const idle = mesh.getAnimationByName("Idle")
        
        this.animate("Idle_2")

        // this.animations.map((x) => x.stop());
        // this.animations.find((a) => a.name.indexOf("Eating") > -1)?.start(true);

        this.hunger = Math.random();

        this.beforeNextFrame = this.beforeNextFrame.bind(this)
    }

    animate(name: string){
        if(this.currentAnim){
            this.currentAnim.reset()
            this.currentAnim.stop();
        }

        this.currentAnim = this.animations.find((a) => a.name.indexOf(name) > -1);
        this.currentAnim?.start(true);

    }

    beforeNextFrame(){
        if(this.state != "EATING"){
            this.hunger += 0.0001;
        }

        if(this.state == "EATING"){
            this.inputDirection = Vector3.Zero();
            this.controller.setVelocity(Vector3.Zero());

            const {col, row} = worldToHex(this.controller.getPosition().x, this.controller.getPosition().z)

            const tile = this.gameState.getTile(col, row)
            if(tile && tile.type == 'grass'){
                if(tile.take('health', 0.01)){
                    this.hunger -= 0.0001;
                }else{
                    console.log("Failed to take a piece of ", tile)
                    this.state = 'IDLE'
                    this.animate("Idle_2")
                }

                if(this.hunger < 0.3){
                    this.state = "IDLE";
                    this.animate("Idle_2")
                }
            }else{
                console.log({tile, hunger: this.hunger})
                this.state = 'IDLE'
                this.animate("Idle_2")
            }

        }else if(this.state == "WANTS_FOOD"){
            this.inputDirection = new Vector3(0, 0, 1);

            const ray = new Ray(this.controller.getPosition(), Vector3.Down(), 2);
            const hit = this.scene.pickWithRay(ray, (mesh) => mesh.name.indexOf('ground') > -1);

            if (hit?.pickedMesh) {
                const match : any = hit.pickedMesh.name.match(/ground-(.?)-(.?)/);

                const tile = this.gameState.getTile(match?.[1], match?.[2])

                if(tile?.center){

                    if(tile?.type == 'grass' && Vector3.Distance(tile.center, this.mesh.position) < 10  ){ //this.gameState.getTile(match?.[1] - 1, match?.[2])?.type == 'grass'){
                        // console.log({match, tile: this.gameState.getTile(match?.[1], match?.[2]), mesh: hit.pickedMesh.material?.name, tiles: this.gameState.tiles })
        
                
                        this.state = 'EATING';
        
                        this.animate("Eating");
        
                        // this.animations.map((x) => x.stop())
                        // this.animations.find((a) => a.name.indexOf("Eat") > -1)?.start(true);
        
        
                        clearInterval(this.changeDirection)
                    }else{
                        // RayHelper.CreateAndShow(ray, this.scene, Color3.Green());

                    }
                }

                // support.supportedState = 2
                // console.log("Ground detected at", hit.pickedPoint?.y);
            } else {
                // hit.
                // console.log("No ground contact", this.mesh.position);
            }


        }


        if(this.hunger > 0.5 && this.state != "EATING" && this.state != 'WANTS_FOOD'){
            this.state = 'WANTS_FOOD'; 

                // this.animations.map((x) => x.stop())

            this.animate("Walk");

            // this.animations.find((a) => a.name.indexOf("Walk") > -1)?.start(true);
            this.inputDirection = new Vector3(0, 0,1);
            this.wantsFood = false

            this.characterOrientation = Quaternion.FromEulerAngles(0, Math.random() * 2 * Math.PI, 0);

            if(!this.changeDirection)
                        this.changeDirection = setInterval(() => {
                            // this.changeDirection = null;
                            // Quaternion.FromEulerAngles()
                            this.characterOrientation = Quaternion.FromEulerAngles(0, Math.random() * 2 * Math.PI, 0);

                            // this.characterOrientation.y = Math.random() - 0.5;
                            // this.characterOrientation.z = Math.random() - 0.5;
                            
                        }, 10 * 1000)

        }

        // if(this.mesh.name.indexOf('Deer') > -1)

        //     console.log("HUNGER", this.hunger, this.mesh.name, this.state)

    }

    // getNextState(){
    //     if(this.wantsIdle){
    //         // this.mesh.beginAnimation("Idle")
    //         this.animations.find((a) => a.name.indexOf("Idle") > -1)?.start(true);

    //         return "IDLE";
    //     }
    //     if(this.wantsFood){
    //         // this.mesh.beginAnimation("Walk")
    //         this.animations.find((a) => a.name.indexOf("Walk") > -1)?.start(true);
    //         this.velocity = 0.05;

    //         if(!this.changeDirection)
    //         this.changeDirection = setTimeout(() => {
    //             this.changeDirection = null;
    //             this.characterOrientation = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5);
    //         }, 3000)

    //         return "FEEDING"
    //     }
    //     return this.state;
    // }

  
}
