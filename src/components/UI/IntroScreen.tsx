import { motion } from 'motion/react';
import { Compass, Shield, Sword, Sparkles, ArrowRight } from 'lucide-react';
import { useGameStore } from '../../store';

const STORY_TEXT = [
  "En lo profundo de las tierras olvidadas, yace el Templo de los Siete Sabios.",
  "Cuenta la leyenda que solo aquellos con la agilidad de un explorador y la mente de un matemático pueden cruzar sus puertas.",
  "Tu misión es clara: atraviesa los 7 velos del conocimiento, resuelve los acertijos rúnicos y recupera los Tesoros del Infinito.",
  "¡Prepárate, el viaje hacia la maestría comienza ahora!"
];

export default function IntroScreen() {
  const { setPhase, playerName } = useGameStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-8 text-center overflow-hidden pointer-events-auto"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600 blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 blur-[120px] animate-pulse delay-1000" />
          
          {/* Animated Energy Beams for dynamic effect */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: '-100%', y: (i * 12 + 10) + '%' }}
              animate={{ x: '300%' }}
              transition={{ duration: 3 + Math.random() * 5, repeat: Infinity, ease: 'linear', delay: Math.random() * 5 }}
              className="absolute h-[2px] w-[500px] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12"
            />
          ))}
      </div>

      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center space-y-6 sm:space-y-12">
        <motion.div
           initial={{ y: -50, scale: 0.8 }}
           animate={{ y: 0, scale: 1 }}
           className="bg-white/5 p-4 sm:p-6 rounded-full border border-white/10"
        >
          <Compass className="text-orange-500 w-10 h-10 sm:w-16 sm:h-16 animate-spin-slow" />
        </motion.div>
 
        <div className="space-y-4 sm:space-y-6">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-orange-500 font-sans tracking-[0.3em] uppercase text-[10px] sm:text-sm font-black"
          >
            Misión: El Despertar del Sabio
          </motion.h2>
          
          <div className="space-y-3 sm:space-y-4 px-2">
            {STORY_TEXT.map((text, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.8 }}
                className="text-gray-300 text-sm sm:text-lg md:text-xl font-serif leading-relaxed italic"
              >
                {i === 0 && <span className="text-white font-bold">Bienvenido, {playerName || 'Explorador'}. </span>}
                {text}
              </motion.p>
            ))}
          </div>
        </div>
 
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full px-4"
        >
          <button
            onClick={() => setPhase('playing')}
            className="flex-1 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-serif text-lg sm:text-xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-600/30"
          >
            Aceptar Desafío
            <ArrowRight size={24} />
          </button>
          
          <button
            onClick={() => setPhase('playing')}
            className="px-6 py-3 sm:px-8 sm:py-4 bg-white/5 hover:bg-white/10 text-gray-500 rounded-2xl border border-white/5 transition-all text-[10px] sm:text-xs uppercase tracking-widest font-black"
          >
            Omitir Intro
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 2 }}
          className="flex gap-8 pt-6 opacity-30"
        >
           <Shield size={24} className="text-gray-400" />
           <Sword size={24} className="text-gray-400" />
           <Sparkles size={24} className="text-gray-400" />
        </motion.div>
      </div>
    </motion.div>
  );
}
