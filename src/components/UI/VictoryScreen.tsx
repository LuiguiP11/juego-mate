/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight, Award, Home } from 'lucide-react';
import { useGameStore, LEVELS } from '../../store';

export default function VictoryScreen() {
  const { 
    currentLevel, 
    score, 
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
      className="fixed inset-0 z-[300] bg-[radial-gradient(circle_at_center,_rgba(200,165,0,0.2)_0%,_#000_100%)] flex flex-col items-center justify-center p-6 pointer-events-auto"
    >
      <div className="w-full max-w-lg text-center space-y-6 sm:space-y-8">
        <header className="space-y-2 sm:space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-30 animate-pulse" />
              <Trophy size={60} className="text-yellow-400 relative z-10 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" />
            </div>
          </motion.div>
          
          <h1 className="text-2xl md:text-4xl font-serif font-black text-white tracking-tighter">
            {isLast ? "¡LEYENDA SUPREMA!" : "¡NIVEL SUPERADO!"}
          </h1>
          <p className="text-yellow-500 font-sans tracking-[0.2em] uppercase text-[10px] font-bold">
            Ascensión Lograda
          </p>
        </header>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-[8px] uppercase tracking-widest text-gray-400 mb-0.5">Explorador</span>
              <span className="text-sm font-bold text-white">{playerName || 'Anónimo'}</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-[8px] uppercase tracking-widest text-gray-400 mb-0.5">Artefacto</span>
              <span className="text-sm font-bold text-yellow-500">{level.treasure}</span>
            </div>
          </div>

          <div className="flex flex-col items-center py-2 border-t border-white/10">
            <span className="text-xs text-gray-300">Puntuación perfecta en las puertas matematicas</span>
            <div className="flex items-center gap-2 mt-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                   <Award size={16} fill="currentColor" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 justify-center w-full max-w-md mx-auto">
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-white text-black rounded-xl font-serif text-base font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/10"
          >
            {isLast ? "Finalizar Expedición" : "Siguiente Nivel"}
            <ArrowRight size={20} />
          </button>
          <button
            onClick={() => setPhase('certificate')}
            className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-serif text-base font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-orange-600/20"
          >
            <Award size={20} />
            Certificado
          </button>
          <button
            onClick={resetGame}
            className="w-12 h-12 flex-shrink-0 bg-white/5 text-gray-400 rounded-xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center"
            title="Reiniciar"
          >
            <Home size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
