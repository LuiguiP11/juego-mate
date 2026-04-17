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
      <div className="w-full max-w-xl text-center space-y-10">
        <header className="space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-30 animate-pulse" />
              <Trophy size={100} className="text-yellow-400 relative z-10 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" />
            </div>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-serif font-black text-white tracking-tighter">
            {isLast ? "¡LEYENDA SUPREMA!" : "¡NIVEL SUPERADO!"}
          </h1>
          <p className="text-yellow-500 font-sans tracking-[0.4em] uppercase text-xs font-bold">
            Tesoro Reclamado
          </p>
        </header>

        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Explorador</span>
              <span className="text-lg font-bold text-white">{playerName || 'Anónimo'}</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Tesoro</span>
              <span className="text-lg font-bold text-yellow-500">{level.treasure}</span>
            </div>
          </div>

          <div className="flex flex-col items-center py-4 border-t border-white/10">
            <span className="text-sm text-gray-300">Puntuación perfecta en las puertas matematicas</span>
            <div className="flex items-center gap-4 mt-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                  <Award size={20} fill="currentColor" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            onClick={handleNext}
            className="flex-1 py-4 bg-white text-black rounded-2xl font-serif text-xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/10"
          >
            {isLast ? "Finalizar Expedición" : "Siguiente Nivel"}
            <ArrowRight size={24} />
          </button>
          {!isLast && (
             <button
              onClick={() => setPhase('certificate')}
              className="flex-1 py-4 bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50 rounded-2xl font-serif text-xl font-bold flex items-center justify-center gap-3 hover:bg-yellow-500/30 transition-all"
            >
              <Award size={24} />
              Ver Certificado
            </button>
          )}
          <button
            onClick={resetGame}
            className="p-4 bg-white/5 text-gray-400 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
          >
            <Home size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
