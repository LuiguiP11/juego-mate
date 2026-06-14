/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PointLight, Color, AdditiveBlending } from 'three';
import { Text, Float, Sparkles } from '@react-three/drei';
import { LEVELS, useGameStore } from '../store';

function Torch({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<PointLight>(null);
  const timeRef = useRef(0);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    if (lightRef.current) {
      // Flicker effect
      const time = timeRef.current;
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

function Gate({ index, z, solved, theme }: { index: number, z: number, solved: boolean, theme: string }) {
  const doorRef = useRef<any>(null);
  const [opacity, setOpacity] = useState(1);
  
  // High-contrast theme colors
  const colors = useMemo(() => {
    switch (theme) {
      case 'water': return { primary: '#00ffff', secondary: '#ffffff', glow: '#00ffff' };
      case 'sky': return { primary: '#0088ff', secondary: '#ffffff', glow: '#0088ff' };
      case 'crystal': return { primary: '#ff00ff', secondary: '#ffffff', glow: '#ff00ff' };
      case 'abyss': return { primary: '#ff3300', secondary: '#ffffff', glow: '#ff3300' };
      default: return { primary: '#ff8800', secondary: '#ffffff', glow: '#ff8800' };
    }
  }, [theme]);

  useFrame((state) => {
    if (solved) {
      if (doorRef.current && doorRef.current.position.y < 6) {
        doorRef.current.position.y += 0.05;
      }
      if (opacity > 0) {
        setOpacity(prev => Math.max(0, prev - 0.02));
      }
    } else {
        if (opacity < 1) setOpacity(1);
    }
  });

  if (solved && opacity <= 0) return null;

  return (
    <group position={[0, 0, z]}>
      {/* Wall blockage on sides - Now with opacity support */}
      <mesh position={[-3, 3.5, 0]} receiveShadow>
        <boxGeometry args={[2, 7, 0.4]} />
        <meshStandardMaterial color="#222222" transparent opacity={opacity} />
      </mesh>
      <mesh position={[3, 3.5, 0]} receiveShadow>
        <boxGeometry args={[2, 7, 0.4]} />
        <meshStandardMaterial color="#222222" transparent opacity={opacity} />
      </mesh>

      {/* Tribal Interaction Circle - Ancient Mystic Design with High Contrast */}
      {!solved && (
        <group position={[0, 0.05, 1.5]}>
            {/* Outer Decorative Ring with "Teeth" */}
            <group rotation={[-Math.PI / 2, 0, 0]}>
                <mesh>
                    <ringGeometry args={[0.8, 0.85, 32]} />
                    <meshBasicMaterial color={colors.primary} transparent opacity={0.6} blending={AdditiveBlending} />
                </mesh>
                {/* Tribal Sigils around the ring */}
                {[...Array(12)].map((_, i) => (
                    <mesh key={i} rotation={[0, 0, (i / 12) * Math.PI * 2]} position={[0.82, 0, 0]}>
                        <boxGeometry args={[0.05, 0.1, 0.03]} />
                        <meshBasicMaterial color={colors.secondary} transparent opacity={0.9} />
                    </mesh>
                ))}
            </group>

            {/* Inner Runic Orbit */}
            <group rotation={[-Math.PI / 2, 0, 0]}>
                <mesh>
                    <ringGeometry args={[0.5, 0.55, 32]} />
                    <meshBasicMaterial color={colors.primary} transparent opacity={0.5} blending={AdditiveBlending} />
                </mesh>
                {/* Floating Math Runes in a circle */}
                {[...Array(6)].map((_, i) => (
                    <Text
                        key={`rune-${i}`}
                        position={[Math.cos((i / 6) * Math.PI * 2) * 0.65, Math.sin((i / 6) * Math.PI * 2) * 0.65, 0.01]}
                        fontSize={0.12}
                        color={colors.secondary}
                        fillOpacity={0.9}
                    >
                        {['Σ', 'π', 'Ω', '∆', '√', '∞'][i]}
                    </Text>
                ))}
            </group>

            {/* Core Glow - "Eye of Knowledge" with White Hot Core for Contrast */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.4, 32]} />
                <meshBasicMaterial color={colors.primary} transparent opacity={0.3} blending={AdditiveBlending} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.01]}>
                <circleGeometry args={[0.1, 32]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={AdditiveBlending} />
            </mesh>
            <pointLight intensity={6} color={colors.glow} distance={8} />
            
            {/* Floating Sigil Above */}
            <Float speed={5} rotationIntensity={2} floatIntensity={0.5}>
                <mesh position={[0, 1.5, 0]}>
                    <octahedronGeometry args={[0.25]} />
                    <meshBasicMaterial color={colors.secondary} wireframe />
                </mesh>
                <pointLight intensity={3} color={colors.secondary} distance={3} />
            </Float>
        </group>
      )}

      {/* Main Arch Frame */}
      <group position={[0, 0, 0]}>
        <mesh position={[-1.3, 1.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 3.5, 0.4]} />
            <meshStandardMaterial 
              color="#333333" 
              transparent 
              opacity={opacity} 
              emissive={solved ? "#00ff00" : "#ff4400"}
              emissiveIntensity={0.1}
            />
        </mesh>
        <mesh position={[1.3, 1.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 3.5, 0.4]} />
            <meshStandardMaterial 
              color="#333333" 
              transparent 
              opacity={opacity} 
              emissive={solved ? "#00ff00" : "#ff4400"}
              emissiveIntensity={0.1}
            />
        </mesh>
        <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.8, 0.4, 0.4]} />
            <meshStandardMaterial 
              color="#333333" 
              transparent 
              opacity={opacity} 
              emissive={solved ? "#00ff00" : "#ff4400"}
              emissiveIntensity={0.1}
            />
        </mesh>
      </group>

      {/* Door Slab - Partially transparent when closed for visibility */}
      <mesh ref={doorRef} position={[0, solved ? 3.5 : 1.75, -0.05]} castShadow>
        <boxGeometry args={[2.2, 3.2, 0.1]} />
        <meshStandardMaterial 
           color={solved ? "#0a2a0a" : "#1a1a1a"} 
           metalness={0.9} 
           roughness={0.1}
           emissive={solved ? "#00ff00" : "#ff4400"}
           emissiveIntensity={0.2}
           transparent
           opacity={solved ? opacity : 0.15}
        />
        <Text
          position={[0, 0, 0.06]}
          fontSize={0.4}
          color={solved ? "#39ff14" : "#ffffff"}
          anchorX="center"
          anchorY="middle"
          fillOpacity={opacity}
        >
          {['∑', 'π', 'Ω', '∆', '√'][index % 5]}
        </Text>
      </mesh>
    </group>
  );
}

function Portal({ position, theme }: { position: [number, number, number], theme: string }) {
  const timeRef = useRef(0);
  const vortexRef = useRef<any>(null);
  const auraRef = useRef<any>(null);
  const coreRef = useRef<any>(null);

  // Theme-based colors
  const colors = useMemo(() => {
    switch (theme) {
      case 'water': return { primary: '#00ffff', secondary: '#ffffff' };
      case 'sky': return { primary: '#44ccff', secondary: '#ffffff' };
      case 'crystal': return { primary: '#8800ff', secondary: '#ff00ff' };
      default: return { primary: '#ffd700', secondary: '#ff8800' };
    }
  }, [theme]);

  useFrame((state, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    
    if (vortexRef.current) {
      vortexRef.current.rotation.z = t * 0.8;
      vortexRef.current.scale.setScalar(2.5 + Math.sin(t * 3) * 0.1);
    }
    if (auraRef.current) {
      auraRef.current.rotation.z = -t * 0.4;
      auraRef.current.opacity = 0.3 + Math.sin(t * 2) * 0.1;
    }
    if (coreRef.current) {
        coreRef.current.intensity = 8 + Math.sin(t * 5) * 4;
    }
  });

  return (
    <group position={position}>
      {/* Beacon Wall Light - Higher intensity, smaller distance */}
      <pointLight ref={coreRef} intensity={10} color={colors.primary} distance={20} position={[0, 2.5, 0]} />
      
      {/* Portal Frame - Two massive tech-sigil towers */}
      <group>
        <mesh position={[-1.6, 1.6, 0]} castShadow>
          <boxGeometry args={[0.4, 3.2, 0.4]} />
          <meshStandardMaterial color="#1a1a1a" emissive={colors.primary} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[1.6, 1.6, 0]} castShadow>
          <boxGeometry args={[0.4, 3.2, 0.4]} />
          <meshStandardMaterial color="#1a1a1a" emissive={colors.primary} emissiveIntensity={0.5} />
        </mesh>
        {/* Top connected sigils */}
        <mesh position={[0, 3.3, 0]}>
           <boxGeometry args={[3.6, 0.2, 0.2]} />
           <meshStandardMaterial color="#222" emissive={colors.primary} emissiveIntensity={1} />
        </mesh>
      </group>

      {/* The Vortex - Energy Core */}
      <mesh ref={vortexRef} position={[0, 1.6, -0.1]}>
        <circleGeometry args={[1.4, 32]} />
        <meshBasicMaterial color={colors.primary} transparent opacity={0.8} blending={AdditiveBlending} />
      </mesh>
      
      {/* Outer Energy Swirl */}
      <mesh ref={auraRef} position={[0, 1.6, -0.2]}>
        <circleGeometry args={[1.9, 32]} />
        <meshBasicMaterial color={colors.secondary} transparent opacity={0.4} blending={AdditiveBlending} />
      </mesh>

      {/* God Rays / Beam from the center - Horizontal towards player */}
      <mesh position={[0, 1.6, 2]} rotation={[-Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.2, 1.8, 6, 32, 1, true]} />
        <meshBasicMaterial color={colors.primary} transparent opacity={0.15} blending={AdditiveBlending} side={2} />
      </mesh>

      {/* Vertical Ascension Beam - Shoots to the sky */}
      <mesh position={[0, 15, 0]}>
        <cylinderGeometry args={[1, 3, 30, 32]} />
        <meshBasicMaterial color={colors.primary} transparent opacity={0.2} blending={AdditiveBlending} />
      </mesh>
      <mesh position={[0, 15, 0]}>
        <cylinderGeometry args={[0.2, 0.5, 30, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} blending={AdditiveBlending} />
      </mesh>

      {/* Floor Discharge Aura */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[6, 32]} />
        <meshBasicMaterial color={colors.primary} transparent opacity={0.3} blending={AdditiveBlending} />
      </mesh>

      {/* Portal Particles */}
      <Sparkles 
         position={[0, 3, 0]}
         count={150} 
         scale={[6, 6, 2]} 
         size={8} 
         speed={4} 
         opacity={1} 
         color={colors.primary} 
      />
    </group>
  );
}

function WaterFloor({ color, corridorLen, corridorW }: { color: string, corridorLen: number, corridorW: number }) {
  const meshRef = useRef<any>(null);
  const timeRef = useRef(0);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      // Small wave effect on position and slightly on material
      const time = timeRef.current;
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

function Pendulum({ position }: { position: [number, number, number] }) {
  const group = useRef<any>(null);
  const timeRef = useRef(0);
  useFrame((state, delta) => {
    timeRef.current += delta;
    if (group.current) {
        group.current.rotation.z = Math.sin(timeRef.current * 2) * 1.2;
    }
  });

  return (
    <group position={position}>
      <group ref={group} position={[0, 6.5, 0]}>
         {/* String/Chain */}
         <mesh position={[0, -2, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 4]} />
            <meshPhongMaterial color="#333" />
         </mesh>
         {/* Blade */}
         <mesh position={[0, -4, 0]} rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[1, 1, 0.1, 8]} />
            <meshPhongMaterial color="#888" shininess={100} />
            <mesh position={[0,0,0.06]}>
               <boxGeometry args={[1.5, 0.2, 0.01]} />
               <meshBasicMaterial color="#ff0000" opacity={0.5} transparent />
            </mesh>
         </mesh>
      </group>
    </group>
  );
}

function Spikes({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<any>(null);
  const timeRef = useRef(0);
  useFrame((state, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
        const cycle = (Math.sin(timeRef.current * 3) + 1) / 2;
        meshRef.current.position.y = -0.5 + cycle * 0.6;
    }
  });

  return (
    <group position={position}>
        <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[2, 0.2, 2]} />
            <meshPhongMaterial color="#222" />
        </mesh>
        <mesh ref={meshRef} position={[0, -0.5, 0]}>
            <group>
                {[...Array(9)].map((_, i) => (
                    <mesh key={i} position={[(i % 3 - 1) * 0.5, 0.3, (Math.floor(i / 3) - 1) * 0.5]}>
                        <coneGeometry args={[0.1, 0.6, 4]} />
                        <meshPhongMaterial color="#666" />
                    </mesh>
                ))}
            </group>
        </mesh>
    </group>
  );
}

function Prop({ type, position }: { type: 'vase' | 'crate' | 'barrel' | 'pillar', position: [number, number, number] }) {
  return (
    <group position={position}>
      {type === 'vase' && (
        <mesh castShadow scale={0.7}>
          <cylinderGeometry args={[0.2, 0.3, 0.6, 8]} />
          <meshPhongMaterial color="#8b4513" />
          <mesh position={[0, 0.35, 0]} rotation={[Math.PI/2, 0, 0]}>
             <torusGeometry args={[0.15, 0.05, 8, 16]} />
             <meshPhongMaterial color="#8b4513" />
          </mesh>
        </mesh>
      )}
      {type === 'crate' && (
        <mesh castShadow scale={0.7}>
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
           <cylinderGeometry args={[0.3, 0.35, 7, 8]} />
           <meshPhongMaterial color="#2a2a2a" />
        </mesh>
      )}
    </group>
  );
}

function Particles({ count = 80, theme }: { count?: number, theme: string }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 12;
      p[i * 3 + 1] = Math.random() * 8;
      p[i * 3 + 2] = -Math.random() * 80;
    }
    return p;
  }, [count]);

  const pointsRef = useRef<any>(null);
  const timeRef = useRef(0);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    if (pointsRef.current) {
        const time = timeRef.current;
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
        size={theme === 'water' ? 0.08 : theme === 'crystal' ? 0.1 : 0.04}
        color={
          theme === 'water' ? '#00eeff' : 
          theme === 'crystal' ? '#ff00ff' : 
          theme === 'abyss' ? '#55ccff' : 
          theme === 'library' ? '#ffcc00' : 
          '#ffffff'
        }
        transparent
        opacity={0.6}
        sizeAttenuation={true}
        blending={AdditiveBlending}
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
  const isCrystal = level.theme === 'crystal';

  // Corridor settings
  const corridorLen = 45;
  const corridorW = 4.2;
  const gateSpacing = 8;
  
  // Custom props distribution based on level
  const { props, traps } = useMemo(() => {
    const pList: { type: any, pos: [number, number, number] }[] = [];
    const tList: { type: 'pendulum' | 'spikes', pos: [number, number, number] }[] = [];
    
    for(let i = 0; i < 15; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const z = -Math.random() * 50 - 5;
        const x = side * (3.2 + Math.random() * 0.5);
        let type: any = Math.random() > 0.6 ? 'vase' : 'crate';
        if (isLibrary) type = Math.random() > 0.7 ? 'pillar' : 'crate';
        if (isCrystal) type = Math.random() > 0.5 ? 'pillar' : 'vase';
        pList.push({ type, pos: [x, type === 'pillar' ? 3.5 : 0.3, z] });
    }

    // Traps placement based on level difficulty
    const trapsCount = 2 + currentLevelIdx;
    for(let i = 0; i < trapsCount; i++) {
        const z = -(i + 1) * (corridorLen / (trapsCount + 1)) - 5;
        if (isWater || level.theme === 'cave' || isCrystal) {
            tList.push({ type: 'spikes', pos: [0, 0, z] });
        } else {
            tList.push({ type: 'pendulum', pos: [0, 0, z] });
        }
    }

    return { props: pList, traps: tList };
  }, [currentLevelIdx, level.theme, isWater, isLibrary, isCrystal, isAbyss]);

  return (
    <group>
      {/* Fog and Lighting */}
      <color attach="background" args={[level.fog]} />
      <fogExp2 attach="fog" color={level.fog} density={0.012} />
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.5} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 15, -20]} intensity={2.5} color={isCrystal ? "#cc88ff" : isAbyss ? "#66ccff" : "#fff1d0"} />

      {/* Floor */}
      {isWater ? (
        <WaterFloor color="#0a3a6a" corridorLen={corridorLen} corridorW={corridorW} />
      ) : isAbyss ? (
         <group>
            {/* Narrow path for Abyss */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -corridorLen / 2 + 2]} receiveShadow>
                <planeGeometry args={[3, corridorLen]} />
                <meshStandardMaterial color="#050505" roughness={0.1} metalness={0.8} />
            </mesh>
            {/* Glowing path edges */}
            <mesh position={[-1.5, 0.05, -corridorLen / 2 + 2]} rotation={[-Math.PI/2, 0, 0]}>
               <planeGeometry args={[0.05, corridorLen]} />
               <meshBasicMaterial color="#00ffff" />
            </mesh>
            <mesh position={[1.5, 0.05, -corridorLen / 2 + 2]} rotation={[-Math.PI/2, 0, 0]}>
               <planeGeometry args={[0.05, corridorLen]} />
               <meshBasicMaterial color="#00ffff" />
            </mesh>
         </group>
      ) : isCrystal ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -corridorLen / 2 + 2]} receiveShadow>
          <planeGeometry args={[corridorW, corridorLen]} />
          <meshStandardMaterial 
            color="#220044" 
            roughness={0.05}
            metalness={0.9}
            emissive="#4400aa"
            emissiveIntensity={0.2}
          />
        </mesh>
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -corridorLen / 2 + 2]} receiveShadow>
          <planeGeometry args={[corridorW, corridorLen]} />
          <meshStandardMaterial 
            color={isLibrary ? '#442211' : level.theme === 'cave' ? '#111111' : '#3e2c1a'} 
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* Traps */}
      {traps.map((t, i) => (
        t.type === 'pendulum' ? <Pendulum key={i} position={t.pos} /> : <Spikes key={i} position={t.pos} />
      ))}

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
            ) : isCrystal ? (
                <mesh position={[0, 6.8, 0]}>
                    <boxGeometry args={[corridorW, 0.2, 0.2]} />
                    <meshStandardMaterial color="#8800ff" emissive="#5500aa" />
                </mesh>
            ) : null}
            <mesh position={[-1.9, 3.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 7, 0.8]} />
                <meshPhongMaterial color={isCrystal ? "#2a0055" : "#1a1a1a"} />
            </mesh>
            <mesh position={[1.9, 3.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.4, 7, 0.8]} />
                <meshPhongMaterial color={isCrystal ? "#2a0055" : "#1a1a1a"} />
            </mesh>
            {isCrystal && (
                <pointLight position={[0, 4, 0]} intensity={0.5} color="#8800ff" distance={8} />
            )}
        </group>
      ))}

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 7, -corridorLen / 2 + 2]}>
        <planeGeometry args={[corridorW, corridorLen]} />
        <meshPhongMaterial color={isCrystal ? "#100022" : "#111"} />
      </mesh>

      {/* Walls */}
      <mesh position={[-corridorW / 2, 3.5, -corridorLen / 2 + 2]} receiveShadow>
        <boxGeometry args={[0.2, 7, corridorLen]} />
        <meshPhongMaterial color={isCrystal ? "#1a0033" : "#1a1a1a"} />
      </mesh>
      <mesh position={[corridorW / 2, 3.5, -corridorLen / 2 + 2]} receiveShadow>
        <boxGeometry args={[0.2, 7, corridorLen]} />
        <meshPhongMaterial color={isCrystal ? "#1a0033" : "#1a1a1a"} />
      </mesh>

      {/* End Wall */}
      <mesh position={[0, 3.5, -corridorLen + 1]} castShadow>
        <boxGeometry args={[corridorW, 7, 0.5]} />
        <meshPhongMaterial color={isCrystal ? "#1a0033" : "#1a1a1a"} />
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
        <Gate 
          key={`gate-${currentLevelIdx}-${i}`} 
          index={i} 
          z={-(i + 1) * gateSpacing - 3} 
          solved={i < score} 
          theme={level.theme}
        />
      ))}

      {/* World Interaction Guides and Path - Arrows on the floor */}
      {[...Array(6)].map((_, i) => (
        <group key={`guide-${i}`} position={[0, 0.05, -i * 8 - 4]}>
            {/* Pulsing neon arrow pointing forward */}
            <mesh rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[0.5, 0.5]} />
                <meshBasicMaterial 
                   color="#ff8800" 
                   transparent 
                   opacity={0.3} 
                   blending={AdditiveBlending} 
                   map={null} // We'll just use a shape
                />
            </mesh>
            <pointLight intensity={0.5} color="#ff8800" distance={5} />
        </group>
      ))}

      {/* Dimensional Portal (Formerly Treasure Chest) */}
      <Portal position={[0, 0, -54]} theme={level.theme} />
    </group>
  );
}
