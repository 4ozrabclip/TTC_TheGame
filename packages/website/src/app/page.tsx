'use client';
import { WorldPreview } from "./world-preview";

export default function Game(){
    return (
        <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            <h2>The Game</h2>
          
            <div style={{display: 'flex', maxHeight: '100vh', flex: 1}}>
                <WorldPreview onSceneReady={() => {}} />
            </div>
        </div>
    )
}