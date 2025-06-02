import { useEffect, useRef } from "react";
import { ActionManager, ArcRotateCamera, CannonJSPlugin, CharacterSupportedState, Color3, Color4, Engine, ExecuteCodeAction, FloatArray, FollowCamera, FreeCamera, HavokPlugin, HemisphericLight, ImportMeshAsync, IndicesArray, KeyboardEventTypes, LoadAssetContainerAsync, Material, Mesh, MeshBuilder, ParticleSystem, PhysicsAggregate, PhysicsCharacterController, PhysicsImpostor, PhysicsShapeType, PointerEventTypes, Quaternion, Ray, Scene, SceneLoader, Space, StandardMaterial, Texture, TransformNode, Vector3, Vector4, VertexData } from "@babylonjs/core";
import { createNoise2D } from 'simplex-noise'
import { Inspector } from '@babylonjs/inspector';
import earcut from 'earcut'
import '@babylonjs/loaders';
import { TextBlock } from "@babylonjs/gui";
import { createHexWorld, getHeight, hexToWorld } from "./world-generator";
import * as cannon from "cannon";
import HavokPhysics from "@babylonjs/havok";
import { PlayerController } from "./player-controller";
import { Animals } from "./resources";
import { GameState } from "./state";
import { Trees } from "./resources/trees";

window.CANNON = cannon;

const green = new Color4(0, 1, 0, 1);

// const HEX_RADIUS = 1;
// const WIDTH = Math.sqrt(3) * HEX_RADIUS;
// const HEIGHT = 2 * HEX_RADIUS;

const WORLD_WIDTH = 10;
const WORLD_DEPTH = 10;


export const WorldPreview = ({ antialias, engineOptions, adaptToDeviceRatio, sceneOptions, onRender, onSceneReady, ...rest }: any) => {
    const reactCanvas = useRef(null);


    // set up basic engine and scene
    useEffect(() => {
        const { current: canvas } = reactCanvas;

        if (!canvas) return;

        let vertexMap = new Map();
        let positions: any[] = [];
        let indices: any[] = [];
        let uvs: any[] = [];
        let vertexIndex = 0;

        const engine = new Engine(canvas, antialias, engineOptions, adaptToDeviceRatio);
        const scene = new Scene(engine, sceneOptions);

        // scene.gravity = new Vector3(0, -0.2, 0); // negative Y = down
        var state : any = "IN_AIR";

        var inAirSpeed = 8.0;
        var onGroundSpeed = 10.0;
        var jumpHeight = 1.5;

        var wantJump = false;
        var inputDirection = new Vector3(0,0,0);
        var forwardLocalSpace = new Vector3(0, 0, 1);
        let characterOrientation = Quaternion.Identity();
        let characterGravity = new Vector3(0, -18, 0);

        let renderIx = 0;

        let npcs = [];
        let treeObjects = [];

        (async () => {
            const havokInstance = await HavokPhysics()
            scene.enablePhysics(null, new HavokPlugin(true, havokInstance));

            const partcileSystem = new ParticleSystem("particles", 2000, scene);

            scene.createDefaultEnvironment({
                // sizeAuto: true
                skyboxSize: 2000,
            });

            const groundMaterial = new StandardMaterial("groundMat", scene);
            groundMaterial.diffuseColor = new Color3(0.5, 0.35, 0.05);

            if (scene.isReady()) {
                onSceneReady(scene);
            } else {
                scene.onReadyObservable.addOnce((scene) => onSceneReady(scene));
            }
            
            scene.stopAllAnimations();

  
            // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
            var light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

            var spareCamera = new FreeCamera("spare", new Vector3(0, 100, 0), scene);
            spareCamera.target = new Vector3(200, 0, 200);

            // spareCamera.rotationQuaternion = Quaternion.FromEulerAngles(20, 10, 0);

            // This creates and positions a free camera (non-mesh)
            var camera = new FreeCamera("camera1", new Vector3(0, 5, -5), scene);
            scene.activeCamera = camera;
            // const camera = new ArcRotateCamera("Camera", -Math.PI, (Math.PI / 4), 100, new Vector3(0, 10, 40));
            // camera.attachControl(canvas, true);

            const { homePoint, land, landMap, noise } = createHexWorld(scene, WORLD_WIDTH, WORLD_DEPTH);

            Promise.all([Promise.all(Animals(scene)), Promise.all(Trees(scene))]).then(([items, trees]) => {
                console.log({ items, land, landMap })


                const state = new GameState(scene, landMap)

                const { x: hx, z: hz } = hexToWorld(homePoint.x, homePoint.z)

                const controller = PlayerController(scene, camera, new Vector3(hx + 7, homePoint.y + 5, hz + 7));

                land.dirt.forEach((tile: any) => {
                    if((tile.x != homePoint.x && tile.y != homePoint.y) && Math.random() > 0.5){
                        let itemIx = Math.floor(Math.random() * items.length);
                        let rng = Math.floor(Math.random() * items[itemIx].length)
                        console.log({itemIx, rng, fnc: items[itemIx][rng]})

                        const { x: tx, z: tz } = hexToWorld(tile.x, tile.z)
                        
                        npcs.push({
                            item: items[itemIx][rng]
                        })

                        const inst : any = items[itemIx][rng]('name-'+ npcs.length, state)

                        // inst.checkCollisions = true;

                        inst.translate(new Vector3(tx, tile.y, tz), 1, Space.WORLD);

                    }

                    if((tile.x != homePoint.x && tile.y != homePoint.y)){

                        let numTrees = Math.floor(Math.random() * 10);

                        for(var i = 0; i < numTrees; i++){

                            let itemIx = Math.floor(Math.random() * trees.length);
                            let rng = Math.floor(Math.random() * trees[itemIx].length)
                            console.log({itemIx, rng, fnc: trees[itemIx][rng]})
    
    
                            const { x: tx, z: tz } = hexToWorld(tile.x, tile.z)
    
                            treeObjects.push({
                                item: trees[itemIx][rng]
                            })
                            const inst : any = trees[itemIx][rng]('tree-'+treeObjects.length, state)
    
                            // const inst = items[itemIx][rng]('name', )
    
                            // inst.checkCollisions = true;

                            let vec = new Vector3(tx + (Math.random() * 15) - 7.5, tile.y + 5, tz + (Math.random() * 15) - 7.5);
                            const ray = new Ray(vec, Vector3.Down(), 10)
                            const hit = scene.pickWithRay(ray);

                            if(hit?.pickedPoint){
                                vec.y = hit.pickedPoint?.y
                                inst.translate(vec, 1, Space.WORLD);
                            }
                        }


                    }
                })

                land.grass.forEach((tile: any) => {
                    if((tile.x != homePoint.x && tile.y != homePoint.y) && Math.random() > 0.5){
                        let itemIx = Math.floor(Math.random() * items.length);
                        let rng = Math.floor(Math.random() * items[itemIx].length)
                        console.log({itemIx, rng, fnc: items[itemIx][rng]})


                        const { x: tx, z: tz } = hexToWorld(tile.x, tile.z)

                        npcs.push({
                            item: items[itemIx][rng]
                        })
                        const inst : any = items[itemIx][rng]('name-'+npcs.length, state)

                        // const inst = items[itemIx][rng]('name', )

                        // inst.checkCollisions = true;
                        inst.translate(new Vector3(tx, tile.y, tz), 1, Space.WORLD);

                    }

                    if((tile.x != homePoint.x && tile.y != homePoint.y)){

                        let numTrees = Math.floor(Math.random() * 10);

                        for(var i = 0; i < numTrees; i++){

                            let itemIx = Math.floor(Math.random() * trees.length);
                            let rng = Math.floor(Math.random() * trees[itemIx].length)
                            console.log({itemIx, rng, fnc: trees[itemIx][rng]})
    
    
                            const { x: tx, z: tz } = hexToWorld(tile.x, tile.z)
    
                            treeObjects.push({
                                item: trees[itemIx][rng]
                            })
                            const inst : any = trees[itemIx][rng]('tree-'+treeObjects.length, state)
    
                            // const inst = items[itemIx][rng]('name', )
    
                            let vec = new Vector3(tx + (Math.random() * 15) - 7.5, tile.y + 5, tz + (Math.random() * 15) - 7.5);
                            const ray = new Ray(vec, Vector3.Down(), 10)
                            const hit = scene.pickWithRay(ray);

                            if(hit?.pickedPoint){
                                vec.y = hit.pickedPoint?.y
                                inst.translate(vec, 1, Space.WORLD);
                            }
                            // inst.checkCollisions = true;

                        }


                    }
                })

                scene.onBeforeRenderObservable.add(() => {

                    let dt = scene.deltaTime;

                    if(dt % 2 == 0){
                    state.tileTick();
                    }

                });

                Promise.all([
                    ImportMeshAsync('survival/Tent.glb', scene).then(({transformNodes}) => transformNodes),
                    ImportMeshAsync('survival/Compass.glb', scene).then(({transformNodes}) => transformNodes),
                    ImportMeshAsync('survival/Bonfire.glb', scene).then(({transformNodes}) => transformNodes),
                    ImportMeshAsync('survival/Backpack.glb', scene).then(({transformNodes}) => transformNodes),
                    ImportMeshAsync('survival/Axe.glb', scene).then(({transformNodes}) => transformNodes),
                    ImportMeshAsync('survival/First Aid Kit.glb', scene).then(({transformNodes}) => transformNodes),
                    ImportMeshAsync('survival/Match Burnt.glb', scene).then(({transformNodes}) => transformNodes),
                ]).then(([tent, compass, bonfire, backpack, axe, firstAid, matchBurnt]) => {

                    tent[0].scaling = new Vector3(0.4, 0.4, 0.4);
                    tent[0].translate(new Vector3(hx, homePoint.y, hz), 1, Space.WORLD);

                    tent[0].getChildMeshes().forEach((mesh) => {
                        new PhysicsAggregate(mesh, PhysicsShapeType.BOX, {mass: 0})

                    })

                    let ray = new Ray(new Vector3(hx - 5, homePoint.y + 10, hz), Vector3.Down(), 20);
                    let hit = scene.pickWithRay(ray);

                    if (hit?.pickedMesh) {

                        compass[0].translate(new Vector3(hx - 5, hit.pickedPoint?.y, hz), 1, Space.WORLD);
                        compass[0].rotate(new Vector3(1, 0, 0), -Math.PI /2);
                    }

                    ray = new Ray(new Vector3(hx, homePoint.y + 10, hz - 5), Vector3.Down(), 20);
                    hit = scene.pickWithRay(ray);

                    if (hit?.pickedMesh) {
                        bonfire[0].translate(new Vector3(hx, hit.pickedPoint?.y, hz - 5), 1, Space.WORLD);

                        // support.supportedState = 2
                        // console.log("Ground detected at", hit.pickedPoint?.y);
                    } 

                    matchBurnt[0].translate(new Vector3(hx, homePoint.y, hz - 6), 1, Space.WORLD);
                    
                    backpack[0].translate(new Vector3(hx - 5, homePoint.y, hz - 5), 1, Space.WORLD);
                    backpack[0].rotate(new Vector3(1, 0, 0), -Math.PI / 2);

                    firstAid[0].name = 'first-aid'
                    firstAid[0].translate(new Vector3(hx + 5, homePoint.y + 1, hz + 2), 1, Space.WORLD);
                    firstAid[0].rotate(new Vector3(1, 0, 0), Math.PI);
                    firstAid[0].rotate(new Vector3(0, 1, 0), -Math.PI/2);

                    new PhysicsAggregate(firstAid[0], PhysicsShapeType.BOX, {mass: 1, friction: 1})

                })

                // Inspector.Show(scene, {});
            })


            // ImportMeshAsync('nature/Maple Trees.glb', scene).then((result) => {
            //     result.meshes.forEach((mesh) => {
            //         console.log({mesh: mesh.name})

            //         if(mesh.name.indexOf("MapleTree_5_primitive") > -1){
            //             mesh.scaling = new Vector3(5, 5, 5);
            //         }
            //         // mesh.setEnabled(true);
            //         // mesh.scaling = new Vector3(1, 1, 1);
            //         // scene.addMesh(mesh)

            //     });
            // })

            // createHexagon(scene, 2, 5, Color3.Red(), Vector3.Zero());
            // createHexagon(scene, 2, 3, Color3.Blue(), new Vector3(3, 0, 1));

            // MeshBuilder.CreatePolyhedron('hexagon', { type: 7, faceColors: [green, green, green, green, green] }, scene)

            engine.runRenderLoop(() => {
                if (typeof onRender === "function") onRender(scene);
                scene.render();
                partcileSystem.render()
            });

        })();


        const resize = () => {
            scene.getEngine().resize();
        };

        if (window) {
            window.addEventListener("resize", resize);
        }

        return () => {
            scene.getEngine().dispose();

            if (window) {
                window.removeEventListener("resize", resize);
            }
        };
    }, [antialias, engineOptions, adaptToDeviceRatio, sceneOptions, onRender, onSceneReady]);

    return <canvas style={{maxWidth: '80vw'}} ref={reactCanvas} {...rest} />;
};