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
          className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 p-4 bg-black/85 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl pointer-events-auto max-w-[200px]"
        >
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <Zap className="text-yellow-400" size={16} />
            <h3 className="font-black text-white uppercase tracking-tighter text-sm">Controles</h3>
          </div>

          {!isMobile ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-1.5 rounded-lg">
                  <Keyboard className="text-orange-500" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-400 uppercase font-bold">Moverse</span>
                  <span className="text-white font-black text-xs">WASD</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-1.5 rounded-lg">
                  <div className="w-5 h-5 border border-orange-500 rounded flex items-center justify-center text-[8px] font-black text-white">SPC</div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-400 uppercase font-bold">Saltar</span>
                  <span className="text-white font-black text-xs">Espacio</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-1.5 rounded-lg">
                  <div className="w-5 h-5 border border-orange-500 rounded flex items-center justify-center text-[8px] font-black text-white">E</div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-400 uppercase font-bold">Acción</span>
                  <span className="text-white font-black text-xs">Tecla E</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-1.5 rounded-lg">
                  <Smartphone className="text-orange-500" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-400 uppercase font-bold">Caminar</span>
                  <span className="text-white font-black text-xs">Joystick</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-1.5 rounded-lg">
                  <Zap className="text-orange-500" size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-400 uppercase font-bold">Interactuar</span>
                  <span className="text-white font-black text-xs">Botón HUD</span>
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={() => setVisible(false)}
            className="mt-1 w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[8px] uppercase tracking-widest font-black text-gray-400 transition-colors"
          >
            Cerrar
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
