/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointLight, Color } from 'three';
import { Text, Float } from '@react-three/drei';
import { LEVELS, useGameStore } from '../store';

function Torch({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<PointLight>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      // Flicker effect
      const time = state.clock.getElapsedTime();
      lightRef.current.intensity = 1.2 + Math.sin(time * 5) * 0.2 + Math.random() * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Stick */}
      <mesh rotation={[0, 0, Math.PI / 4 * (position[0] > 0 ? -1 : 1)]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5]} />
        <meshPhongMaterial color="#422" />
      </mesh>
      {/* Flame Glow */}
      <pointLight ref={lightRef} intensity={3} distance={15} color="#ff8822" position={[0, 0.4, 0]} castShadow={false} />
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffaa44" />
      </mesh>
    </group>
  );
}

function Gate({ index, z, solved }: { index: number, z: number, solved: boolean }) {
  const doorRef = useRef<any>(null);
  const [initialY] = useState(2.5);
  
  useFrame((state) => {
    if (solved && doorRef.current && doorRef.current.position.y < 5) {
      doorRef.current.position.y += 0.08;
    }
    if (!solved && doorRef.current && doorRef.current.position.y > initialY) {
      // Ensure it stays closed if not solved (useful for level transitions)
      doorRef.current.position.y = initialY;
    }
  });

  return (
    <group position={[0, 0, z]}>
      {/* Wall blockage on sides to prevent "surrounding" */}
      <mesh position={[-3.1, 3.5, 0]} receiveShadow>
        <boxGeometry args={[1.8, 7, 0.4]} />
        <meshPhongMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[3.1, 3.5, 0]} receiveShadow>
        <boxGeometry args={[1.8, 7, 0.4]} />
        <meshPhongMaterial color="#1a1a1a" />
      </mesh>

      {/* Main Arch Frame */}
      <group position={[0, 0, 0]}>
        {/* Left pillar */}
        <mesh position={[-1.7, 2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.6, 5, 0.6]} />
            <meshPhongMaterial color="#2a2a2a" />
        </mesh>
        {/* Right pillar */}
        <mesh position={[1.7, 2.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.6, 5, 0.6]} />
            <meshPhongMaterial color="#2a2a2a" />
        </mesh>
        {/* Top bar */}
        <mesh position={[0, 5, 0]} castShadow receiveShadow>
            <boxGeometry args={[4, 0.6, 0.6]} />
            <meshPhongMaterial color="#2a2a2a" />
        </mesh>
      </group>

      {/* Sliding Door Slabs */}
      <mesh ref={doorRef} position={[0, solved ? 5 : 2.5, -0.1]} castShadow>
        <boxGeometry args={[2.8, 4.4, 0.1]} />
        <meshPhongMaterial color={solved ? "#0a1a0a" : "#221111"} shininess={50} />
        {/* Runes */}
        <Text
          position={[0, 0, 0.06]}
          fontSize={0.6}
          color={solved ? "#39ff14" : "#ff4400"}
          anchorX="center"
          anchorY="middle"
        >
          {['∑', 'π', 'Ω', '∆', '√'][index]}
        </Text>
      </mesh>

      {/* Interaction Altar */}
      <group position={[-2.5, 0, 3]}>
        <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.5, 1.2, 8]} />
            <meshPhongMaterial color="#1a120a" />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[0.7, 0.1, 0.7]} />
            <meshPhongMaterial color="#2a1a10" />
        </mesh>
        <pointLight position={[0, 1.5, 0]} intensity={1.5} color="#ff6600" distance={5} />
      </group>
    </group>
  );
}

function Chest({ position }: { position: [number, number, number] }) {
  return (
      <Float speed={3} rotationIntensity={0.2} floatIntensity={0.5} position={position}>
          <group>
              {/* Base */}
              <mesh castShadow receiveShadow>
                  <boxGeometry args={[1.2, 0.6, 0.8]} />
                  <meshPhongMaterial color="#4a2a10" shininess={30} />
              </mesh>
              {/* Lid */}
              <mesh position={[0, 0.4, 0]} castShadow>
                  <boxGeometry args={[1.2, 0.3, 0.9]} />
                  <meshPhongMaterial color="#5a3a1a" shininess={40} />
              </mesh>
              {/* Gold Trims */}
              <group>
                  <mesh position={[0.55, 0, 0]}>
                      <boxGeometry args={[0.1, 0.62, 0.82]} />
                      <meshPhongMaterial color="#d4af37" shininess={100} specular="#ffffff" />
                  </mesh>
                  <mesh position={[-0.55, 0, 0]}>
                      <boxGeometry args={[0.1, 0.62, 0.82]} />
                      <meshPhongMaterial color="#d4af37" shininess={100} specular="#ffffff" />
                  </mesh>
                  <mesh position={[0, 0.35, 0.4]} castShadow>
                      <boxGeometry args={[0.2, 0.2, 0.1]} />
                      <meshPhongMaterial color="#ffd700" />
                  </mesh>
              </group>
              {/* Inner Glow */}
              <pointLight intensity={2} color="#ffd700" distance={6} position={[0, 1, 0]} />
          </group>
      </Float>
  );
}

function WaterFloor({ color, corridorLen, corridorW }: { color: string, corridorLen: number, corridorW: number }) {
  const meshRef = useRef<any>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Small wave effect on position and slightly on material
      const time = state.clock.getElapsedTime();
      meshRef.current.position.y = Math.sin(time) * 0.05 - 0.05;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -corridorLen / 2 + 2]} receiveShadow>
      <planeGeometry args={[corridorW, corridorLen, 16, 16]} />
      <meshPhongMaterial 
        color={color} 
        shininess={80} 
        specular="#ffffff" 
        transparent 
        opacity={0.8} 
      />
    </mesh>
  );
}

function Prop({ type, position }: { type: 'vase' | 'crate' | 'barrel' | 'pillar', position: [number, number, number] }) {
  return (
    <group position={position}>
      {type === 'vase' && (
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.3, 0.6, 8]} />
          <meshPhongMaterial color="#8b4513" />
          <mesh position={[0, 0.35, 0]} rotation={[Math.PI/2, 0, 0]}>
             <torusGeometry args={[0.15, 0.05, 8, 16]} />
             <meshPhongMaterial color="#8b4513" />
          </mesh>
        </mesh>
      )}
      {type === 'crate' && (
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshPhongMaterial color="#5d4037" />
          {/* Crate lines */}
          <mesh position={[0, 0, 0.31]}>
             <boxGeometry args={[0.5, 0.05, 0.01]} />
             <meshBasicMaterial color="#3e2723" />
          </mesh>
        </mesh>
      )}
      {type === 'pillar' && (
        <mesh castShadow>
           <cylinderGeometry args={[0.4, 0.45, 7, 8]} />
           <meshPhongMaterial color="#2a2a2a" />
        </mesh>
      )}
    </group>
  );
}

function Particles({ count = 50, theme }: { count?: number, theme: string }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 8;
      p[i * 3 + 1] = Math.random() * 6;
      p[i * 3 + 2] = -Math.random() * 60;
    }
    return p;
  }, [count]);

  const pointsRef = useRef<any>(null);
  
  useFrame((state) => {
    if (pointsRef.current) {
        const time = state.clock.getElapsedTime();
        const positions = pointsRef.current.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            positions[iy] += Math.sin(time + positions[ix]) * 0.005;
            if (theme === 'water') {
                positions[iy] += 0.01; // Bubbles float up
                if (positions[iy] > 6) positions[iy] = 0;
            }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={theme === 'water' ? 0.08 : 0.04}
        color={theme === 'water' ? '#88ccff' : '#aaaaaa'}
        transparent
        opacity={0.4}
      />
    </points>
  );
}

export default function World() {
  const currentLevelIdx = useGameStore((state) => state.currentLevel);
  const score = useGameStore((state) => state.score);
  const level = LEVELS[currentLevelIdx];
  const isWater = level.theme === 'water';
  const isLibrary = level.theme === 'library';
  const isAbyss = level.theme === 'abyss';

  // Corridor settings
  const corridorLen = 60;
  const corridorW = 8;
  const gateSpacing = 10;
  
  // Custom props distribution based on level
  const props = useMemo(() => {
    const list: { type: any, pos: [number, number, number] }[] = [];
    for(let i = 0; i < 10; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const z = -Math.random() * 50 - 5;
        const x = side * (3.2 + Math.random() * 0.5);
        const type = Math.random() > 0.6 ? 'vase' : 'crate';
        list.push({ type, pos: [x, 0.3, z] });
    }
    // Specific level props
    if (isLibrary) {
        for(let i = 0; i < 5; i++) {
            list.push({ type: 'pillar', pos: [-3.8, 3.5, -i * 12] });
            list.push({ type: 'pillar', pos: [3.8, 3.5, -i * 12 - 6] });
        }
    }
    return list;
  }, [currentLevelIdx]);

  return (
    <group>
      {/* Fog and Lighting */}
      <color attach="background" args={[level.fog]} />
      <fogExp2 attach="fog" color={level.fog} density={0.018} />
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 15, -20]} intensity={1.5} color="#fff1d0" />

      {/* Floor */}
      {isWater ? (
        <WaterFloor color="#0a2a4a" corridorLen={corridorLen} corridorW={corridorW} />
      ) : isAbyss ? (
         <group>
            {/* Narrow path for Abyss */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -corridorLen / 2 + 2]} receiveShadow>
                <planeGeometry args={[3, corridorLen]} />
                <meshPhongMaterial color="#111" shininess={5} />
            </mesh>
            {/* Dark void on sides */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3, -0.2, -corridorLen / 2 + 2]}>
                <planeGeometry args={[3, corridorLen]} />
                <meshBasicMaterial color="#000" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, -0.2, -corridorLen / 2 + 2]}>
                <planeGeometry args={[3, corridorLen]} />
                <meshBasicMaterial color="#000" />
            </mesh>
         </group>
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -corridorLen / 2 + 2]} receiveShadow>
          <planeGeometry args={[corridorW, corridorLen]} />
          <meshPhongMaterial color={isLibrary ? '#2c1e10' : '#3e2c1a'} shininess={10} />
        </mesh>
      )}

      {/* Decorative Props */}
      {props.map((p, i) => <Prop key={i} type={p.type} position={p.pos} />)}

      {/* Corridor Structure */}
      {[...Array(12)].map((_, i) => (
        <group key={i} position={[0, 0, -i * 5]}>
            {/* Arches or regular columns */}
            {isLibrary ? (
                <mesh position={[0, 6.8, 0]}>
                    <boxGeometry args={[corridorW, 0.4, 0.4]} />
                    <meshPhongMaterial color="#2a1a0a" />
                </mesh>
            ) : null}
            <mesh position={[-3.8, 3.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 7, 0.8]} />
                <meshPhongMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[3.8, 3.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 7, 0.8]} />
                <meshPhongMaterial color="#1a1a1a" />
            </mesh>
        </group>
      ))}

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 7, -corridorLen / 2 + 2]}>
        <planeGeometry args={[corridorW, corridorLen]} />
        <meshPhongMaterial color="#111" />
      </mesh>

      {/* Walls */}
      <mesh position={[-corridorW / 2, 3.5, -corridorLen / 2 + 2]} receiveShadow>
        <boxGeometry args={[0.2, 7, corridorLen]} />
        <meshPhongMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[corridorW / 2, 3.5, -corridorLen / 2 + 2]} receiveShadow>
        <boxGeometry args={[0.2, 7, corridorLen]} />
        <meshPhongMaterial color="#1a1a1a" />
      </mesh>

      {/* End Wall */}
      <mesh position={[0, 3.5, -corridorLen + 1]} castShadow>
        <boxGeometry args={[corridorW, 7, 0.5]} />
        <meshPhongMaterial color="#1a1a1a" />
      </mesh>

      {/* Torches */}
      {[...Array(8)].map((_, i) => (
        <group key={i}>
          <Torch position={[-3.6, 2.5, -i * 8 - 2]} />
          <Torch position={[3.6, 2.5, -i * 8 - 6]} />
        </group>
      ))}

      {/* Atmospheric Particles */}
      <Particles key={level.id} theme={level.theme} count={level.theme === 'water' ? 100 : 60} />

      {/* Gates */}
      {[...Array(5)].map((_, i) => (
        <Gate key={i} index={i} z={-(i + 1) * gateSpacing - 2} solved={i < score} />
      ))}

      {/* Treasure Chest */}
      <Chest position={[0, 0.4, -56]} />
    </group>
  );
}
