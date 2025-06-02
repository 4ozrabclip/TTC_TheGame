import { Color3, Mesh, PBRMaterial, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { GrassProceduralTexture } from "@babylonjs/procedural-textures";

export type TileType = 'grass' | 'dirt' | "water";


export class Tile {

    center: Vector3;

    mesh: Mesh;

    type: TileType

    qualities: any;

    constructor(center: Vector3, mesh: Mesh, startingType: TileType, qualities: any) {
        this.center = center;

        this.mesh = mesh;
        this.type = startingType;
        this.qualities = qualities
    }

    take(key: string, amount: any) {
        if (this.qualities[key] > amount) {
            this.qualities[key] -= amount;
            return true;
        } else {
            return false;
        }
    }

    give(key: string, amount: any) {
        this.qualities[key] += amount;
    }

    tick() {
        switch (this.type) {
            case 'grass':
                if (this.qualities.nutrient > 0.5) {
                    this.qualities.health += 0.001;
                    this.qualities.nutrient -= 0.001;
                }

                if (this.qualities.health < 0.3) {
                    console.log("Becoming dirt")
                    this.type = 'dirt';
                }

                if(this.qualities.health < 0.5){
                    console.log(this.qualities)

                }
                break;
            case 'dirt':
                if (this.qualities.nutrient > 0.3) {
                    this.qualities.health += 0.001;
                    this.qualities.nutrient -= 0.001;
                }

                if (this.qualities.health > 0.7) {
                    this.type = 'grass';
                }
                break;
            case 'water':
                if (this.qualities.nutrient > 0.5) {
                    this.qualities.health -= 0.001;
                    this.qualities.nutrient += 0.001;
                }
                if (this.qualities.level < 0.3) {
                    this.type = 'dirt';
                }
                break;
        }


    }
}

export class GameState {

    tiles: { [key: string]: Tile } = {};

    materials: any = {};

    constructor(scene: Scene, tiles: any) {
        this.tiles = tiles;


        this.materials.ground = new PBRMaterial("groundMat", scene);
        this.materials.ground.albedoColor = new Color3(0.5, 0.3, 0.1); // Brownish soil
        this.materials.ground.roughness = 1; // High roughness = matte

        const grassTexture = new GrassProceduralTexture("grassTex", 100, scene);
        grassTexture.grassColors = [
            new Color3(0.1, 0.6, 0.2), // Light green
            new Color3(0.1, 0.6, 0.1), // Medium green
            new Color3(0.05, 0.4, 0.05) // Dark green
        ];
        grassTexture.groundColor = new Color3(0.5, 0.3, 0.1); // Brownish soil

        this.materials.grass  = new StandardMaterial("grassMat", scene);
        this.materials.grass .ambientTexture = grassTexture;
        this.materials.grass .specularColor = new Color3(0, 0, 0);

    }

    getTile(col: number, row: number) {
        return this.tiles[col + '|' + row];
    }
    

    tileTick() {
        // Object.keys(this.tiles).forEach((tileKey) => {
        //     this.tiles[tileKey].tick();

        //     let tile = this.tiles[tileKey];
            
        //     switch(tile.type){
        //         case 'grass':
        //             tile.mesh.material = this.materials.grass;
        //             break;
        //         case 'dirt':
        //             tile.mesh.material = this.materials.ground;
        //             break;
        //             // case 'water':
        //             //     tile.mesh.material = this.materials.water;
        //             // break;
        //     }
        // })

        
        // console.log(Object.keys(this.tiles).filter((tileKey) => this.tiles[tileKey].type == 'dirt').length)
    }
}