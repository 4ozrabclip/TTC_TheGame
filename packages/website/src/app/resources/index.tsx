import { AnimationGroup, ImportMeshAsync, LoadAssetContainerAsync, Mesh, MeshBuilder, PhysicsAggregate, PhysicsImpostor, PhysicsShapeType, Quaternion, Scene, Space, TransformNode, Vector3 } from "@babylonjs/core";
import { BaseObject } from "./classes/base-class";
import { Cow } from "./classes/cow";
import { GameState } from "../state";

function createWanderController(scene: Scene, animalMesh: Mesh, animations: AnimationGroup[], state: GameState, options: any = {}) {

    animalMesh.translate(new Vector3(0, 1, 0), 1);

    const animal = new Cow(scene, state, animalMesh, animations, animalMesh.position, 0);
    
    // const speed = options.speed || 0.02;
    // const turnInterval = options.turnInterval || 3000; // time in ms to change direction

    // let direction = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();

    // // Periodically pick a new direction
    // setInterval(() => {
    //     direction = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();

    //     const angle = Math.atan2(direction.x, direction.z);
    //     console.log({angle})
    //     animalMesh.rotate(new Vector3(0, 1, 0), angle + -(Math.PI / 2), Space.WORLD);
    // }, turnInterval);

    // Update movement in each frame
    scene.onBeforeRenderObservable.add(() => {
        // Move forward slowly  
        animal.beforeRender()


        // const movement = direction.scale(speed);
        // animalMesh.position.addInPlace(movement);

        // // Rotate animal to face movement direction
        // const angle = Math.atan2(direction.x, direction.z);
        // // animalMesh.rotate(new Vector3(0, 1, 0), angle, Space.WORLD);

        // // animalMesh.rotationQuaternion?.addInPlace(new Quaternion(0, angle, 0, 0));
    });

    scene.onAfterPhysicsObservable.add(() => {
        animal.afterPhysics()
    })
}

export const Animals = (scene: Scene) => [

        
        LoadAssetContainerAsync(`animals/Alpaca.fixed.glb`, scene).then((container) => {
            // container.addAllToScene();

            const skeleton = container.skeletons[0];
            const mesh = container.meshes[0];
            container.animationGroups.map((a) => a.stop())

            return [(name: string, state: GameState) => {
                let instance = container.instantiateModelsToScene((sourceName) => 'Alpaca-'+name+sourceName, true);

                const mesh : any =  instance.rootNodes[0]; //.getChildMeshes()[0] as any;

                createWanderController(scene, mesh, instance.animationGroups, state)

                return mesh
            }] //[container.meshe
        
        }),
        LoadAssetContainerAsync(`animals/Cow.fixed.glb`, scene).then((container) => {
            // container.addAllToScene();

            const skeleton = container.skeletons[0];
            const mesh = container.meshes[0];
            container.animationGroups.map((a) => a.stop())

            return [(name: string, state: GameState) => {
                let instance = container.instantiateModelsToScene((sourceName) => 'Cow-'+name+sourceName, true);

                const mesh : any =  instance.rootNodes[0]; //.getChildMeshes()[0] as any;

                createWanderController(scene, mesh, instance.animationGroups, state)

                return mesh
            }] //[container.meshe
        }),
        LoadAssetContainerAsync(`animals/Deer.fixed.glb`, scene).then((container) => {
            // container.addAllToScene();

            const skeleton = container.skeletons[0];
            const mesh = container.meshes[0];

            return [(name: string, state: GameState) => {
                let instance = container.instantiateModelsToScene((sourceName) => 'Deer-'+name+sourceName, true);

                const mesh : any =  instance.rootNodes[0]; //.getChildMeshes()[0] as any;

                createWanderController(scene, mesh, instance.animationGroups, state)

                return mesh
            }] //[container.meshe
        }),





        LoadAssetContainerAsync(`animals/Wolf.fixed.glb`, scene).then((container) => {
            // container.addAllToScene();

            const skeleton = container.skeletons[0];
            const mesh = container.meshes[0];

            return [(name: string, state: GameState) => { 
                let instance = container.instantiateModelsToScene((sourceName) => 'Wolf-'+name+sourceName, true);

                const mesh : any =  instance.rootNodes[0]; //.getChildMeshes()[0] as any;

                createWanderController(scene, mesh, instance.animationGroups, state)

                return mesh
            }] //[container.meshe
        }),
        LoadAssetContainerAsync(`animals/Husky.fixed.glb`, scene).then((container) => {
            // container.addAllToScene();

            const skeleton = container.skeletons[0];
            const mesh = container.meshes[0];

            return [(name: string, state: GameState) => {   
                
                let instance = container.instantiateModelsToScene((sourceName) => 'Husky-'+name+sourceName, true);

                const mesh : any =  instance.rootNodes[0]; //.getChildMeshes()[0] as any;

                createWanderController(scene, mesh, instance.animationGroups, state)

                return mesh
            }] //[container.meshe
        }),
        LoadAssetContainerAsync(`animals/Horse.fixed.glb`, scene).then((container) => {
            // container.addAllToScene();

            const skeleton = container.skeletons[0];
            const mesh = container.meshes[0];

            return [(name: string, state: GameState) => { 
                let instance = container.instantiateModelsToScene((sourceName) => 'Horse-'+name+sourceName, true);

                const mesh : any =  instance.rootNodes[0]; //.getChildMeshes()[0] as any;

                createWanderController(scene, mesh, instance.animationGroups, state)

                return mesh
            }] //[container.meshe
        }),
        LoadAssetContainerAsync(`animals/Bull.fixed.glb`, scene).then((container) => {
            // container.addAllToScene();

            const skeleton = container.skeletons[0];
            const mesh = container.meshes[0];


            return [(name: string, state: GameState) => {
                // return container.meshes[0]

                let instance = container.instantiateModelsToScene((sourceName) => 'Bull-'+name+sourceName, true);

                const mesh : any =  instance.rootNodes[0]; //.getChildMeshes()[0] as any;

                createWanderController(scene, mesh, instance.animationGroups, state)

                return mesh
            }] //[container.meshes]
        }),
        // ImportMeshAsync('survival/Crops.glb', scene).then((result) => {
        //     return result.transformNodes.map((x) => {
        //         // return Mesh.MergeMeshes(x.getChildMeshes())
        //         x.position = new Vector3(0, 0, 0);
        //         x.setEnabled(false);

        //         return (name: string) => {
        //             const root = new TransformNode(name)
        //             x.getChildMeshes().forEach((mesh: any) => {
        //                 let inst = mesh.createInstance(name)
        //                 inst.setEnabled(true);
        //                 // inst.parent = root;
        //                 root.addChild(inst)
        //             });
        //             root.scaling = new Vector3(4, 4, 4);
        //             return root;
        //         }
        //     });
        // }),
        // ImportMeshAsync('survival/Axe.glb', scene).then((result) => {
        //     return result.transformNodes.map((x) => {
        //         // return Mesh.MergeMeshes(x.getChildMeshes())
        //         x.position = new Vector3(0, 0, 0);
        //         x.setEnabled(false);

        //         return (name: string) => {
        //             const root = new TransformNode(name)
        //             x.getChildMeshes().forEach((mesh: any) => {
        //                 let inst = mesh.createInstance(name)
        //                 inst.setEnabled(true);
        //                 // inst.parent = root;
        //                 root.addChild(inst)
        //             });

        //             return root;
        //         }
        //     });
        // }),
        // ImportMeshAsync('survival/Pot.glb', scene).then((result) => {
        //     return result.transformNodes.map((x) => {
        //         // return Mesh.MergeMeshes(x.getChildMeshes())
        //         x.position = new Vector3(0, 0, 0);
        //         x.setEnabled(false);

        //         return (name: string) => {
        //             const root = new TransformNode(name)
        //             x.getChildMeshes().forEach((mesh: any) => {
        //                 let inst = mesh.createInstance(name)
        //                 inst.setEnabled(true);
        //                 // inst.parent = root;
        //                 root.addChild(inst)
        //             });
        //             return root;
        //         }
        //     });
        // }),

        // ImportMeshAsync('survival/Raft.glb', scene).then((result) => {
        //     return result.transformNodes.map((x) => {
        //         // return Mesh.MergeMeshes(x.getChildMeshes())
        //         x.position = new Vector3(0, 0, 0);
        //         x.setEnabled(false);

        //         return (name: string) => {
        //             const root = new TransformNode(name)
        //             x.getChildMeshes().forEach((mesh: any) => {
        //                 let inst = mesh.createInstance(name)
        //                 inst.setEnabled(true);
        //                 // inst.parent = root;
        //                 root.addChild(inst)
        //             });
        //             root.scaling = new Vector3(0.3, 0.3, 0.3);

        //             return root;
        //         }
        //     });
        // }),

        // ImportMeshAsync('survival/Tent.glb', scene).then((result) => {
        //     return result.transformNodes.map((x) => {
        //         // return Mesh.MergeMeshes(x.getChildMeshes())
        //         x.position = new Vector3(0, 0, 0);
        //         x.setEnabled(false);

        //         return (name: string) => {
        //             const root = new TransformNode(name)
        //             x.getChildMeshes().forEach((mesh: any) => {
        //                 let inst = mesh.createInstance(name)
        //                 inst.setEnabled(true);
        //                 // inst.parent = root;
        //                 root.addChild(inst)
        //             });
        //             root.scaling = new Vector3(0.4, 0.4, 0.4);

        //             return root;
        //         }
        //     });
        // })
    ]
