/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight, Award, Home } from 'lucide-react';
import { useGameStore, LEVELS } from '../../store';
import FamilyPerformancePanel from './FamilyPerformancePanel';

export default function VictoryScreen() {
  const { 
    currentLevel, 
    playerName, 
    setPhase, 
    unlockNextLevel, 
    startLevel,
    resetGame 
  } = useGameStore();
  
  const level = LEVELS[currentLevel];
  const isLast = currentLevel === LEVELS.length - 1;

  useEffect(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    unlockNextLevel();
    if (!isLast) {
      startLevel(currentLevel + 1);
    } else {
      setPhase('certificate');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-[radial-gradient(circle_at_center,_rgba(200,165,0,0.15)_0%,_#030306_100%)] flex items-center justify-center p-3 sm:p-6 pointer-events-auto overflow-y-auto"
    >
      <div className="w-full max-w-5xl bg-[#090a0f]/95 border-2 border-yellow-500/20 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 shadow-[0_0_80px_rgba(234,179,8,0.1)] my-auto max-h-[92vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* LEFT COLUMN: Victory Celebration (cols: 5) */}
          <div className="md:col-span-5 space-y-4 sm:space-y-6 text-center md:text-left flex flex-col justify-between h-full md:sticky md:top-0">
            <div className="space-y-4">
              {/* Trophy Header */}
              <div className="flex flex-col items-center md:items-start space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 animate-pulse" />
                  <Trophy size={48} className="text-yellow-400 relative z-10 drop-shadow-[0_0_15px_rgba(255,215,0,0.4)] sm:size-[56px]" />
                </motion.div>
                
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-white tracking-tighter">
                    {isLast ? "¡LEYENDA SUPREMA!" : "¡NIVEL SUPERADO!"}
                  </h1>
                  <p className="text-yellow-500 font-sans tracking-[0.2em] uppercase text-[8px] sm:text-[9px] font-bold text-center md:text-left">
                    Ascensión Lograda • {level.name}
                  </p>
                </div>
              </div>

              {/* Achievements details card */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col items-center md:items-start p-2.5 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-[7px] sm:text-[8px] uppercase tracking-widest text-gray-400 mb-0.5 font-mono">Explorador</span>
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-full">{playerName || 'Anónimo'}</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start p-2.5 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-[7px] sm:text-[8px] uppercase tracking-widest text-gray-400 mb-0.5 font-mono">Artefacto</span>
                    <span className="text-xs sm:text-sm font-bold text-yellow-500 truncate max-w-full">{level.treasure}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center py-3 border-t border-white/10">
                  <span className="text-[10px] sm:text-xs text-gray-300 font-medium">Calificación perfecta en Puertas de Sabiduría</span>
                  <div className="flex items-center gap-2 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: i * 0.1, type: 'spring' }}
                        className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-black shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                      >
                        <Award size={14} fill="currentColor" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons inside same left column */}
            <div className="flex flex-col gap-2.5 pt-4">
              <button
                onClick={handleNext}
                className="w-full py-3 sm:py-3.5 bg-white text-black rounded-xl font-serif text-sm sm:text-base font-black flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-white/5 cursor-pointer"
              >
                {isLast ? "Finalizar Expedición" : "Siguiente Nivel"}
                <ArrowRight size={18} />
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setPhase('certificate')}
                  className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-serif text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all shadow-md shadow-orange-600/10 cursor-pointer"
                >
                  <Award size={16} />
                  <span>Certificado</span>
                </button>
                <button
                  onClick={resetGame}
                  className="w-12 h-11 sm:h-12 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/10 transition-all flex items-center justify-center cursor-pointer"
                  title="Reiniciar"
                >
                  <Home size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Performance and AI Report (cols: 7) */}
          <div className="md:col-span-7 bg-white/[0.01] border border-white/5 rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-6 shadow-inner">
            <FamilyPerformancePanel />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
