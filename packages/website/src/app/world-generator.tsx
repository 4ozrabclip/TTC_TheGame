import { Color3, Material, Mesh, MeshBuilder, Scene, Space, StandardMaterial, ProceduralTexture, Vector3, VertexData, Texture, PBRMaterial, PhysicsImpostor, PhysicsAggregate, PhysicsShapeType, Vector2, CubeTexture, HDRCubeTexture } from "@babylonjs/core";
import { createNoise2D } from "simplex-noise";
import { GrassProceduralTexture } from "@babylonjs/procedural-textures";
import { WaterMaterial } from "@babylonjs/materials";
import { Tile } from "./state";
import earcut from "earcut";

const HEX_RADIUS = 15;  // outer radius
const WIDTH = 2 * HEX_RADIUS;
const HEIGHT = Math.sqrt(3) * HEX_RADIUS;

const AMPLITUDE = 10;
const FREQ_BIAS = 0.05;


export function hexToWorld(col: number, row: number) {
    const x = col * 1.5 * HEX_RADIUS;
    const z = row * HEIGHT + (col % 2) * (HEIGHT / 2)

    return { x, z };
}

export function worldToHex(x: number, z: number){
    let col = Math.ceil(x / HEX_RADIUS / 1.5)
    let row = Math.ceil((z - (col % 2) * (HEIGHT / 2)) / HEIGHT)

    return {col, row}
}

export function getHeight(noise: any, x: number, z: number) {
    return (noise(x * FREQ_BIAS, z * FREQ_BIAS) * AMPLITUDE); // scale noise & amplitude
}

function createWorldHeightmap(noise: any, width: number, depth: number) {
    let heights: any[] = [];
    for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
            const { x: cx, z: cz } = hexToWorld(x, z)
            heights.push(getHeight(noise, cx, cz))
        }
    }
    return heights;
}


function getHeightAtNeighborCenters(noise: any, scene: Scene, x: number, centerY: number, z: number, cornerIndex = 0, render: any, radius = HEX_RADIUS) {
    const neighbors = [];

    const sharedBy: any = {
        0: [1, 2],
        1: [0, 1],
        2: [0, 5],
        3: [4, 5],
        4: [4, 3],
        5: [3, 2],
    };


    const directions = [
        [0, 1], //0: top
        [1, (x % 2 != 0) ? 1 : 0],// 1: Top-right
        [1, (x % 2 != 0) ? 0 : -1],// 2: Bottom-right
        [0, -1], //3:  bottom
        [-1, (x % 2 == 0) ? -1 : 0], //4: Bottom-left
        [-1, (x % 2 == 0) ? 0 : 1] //Top-left
    ].filter((dir, ix) => {
        return sharedBy[cornerIndex].indexOf(ix) > -1;
    });


    // Loop through each direction to calculate the neighbor centers
    for (let i = 0; i < directions.length; i++) {
        // Calculate the neighbor's center position

        const { x: nx, z: nz } = hexToWorld(x + directions[i][0], z + directions[i][1])

        // Sample the height at this neighbor's center
        const neighborHeight = getHeight(noise, nx, nz);

        if (render) {
            const cylinder = MeshBuilder.CreateCylinder('cyl', {
                height: 20,
                diameter: 0.2
            }, scene)

            cylinder.position = new Vector3(nx, 0, nz);
        }
        // Store the result (you can adjust what to do with the height as needed)
        neighbors.push({ realX: x + directions[i][0], realZ: z + directions[i][1], x: nx, z: nz, height: neighborHeight });
    }

    const avg = (neighbors.reduce((prev, curr) => prev + curr.height, 0) + centerY) / (neighbors.length + 1);
    if (z == 1 && ((x == 1 && cornerIndex == 5) || (x == 2 && cornerIndex == 3)))
        console.log({ x, z, neighbors, avg, cornerIndex })
    return avg;
}

function addHex(noise: any, scene: Scene, x: number, z: number, material: Material) {

    const { x: cx, z: cz } = hexToWorld(x, z);

    const center = getHeight(noise, cx, cz);
    const corners = [];
    let local_indices: any[] = [];
    let local_positions: any[] = [];
    let local_uvs: any[] = [];


    // Center vertex
    local_positions.push(cx, center, cz);
    local_uvs.push(0.5, 0.5);

    let shape : any = {};

    shape[cx] = [new Vector3(cx, center, cz)];

    // Outer corners
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i;
        const vx = cx + HEX_RADIUS * Math.cos(angle);
        const vz = cz + HEX_RADIUS * Math.sin(angle);

        const render = false; //x % 2 != 0 && i == 4; //i == 5 && z == 2 && (x % 2 != 0);
        const vy = getHeightAtNeighborCenters(noise, scene, x, center, z, i, render);

        if (render) {
            const cyl = MeshBuilder.CreateCylinder(`center`, { diameter: 3, height: 5 }, scene)
            cyl.position = new Vector3(vx, vy, vz);
        }
        
        shape[vx] = [...(shape[vx] || []), new Vector3(vx, vy, vz)]

        local_positions.push(vx, vy, vz);
        local_uvs.push(0.5 + 0.5 * Math.cos(angle), 0.5 + 0.5 * Math.sin(angle));
    }

    // Triangles: center to each edge
    for (let i = 1; i <= 6; i++) {
        const next = i < 6 ? i + 1 : 1;
        local_indices.push(0, i, next);
    }


    const mesh = new Mesh(`ground-${x}-${z}`, scene);
    const data = new VertexData();

    mesh.checkCollisions = true;

    data.positions = local_positions;
    data.uvs = local_uvs;
    data.indices = local_indices
    VertexData.ComputeNormals(local_positions, local_indices, data.normals = [])
    
    data.applyToMesh(mesh);
    mesh.sideOrientation = Mesh.DOUBLESIDE;

    mesh.material = material

    mesh.isPickable = true;

    new PhysicsAggregate(mesh, PhysicsShapeType.MESH, {mass: 0, friction: 1}, scene)

    return {mesh, shape};

}

function computeFlowDirection(heightMap: {[key: string]: Vector3[]}) {
    const size = Object.keys(heightMap).length;
    const directions = Array(size).fill(0).map(() => Array(size).fill(null));
  
    const offsets = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0],          [1,  0],
      [-1,  1], [0,  1], [1,  1],
    ];
    
    let keys = Object.keys(heightMap)
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        let minHeight = heightMap[keys[x]][z];
        let bestNeighbor = null;
  
        for (const [dx, dz] of offsets) {
          const nx = x + dx;
          const nz = z + dz;
          if (nx >= 0 && nx < size && nz >= 0 && nz < size) {
            const nh = heightMap[keys[nx]][nz];
            if (nh < minHeight) {
              minHeight = nh;
              bestNeighbor = [nx, nz];
            }
          }
        }
  
        directions[x][z] = bestNeighbor; // null means it's a local minimum
      }
    }
  
    return directions;
  }


function computeFlowAccumulation(flowDirMap: any[][]) {
    const size = flowDirMap.length;
    const accumulation = Array(size).fill(0).map(() => Array(size).fill(1)); // start with 1 "unit" of water per cell
  
    // Do a topological sort to ensure upstream cells are processed first
    const queue : any[] = [];
  
    const inDegrees = Array(size).fill(0).map(() => Array(size).fill(0));
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const dir = flowDirMap[x][z];
        if (dir) inDegrees[dir[0]][dir[1]]++;
      }
    }
  
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        if (inDegrees[x][z] === 0) queue.push([x, z]);
      }
    }
  
    while (queue.length > 0) {
      const [x, z] = queue.pop();
      const dir = flowDirMap[x][z];
      if (dir) {
        const [nx, nz] = dir;
        accumulation[nx][nz] += accumulation[x][z];
        inDegrees[nx][nz]--;
        if (inDegrees[nx][nz] === 0) queue.push([nx, nz]);
      }
    }
  
    return accumulation;
  }

function createExtrudedHexagon(scene: Scene, x: number, z: number, options : any = {}) {
    const {
      height = 1,
      material = null,
      y = 0
    } = options;

    const r = 5;
  
    // Define the 2D hexagon shape
    const hexPath = [];
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      hexPath.push(new Vector3(
        r * Math.cos(angle),
        0,
        r * Math.sin(angle)
      ));
    }
    hexPath.push(hexPath[0]); // Close the shape
  
    // Extrude it
    const hex = MeshBuilder.ExtrudePolygon("hex", {
      shape: hexPath,
      depth: height,
      sideOrientation: Mesh.DOUBLESIDE
    }, scene, earcut);
  
    // Position it
    hex.position.x = x;
    hex.position.y = y;
    hex.position.z = z;
  
    // Optional material
    if (material) {
      hex.material = material;
    }
  
    return hex;
  }

export function createHexWorld(scene: Scene, width: number, depth: number) {
    const noise = createNoise2D();


    var skybox = MeshBuilder.CreateBox("skyBox", {size: 1000.0}, scene);

    // var hdrTexture = new HDRCubeTexture('country.hdr', scene, 512);

    // var hdrMaterial = new PBRMaterial('skybox-mat')
    // hdrMaterial.reflectionTexture = hdrTexture

    // skybox.material = hdrMaterial;
    // skybox.material.backFaceCulling = false;

    var skyboxMaterial = new StandardMaterial("skyBox", scene);
	skyboxMaterial.backFaceCulling = false;
	skyboxMaterial.reflectionTexture = new CubeTexture("TropicalSunnyDay", scene);
	skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
	skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
	skyboxMaterial.specularColor = new Color3(0, 0, 0);
	skyboxMaterial.disableLighting = true;
	skybox.material = skyboxMaterial;

    const heightmap = createWorldHeightmap(noise, width, depth);

    const heights = heightmap.slice().sort((a, b) => a - b);

    const percentileIndex = Math.floor(heights.length * 0.3);

    const threshold = heights[percentileIndex];

    const waterMaterial = new StandardMaterial(`water`, scene);
    waterMaterial.diffuseColor = new Color3(196/255, 166/255, 97/255);
    // waterMaterial.diffuseColor = new Color3(0, 0, 0.7);
    waterMaterial.specularColor = new Color3(0.1, 0.1, 0.1); //100;

    const deepWaterMaterial = new WaterMaterial(`deepWater`, scene);
	deepWaterMaterial.bumpTexture = new Texture("waterbump.png", scene);
	deepWaterMaterial.backFaceCulling = true;
	deepWaterMaterial.windForce = -15;
    
	deepWaterMaterial.addToRenderList(skybox);

	deepWaterMaterial.waveHeight = 1.3;
    deepWaterMaterial.waveLength = 0.1;
	deepWaterMaterial.bumpHeight = 0.1;

    deepWaterMaterial.colorBlendFactor = 0.3;
	deepWaterMaterial.windDirection = new Vector2(1, 1);
	// deepWaterMaterial.waterColor = new Color3(0, 0.1, 0);

    const groundMaterial = new PBRMaterial("groundMat", scene);
    groundMaterial.albedoColor = new Color3(0.5, 0.3, 0.1); // Brownish soil
    groundMaterial.roughness = 1; // High roughness = matte

    const grassTexture = new GrassProceduralTexture("grassTex", HEX_RADIUS * 10, scene);
    grassTexture.grassColors = [
        new Color3(0.1, 0.6, 0.2), // Light green
        new Color3(0.1, 0.6, 0.1), // Medium green
        new Color3(0.05, 0.4, 0.05) // Dark green
    ];
    grassTexture.groundColor = new Color3(0.5, 0.3, 0.1); // Brownish soil

    const grassMaterial = new StandardMaterial("grassMat", scene);
    grassMaterial.ambientTexture = grassTexture;
    grassMaterial.specularColor = new Color3(0, 0, 0);


    let land : any = {
        dirt: [],
        grass: [],
        water: []
    }
    
    let home : any;

    // deepWaterMaterial.addToRenderList(otherGround);

    const ground = MeshBuilder.CreateGround('ground', {
        width: 500,
        height: 500
    });
    // ground.checkCollisions = true;
    ground.position.y = (threshold - 4.5);// + heights[heights.length - 1])/2;
    // new PhysicsAggregate(ground, PhysicsShapeType.BOX, {mass: 0})


    let landMap : {[key: string]: Tile} = {};

    let hm = [];

    let heightShape : {[key: string]: Vector3[]} = {};

    for (let x = 1; x < width; x++) {
        let _hm = [];

        for (let z = 1; z < depth; z++) {

            const { x: worldX, z: worldZ } = hexToWorld(x, z);

            const y = getHeight(noise, worldX, worldZ);

            _hm.push(y)

            if (y > threshold) {

                let isGrass = Math.random() > 0.5

                const {mesh, shape} = addHex(noise, scene, x, z, isGrass ? grassMaterial : groundMaterial)

                deepWaterMaterial.addToRenderList(mesh);

                Object.keys(shape).map((shapeKey) => {
                    heightShape[shapeKey] = [...(heightShape[shapeKey] || []), ...shape[shapeKey]]
                })
                landMap[(x) + "|" + (z)] = new Tile(new Vector3(worldX, y, worldZ), mesh, isGrass ? 'grass' : 'dirt', {nutrient: 1, health: 1});
            // ) {type: isGrass ? 'grass' : 'dirt'}

                land[isGrass ? 'grass' : 'dirt'].push({x, z, y})


                // let itemIx = Math.floor(Math.random() * items.length)
                // let meshIx = Math.floor(Math.random() * items[itemIx].length)

                // const inst = items[itemIx][meshIx](`mesh-${x}-${z}`);

                // inst.translate(new Vector3(worldX, y, worldZ), 1, Space.WORLD);
               

            } else {
                const {mesh, shape} = addHex(noise, scene, x, z, waterMaterial)

                deepWaterMaterial.addToRenderList(mesh);
                Object.keys(shape).map((shapeKey) => {
                    heightShape[shapeKey] = [...(heightShape[shapeKey] || []), ...shape[shapeKey]]
                })
                landMap[(x) + "|" + (z)] = new Tile(new Vector3(worldX, y, worldZ), mesh, 'water', {nutrient: 0, health: 1});

                // landMap[x + "|" + z] = {type: 'water'}


                land.water.push({x, z, y})
            }

        }

        hm.push(_hm)
    }

    ground.material = deepWaterMaterial

    // const flowDirection = computeFlowDirection(heightShape);

    // const accum = computeFlowAccumulation(flowDirection)

    // const material = new StandardMaterial('test-material');

    // let keys = Object.keys(heightShape)
    // for (let x = 1; x < accum.length; x++) {

    //     for (let z = 1; z < accum.length; z++) {

    //         const accumulatedAmount = accum?.[x]?.[z] / 10;

    //         if(accumulatedAmount > 0.5){
    //             const hex = createExtrudedHexagon(scene, keys[x] as any, heightShape[keys[x]]?.[z]?.z, {y: heightShape[keys[x]]?.[z]?.y + 5, height: 2})
    //             console.log(keys[x] as any, heightShape[keys[x]]?.[z]?.z, {heightShape})
    //             hex.material = material.clone(`m-${x}-${z}`);
    //             (hex.material as any).diffuseColor = new Color3(0, 0, accumulatedAmount);
    //         }
    //     }
    // }

    let homeOptions = land.dirt.concat(land.grass)
    home = homeOptions[Math.floor(Math.random() * homeOptions.length)]

    return {
        homePoint: home,
        noise,
        land,
        landMap
    }

}
