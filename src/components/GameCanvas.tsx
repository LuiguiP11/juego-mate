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
      // Check if viewport is portrait (for mobile presentation)
      const isPortrait = state.viewport.aspect < 1;
      
      // Smoothly move camera behind player - dynamic scaling based on screen orientation
      const targetPos = vec.set(
        player.position.x,
        player.position.y + (isPortrait ? 4.3 : 2.5),
        player.position.z + (isPortrait ? 6.3 : 3.5)
      );
      
      state.camera.position.lerp(targetPos, 0.1);
      state.camera.lookAt(player.position.x, player.position.y + 0.6, player.position.z);
    }
  });
  
  return null;
}

function PerformanceAdapter() {
  const setGraphicsQuality = useGameStore((state) => state.setGraphicsQuality);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  
  const lowFpsCounter = useRef(0);
  const sampleCounter = useRef(0);

  useFrame((_, delta) => {
    if (graphicsQuality !== 'high') return;

    sampleCounter.current += 1;
    // delta at normal/target 60fps is ~0.016s. At under 25fps, it exceeds 0.04s.
    if (delta > 0.04) {
      lowFpsCounter.current += 1;
    }

    // Check periodically (every 120 frames ~ 2s)
    if (sampleCounter.current >= 120) {
      // If >30% of frames are sluggish, downgrade automatically to ensure a smooth gameplay
      if (lowFpsCounter.current > 35) {
        console.log("Auto-adaptive performance: setting graphics quality to 'low' due to low frame rates");
        setGraphicsQuality('low');
      }
      sampleCounter.current = 0;
      lowFpsCounter.current = 0;
    }
  });

  return null;
}

export default function GameCanvas() {
  const currentLevelIdx = useGameStore((state) => state.currentLevel);
  const theme = LEVELS[currentLevelIdx].theme;
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);

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
        <Canvas 
          dpr={[1, 1.25]}
          shadows
          gl={{ 
            antialias: true, 
            powerPreference: 'high-performance'
          }}
        >
          <Suspense fallback={null}>
            <PerformanceAdapter />
            <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={60} />
            <CameraFollow />
            
            <World />
            <Player />

            {/* Effects based on theme */}
            {theme === 'abyss' && graphicsQuality === 'high' && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
            {theme === 'library' && <Environment preset="apartment" />}
            
            {/* Extreme Illumination to troubleshoot black screen */}
            <directionalLight
              position={[5, 15, 5]}
              intensity={graphicsQuality === 'high' ? 2.0 : 1.5}
            />
            {graphicsQuality === 'high' && (
              <pointLight position={[0, 10, -10]} intensity={2.0} color="#ffffff" distance={100} />
            )}
            <ambientLight intensity={graphicsQuality === 'high' ? 1.5 : 1.8} />
          </Suspense>
        </Canvas>
      </div>
    </KeyboardControls>
  );
}
