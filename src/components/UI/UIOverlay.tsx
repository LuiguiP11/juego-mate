/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Heart, DoorOpen, User, Trophy, MapPin, RefreshCcw } from 'lucide-react';
import { useGameStore, LEVELS } from '../../store';
import StartScreen from './StartScreen';
import PuzzleOverlay from './PuzzleOverlay';
import GameOverScreen from './GameOverScreen';
import VictoryScreen from './VictoryScreen';
import CertificateScreen from './CertificateScreen';
import ControlsHint from './ControlsHint';

function HUD() {
  const { lives, score, playerName, currentLevel, phase, retries, nearGateIndex, setPhase } = useGameStore();
  const level = LEVELS[currentLevel];

  if (phase === 'start' || phase === 'certificate') return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 pointer-events-none h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3 bg-black/60 backdrop-blur-md border-b border-orange-500/30 pointer-events-auto">
        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex flex-col">
            <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-gray-400">Vidas</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <Heart key={i} size={14} className={i < lives ? "fill-red-500 text-red-500" : "text-gray-700"} />
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-gray-400">Intentos</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <RefreshCcw key={i} size={10} className={i < retries ? "text-orange-400" : "text-gray-800"} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-orange-500/80 font-bold">Explorando</span>
          <span className="text-xs md:text-sm font-black text-white tracking-tight text-center leading-none truncate max-w-[100px] md:max-w-none">
            {level.name.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-3 md:gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-gray-400">Puertas</span>
            <span className="text-sm md:text-lg font-mono font-bold text-yellow-400">{score}/5</span>
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
            className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-4"
          >
            <div className="px-6 py-3 bg-black/80 backdrop-blur-xl border border-orange-500/50 rounded-full flex items-center gap-4 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
               <div className="flex flex-col">
                  <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Altar de Desafío</span>
                  <span className="text-white font-bold">Acércate para resolver</span>
               </div>
               <button 
                onClick={() => setPhase('puzzle')}
                className="w-12 h-12 bg-orange-500 hover:bg-orange-400 rounded-full flex items-center justify-center text-white font-black shadow-lg transition-transform active:scale-95"
               >
                 E
               </button>
            </div>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Presiona 'E' o toca el círculo para comenzar</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial */}
      {phase === 'playing' && <ControlsHint />}
    </div>
  );
}

export default function UIOverlay() {
  const phase = useGameStore((state) => state.phase);

  return (
    <>
      <HUD />
      <AnimatePresence mode="wait">
        {phase === 'start' && <StartScreen key="start" />}
        {phase === 'puzzle' && <PuzzleOverlay key="puzzle" />}
        {phase === 'gameover' && <GameOverScreen key="over" />}
        {phase === 'victory' && <VictoryScreen key="victory" />}
        {phase === 'certificate' && <CertificateScreen key="cert" />}
      </AnimatePresence>
    </>
  );
}
