/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  KeyboardControls, 
  PerspectiveCamera, 
  Stars, 
  Sky,
  Environment
} from '@react-three/drei';
import * as THREE from 'three';
import Player from './Player';
import World from './World';
import { useGameStore, LEVELS } from '../store';

function CameraFollow() {
  const phase = useGameStore((state) => state.phase);
  const vec = new THREE.Vector3();
  
  useFrame((state) => {
    if (phase !== 'playing') return;
    
    const player = state.scene.getObjectByName('player_group');
    if (player) {
      // Smoothly move camera behind player
      // Player is moving along Z negative
      const targetPos = vec.set(
        player.position.x,
        player.position.y + 4,
        player.position.z + 6
      );
      
      state.camera.position.lerp(targetPos, 0.1);
      state.camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
    }
  });
  
  return null;
}

export default function GameCanvas() {
  const currentLevelIdx = useGameStore((state) => state.currentLevel);
  const theme = LEVELS[currentLevelIdx].theme;

  return (
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
        { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
        { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
        { name: 'right', keys: ['ArrowRight', 'KeyD'] },
        { name: 'jump', keys: ['Space'] },
        { name: 'interact', keys: ['KeyE'] },
      ]}
    >
      <div className="w-full h-full bg-black">
        <Canvas gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={60} />
            <CameraFollow />
            
            <World />
            <Player />

            {/* Effects based on theme */}
            {theme === 'abyss' && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
            {theme === 'library' && <Environment preset="apartment" />}
            
            {/* Extreme Illumination to troubleshoot black screen */}
            <directionalLight
              position={[5, 15, 5]}
              intensity={2.0}
            />
            <pointLight position={[0, 10, -10]} intensity={2.0} color="#ffffff" distance={100} />
            <ambientLight intensity={1.5} />
          </Suspense>
        </Canvas>
      </div>
    </KeyboardControls>
  );
}
