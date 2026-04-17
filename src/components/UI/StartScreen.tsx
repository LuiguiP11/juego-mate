/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { QrCode, Play, Camera, Star, Sword, Shield } from 'lucide-react';
import { useGameStore, LEVELS } from '../../store';
import { Html5Qrcode } from 'html5-qrcode';

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
  };

  const startQRScanner = async () => {
    setScanning(true);
    setError('');
    
    setTimeout(async () => {
      const html5QrCode = new Html5Qrcode("qr-reader");
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setName(decodedText);
            setScanning(false);
            html5QrCode.stop();
          },
          () => {}
        );
      } catch (err) {
        setScanning(false);
        setError('No se pudo acceder a la cámara');
      }
    }, 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_#1a1005_0%,_#050200_100%)] pointer-events-auto"
    >
      {/* Brand */}
      <div className="absolute top-10 flex flex-col items-center">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="text-orange-500 font-serif text-5xl font-black mb-1 drop-shadow-2xl"
        >
          JHIRO'S
        </motion.div>
        <div className="text-yellow-400 font-sans tracking-[0.4em] text-xs font-bold uppercase pl-1">
          Adventure 3D
        </div>
      </div>

      <div className="w-full max-w-md space-y-8 bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-orange-500/20 shadow-2xl">
        {/* Name Input */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-widest text-gray-400 pl-1 font-bold">Registro de Explorador</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Escribe tu nombre..."
              className="flex-1 bg-white/5 border-2 border-orange-500/30 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-all font-serif"
            />
            <button
              onClick={startQRScanner}
              className="p-3 bg-orange-500 rounded-xl text-black hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20"
            >
              <QrCode size={20} />
            </button>
          </div>
          {error && <p className="text-red-500 text-[10px] font-bold pl-1">{error}</p>}
        </div>

        {/* Character Selection */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-widest text-gray-400 pl-1 font-bold">Elige tu Avatar</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setGender('male')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                gender === 'male' ? 'bg-orange-500/20 border-orange-500' : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <Sword size={24} className={gender === 'male' ? 'text-orange-400' : 'text-gray-500'} />
              <span className="text-xs font-bold text-white">Guerrero</span>
            </button>
            <button
              onClick={() => setGender('female')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                gender === 'female' ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <Shield size={24} className={gender === 'female' ? 'text-purple-400' : 'text-gray-500'} />
              <span className="text-xs font-bold text-white">Hechicera</span>
            </button>
          </div>
        </div>

        {/* Level Select */}
        <div className="space-y-3">
          <label className="text-[10px] uppercase tracking-widest text-gray-400 pl-1 font-bold">Puerta de Inicio</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {LEVELS.map((lv, i) => {
              const unlocked = i < unlockedLevels;
              return (
                <button
                  key={lv.id}
                  disabled={!unlocked}
                  onClick={() => setSelectedLevel(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    selectedLevel === i ? 'bg-yellow-500/20 border-yellow-500' : 'bg-white/5 border-white/10'
                  } ${!unlocked ? 'opacity-30 grayscale' : 'hover:scale-105'}`}
                >
                  <span className={`text-xl font-black ${selectedLevel === i ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {unlocked ? i + 1 : '🔒'}
                  </span>
                  <span className="text-[8px] uppercase tracking-tighter text-gray-500">{unlocked ? 'Lvl' : 'Cerrado'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl text-black font-serif text-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3"
        >
          <Play size={20} fill="currentColor" />
          INICIAR EXPEDICIÓN
        </button>
      </div>

      {/* QR Modal Overlay */}
      {scanning && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <div className="relative w-full max-w-sm aspect-square border-4 border-orange-500 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,165,0,0.3)]">
            <div id="qr-reader" className="w-full h-full" />
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-orange-500 shadow-[0_0_15px_rgba(255,165,0,1)] animate-pulse" />
          </div>
          <button
            onClick={() => {
              setScanning(false);
              setPhase('start');
            }}
            className="mt-10 px-8 py-3 bg-red-500/20 border border-red-500 text-red-500 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white transition-all"
          >
            Cancelar Escaneo
          </button>
        </div>
      )}

      {/* Footer Hint */}
      <div className="absolute bottom-10 flex gap-6 text-gray-500 uppercase tracking-widest text-[9px] font-bold">
        <span>← → Moverse</span>
        <span className="text-orange-500/30">|</span>
        <span>Espacio Saltar</span>
        <span className="text-orange-500/30">|</span>
        <span>E Interactuar</span>
      </div>
    </motion.div>
  );
}
