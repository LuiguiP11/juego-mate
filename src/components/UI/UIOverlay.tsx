/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, DoorOpen, User, Trophy, MapPin, RefreshCcw, Volume2, VolumeX, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react';
import { useGameStore, LEVELS } from '../../store';
import StartScreen from './StartScreen';
import IntroScreen from './IntroScreen';
import PuzzleOverlay from './PuzzleOverlay';
import GameOverScreen from './GameOverScreen';
import VictoryScreen from './VictoryScreen';
import CertificateScreen from './CertificateScreen';
import ControlsHint from './ControlsHint';

function HUD() {
  const { lives, score, playerName, currentLevel, phase, retries, nearGateIndex, setPhase, muted, toggleMute, inventory, totalPoints, setMobileControl } = useGameStore();
  const level = LEVELS[currentLevel];

  if (phase === 'start' || phase === 'intro' || phase === 'certificate') return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 pointer-events-none h-full">
      {/* Top Bar - Compact version */}
      <div className="flex items-center justify-between px-3 md:px-6 py-1 md:py-2 bg-black/60 backdrop-blur-md border-b border-orange-500/30 pointer-events-auto">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={toggleMute}
            className="p-1 px-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          
          <div className="flex flex-col">
            <span className="text-[7px] md:text-[9px] uppercase tracking-wider text-gray-500 font-bold leading-none">Vidas</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <Heart key={i} size={10} className={i < lives ? "fill-red-500 text-red-500" : "text-gray-800"} />
              ))}
            </div>
          </div>

          <div className="flex flex-col border-l border-white/10 pl-2">
            <span className="text-[7px] md:text-[8px] uppercase tracking-wider text-gray-500 font-bold leading-none">Intentos</span>
            <span className="text-[9px] font-mono text-orange-400 font-black">{retries}</span>
          </div>
          
          {inventory.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 border-l border-white/10 pl-2 opacity-60">
                {inventory.map((_, i) => <Trophy key={i} size={10} className="text-yellow-500" />)}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[7px] md:text-[9px] uppercase tracking-widest text-orange-500/80 font-black">Score</span>
          <span className="text-xs md:text-base font-mono font-black text-yellow-500 leading-none">
            {totalPoints}
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[7px] md:text-[9px] uppercase tracking-wider text-gray-400">Progreso</span>
            <span className="text-xs md:text-base font-mono font-bold text-white uppercase">{score}/5</span>
          </div>
          <div className="hidden sm:flex flex-col items-end border-l border-white/10 pl-6">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">{level.theme}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-200">{playerName || 'Explorador'}</span>
              <User size={14} className="text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Interact Hint / Mobile Button */}
      <AnimatePresence>
        {phase === 'playing' && nearGateIndex !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 lg:bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-2"
          >
            <div 
              onClick={() => setPhase('puzzle')}
              className="cursor-pointer px-4 py-2 bg-black/80 backdrop-blur-xl border border-orange-500 rounded-xl flex items-center gap-4 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            >
               <div className="flex flex-col">
                  <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest leading-none">¡SIGILO ACTIVADO!</span>
                  <span className="text-white text-sm font-black tracking-tight underline decoration-orange-500">PÁRATE EN EL CÍRCULO</span>
               </div>
               <button 
                onClick={(e) => { e.stopPropagation(); setPhase('puzzle'); }}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white text-lg sm:text-xl font-black shadow-[0_4px_0_rgb(154,52,18)] transition-transform active:translate-y-1 active:shadow-none cursor-pointer"
               >
                 E
               </button>
            </div>
            <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Presiona 'E' o toca el cuadro</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Virtual Controller Overlay (Hidden on desktop / active on touch screen or smaller screens) */}
      {phase === 'playing' && (
        <div className="absolute inset-x-0 bottom-0 top-auto z-40 h-48 pointer-events-none lg:hidden select-none">
          {/* Movement D-Pad (Left Side) */}
          <div className="absolute bottom-4 left-4 flex flex-col items-center gap-1 pointer-events-auto">
            {/* Forward */}
            <button 
              onTouchStart={() => setMobileControl('forward', true)}
              onTouchEnd={() => setMobileControl('forward', false)}
              onTouchCancel={() => setMobileControl('forward', false)}
              onMouseDown={() => setMobileControl('forward', true)}
              onMouseUp={() => setMobileControl('forward', false)}
              onMouseLeave={() => setMobileControl('forward', false)}
              className="w-11 h-11 bg-black/60 active:bg-orange-600/80 border border-white/10 rounded-xl flex items-center justify-center text-white shadow-lg backdrop-blur-md active:scale-90 transition-all cursor-pointer"
            >
              <ChevronUp size={22} />
            </button>
            {/* Row for Left & Right */}
            <div className="flex gap-11">
              <button 
                onTouchStart={() => setMobileControl('left', true)}
                onTouchEnd={() => setMobileControl('left', false)}
                onTouchCancel={() => setMobileControl('left', false)}
                onMouseDown={() => setMobileControl('left', true)}
                onMouseUp={() => setMobileControl('left', false)}
                onMouseLeave={() => setMobileControl('left', false)}
                className="w-11 h-11 bg-black/60 active:bg-orange-600/80 border border-white/10 rounded-xl flex items-center justify-center text-white shadow-lg backdrop-blur-md active:scale-90 transition-all cursor-pointer"
              >
                <ChevronLeft size={22} />
              </button>
              <button 
                onTouchStart={() => setMobileControl('right', true)}
                onTouchEnd={() => setMobileControl('right', false)}
                onTouchCancel={() => setMobileControl('right', false)}
                onMouseDown={() => setMobileControl('right', true)}
                onMouseUp={() => setMobileControl('right', false)}
                onMouseLeave={() => setMobileControl('right', false)}
                className="w-11 h-11 bg-black/60 active:bg-orange-600/80 border border-white/10 rounded-xl flex items-center justify-center text-white shadow-lg backdrop-blur-md active:scale-90 transition-all cursor-pointer"
              >
                <ChevronRight size={22} />
              </button>
            </div>
            {/* Backward */}
            <button 
              onTouchStart={() => setMobileControl('backward', true)}
              onTouchEnd={() => setMobileControl('backward', false)}
              onTouchCancel={() => setMobileControl('backward', false)}
              onMouseDown={() => setMobileControl('backward', true)}
              onMouseUp={() => setMobileControl('backward', false)}
              onMouseLeave={() => setMobileControl('backward', false)}
              className="w-11 h-11 bg-black/60 active:bg-orange-600/80 border border-white/10 rounded-xl flex items-center justify-center text-white shadow-lg backdrop-blur-md active:scale-90 transition-all cursor-pointer"
            >
              <ChevronDown size={22} />
            </button>
          </div>

          {/* Jump Button (Right Side) */}
          <div className="absolute bottom-4 right-4 pointer-events-auto">
            <button 
              onTouchStart={() => setMobileControl('jump', true)}
              onTouchEnd={() => setMobileControl('jump', false)}
              onTouchCancel={() => setMobileControl('jump', false)}
              onMouseDown={() => setMobileControl('jump', true)}
              onMouseUp={() => setMobileControl('jump', false)}
              onMouseLeave={() => setMobileControl('jump', false)}
              className="w-14 h-14 bg-gradient-to-tr from-orange-600 to-red-600 active:from-orange-500 active:to-red-500 border border-orange-500/20 rounded-full flex flex-col items-center justify-center text-white shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <ArrowUp size={18} className="animate-bounce" />
              <span className="text-[7px] font-black tracking-widest uppercase mt-0.5 leading-none">Saltar</span>
            </button>
          </div>
        </div>
      )}

      {/* Tutorial */}
      {phase === 'playing' && <ControlsHint />}
    </div>
  );
}

function LevelStart() {
  const { currentLevel, phase } = useGameStore();
  const [visible, setVisible] = useState(false);
  const level = LEVELS[currentLevel];

  useEffect(() => {
    if (phase === 'playing') {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentLevel, phase]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            className="h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent mb-4"
          />
          <span className="text-orange-500 font-black tracking-[0.5em] uppercase text-[10px] sm:text-xs mb-1">Expedición 0{currentLevel + 1}</span>
          <h2 className="text-white font-serif text-2xl sm:text-4xl font-black uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
            {level.name}
          </h2>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            className="h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent mt-4"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function UIOverlay() {
  const phase = useGameStore((state) => state.phase);

  return (
    <>
      <HUD />
      <LevelStart />
      <AnimatePresence mode="wait">
        {phase === 'start' && <StartScreen key="start" />}
        {phase === 'intro' && <IntroScreen key="intro" />}
        {phase === 'puzzle' && <PuzzleOverlay key="puzzle" />}
        {phase === 'gameover' && <GameOverScreen key="over" />}
        {phase === 'victory' && <VictoryScreen key="victory" />}
        {phase === 'certificate' && <CertificateScreen key="cert" />}
      </AnimatePresence>
    </>
  );
}
