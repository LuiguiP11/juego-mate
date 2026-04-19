/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useGameStore } from '../../store';

export default function Joystick() {
  const setJoystick = useGameStore((state) => state.setJoystick);
  const phase = useGameStore((state) => state.phase);
  
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    updateJoystick(e);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (dragging) {
      updateJoystick(e);
    }
  };

  const handlePointerUp = () => {
    setDragging(false);
    setPosition({ x: 0, y: 0 });
    setJoystick(0, 0, false);
  };

  const updateJoystick = (e: React.PointerEvent | PointerEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let x = e.clientX - centerX;
    let y = e.clientY - centerY;
    
    const distance = Math.sqrt(x * x + y * y);
    const maxRadius = rect.width / 2;
    
    if (distance > maxRadius) {
      x = (x / distance) * maxRadius;
      y = (y / distance) * maxRadius;
    }
    
    setPosition({ x, y });
    
    // Normalize values between -1 and 1
    const normX = x / maxRadius;
    const normY = y / maxRadius;
    
    setJoystick(normX, normY, true);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    } else {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragging]);

  if (phase !== 'playing') return null;

  return (
    <div className="fixed bottom-10 left-10 z-[100] pointer-events-auto select-none sm:hidden">
      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        className="w-32 h-32 bg-white/5 backdrop-blur-md rounded-full border-2 border-white/10 relative flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)]"
      >
        {/* Inner static circle */}
        <div className="w-12 h-12 bg-white/5 rounded-full border border-white/5 pointer-events-none" />
        
        {/* The Knob */}
        <motion.div
          animate={{ x: position.x, y: position.y }}
          transition={{ type: 'spring', damping: 20, stiffness: 200, mass: 0.5 }}
          className="absolute w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full border-2 border-white/20 shadow-xl pointer-events-none"
        >
          <div className="absolute inset-0 bg-white/20 rounded-full blur-[2px]" />
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 rounded-full" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
