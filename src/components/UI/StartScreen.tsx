/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Play, Camera, Star, Sword, Shield, ChevronRight, User, Lock, Trophy } from 'lucide-react';
import { useGameStore, LEVELS } from '../../store';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerModalProps {
  onSuccess: (text: string) => void;
  onClose: () => void;
  onError: (errMsg: string) => void;
}

function QRScannerModal({ onSuccess, onClose, onError }: QRScannerModalProps) {
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;

    const initScanner = async () => {
      // Short delay for DOM and modal transitions to complete
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!isMounted) return;

      const element = document.getElementById("qr-reader");
      if (!element) {
        console.error("qr-reader element not found");
        return;
      }

      try {
        html5QrCode = new Html5Qrcode("qr-reader");
        
        // Try starting with rear camera (environment mode) first
        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            { 
              fps: 15, 
              qrbox: (width, height) => {
                const min = Math.min(width, height);
                // Wider scanning box of 85% for an extremely mobile-friendly scan experience
                const size = Math.floor(min * 0.85); 
                return { width: size, height: size };
              }
            },
            (decodedText) => {
              if (isMounted) {
                onSuccess(decodedText);
              }
            },
            () => {} // silent feedback
          );
        } catch (firstErr) {
          console.warn("Retrying with camera list fallback due to facingMode environment error:", firstErr);
          if (!isMounted) return;
          
          // Fallback: list all cameras and pick any available camera (usually rear camera is lists' last camera)
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const selectedCameraId = cameras[cameras.length - 1].id;
            await html5QrCode.start(
              selectedCameraId,
              { 
                fps: 15,
                qrbox: (width, height) => {
                  const min = Math.min(width, height);
                  const size = Math.floor(min * 0.85); 
                  return { width: size, height: size };
                }
              },
              (decodedText) => {
                if (isMounted) {
                  onSuccess(decodedText);
                }
              },
              () => {}
            );
          } else {
            throw new Error("No se encontraron cámaras compatibles.");
          }
        }
      } catch (err) {
        console.error("Camera access error:", err);
        if (isMounted) {
          onError("No se pudo iniciar la cámara. Otorga los permisos e inténtalo de nuevo.");
          onClose();
        }
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      const stopScanner = async () => {
        if (html5QrCode) {
          try {
            if (html5QrCode.isScanning) {
              await html5QrCode.stop();
            }
          } catch (e) {
            console.error("Error stopping scanner on cleanup:", e);
          }
        }
      };
      stopScanner();
    };
  }, [onSuccess, onClose, onError]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-xl"
    >
      <div className="relative w-full max-w-sm aspect-square border-4 border-orange-600 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(234,88,12,0.3)] animate-panic">
        <div id="qr-reader" className="w-full h-full" style={{ position: 'relative' }} />
        <div className="absolute inset-x-0 top-1/2 h-1 bg-orange-500 shadow-[0_0_20px_rgba(255,165,0,1)] animate-scanline" />
      </div>
      <button
        onClick={onClose}
        className="mt-12 px-10 py-4 bg-red-600/20 border-2 border-red-600 text-red-500 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-red-600 hover:text-white transition-all active:scale-95 cursor-pointer"
      >
        Cancelar Escaneo
      </button>
    </motion.div>
  );
}

export default function StartScreen() {
  const { 
    playerName, 
    unlockedLevels, 
    setPlayerInfo, 
    setPhase, 
    startLevel, 
    gender, 
    setGender 
  } = useGameStore();
  
  const [name, setName] = useState(playerName);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(0);

  const handleStart = () => {
    if (!name.trim()) {
      setError('Ingresa tu nombre para comenzar');
      return;
    }
    setPlayerInfo(name, name.toLowerCase(), '7mo Grado'); // Mocked grade for now
    startLevel(selectedLevel);
    setPhase('intro'); // Go to intro first
  };

  const startQRScanner = () => {
    setScanning(true);
    setError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] bg-[#050402] overflow-y-auto pointer-events-auto selection:bg-orange-500/30"
    >
      {/* Global Style overrides for Custom Animations */}
      <style>{`
        @keyframes pan-bg {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.1) translate(-2%, -2%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        @keyframes rune-pulse {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(255, 165, 0, 0.5)); opacity: 0.1; }
          50% { filter: drop-shadow(0 0 20px rgba(255, 165, 0, 0.8)); opacity: 0.3; }
        }
        .animate-pan { animation: pan-bg 20s ease-in-out infinite; }
        .animate-rune { animation: rune-pulse 4s ease-in-out infinite; }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes panic-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 165, 0, 0.2); }
          50% { box-shadow: 0 0 40px rgba(255, 165, 0, 0.5); }
        }
        .animate-scanline { animation: scanline 2s linear infinite; }
        .animate-panic { animation: panic-glow 2s ease-in-out infinite; }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, #fff 0%, #ff8c00 50%, #fff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        #qr-reader {
          position: relative !important;
          border: none !important;
          background: black !important;
        }
        #qr-reader video {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #qr-reader__header_message,
        #qr-reader__status_span,
        #qr-reader__camera_selection,
        #qr-reader button {
          display: none !important;
        }
      `}</style>
      
      {/* Background Layer with Parallax-like effect */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 animate-pan bg-[url('https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center brightness-[0.4] saturate-[1.2]" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-purple-500/20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center p-3 sm:p-10 lg:p-20 overflow-x-hidden justify-center">
        {/* Decorative Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-500/20 blur-[60px] rounded-full animate-pulse" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/4 animate-rune font-serif text-5xl text-white select-none pointer-events-none -rotate-12 opacity-60">∫</div>
        <div className="absolute top-1/3 right-1/4 animate-rune delay-700 font-serif text-5xl text-white select-none pointer-events-none rotate-12 opacity-60">√</div>
        <div className="absolute bottom-1/3 left-1/3 animate-rune delay-1000 font-serif text-3xl text-white select-none pointer-events-none rotate-45 opacity-60">π</div>
        <header className="text-center mb-5 sm:mb-8 px-4 relative mt-2">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-block px-2.5 py-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-full text-[7px] sm:text-[9px] font-black tracking-[0.3em] text-white mb-2 sm:mb-4 shadow-xl shadow-orange-600/40 uppercase animate-pulse"
          >
            Nueva Era de Aprendizaje
          </motion.div>
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <span className="animate-shimmer">JHIRO'S</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-500 italic drop-shadow-none">ADVENTURE</span>
          </motion.h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-[1px] w-4 sm:w-10 bg-gradient-to-r from-transparent to-orange-500/50" />
            <p className="text-orange-200 font-sans tracking-[0.15em] sm:tracking-[0.4em] text-[5px] sm:text-[8px] font-black uppercase leading-none">
              El Templo de los Siete Sabios
            </p>
            <div className="h-[1px] w-4 sm:w-10 bg-gradient-to-l from-transparent to-orange-500/50" />
          </div>
        </header>

        <div className="w-[94%] sm:w-full max-w-sm bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-2xl sm:rounded-[2rem] p-3 sm:p-6 space-y-3 sm:space-y-5 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          <div className="space-y-2">
            <label className="text-[7px] uppercase tracking-[0.3em] text-white/50 font-black flex items-center gap-1">
              <User size={8} className="text-orange-500" />
              Ingresa al Santuario
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu Nombre de Héroe"
                  className="w-full bg-white/5 border-2 border-white/10 rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2.5 text-white focus:border-orange-500 outline-none transition-all font-serif text-xs sm:text-base placeholder:text-white/20"
                />
                <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-orange-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
              </div>
              <button
                onClick={startQRScanner}
                className="p-2 sm:p-3 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg sm:rounded-xl text-white hover:from-orange-500 hover:to-orange-600 transition-all shadow-xl shadow-orange-600/20 flex items-center justify-center active:scale-95 group cursor-pointer"
                title="Escanear con QR"
              >
                <QrCode size={18} className="group-hover:rotate-12 transition-transform" />
              </button>
            </div>
            {error && <p className="text-red-400 text-[9px] font-black animate-shake text-center">{error}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[7px] uppercase tracking-[0.3em] text-white/50 font-black flex items-center gap-1.5">
               <Trophy size={8} className="text-yellow-500" />
               Selecciona tu Destino
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <button
                onClick={() => setGender('male')}
                className={`group relative p-2 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 active:scale-95 overflow-hidden cursor-pointer ${
                  gender === 'male' ? 'bg-orange-600/20 border-orange-500 text-white shadow-[0_0_40px_rgba(234,88,12,0.2)]' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                }`}
              >
                <div className={`w-7 h-7 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all ${gender === 'male' ? 'bg-orange-500 text-white scale-105' : 'bg-white/10'}`}>
                   <Sword size={12} className="sm:size-5" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]">Guerrero</span>
                {gender === 'male' && <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent pointer-events-none" />}
              </button>
              <button
                onClick={() => setGender('female')}
                className={`group relative p-2 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 active:scale-95 overflow-hidden cursor-pointer ${
                  gender === 'female' ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_40px_rgba(147,51,234,0.2)]' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                }`}
              >
                <div className={`w-7 h-7 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all ${gender === 'female' ? 'bg-purple-500 text-white scale-105' : 'bg-white/10'}`}>
                   <Shield size={12} className="sm:size-5" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]">Mística</span>
                {gender === 'female' && <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent pointer-events-none" />}
               </button>
            </div>
          </div>

          <div className="pt-1.5 sm:pt-3">
            <motion.button
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={handleStart}
               className="w-full py-2.5 sm:py-3.5 bg-white text-black rounded-xl sm:rounded-2xl font-serif text-xs sm:text-base font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-[0_15px_40px_rgba(255,255,255,0.05)] hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 sm:gap-3 group cursor-pointer"
            >
              <div className="w-5 h-5 sm:w-7 sm:h-7 bg-black/5 rounded-full flex items-center justify-center group-hover:bg-white/20">
                <Play size={10} fill="currentColor" className="ml-0.5" />
              </div>
              INICIAR CRÓNICA
            </motion.button>
          </div>
               {/* Level Rail - Refined Anime Style - Compacted */}
        <div className="w-full max-w-5xl mt-5 sm:mt-12 relative px-4 sm:px-8">
          <div className="flex items-end justify-between mb-3 sm:mb-6">
            <div className="space-y-1">
              <h3 className="text-white font-serif text-base sm:text-2xl font-black uppercase tracking-tighter">Expediciones</h3>
              <div className="h-0.5 w-8 sm:w-16 bg-orange-600 rounded-full" />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[6px] sm:text-[9px] text-orange-500 font-black tracking-widest uppercase">Progreso</span>
              <span className="text-xs sm:text-base font-mono text-white/80">{unlockedLevels}/{LEVELS.length}</span>
            </div>
          </div>
          <div className="flex gap-3 sm:gap-5 overflow-x-auto pb-4 sm:pb-10 snap-x no-scrollbar">
            {LEVELS.map((lv, i) => {
              const unlocked = i < unlockedLevels;
              return (
                <button
                  key={lv.id}
                  disabled={!unlocked}
                  onClick={() => setSelectedLevel(i)}
                  className={`flex-shrink-0 w-32 xs:w-40 sm:w-64 aspect-[4/5] rounded-xl sm:rounded-[2rem] p-3 sm:p-6 flex flex-col justify-end relative shadow-2xl transition-all snap-start overflow-hidden group/card cursor-pointer ${
                    selectedLevel === i ? 'ring-2 ring-orange-500 scale-105 z-10' : 'scale-100'
                  } ${!unlocked ? 'bg-[#120a05] grayscale opacity-40 cursor-not-allowed' : 'bg-black'}`}
                >
                  <div className="absolute inset-0 z-0">
                     <img 
                       src={`https://picsum.photos/seed/${lv.theme}/600/800`} 
                       className={`w-full h-full object-cover transition-transform duration-[20s] group-hover/card:scale-125 group-hover/card:rotate-2 ${unlocked ? 'opacity-30 animate-pan group-hover/card:opacity-60' : 'opacity-10'}`} 
                       referrerPolicy="no-referrer"
                       alt={lv.name}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                     {/* Scanline Effect - Subtler */}
                     <div className="absolute inset-0 z-10 pointer-events-none opacity-5 group-hover/card:opacity-10 transition-opacity">
                        <div className="absolute inset-0 h-[1px] bg-white/20 animate-scanline" />
                     </div>
                  </div>
                  
                  <div className="relative z-10 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1">
                       <span className="w-3 h-[1px] bg-orange-500" />
                       <span className="text-[7px] text-orange-500 font-black tracking-[0.3em] uppercase">Nivel 0{i + 1}</span>
                    </div>
                    <h4 className="text-white font-serif text-xs xs:text-sm sm:text-xl font-black leading-none uppercase tracking-tighter">{lv.name}</h4>
                    <p className="text-white/40 text-[7px] font-bold tracking-widest uppercase mb-0.5">{lv.theme}</p>
                    
                    <div className="flex items-center justify-between mt-0.5 pt-2 border-t border-white/5">
                      <span className="text-[6px] text-orange-200/40 font-black tracking-widest uppercase">
                        {unlocked ? (selectedLevel === i ? 'Misión Activa' : 'Explorar') : 'Cerrado'}
                      </span>
                      {unlocked && (
                        <div className={`p-1 rounded-full transition-colors ${selectedLevel === i ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/40'}`}>
                           <ChevronRight size={10} />
                        </div>
                      )}
                    </div>
                  </div>
 
                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                       <div className="p-3 bg-white/5 rounded-full border border-white/10">
                          <Lock size={20} className="text-white/20" />
                       </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
   </div>
      </div>

      {/* QR Modal Overlay */}
      <AnimatePresence>
        {scanning && (
          <QRScannerModal 
            onSuccess={(decodedText) => {
              setName(decodedText);
              setScanning(false);
            }}
            onClose={() => setScanning(false)}
            onError={(msg) => setError(msg)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Hints - Hidden on mobile */}
      <div className="hidden lg:flex fixed bottom-10 left-10 gap-8 text-gray-600 uppercase tracking-widest text-[10px] font-black">
        <div className="flex items-center gap-2"><span className="text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md">WASD</span> MOVERSE</div>
        <div className="flex items-center gap-2"><span className="text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md">ESPACIO</span> SALTAR</div>
        <div className="flex items-center gap-2"><span className="text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md">E</span> INTERACTUAR</div>
      </div>
    </motion.div>
  );
}
