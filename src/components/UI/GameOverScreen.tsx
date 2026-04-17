/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Skull, RefreshCw, Home, XCircle } from 'lucide-react';
import { useGameStore, LEVELS } from '../../store';

export default function GameOverScreen() {
  const { currentLevel, retries, useRetry, resetGame } = useGameStore();
  const level = LEVELS[currentLevel];
  const hasRetries = retries > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-[radial-gradient(circle_at_center,_#200_0%,_#000_100%)] flex flex-col items-center justify-center p-6 pointer-events-auto"
    >
      <div className="w-full max-w-md text-center space-y-12">
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
            Expedición Fallida
          </p>
        </header>

        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 backdrop-blur-md space-y-6">
          <p className="text-gray-400 text-sm leading-relaxed">
            Te has quedado sin energía en el <span className="text-white font-bold">{level.name}</span>. 
            {hasRetries 
              ? `¿Deseas gastar un intento para retomar la expedición?` 
              : "No quedan más intentos por hoy. Regresa mañana con nuevas fuerzas."}
          </p>

          <div className="flex justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${
                  i < retries ? "border-red-500/50 text-red-400" : "border-white/5 text-gray-800"
                }`}
              >
                <RefreshCw size={14} className={i < retries ? "animate-spin-slow" : ""} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
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
              className="w-full py-4 bg-orange-600/20 text-orange-400 border-2 border-orange-500/50 rounded-2xl font-serif text-xl font-bold flex items-center justify-center gap-3 hover:bg-orange-600 hover:text-white transition-all"
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
