/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Skull, RefreshCw, Home, XCircle } from 'lucide-react';
import { useGameStore, LEVELS } from '../../store';

export default function GameOverScreen() {
  const { currentLevel, retries, useRetry, resetGame, totalPoints } = useGameStore();
  const level = LEVELS[currentLevel];
  const hasRetries = retries > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-[radial-gradient(circle_at_center,_#200_0%,_#000_100%)] flex flex-col items-center justify-center p-6 pointer-events-auto"
    >
      <div className="w-full max-w-lg text-center space-y-12">
        <header className="space-y-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20 animate-pulse" />
              <Skull size={90} className="text-red-500 relative z-10" />
            </div>
          </motion.div>
          
          <h1 className="text-5xl font-serif font-black text-white tracking-tight uppercase">
            {hasRetries ? "Sin Aliento" : "Fin del Camino"}
          </h1>
          <p className="text-red-600 font-sans tracking-[0.4em] uppercase text-[10px] font-black">
            Expedición Detenida
          </p>
        </header>

        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 backdrop-blur-md space-y-8">
          <div className="space-y-2">
            <p className="text-gray-400 text-sm leading-relaxed italic">
              "Incluso los grandes exploradores deben saber cuándo reagruparse..."
            </p>
            <p className="text-white text-lg font-serif">
              Caíste en el <span className="text-red-400 font-bold">{level.name.toUpperCase()}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Puntos Obtenidos</span>
              <span className="text-3xl font-mono text-yellow-400 font-black">{totalPoints} PTS</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Fallas Globales</span>
              <div className="flex gap-2 mt-1">
                {[...Array(3)].map((_, i) => (
                  <RefreshCw 
                     key={i} 
                     size={16} 
                     className={i < (3 - retries) ? "text-red-600" : "text-gray-700"} 
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="text-gray-400 text-sm">
            {hasRetries 
              ? `¿Deseas gastar uno de tus ${retries} intentos restantes para retomar la expedición?` 
              : "Has agotado tus 3 oportunidades globales (9 vidas en total). No puedes avanzar más por ahora."}
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
          {hasRetries ? (
            <button
              onClick={() => useRetry()}
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-serif text-xl font-bold flex items-center justify-center gap-3 hover:bg-red-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-red-600/20"
            >
              <RefreshCw size={20} />
              REINTENTAR ({retries})
            </button>
          ) : (
             <button
              onClick={() => useGameStore.getState().setPhase('certificate')}
              className="w-full py-4 bg-orange-600 text-white rounded-2xl font-serif text-xl font-bold flex items-center justify-center gap-3 hover:bg-orange-500 transition-all shadow-xl shadow-orange-500/30"
            >
              <XCircle size={20} />
              Ver Resultados Finales
            </button>
          )}
          
          <button
            onClick={resetGame}
            className="w-full py-4 bg-white/5 text-gray-500 rounded-2xl border border-white/10 hover:bg-white/10 flex items-center justify-center gap-3 transition-all font-bold uppercase tracking-widest text-[10px]"
          >
            <Home size={16} />
            Menú Principal
          </button>
        </div>
      </div>
    </motion.div>
  );
}
