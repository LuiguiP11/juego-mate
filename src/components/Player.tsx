/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, LEVELS } from '../store';

export default function Player() {
  const group = useRef<THREE.Group>(null);
  const bodyGroup = useRef<THREE.Group>(null);
  const headGroup = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);

  const [blinking, setBlinking] = useState(false);
  const blinkTimer = useRef(0);

  const gender = useGameStore((state) => state.gender);
  const phase = useGameStore((state) => state.phase);
  const currentLevel = useGameStore((state) => state.currentLevel);
  
  const [, getKeys] = useKeyboardControls();
  const isMale = gender === 'male';

  // Movement physics
  const velocity = useRef(new THREE.Vector3());
  const position = useRef(new THREE.Vector3(0, 0.5, 0));
  const timeRef = useRef(0);

  // Reset position on level change
  useEffect(() => {
    position.current.set(0, 0.5, 0);
    velocity.current.set(0, 0, 0);
    if (group.current) {
        group.current.position.set(0, 0.5, 0);
        group.current.rotation.y = 0;
    }
  }, [currentLevel]);
  const GRAVITY = 0.006;
  const MOVE_SPEED = 0.08;
  const JUMP_FORCE = 0.14;
  const onGround = useRef(true);

  // Colors
  const COLORS = useMemo(() => isMale ? {
    skin: '#f5c090', body: '#c8a050', pants: '#8a6e30', hat: '#8b5e1a', belt: '#3e2008', boot: '#2e1608'
  } : {
    skin: '#f5b898', body: '#5a0e9a', pants: '#2a1860', hat: '#6a00aa', belt: '#2a1808', boot: '#1a1230'
  }, [isMale]);

  useFrame((state, delta) => {
    if (phase !== 'playing') return;

    // Increment time manually using delta (modern approach avoiding THREE.Clock)
    timeRef.current += delta;
    const time = timeRef.current;

    const { forward, backward, left, right, jump, interact } = getKeys();
    const gates = useGameStore.getState().score; // Number of solved gates

    // Interaction check
    if (interact && useGameStore.getState().nearGateIndex !== null) {
      useGameStore.getState().setPhase('puzzle');
    }

    // Horizontal Movement
    let dx = 0;
    let dz = 0;
    if (forward) dz -= MOVE_SPEED;
    if (backward) dz += MOVE_SPEED * 0.6;
    if (left) dx -= MOVE_SPEED * 0.7;
    if (right) dx += MOVE_SPEED * 0.7;

    velocity.current.x = dx;
    velocity.current.z = dz;

    // Vertical Movement (Gravity)
    velocity.current.y -= GRAVITY;
    
    // Jump
    if (jump && onGround.current) {
      velocity.current.y = JUMP_FORCE;
      onGround.current = false;
    }

    position.current.add(velocity.current);

    // --- COLLISIONS ---
    
    // Floor collision
    if (position.current.y <= 0.03) {
      position.current.y = 0.03;
      velocity.current.y = 0;
      onGround.current = true;
    }

    // World Constraints (Walls)
    const isAbyss = useGameStore.getState().currentLevel === 3; // level 4 (Abyss)
    
    if (isAbyss) {
        // Narrow path constraints for Abyss
        if (Math.abs(position.current.x) > 1.2 && position.current.y < 0.2) {
            // Player is falling!
            velocity.current.y -= 0.01;
            if (position.current.y < -5) {
                // Respawn and lose life
                useGameStore.getState().solvePuzzle(false); // Wrong answer / Death logic
                position.current.set(0, 5, position.current.z + 5); // Respawn slightly back and high
                velocity.current.set(0,0,0);
            }
        } else {
            position.current.x = Math.max(-1.8, Math.min(1.8, position.current.x));
        }
    } else {
        position.current.x = Math.max(-1.8, Math.min(1.8, position.current.x));
    }
    
    position.current.z = Math.min(2, position.current.z); // Back wall

    // Gate Collisions and Proximity
    let foundGate = null;
    const gateSpacing = 8;
    for (let i = 0; i < 5; i++) {
        const gateZ = -(i + 1) * gateSpacing - 3;
        const isSolved = i < gates;
        
        // Proximity for interaction (Centered at x: 0, and relative z: 1.2 from gate)
        // Actual marker Z is gateZ + 1.2
        const markerZ = gateZ + 1.2;
        const dist = Math.sqrt(Math.pow(position.current.x, 2) + Math.pow(position.current.z - markerZ, 2));
        if (dist < 1.2 && !isSolved) {
            foundGate = i;
        }

        if (!isSolved) {
            if (position.current.z < gateZ + 0.4 && position.current.z > gateZ - 0.4) {
                position.current.z = gateZ + 0.4;
                velocity.current.z = 0;
            }
        }
    }

    // --- TRAP COLLISIONS ---
    if (useGameStore.getState().currentLevel >= 1) {
        for(let i = 0; i < 3; i++) {
            const trapZ = -(i + 1) * 15 - 5;
            const dist = Math.sqrt(Math.pow(position.current.x, 2) + Math.pow(position.current.z - trapZ, 2));
            
            // Basic proximity check for simplified collisions
            if (dist < 1.2) {
                const currentLevelIdx = useGameStore.getState().currentLevel;
                const levelMetadata = useGameStore.getState().currentLevel !== null ? LEVELS[currentLevelIdx] : null;
                const isWaterLevel = levelMetadata?.theme === 'water';
                const isCaveLevel = levelMetadata?.theme === 'cave';
                const isPendulum = !isAbyss && !isWaterLevel && !isCaveLevel;
                
                let hit = false;
                if (isPendulum) {
                    // Check if pendulum blade is in center
                    const swing = Math.sin(time * 2) * 1.2;
                    if (Math.abs(swing) < 0.3) hit = true;
                } else {
                    // Spikes check
                    const cycle = (Math.sin(time * 3) + 1) / 2;
                    if (cycle > 0.6) hit = true;
                }

                if (hit) {
                    // Push back and damage
                    useGameStore.getState().solvePuzzle(false);
                    position.current.z += 2;
                    velocity.current.set(0, 0, 0.1);
                }
            }
        }
    }
    
    if (useGameStore.getState().nearGateIndex !== foundGate) {
        useGameStore.getState().setNearGate(foundGate);
    }

    // Chest Collision (Victory Point)
    const CHEST_Z = -54;
    if (position.current.z < CHEST_Z + 1.2 && position.current.z > CHEST_Z - 1) {
        if (Math.abs(position.current.x) < 1.0) {
            position.current.z = CHEST_Z + 1.2;
            velocity.current.z = 0;
            // Trigger victory if all gates solved
            if (gates >= 5 && phase === 'playing') {
                useGameStore.getState().setPhase('victory');
            }
        }
    }

    // Update group position
    if (group.current) {
      group.current.position.copy(position.current);
      
      // Face direction
      if (dz < 0) group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.2);
      if (dz > 0) group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.PI, 0.2);
      if (dx < 0 && dz === 0) group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.PI * 0.5, 0.2);
      if (dx > 0 && dz === 0) group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, -Math.PI * 0.5, 0.2);
    }

    // Animation updates...
    const isMoving = dx !== 0 || dz !== 0;
    
    if (isMoving) {
      const swing = Math.sin(time * 10) * 0.6;
      if (legL.current) legL.current.rotation.x = swing;
      if (legR.current) legR.current.rotation.x = -swing;
      if (armL.current) armL.current.rotation.x = -swing * 0.5;
      if (armR.current) armR.current.rotation.x = swing * 0.5;
      if (bodyGroup.current) bodyGroup.current.position.y = Math.abs(Math.sin(time * 20)) * 0.05;
    } else {
      const breath = Math.sin(time * 2) * 0.02;
      if (bodyGroup.current) bodyGroup.current.position.y = breath;
      if (legL.current) legL.current.rotation.x = THREE.MathUtils.lerp(legL.current.rotation.x, 0, 0.1);
      if (legR.current) legR.current.rotation.x = THREE.MathUtils.lerp(legR.current.rotation.x, 0, 0.1);
      if (armL.current) armL.current.rotation.x = THREE.MathUtils.lerp(armL.current.rotation.x, 0, 0.1);
      if (armR.current) armR.current.rotation.x = THREE.MathUtils.lerp(armR.current.rotation.x, 0, 0.1);
    }

    // Blinking logic
    blinkTimer.current += delta;
    if (blinkTimer.current > 3 && !blinking) {
      setBlinking(true);
      setTimeout(() => {
        if (blinkTimer.current !== undefined) {
          setBlinking(false);
          blinkTimer.current = 0;
        }
      }, 150);
    }
  });

  return (
    <group ref={group} name="player_group" scale={0.65}>
      <Sparkles 
         count={50} 
         scale={[1.5, 3, 1.5]} 
         size={3} 
         speed={2} 
         opacity={0.8} 
         color={isMale ? "#00ffff" : "#ff00ff"} 
         noise={0.5}
      />
      <Sparkles 
         count={20} 
         scale={[2, 2, 2]} 
         size={6} 
         speed={4} 
         opacity={0.4} 
         color="#ffffff" 
         noise={1}
      />
      <group position={[0, -0.45, 0]} name="player_shadow">
         <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.9, 0.9]} />
            <meshBasicMaterial color="black" transparent opacity={0.3} />
         </mesh>
      </group>
      <group ref={bodyGroup}>
        {/* Torso with more detail */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.6, 0.7, 0.38]} />
          <meshPhongMaterial color={COLORS.body} shininess={30} />
          {/* Shirt details */}
          <mesh position={[0, 0, 0.2]}>
            <boxGeometry args={[0.1, 0.4, 0.02]} />
            <meshBasicMaterial color="#333" />
          </mesh>
        </mesh>
        
        {/* Head with more detail */}
        <group ref={headGroup} position={[0, 1.5, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.45, 0.45, 0.4]} />
            <meshPhongMaterial color={COLORS.skin} shininess={10} />
          </mesh>
          
          {/* Eyes with pupils and expression */}
          <group position={[0, 0.05, -0.21]}>
             <mesh position={[-0.12, 0, 0]} scale={[1, blinking ? 0.1 : 1, 1]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial color={blinking ? COLORS.skin : "white"} />
                {!blinking && (
                  <mesh position={[0, 0, -0.06]}>
                      <sphereGeometry args={[0.04, 12, 12]} />
                      <meshBasicMaterial color="black" />
                  </mesh>
                )}
             </mesh>
             <mesh position={[0.12, 0, 0]} scale={[1, blinking ? 0.1 : 1, 1]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial color={blinking ? COLORS.skin : "white"} />
                {!blinking && (
                  <mesh position={[0, 0, -0.06]}>
                      <sphereGeometry args={[0.04, 12, 12]} />
                      <meshBasicMaterial color="black" />
                  </mesh>
                )}
             </mesh>
          </group>

          {/* Nose */}
          <mesh position={[0, -0.05, -0.22]}>
            <boxGeometry args={[0.06, 0.1, 0.05]} />
            <meshPhongMaterial color={COLORS.skin} />
          </mesh>

          {/* Mouth / Smile */}
          <mesh position={[0, -0.15, -0.21]}>
             <capsuleGeometry args={[0.05, 0.1, 8, 8]} />
             <meshPhongMaterial color="#883333" />
          </mesh>
          
          {/* Hair / Hat Details */}
          {isMale ? (
            <group position={[0, 0.22, 0]}>
              <mesh position={[0, 0.1, 0]} castShadow>
                <cylinderGeometry args={[0.26, 0.3, 0.3, 10]} />
                <meshPhongMaterial color={COLORS.hat} />
              </mesh>
              <mesh position={[0, 0, 0]} castShadow>
                <cylinderGeometry args={[0.5, 0.5, 0.06, 16]} />
                <meshPhongMaterial color={COLORS.hat} />
              </mesh>
              {/* Hat band */}
              <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.31, 0.31, 0.05, 10]} />
                <meshBasicMaterial color="#221105" />
              </mesh>
               {/* Side hair */}
               <mesh position={[-0.23, -0.2, 0.1]}>
                <boxGeometry args={[0.05, 0.3, 0.2]} />
                <meshPhongMaterial color="#4a2a10" />
              </mesh>
              <mesh position={[0.23, -0.2, 0.1]}>
                <boxGeometry args={[0.05, 0.3, 0.2]} />
                <meshPhongMaterial color="#4a2a10" />
              </mesh>
            </group>
          ) : (
            <group position={[0, 0.1, 0]}>
                {/* Bun */}
                <mesh position={[0, 0.15, 0.2]} castShadow>
                    <sphereGeometry args={[0.2, 16, 12]} />
                    <meshPhongMaterial color="#1a1111" />
                </mesh>
                {/* Hair bang */}
                 <mesh position={[0, 0.15, -0.1]} castShadow>
                    <boxGeometry args={[0.48, 0.15, 0.2]} />
                    <meshPhongMaterial color="#1a1111" />
                </mesh>
                <mesh position={[0, -0.2, 0.15]}>
                    <boxGeometry args={[0.5, 0.5, 0.1]} />
                    <meshPhongMaterial color="#1a1111" />
                </mesh>
            </group>
          )}
        </group>

        {/* Backpack Equipment */}
        <group position={[0, 0.9, 0.25]}>
            <mesh castShadow>
                <boxGeometry args={[0.5, 0.6, 0.25]} />
                <meshPhongMaterial color="#4a3a2a" />
            </mesh>
            {/* Straps */}
            <mesh position={[-0.2, 0, -0.15]}>
                <boxGeometry args={[0.1, 0.7, 0.05]} />
                <meshPhongMaterial color="#3a2a1a" />
            </mesh>
            <mesh position={[0.2, 0, -0.15]}>
                <boxGeometry args={[0.1, 0.7, 0.05]} />
                <meshPhongMaterial color="#3a2a1a" />
            </mesh>
            {/* Bedroll on top */}
             <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.12, 0.12, 0.55, 8]} />
                <meshPhongMaterial color="#335533" />
            </mesh>
        </group>

        {/* Improved Arms */}
        <group ref={armL} position={[-0.4, 1.2, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshPhongMaterial color={COLORS.body} />
          </mesh>
          <mesh position={[0, -0.65, 0]} castShadow>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshPhongMaterial color={COLORS.skin} />
          </mesh>
        </group>
        <group ref={armR} position={[0.4, 1.2, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <boxGeometry args={[0.2, 0.6, 0.2]} />
            <meshPhongMaterial color={COLORS.body} />
          </mesh>
          <mesh position={[0, -0.65, 0]} castShadow>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshPhongMaterial color={COLORS.skin} />
          </mesh>
        </group>
      </group>

      {/* Improved Legs */}
      <group ref={legL} position={[-0.18, 0.6, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.22, 0.6, 0.24]} />
          <meshPhongMaterial color={COLORS.pants} />
        </mesh>
        <mesh position={[0, -0.65, 0.02]} castShadow>
          <boxGeometry args={[0.24, 0.15, 0.32]} />
          <meshPhongMaterial color={COLORS.boot} />
        </mesh>
      </group>
      <group ref={legR} position={[0.18, 0.6, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.22, 0.6, 0.24]} />
          <meshPhongMaterial color={COLORS.pants} />
        </mesh>
        <mesh position={[0, -0.65, 0.02]} castShadow>
          <boxGeometry args={[0.24, 0.15, 0.32]} />
          <meshPhongMaterial color={COLORS.boot} />
        </mesh>
      </group>

      <pointLight position={[0, 2, 1]} intensity={2.5} color="#ffffff" distance={10} />
    </group>
  );
}
