import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer2, Keyboard, Move, Smartphone, Zap } from 'lucide-react';

export default function ControlsHint() {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check local storage to see if we've shown it this session
    const hasShownHint = sessionStorage.getItem('math_quest_hint_shown');
    
    if (!hasShownHint) {
      setVisible(true);
      sessionStorage.setItem('math_quest_hint_shown', 'true');
    }

    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    // Hide after 8 seconds
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-10 right-10 z-[100] flex flex-col gap-4 p-6 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl pointer-events-auto"
        >
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <Zap className="text-yellow-400" size={20} />
            <h3 className="font-black text-white uppercase tracking-tighter text-lg">Guía de Controles</h3>
          </div>

          {!isMobile ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Keyboard className="text-orange-500" size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase font-bold">Moverse</span>
                  <span className="text-white font-black">WASD o Flechas</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-2 rounded-lg">
                  <div className="w-6 h-6 border-2 border-orange-500 rounded flex items-center justify-center text-[10px] font-black">SPACE</div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase font-bold">Saltar</span>
                  <span className="text-white font-black">Barra Espaciadora</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-2 rounded-lg">
                  <div className="w-6 h-6 border-2 border-orange-500 rounded flex items-center justify-center text-[10px] font-black">E</div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase font-bold">Interactuar</span>
                  <span className="text-white font-black">Tecla E</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Smartphone className="text-orange-500" size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase font-bold">Movimiento</span>
                  <span className="text-white font-black">Arrastrar en pantalla</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Zap className="text-orange-500" size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase font-bold">Acción</span>
                  <span className="text-white font-black">Tocar botones HUD</span>
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={() => setVisible(false)}
            className="mt-2 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] uppercase tracking-widest font-black text-gray-400 transition-colors"
          >
            Entendido
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
