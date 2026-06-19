/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Play, Camera, Star, Sword, Shield, ChevronRight, User, Lock, Trophy } from 'lucide-react';
import { useGameStore, LEVELS } from '../../store';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const parseScannedUser = (text: string): string => {
  let cleaned = text.trim();
  
  // 1. Try to parse as JSON (e.g. {"usuario": "juan.perez"})
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object') {
      const possibleKeys = ['usuario', 'user', 'username', 'code', 'id', 'alumno', 'name', 'nombre'];
      for (const key of possibleKeys) {
        if (parsed[key] && typeof parsed[key] === 'string') {
          return parsed[key].trim().toLowerCase();
        }
      }
    }
  } catch (e) {
    // Not JSON
  }

  // 2. Try to parse as URL (e.g. https://mate-experimental.web.app/alumno/juan.perez)
  try {
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      const url = new URL(cleaned);
      const params = ['user', 'usuario', 'username', 'id', 'alumno', 'name', 'nombre'];
      for (const p of params) {
        const val = url.searchParams.get(p);
        if (val) return val.trim().toLowerCase();
      }
      
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const last = segments[segments.length - 1];
        if (last && last.length > 2) {
          return last.trim().toLowerCase();
        }
      }
    }
  } catch (e) {
    // Not a valid URL
  }

  // 3. Normalized string: lowercase, strip accents, but KEEP spaces/dots/hyphens/underscores to avoid breaking student IDs
  return cleaned
    .toLowerCase()
    .normalize("NFD") // split accent marks
    .replace(/[\u0300-\u036f]/g, "") // remove accent marks
    .trim();
};

interface QRScannerModalProps {
  onSuccess: (text: string) => void;
  onClose: () => void;
  onError: (errMsg: string) => void;
}

function QRScannerModal({ onSuccess, onClose, onError }: QRScannerModalProps) {
  const [fileError, setFileError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [activeScanner, setActiveScanner] = useState<Html5Qrcode | null>(null);

  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

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
        setActiveScanner(html5QrCode);
        
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
          
          // Fallback: list all cameras and pick any available camera
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
            throw new Error("No se encontraron cámaras de video en este dispositivo.");
          }
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        if (isMounted) {
          setCameraError(
            err?.message || "No se pudo encender la cámara automática. Es posible que los permisos de cámara estén bloqueados por el navegador o por la pestaña."
          );
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

  // Handle uploading a QR code saved on device
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError('');
    try {
      // Use the existing or a temporary Html5Qrcode scanner instance
      const scannerId = "qr-reader-file";
      const fileScanner = new Html5Qrcode(scannerId);
      
      const decodedText = await fileScanner.scanFile(file, false);
      onSuccess(decodedText);
    } catch (err) {
      console.error("File scanning error", err);
      setFileError("No se detectó un código QR válido en la imagen. Intenta con una captura nítida.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-[#0b0805]/98 flex flex-col items-center justify-center p-4 backdrop-blur-xl shrink-0 overflow-y-auto"
    >
      <div className="w-full max-w-sm text-center flex flex-col items-center mt-2">
        <span className="text-[10px] text-orange-500 font-extrabold tracking-[0.3em] uppercase block">Lector de Credenciales QR</span>
        
        {isInsideIframe && (
          <div className="mt-2 bg-orange-500/10 border border-orange-500/30 p-2 sm:p-3 rounded-xl max-w-sm text-center">
            <p className="text-orange-400 text-[10px] font-black leading-snug">
              ⚠️ Estás jugando dentro de la vista previa (iframe) de Google AI Studio.
            </p>
            <p className="text-white/60 text-[9px] mt-1 leading-relaxed">
              Los navegadores bloquean la cámara dentro de vistas previas. Por favor, haz clic en el botón de <span className="text-orange-300 font-bold uppercase">&quot;Abrir en pestaña nueva&quot;</span> en la esquina superior derecha del navegador para jugar con tu cámara habilitada, o bien:
            </p>
          </div>
        )}
      </div>

      <div className="relative w-full max-w-[280px] sm:max-w-xs md:max-w-sm aspect-square border-4 border-orange-600 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(234,88,12,0.2)] mt-4">
        {cameraError ? (
          <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-4 text-center">
            <Camera size={32} className="text-neutral-600 mb-2" />
            <p className="text-white/70 text-[10px] sm:text-xs font-semibold leading-relaxed">
              No se pudo activar la cámara de forma directa.
            </p>
            <p className="text-neutral-500 text-[9px] mt-1 leading-relaxed max-w-[90%]">
              {cameraError}
            </p>
            <span className="text-orange-400 text-[9px] font-bold mt-3 block">
              ¡Puedes subir una imagen/foto del código QR en su lugar!
            </span>
          </div>
        ) : (
          <>
            <div id="qr-reader" className="w-full h-full min-h-[240px]" style={{ position: 'relative' }} />
            <div className="absolute inset-x-0 top-1/2 h-1 bg-orange-500 shadow-[0_0_20px_rgba(255,165,0,1)] animate-scanline pointer-events-none" />
          </>
        )}
      </div>

      {/* Hidden element for file scanning */}
      <div id="qr-reader-file" className="hidden" />

      <div className="mt-4 flex flex-col items-center gap-2.5 w-full max-w-sm">
        {/* File upload option as primary fallback */}
        <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:border-orange-500 hover:bg-orange-950/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer w-[80%]">
          <Camera size={14} className="text-orange-500" />
          Subir Foto de QR
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload}
          />
        </label>

        {fileError && (
          <p className="text-red-400 text-[9px] font-medium text-center max-w-[90%] px-2 py-1 bg-red-950/40 border border-red-900/10 rounded">
            {fileError}
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-1 px-6 py-2.5 bg-red-600/10 border border-red-600/20 text-red-400 hover:text-white hover:bg-red-600 rounded-xl font-black uppercase tracking-[0.15em] text-[9px] transition-all active:scale-95 cursor-pointer"
        >
          Cerrar Lector
        </button>
      </div>
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
    setGender,
    playerActividad,
    playerTrimestre,
    setPlayerActividad,
    setPlayerTrimestre
  } = useGameStore();
  
  const [name, setName] = useState(playerName);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(0);

  const handleStart = async () => {
    const userClean = name.trim().toLowerCase();
    if (!userClean) {
      setError('Ingresa tu usuario asignado o escanea tu QR');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      // Query "alumnos" partition in base-database filtering by "usuario" field
      const q = query(collection(db, 'alumnos'), where('usuario', '==', userClean));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();

        const primerNombre = studentData.primerNombre || '';
        const primerApellido = studentData.primerApellido || '';
        const fullName = `${primerNombre} ${primerApellido}`.trim() || 'Héroe Desconocido';

        const grado = studentData.grado || 'Grado Indefinido';
        const seccion = studentData.seccion ? `Sección ${studentData.seccion}` : '';
        const gradeInfo = seccion ? `${grado} - ${seccion}` : grado;

        // Save validated details to Game Store
        setPlayerInfo(fullName, userClean, gradeInfo);

        const sexo = studentData.sexo || '';
        if (sexo === 'Femenino') {
          setGender('female');
        } else {
          setGender('male');
        }

        // Advance to cinematic introduction
        startLevel(selectedLevel);
        setPhase('intro');
      } else {
        setError('El usuario de héroe no se encuentra en "mate-experimental". Inténtalo de nuevo.');
      }
    } catch (err: any) {
      console.error("Firebase Student lookup error:", err);
      setError(`Error al verificar identidad: ${err.message || 'Sin conexión.'}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    setScanning(false);
    const parsedUser = parseScannedUser(decodedText);
    setName(parsedUser);

    setVerifying(true);
    setError('');

    try {
      const q = query(collection(db, 'alumnos'), where('usuario', '==', parsedUser));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();

        const primerNombre = studentData.primerNombre || '';
        const primerApellido = studentData.primerApellido || '';
        const fullName = `${primerNombre} ${primerApellido}`.trim() || 'Héroe Desconocido';

        const grado = studentData.grado || 'Grado Indefinido';
        const seccion = studentData.seccion ? `Sección ${studentData.seccion}` : '';
        const gradeInfo = seccion ? `${grado} - ${seccion}` : grado;

        // Save validated details to Game Store
        setPlayerInfo(fullName, parsedUser, gradeInfo);

        const sexo = studentData.sexo || '';
        if (sexo === 'Femenino') {
          setGender('female');
        } else {
          setGender('male');
        }

        // Advance to cinematic introduction
        startLevel(selectedLevel);
        setPhase('intro');
      } else {
        setError(`Código QR detectado con éxito (Usuario: "${parsedUser}"), pero no figura en la base de datos "mate-experimental".`);
      }
    } catch (err: any) {
      console.error("Firebase Student lookup error:", err);
      setError(`QR escaneado: "${parsedUser}", pero falló la validación: ${err.message || 'Sin conexión.'}`);
    } finally {
      setVerifying(false);
    }
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
              Usuario del Alumno (QR o Texto)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej: juan.perez"
                  disabled={verifying}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2.5 text-white focus:border-orange-500 outline-none transition-all font-mono text-xs sm:text-base placeholder:text-white/20"
                />
                <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-orange-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
              </div>
              <button
                onClick={startQRScanner}
                disabled={verifying}
                className="p-2 sm:p-3 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg sm:rounded-xl text-white hover:from-orange-500 hover:to-orange-600 transition-all shadow-xl shadow-orange-600/20 flex items-center justify-center active:scale-95 group cursor-pointer disabled:opacity-50"
                title="Escanear con QR"
              >
                <QrCode size={18} className="group-hover:rotate-12 transition-transform" />
              </button>
            </div>
            
            {error && (
              <div className="flex flex-col gap-1 text-center mt-1">
                <p className="text-red-400 text-[9px] font-black animate-shake leading-tight">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    const guestUser = name.trim().toLowerCase() || 'invitado';
                    const guestFullName = name.trim() ? `${name.trim()} (Invitado)` : 'Explorador Invitado';
                    setPlayerInfo(guestFullName, guestUser, '7mo Grado - Invitado');
                    startLevel(selectedLevel);
                    setPhase('intro');
                  }}
                  className="text-[8px] text-gray-500 hover:text-orange-400 underline font-black uppercase tracking-wider transition-colors cursor-pointer mt-0.5"
                >
                  ⚙️ Omitir y jugar como Invitado (Modo Pruebas)
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[7px] uppercase tracking-[0.3em] text-white/50 font-black flex items-center gap-1.5">
               <Trophy size={8} className="text-yellow-500" />
               Tu Destino místico
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <button
                onClick={() => setGender('male')}
                disabled={verifying}
                className={`group relative p-1.5 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all flex flex-col items-center gap-1 active:scale-95 overflow-hidden cursor-pointer disabled:opacity-50 ${
                  gender === 'male' ? 'bg-orange-600/20 border-orange-500 text-white shadow-[0_0_40px_rgba(234,88,12,0.2)]' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                }`}
              >
                <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${gender === 'male' ? 'bg-orange-500 text-white scale-105' : 'bg-white/10'}`}>
                   <Sword size={11} className="sm:size-4" />
                </div>
                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em]">Guerrero</span>
                {gender === 'male' && <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent pointer-events-none" />}
              </button>
              <button
                onClick={() => setGender('female')}
                disabled={verifying}
                className={`group relative p-1.5 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all flex flex-col items-center gap-1 active:scale-95 overflow-hidden cursor-pointer disabled:opacity-50 ${
                  gender === 'female' ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_40px_rgba(147,51,234,0.2)]' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                }`}
              >
                <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${gender === 'female' ? 'bg-purple-500 text-white scale-105' : 'bg-white/10'}`}>
                   <Shield size={11} className="sm:size-4" />
                </div>
                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em]">Mística</span>
                {gender === 'female' && <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent pointer-events-none" />}
               </button>
            </div>
          </div>

          <div className="pt-1 sm:pt-2">
            <motion.button
               whileHover={{ scale: verifying ? 1 : 1.02 }}
               whileTap={{ scale: verifying ? 1 : 0.98 }}
               onClick={handleStart}
               disabled={verifying}
               className="w-full py-2 sm:py-3 bg-white text-black rounded-lg sm:rounded-xl font-serif text-xs sm:text-base font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-[0_15px_40px_rgba(255,255,255,0.05)] hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 sm:gap-3 group cursor-pointer disabled:opacity-50 disabled:bg-white/20 disabled:text-white/60"
            >
              <div className="w-5 h-5 sm:w-7 sm:h-7 bg-black/5 rounded-full flex items-center justify-center group-hover:bg-white/20">
                {verifying ? (
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play size={10} fill="currentColor" className="ml-0.5" />
                )}
              </div>
              {verifying ? 'VERIFICANDO...' : 'INICIAR CRÓNICA'}
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
            onSuccess={handleScanSuccess}
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
