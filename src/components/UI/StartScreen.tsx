/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Play, Camera, Star, Sword, Shield, ChevronRight, User, Lock, Trophy } from 'lucide-react';
import { useGameStore, LEVELS } from '../../store';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const getStudentUserCandidates = (text: string): string[] => {
  let cleaned = text.trim();
  if (!cleaned) return [];
  
  let parsed = cleaned;

  // 1. Try JSON parsing (e.g. {"usuario": "juan.perez"})
  try {
    const ob = JSON.parse(cleaned);
    if (ob && typeof ob === 'object') {
      const possibleKeys = ['usuario', 'user', 'username', 'code', 'id', 'alumno', 'name', 'nombre'];
      for (const key of possibleKeys) {
        if (ob[key] && typeof ob[key] === 'string') {
          parsed = ob[key].trim();
          break;
        }
      }
    }
  } catch (e) {
    // Not JSON
  }

  // 2. Try URL parsing (e.g. https://mate-experimental.web.app/alumno/juan.perez)
  if (parsed === cleaned) {
    try {
      if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
        const url = new URL(cleaned);
        const params = ['user', 'usuario', 'username', 'id', 'alumno', 'name', 'nombre'];
        let found = false;
        for (const p of params) {
          const val = url.searchParams.get(p);
          if (val) {
            parsed = val.trim();
            found = true;
            break;
          }
        }
        
        if (!found) {
          const segments = url.pathname.split('/').filter(Boolean);
          if (segments.length > 0) {
            const last = segments[segments.length - 1];
            if (last && last.length > 2) {
              parsed = last.trim();
            }
          }
        }
      }
    } catch (e) {
      // Not a valid URL
    }
  }

  // Generate robust structural candidates to ignore case, accent mismatches, or dots vs spaces
  const candidatesSet = new Set<string>();
  
  // Basic structures
  candidatesSet.add(parsed);
  candidatesSet.add(parsed.toLowerCase());
  
  const parsedNoAccents = parsed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  candidatesSet.add(parsedNoAccents);
  candidatesSet.add(parsedNoAccents.toLowerCase());

  // Dot / Space conversions
  const withDots = parsed.replace(/\s+/g, '.');
  candidatesSet.add(withDots);
  candidatesSet.add(withDots.toLowerCase());
  const withDotsNoAccents = parsedNoAccents.replace(/\s+/g, '.');
  candidatesSet.add(withDotsNoAccents);
  candidatesSet.add(withDotsNoAccents.toLowerCase());

  const withSpaces = parsed.replace(/\./g, ' ');
  candidatesSet.add(withSpaces);
  candidatesSet.add(withSpaces.toLowerCase());
  const withSpacesNoAccents = parsedNoAccents.replace(/\./g, ' ');
  candidatesSet.add(withSpacesNoAccents);
  candidatesSet.add(withSpacesNoAccents.toLowerCase());

  // Also try fully flattened numeric/letter string as a final option
  const flat = parsed.replace(/[^a-zA-Z0-9]/g, '');
  if (flat) {
    candidatesSet.add(flat);
    candidatesSet.add(flat.toLowerCase());
  }

  return Array.from(candidatesSet).filter(Boolean).slice(0, 30);
};

/**
 * Searches the 'alumnos' collection using candidate usernames or Document IDs in parallel.
 * Checks direct document IDs and queries concurrently (1 roundtrip instead of sequential).
 */
const findStudentByCandidates = async (candidates: string[]) => {
  const filteredCandidates = Array.from(new Set(candidates)).filter(Boolean).slice(0, 10);
  if (filteredCandidates.length === 0) return null;

  console.log("Iniciando búsqueda de alumno ultra-optimizada en paralelo, candidatos:", filteredCandidates);

  const primary = filteredCandidates[0];
  const tasks: Promise<any>[] = [];

  // 1. Direct primary document ID lookup
  tasks.push(
    getDoc(doc(db, 'alumnos', primary))
      .then(snap => (snap.exists() ? snap : null))
      .catch(() => null)
  );

  // 2. Query exact match 'usuario' for primary candidate
  tasks.push(
    getDocs(query(collection(db, 'alumnos'), where('usuario', '==', primary)))
      .then(snap => (!snap.empty ? snap.docs[0] : null))
      .catch(() => null)
  );

  // 3. Document ID lookups for all other candidate formats (including lowercase, flat, normalized formats)
  if (filteredCandidates.length > 1) {
    filteredCandidates.slice(1).forEach(cand => {
      tasks.push(
        getDoc(doc(db, 'alumnos', cand))
          .then(snap => (snap.exists() ? snap : null))
          .catch(() => null)
      );
    });
  }

  // 4. Query with 'in' operator for up to 10 candidates
  tasks.push(
    getDocs(query(collection(db, 'alumnos'), where('usuario', 'in', filteredCandidates.slice(0, 10))))
      .then(snap => (!snap.empty ? snap.docs[0] : null))
      .catch(() => null)
  );

  try {
    const results = await Promise.all(tasks);
    const found = results.find(snap => snap !== null);
    if (found) {
      console.log("Alumno localizado con éxito en paralelo.");
      return found;
    }
  } catch (err) {
    console.warn("Error en búsqueda paralela de alumno:", err);
  }

  return null;
};

interface QRScannerModalProps {
  onSuccess: (text: string) => void;
  onClose: () => void;
  onError: (errMsg: string) => void;
}

function QRScannerModal({ onSuccess, onClose, onError }: QRScannerModalProps) {
  const [cameraError, setCameraError] = useState('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      // 1. Give the DOM and transitions 350ms to mount the container safely
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (!isMounted) return;

      const element = document.getElementById("qr-reader");
      if (!element) {
        console.error("qr-reader element not found");
        return;
      }

      try {
        const scanner = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = scanner;

        const config = {
          fps: 30, // Max decoding speed
          aspectRatio: undefined, // Let the browser choose native aspect ratio to prevent stretching/warping
        };

        const cameraConfig = {
          facingMode: "environment" // Force rear lens usage
        };

        await scanner.start(
          cameraConfig,
          config,
          (decodedText) => {
            if (isMounted) {
              // Stop camera immediately on successful detection
              scanner.stop()
                .then(() => onSuccess(decodedText))
                .catch((err) => {
                  console.error("Error stopping scanner after success:", err);
                  onSuccess(decodedText); // execute callback regardless
                });
            }
          },
          () => {} // silent search frame logging
        );
      } catch (err: any) {
        console.warn("Direct environment camera launch failed, searching for cameras explicitly...", err);
        if (!isMounted) return;

        // Fallback: list camera hardware manually for non-standard environments
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const selectedCameraId = cameras[cameras.length - 1].id;
            const scanner = html5QrCodeRef.current || new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = scanner;

            const config = {
              fps: 30,
              aspectRatio: undefined,
            };

            await scanner.start(
              selectedCameraId,
              config,
              (decodedText) => {
                if (isMounted) {
                  scanner.stop()
                    .then(() => onSuccess(decodedText))
                    .catch(() => onSuccess(decodedText));
                }
              },
              () => {}
            );
          } else {
            throw new Error("No se encontraron cámaras de video en este dispositivo.");
          }
        } catch (fallbackErr: any) {
          console.error("Camera boot fallback unsuccessful:", fallbackErr);
          if (isMounted) {
            const fallbackMessage = "No se pudo encender la cámara automática. Es posible que los permisos de la pestaña o del navegador estén bloqueados.";
            setCameraError(fallbackMessage);
            onError(fallbackMessage);
          }
        }
      }
    };

    startScanner();

    // 3. React cleanup lifecycle
    return () => {
      isMounted = false;
      const stopAndClearAll = async () => {
        if (html5QrCodeRef.current) {
          try {
            if (html5QrCodeRef.current.isScanning) {
              await html5QrCodeRef.current.stop();
            }
          } catch (e) {
            console.error("Error stopping scanner on lifecycle unmount:", e);
          }
        }
      };
      stopAndClearAll();
    };
  }, [onSuccess, onError]);

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
              Los navegadores bloquean la cámara dentro de vistas previas. Por favor, haz clic en el botón de <span className="text-orange-300 font-bold uppercase">&quot;Abrir en pestaña nueva&quot;</span> en la esquina superior derecha del navegador para jugar con tu cámara habilitada.
            </p>
          </div>
        )}
      </div>

      <div className="relative w-full max-w-[340px] sm:max-w-[420px] aspect-[4/3] border-4 border-orange-500 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(249,115,22,0.3)] mt-5 bg-[#0a0502]">
        {cameraError ? (
          <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-4 text-center">
            <Camera size={32} className="text-neutral-600 mb-2" />
            <p className="text-white/70 text-[10px] sm:text-xs font-semibold leading-relaxed">
              No se pudo activar la cámara de forma directa.
            </p>
            <p className="text-neutral-500 text-[9px] mt-1 leading-relaxed max-w-[95%]">
              {cameraError}
            </p>
            <span className="text-orange-400 text-[9px] font-bold mt-4 block">
              Asegúrate de otorgar permisos de cámara en tu navegador e ingresa en una pestaña dedicada.
            </span>
          </div>
        ) : (
          <>
            <div id="qr-reader" className="w-full h-full" style={{ position: 'relative' }} />
            {/* Custom High-Tech Sci-Fi Frame Brackets */}
            <div className="qr-scanner-overlay">
              <div className="qr-scanner-overlay-inner" />
            </div>
            {/* Animated Laser Scanning Line */}
            <div className="absolute inset-x-0 top-1/2 h-1 bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,1)] animate-scanline pointer-events-none z-[25]" />
          </>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2.5 w-full max-w-sm">
        <button
          onClick={onClose}
          className="px-8 py-3 bg-red-600/10 border border-red-600/20 text-red-400 hover:text-white hover:bg-red-600 rounded-xl font-black uppercase tracking-[0.15em] text-[10px] transition-all active:scale-95 cursor-pointer"
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

  // Keep track of the currently validated student in react state to manage form validation state in two steps
  const [validatedStudent, setValidatedStudent] = useState<{
    fullName: string;
    userName: string;
    gradeInfo: string;
    sexo: string;
  } | null>(null);

  const handleStart = async () => {
    // If we have already validated a student, we immediately start!
    // This blocks unnecessary repeated database reads and guarantees instant login.
    if (validatedStudent) {
      console.log("Iniciando aventura con estudiante ya verificado:", validatedStudent);
      setPlayerInfo(validatedStudent.fullName, validatedStudent.userName, validatedStudent.gradeInfo);
      startLevel(selectedLevel);
      setPhase('intro');
      return;
    }

    const candidates = getStudentUserCandidates(name);
    if (candidates.length === 0) {
      setError('Ingresa tu usuario asignado o escanea tu QR');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const studentDoc = await findStudentByCandidates(candidates);

      if (studentDoc) {
        const studentData = studentDoc.data();

        // Get the actual username registered in the db
        const dbUsuario = studentData.usuario || studentData.Usuario || candidates[0];

        // Extremely robust extraction checking all common given name and surname schemas (lowercase/capitalized/Spanish/English)
        const nombrePart = studentData.nombre || studentData.Nombre || studentData.primerNombre || studentData.nombres || studentData.Nombres || studentData.primer_nombre || '';
        const apellidoPart = studentData.apellido || studentData.Apellido || studentData.primerApellido || studentData.apellidos || studentData.Apellidos || studentData.primer_apellido || '';
        
        let fullName = `${nombrePart} ${apellidoPart}`.trim();

        if (!fullName) {
          fullName = studentData.nombreCompleto || studentData.nombre_completo || studentData.displayName || studentData.NombreCompleto || '';
        }

        // Beautiful capitalized fallback from the username string if no naming fields are stored in document
        if (!fullName) {
          if (dbUsuario && dbUsuario.includes('.')) {
            fullName = dbUsuario
              .split('.')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          } else {
            fullName = dbUsuario ? (dbUsuario.charAt(0).toUpperCase() + dbUsuario.slice(1)) : 'Héroe Desconocido';
          }
        }

        const grado = studentData.grado || studentData.Grado || 'Grado Indefinido';
        const seccion = (studentData.seccion || studentData.Seccion) ? `Sección ${studentData.seccion || studentData.Seccion}` : '';
        const gradeInfo = seccion ? `${grado} - ${seccion}` : grado;

        // Auto selection of gender if stored
        const sexo = studentData.sexo || studentData.Sexo || '';
        let matchedGender: 'male' | 'female' = 'male';
        if (sexo === 'Femenino' || sexo === 'femenino' || sexo === 'F' || sexo === 'f') {
          matchedGender = 'female';
          setGender('female');
        } else {
          matchedGender = 'male';
          setGender('male');
        }

        // Save validated details to Game Store
        setPlayerInfo(fullName, dbUsuario, gradeInfo);

        // Store validation locally
        setValidatedStudent({
          fullName,
          userName: dbUsuario,
          gradeInfo,
          sexo
        });
        setName(fullName); // Replace input text with full actual student name!

        // IMMEDIATE TRANSITION! No double click required. Starts playing the game!
        console.log("Validación exitosa, iniciando juego de inmediato para:", fullName);
        startLevel(selectedLevel);
        setPhase('intro');
      } else {
        setError('El usuario de héroe no figura en la base de datos de la plataforma "mate-experimental". Verifica que esté bien escrito o escanea tu QR.');
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
    const candidates = getStudentUserCandidates(decodedText);
    
    // Set a quick temporary username in state while verifying
    const primaryUser = candidates.find(c => c === c.toLowerCase()) || candidates[0] || decodedText.trim();
    setName(primaryUser);

    setVerifying(true);
    setError('');

    try {
      if (candidates.length === 0) {
        setError('No se pudo extraer un usuario a partir del código QR.');
        setVerifying(false);
        return;
      }

      const studentDoc = await findStudentByCandidates(candidates);

      if (studentDoc) {
        const studentData = studentDoc.data();

        // Get the actual username registered in the db
        const dbUsuario = studentData.usuario || primaryUser;

        // Extremely robust extraction checking all common given name and surname schemas in Spanish and English databases
        const nombrePart = studentData.nombre || studentData.primerNombre || studentData.nombres || studentData.primer_nombre || '';
        const apellidoPart = studentData.apellido || studentData.primerApellido || studentData.apellidos || studentData.primer_apellido || '';
        
        let fullName = `${nombrePart} ${apellidoPart}`.trim();

        if (!fullName) {
          fullName = studentData.nombreCompleto || studentData.nombre_completo || studentData.displayName || '';
        }

        // Beautiful capitalized fallback from the username string if no naming fields are stored in document
        if (!fullName) {
          if (dbUsuario && dbUsuario.includes('.')) {
            fullName = dbUsuario
              .split('.')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          } else {
            fullName = dbUsuario ? (dbUsuario.charAt(0).toUpperCase() + dbUsuario.slice(1)) : 'Héroe Desconocido';
          }
        }

        const grado = studentData.grado || 'Grado Indefinido';
        const seccion = studentData.seccion ? `Sección ${studentData.seccion}` : '';
        const gradeInfo = seccion ? `${grado} - ${seccion}` : grado;

        // Save validated details to Game Store (this updates store)
        setPlayerInfo(fullName, dbUsuario, gradeInfo);

        // Save validated student react state
        const valObj = {
          fullName,
          userName: dbUsuario,
          gradeInfo,
          sexo: studentData.sexo || ''
        };
        setValidatedStudent(valObj);
        setName(fullName); // Set input field value to student's FULL name!

        const sexo = studentData.sexo || '';
        if (sexo === 'Femenino') {
          setGender('female');
        } else {
          setGender('male');
        }

        // QR Scanned Successfully! Do NOT automatically jump to the next screen!
        // This lets candidates select Guerrero or Mística and review details before clicking "Iniciar Crónica".
        setError('');
      } else {
        setError(`Código QR detectado ("${primaryUser}"), pero no figura en la base de datos "mate-experimental".`);
      }
    } catch (err: any) {
      console.error("Firebase Student lookup error:", err);
      setError(`QR escaneado: "${primaryUser}", pero falló la validación: ${err.message || 'Sin conexión.'}`);
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
                  onChange={(e) => {
                    setName(e.target.value);
                    if (validatedStudent) {
                      setValidatedStudent(null);
                    }
                  }}
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
            
            {validatedStudent && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-2.5 mt-2 flex flex-col items-center gap-0.5 text-center shadow-lg">
                <span className="text-[7.5px] text-orange-400 font-extrabold uppercase tracking-[0.2em]">Héroe Identificado</span>
                <span className="text-white font-serif font-black text-xs sm:text-sm uppercase tracking-tight">{validatedStudent.fullName}</span>
                <span className="text-[8px] text-white/50 font-mono tracking-wider font-bold">{validatedStudent.gradeInfo}</span>
                <p className="text-[7px] text-yellow-500 leading-none tracking-widest font-extrabold uppercase mt-1.5 animate-pulse">
                  ★ ¡ELIGE TU ROL DE ABAJO Y COMENCEMOS! ★
                </p>
              </div>
            )}

            {error && (
              <div className="flex flex-col gap-1 text-center mt-1">
                <p className="text-red-400 text-[9px] font-black animate-shake leading-tight">{error}</p>
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
                type="button"
                onClick={() => setGender('male')}
                className={`group relative p-1.5 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all flex flex-col items-center gap-1 active:scale-95 overflow-hidden cursor-pointer ${
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
                type="button"
                onClick={() => setGender('female')}
                className={`group relative p-1.5 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all flex flex-col items-center gap-1 active:scale-95 overflow-hidden cursor-pointer ${
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

          <div className="pt-1 sm:pt-2 flex flex-col gap-2">
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
