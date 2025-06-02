import { ImportMeshAsync, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { GameState } from "../state";

export const Trees = (scene: Scene) => 
    [
        ImportMeshAsync('nature/Maple Trees.glb', scene).then((result) => {
            return result.transformNodes.map((x) => {
                // return Mesh.MergeMeshes(x.getChildMeshes())
                x.position = new Vector3(0, 0, 0);
                x.setEnabled(false);

                return (name: string, state: GameState) => {
                    const root = new TransformNode(name)
                    x.getChildMeshes().forEach((mesh: any) => {
                        let inst = mesh.createInstance(name)
                        inst.scaling = new Vector3(3, 3, 3);

                        inst.setEnabled(true);
                        // inst.parent = root;
                        root.addChild(inst)
                    });
                    return root;
                }
            });
            // result.meshes.filter((a) => a.name.indexOf('MapleTree_5_primitive') > -1)
        }),
        ImportMeshAsync('nature/Palm Trees.glb', scene).then((result) => {
            return result.transformNodes.map((x) => {
                // return Mesh.MergeMeshes(x.getChildMeshes())
                x.position = new Vector3(0, 0, 0);

                x.setEnabled(false);

                return (name: string, state: GameState) => {
                    const root = new TransformNode(name)
                    x.getChildMeshes().forEach((mesh: any) => {
                        let inst = mesh.createInstance(name)
                        inst.scaling = new Vector3(3, 3, 3);

                        inst.setEnabled(true);
                        // inst.parent = root;
                        root.addChild(inst)
                    });
                    return root;
                }
            });
        }),
        ImportMeshAsync('nature/Dead Trees.glb', scene).then((result) => {
            console.log("DT", { result })


            return result.meshes.map((mesh: any) => {
                mesh.position = new Vector3(0, 0, 0);
                mesh.parent = null;

                return (name: string, state: GameState) => {
                    let inst = mesh.createInstance(name)
                    inst.scaling = new Vector3(3, 3, 3);

                    inst.setEnabled(true);
                    return mesh;
                }
            })
            //     // return Mesh.MergeMeshes(x.getChildMeshes())
            //     x.position = new Vector3(0, 0, 0);
            //     return (name: string) => {
            //         const root = new TransformNode(name)
            //         x.getChildMeshes().forEach((mesh: any) => {
            //             let inst = mesh.createInstance(name)
            //             inst.setEnabled(true);
            //             // inst.parent = root;
            //             root.addChild(inst)
            //         });
            //         return root;
            //     }
            // });
        }),

        ImportMeshAsync('nature/Flower Bushes.glb', scene).then((result) => {

            return result.meshes.map((mesh: any) => {
                mesh.position = new Vector3(0, 0, 0);
                mesh.parent = null;

                return (name: string, state: GameState) => {
                    let inst = mesh.createInstance(name)
                    inst.scaling = new Vector3(3, 3, 3);

                    inst.setEnabled(true);
                    return mesh;
                }
            })
        }),

        ImportMeshAsync('nature/Flowers.glb', scene).then((result) => {

            return result.meshes.map((mesh: any) => {
                mesh.position = new Vector3(0, 0, 0);
                mesh.parent = null;

                return (name: string, state: GameState) => {
                    let inst = mesh.createInstance(name)
                    inst.setEnabled(true);
                    inst.scaling = new Vector3(3,3, 3);
                    return mesh;
                }
            })
        }),

        ImportMeshAsync('nature/Grass.glb', scene).then((result) => {
            return result.transformNodes.map((x) => {
                // return Mesh.MergeMeshes(x.getChildMeshes())
                x.position = new Vector3(0, 0, 0);
                x.setEnabled(false);

                return (name: string, state: GameState) => {
                    const root = new TransformNode(name)
                    x.getChildMeshes().forEach((mesh: any) => {
                        let inst = mesh.createInstance(name)
                        inst.setEnabled(true);
                        inst.scaling = new Vector3(3, 3, 3);
                        // inst.parent = root;
                        root.addChild(inst)
                    });
                    return root;
                }
            });
        })
        ,

        ImportMeshAsync('nature/Pine Trees.glb', scene).then((result) => {
            return result.transformNodes.map((x) => {
                // return Mesh.MergeMeshes(x.getChildMeshes())
                x.position = new Vector3(0, 0, 0);
                x.setEnabled(false);

                return (name: string, state: GameState) => {
                    const root = new TransformNode(name)
                    x.getChildMeshes().forEach((mesh: any) => {
                        let inst = mesh.createInstance(name)
                        inst.setEnabled(true);
                        inst.scaling = new Vector3(3, 3, 3);
                        root.addChild(inst)
                    });
                    return root;
                }
            });
        }),

        ImportMeshAsync('nature/Rocks.glb', scene).then((result) => {

            return result.meshes.map((mesh: any) => {
                mesh.position = new Vector3(0, 0, 0);
                mesh.parent = null;

                return (name: string, state: GameState) => {
                    let inst = mesh.createInstance(name)
                    inst.scaling = new Vector3(2, 2, 2);
                    inst.setEnabled(true);
                    return mesh;
                }
            })
        }),

    ]
