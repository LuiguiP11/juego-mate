/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Play, Camera, Star, Sword, Shield, ChevronRight, User, Lock, Trophy, Upload, RefreshCw } from 'lucide-react';
import { useGameStore, LEVELS } from '../../store';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const getStudentUserCandidates = (text: string): string[] => {
  let cleaned = text.trim();
  if (!cleaned) return [];
  
  // Try to decode URI component in case of encoded search query or route segment
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch (e) {
    // If it's not valid URI encoded string, proceed with original cleaned
  }

  let parsed = cleaned;

  // 1. Try JSON parsing (e.g. {"usuario": "juan.perez"})
  try {
    const ob = JSON.parse(cleaned);
    if (ob && typeof ob === 'object') {
      const possibleKeys = ['usuario', 'Usuario', 'user', 'User', 'username', 'Username', 'code', 'id', 'alumno', 'Alumno', 'name', 'nombre', 'Nombre'];
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
        const params = ['user', 'User', 'usuario', 'Usuario', 'username', 'Username', 'id', 'ID', 'alumno', 'Alumno', 'name', 'Name', 'nombre', 'Nombre'];
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

  // Apply fallback URI decoding one more time to parsed string to capture any spaces/accents
  try {
    parsed = decodeURIComponent(parsed);
  } catch (e) {
    // Ignore
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

// Simple Levenshtein distance algorithm for robust typo tolerance
const getEditDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
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

  // 1. Direct Document ID searches for all candidate formats
  filteredCandidates.forEach(cand => {
    tasks.push(
      getDoc(doc(db, 'alumnos', cand))
        .then(snap => (snap.exists() ? snap : null))
        .catch(() => null)
    );
  });

  // 2. Query exact match 'usuario' (both lowercase and uppercase versions check) for candidates
  tasks.push(
    getDocs(query(collection(db, 'alumnos'), where('usuario', '==', primary)))
      .then(snap => (!snap.empty ? snap.docs[0] : null))
      .catch(() => null)
  );
  tasks.push(
    getDocs(query(collection(db, 'alumnos'), where('Usuario', '==', primary)))
      .then(snap => (!snap.empty ? snap.docs[0] : null))
      .catch(() => null)
  );

  // 3. Query with 'in' operator check on both lowercase 'usuario' and uppercase 'Usuario' collections
  tasks.push(
    getDocs(query(collection(db, 'alumnos'), where('usuario', 'in', filteredCandidates.slice(0, 10))))
      .then(snap => (!snap.empty ? snap.docs[0] : null))
      .catch(() => null)
  );
  tasks.push(
    getDocs(query(collection(db, 'alumnos'), where('Usuario', 'in', filteredCandidates.slice(0, 10))))
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

  // FALLBACK: Full-collection scan for case-insensitive, space-insensitive, and substring matching!
  console.log("No se encontró coincidencia directa. Iniciando escaneo de colección completa para búsqueda flexible...");
  try {
    const snapshot = await getDocs(collection(db, 'alumnos'));
    console.log(`Diagnostic: Se cargaron ${snapshot.size} alumnos de la base de datos.`);

    // Helper to normalize strings for robust comparison (lowercase, alphanumeric only)
    const normalize = (s: string) => s.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9]/g, ""); // remove dots, spaces, special chars

    const normalizedCandidates = filteredCandidates.map(normalize);

    // Try to find a document with ID that matches normalized candidates
    let bestMatch = snapshot.docs.find(d => {
      const normId = normalize(d.id);
      return normalizedCandidates.includes(normId);
    });

    // If not found, try to match 'usuario' or 'Usuario' field after normalization
    if (!bestMatch) {
      bestMatch = snapshot.docs.find(d => {
        const data = d.data();
        const usr = data.usuario || data.Usuario || '';
        if (!usr) return false;
        return normalizedCandidates.includes(normalize(usr));
      });
    }

    // If still not found, try to match 'nombre' + 'apellido' or 'nombreCompleto'
    if (!bestMatch) {
      bestMatch = snapshot.docs.find(d => {
        const data = d.data();
        const fullName = (data.nombreCompleto || data.NombreCompleto || `${data.nombre || data.Nombre || ''} ${data.apellido || data.Apellido || ''}`).trim();
        if (!fullName) return false;
        const normFullName = normalize(fullName);
        return normalizedCandidates.some(cand => normFullName.includes(cand) || cand.includes(normFullName));
      });
    }

    // If still not found, try Levenshtein distance matching for near typos (edit distance <= 2)
    if (!bestMatch) {
      let minDistance = 999;
      let closestDoc: any = null;

      snapshot.docs.forEach(d => {
        const data = d.data();
        const usr = (data.usuario || data.Usuario || d.id || '').toLowerCase();
        if (!usr) return;

        normalizedCandidates.forEach(cand => {
          const normUsr = normalize(usr);
          // Only check if length difference is small to avoid unrelated matches
          if (Math.abs(normUsr.length - cand.length) <= 2) {
            const dist = getEditDistance(normUsr, cand);
            if (dist < minDistance && dist <= 2) {
              minDistance = dist;
              closestDoc = d;
            }
          }
        });
      });

      if (closestDoc) {
        console.log(`Coincidencia aproximada encontrada por distancia de edición (${minDistance}):`, closestDoc.id);
        bestMatch = closestDoc;
      }
    }

    if (bestMatch) {
      console.log("Alumno localizado mediante escaneo flexible de la colección completa:", bestMatch.id);
      return bestMatch;
    }
  } catch (fallbackErr) {
    console.error("Error en búsqueda flexible por escaneo de colección:", fallbackErr);
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
  const [cameras, setCameras] = useState<any[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'camera' | 'file'>('camera');
  const [fileScanning, setFileScanning] = useState(false);
  const [fileError, setFileError] = useState('');
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Keep references to onSuccess and onError updated so we never restart scanner on parent render
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  // Load cameras once on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadCameras = async () => {
      try {
        const listedCameras = await Html5Qrcode.getCameras();
        if (isMounted && listedCameras && listedCameras.length > 0) {
          setCameras(listedCameras);
          
          // Select best initial camera
          let selected = listedCameras.find(c => {
            const label = c.label.toLowerCase();
            const isRear = label.includes('back') || label.includes('rear') || label.includes('trasera') || label.includes('entorno');
            const isSpecialtyLens = label.includes('wide') || label.includes('ultra') || label.includes('macro') || label.includes('tele') || label.includes('depth') || label.includes('virtual') || label.includes('0');
            return isRear && !isSpecialtyLens;
          });

          if (!selected) {
            selected = listedCameras.find(c => {
              const label = c.label.toLowerCase();
              return label.includes('back') || label.includes('rear') || label.includes('trasera') || label.includes('entorno');
            });
          }

          if (!selected) {
            selected = listedCameras[0];
          }

          setActiveCameraId(selected.id);
        }
      } catch (err) {
        console.warn("Could not list cameras initially:", err);
      }
    };

    loadCameras();

    return () => {
      isMounted = false;
    };
  }, []);

  // Main scanner lifecycle controlled by activeCameraId and activeTab
  useEffect(() => {
    if (activeTab !== 'camera') return;

    let isMounted = true;
    let scanner: Html5Qrcode | null = null;

    const startScanner = async () => {
      // 1. Give DOM 350ms to mount '#qr-reader' safely
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (!isMounted) return;

      const element = document.getElementById("qr-reader");
      if (!element) {
        console.warn("qr-reader element not found in DOM yet");
        return;
      }

      try {
        scanner = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = scanner;

        // Dynamic scanner box (70% of minimum viewfinder edge) for high precision on small phone screens
        const qrBoxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.7);
          return {
            width: qrboxSize,
            height: qrboxSize
          };
        };

        const config = {
          fps: 30, // Much faster frame rate for immediate QR code detection
          qrbox: qrBoxFunction,
          aspectRatio: undefined // Native aspect ratio prevents stretching
        };

        if (activeCameraId) {
          console.log("Starting QR scanner with explicit camera:", activeCameraId);
          await scanner.start(
            activeCameraId,
            config,
            async (decodedText) => {
              if (isMounted) {
                // Turn off camera stream completely BEFORE closing the React modal overlay to avoid corruption/freezing
                if (scanner && scanner.isScanning) {
                  try {
                    await scanner.stop();
                  } catch (e) {
                    console.error("Error al apagar el escáner:", e);
                  }
                }
                html5QrCodeRef.current = null;
                onSuccessRef.current(decodedText);
              }
            },
            () => {} // Silent search frame (ignore partial non-match reads)
          );
        } else {
          console.log("Starting QR scanner with facingMode fallback...");
          await scanner.start(
            { facingMode: "environment" },
            config,
            async (decodedText) => {
              if (isMounted) {
                // Turn off camera stream completely BEFORE closing the React modal overlay to avoid corruption/freezing
                if (scanner && scanner.isScanning) {
                  try {
                    await scanner.stop();
                  } catch (e) {
                    console.error("Error al apagar el escáner:", e);
                  }
                }
                html5QrCodeRef.current = null;
                onSuccessRef.current(decodedText);
              }
            },
            () => {}
          );
        }
      } catch (err: any) {
        console.error("Camera boot failed:", err);
        if (isMounted) {
          const fallbackMessage = "No se pudo encender la cámara de forma directa. Concede permisos de cámara al navegador o usa el lector de archivos abajo.";
          setCameraError(fallbackMessage);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      const stopScanner = async () => {
        if (scanner) {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch (e) {
            console.error("Error stopping scanner in cleanup:", e);
          }
        }
      };
      stopScanner();
    };
  }, [activeCameraId, activeTab]);

  const handleCameraChange = async (newId: string) => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (e) {
        console.error("Error stopping camera before switch:", e);
      }
      html5QrCodeRef.current = null;
    }
    setActiveCameraId(newId);
  };

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    await handleCameraChange(cameras[nextIndex].id);
  };

  const handleClose = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (e) {
        console.error("Error al detener cámara en cancelación:", e);
      }
      html5QrCodeRef.current = null;
    }
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanning(true);
    setFileError('');

    try {
      // Initialize a temporary file scanner on dummy div
      const fileScanner = new Html5Qrcode("qr-file-detector-dummy");
      const decodedText = await fileScanner.scanFile(file, false);
      
      onSuccessRef.current(decodedText);
    } catch (err: any) {
      console.error("File QR reading failed:", err);
      setFileError("No se encontró ningún código QR en la imagen. Asegúrate de que la foto sea clara y esté bien enfocada.");
    } finally {
      setFileScanning(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-[#0b0805]/98 flex flex-col items-center justify-center p-4 backdrop-blur-xl shrink-0 overflow-y-auto"
    >
      <div id="qr-file-detector-dummy" className="hidden" />

      <div className="w-full max-w-sm text-center flex flex-col items-center mt-2 space-y-1">
        <span className="text-[10px] text-orange-500 font-extrabold tracking-[0.3em] uppercase block">Lector de Credenciales QR</span>
        
        {/* Navigation Tabs */}
        <div className="flex gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1 w-full max-w-[280px]">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'camera' 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            Usar Cámara
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'file' 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            Subir Imagen
          </button>
        </div>

        {isInsideIframe && activeTab === 'camera' && (
          <div className="bg-orange-500/10 border border-orange-500/30 p-2 sm:p-3 rounded-xl max-w-sm text-center mt-2">
            <p className="text-orange-400 text-[10px] font-black leading-snug">
              ⚠️ Estás jugando dentro de la vista previa (iframe) de Google AI Studio.
            </p>
            <p className="text-white/60 text-[9px] mt-1 leading-relaxed">
              Los navegadores bloquean la cámara dentro de vistas previas. Por favor, haz clic en <span className="text-orange-300 font-bold uppercase">&quot;Abrir en pestaña nueva&quot;</span> en la esquina superior derecha o usa la pestaña <span className="text-orange-300 font-bold uppercase">&quot;Subir Imagen&quot;</span>.
            </p>
          </div>
        )}

        {activeTab === 'camera' && cameras.length > 0 && !cameraError && (
          <div className="mt-2 w-full max-w-[280px] bg-white/5 border border-white/10 rounded-xl p-1 px-2.5 flex items-center gap-2">
            <Camera size={12} className="text-orange-500 shrink-0" />
            <select
              value={activeCameraId}
              onChange={(e) => handleCameraChange(e.target.value)}
              className="w-full bg-transparent border-none text-white text-[10px] sm:text-xs font-mono font-bold outline-none cursor-pointer py-1.5"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id} className="bg-[#0b0805] text-white font-sans text-xs">
                  {cam.label || `Cámara ${cam.id.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="relative w-full max-w-[340px] sm:max-w-[420px] aspect-[4/3] border border-white/10 rounded-2xl overflow-hidden mt-5 bg-[#0a0502] flex items-center justify-center">
        {activeTab === 'camera' ? (
          cameraError ? (
            <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-4 text-center">
              <Camera size={32} className="text-neutral-600 mb-2" />
              <p className="text-white/70 text-[10px] sm:text-xs font-semibold leading-relaxed">
                No se pudo activar la cámara de forma directa.
              </p>
              <p className="text-neutral-500 text-[9px] mt-1 leading-relaxed max-w-[95%]">
                {cameraError}
              </p>
              <button 
                onClick={() => setActiveTab('file')}
                className="mt-4 px-4 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-[9px] font-black uppercase rounded-lg border border-orange-500/30 transition-all"
              >
                Cambiar a Subir Imagen
              </button>
            </div>
          ) : (
            <>
              <div id="qr-reader" className="w-full h-full" style={{ position: 'relative' }} />
            </>
          )
        ) : (
          <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.01]">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-orange-400">
              <Upload size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold text-xs sm:text-sm">Sube una foto de tu código QR</p>
              <p className="text-white/40 text-[9px] sm:text-[10px] max-w-[240px] mx-auto leading-relaxed">
                Toma una foto de tu credencial QR con tu celular o sube una captura de pantalla.
              </p>
            </div>

            <label className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-lg transition-all active:scale-95 inline-flex items-center gap-2">
              <Camera size={14} />
              <span>Seleccionar Imagen</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                disabled={fileScanning}
                className="hidden" 
              />
            </label>

            {fileScanning && (
              <p className="text-yellow-400 text-[9px] sm:text-[10px] font-bold animate-pulse font-mono uppercase tracking-wider">
                ⏳ Analizando imagen en busca de QR...
              </p>
            )}

            {fileError && (
              <p className="text-red-400 text-[9px] sm:text-[10px] font-bold max-w-[280px] leading-tight">
                {fileError}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 w-full max-w-sm">
        {activeTab === 'camera' && cameras.length > 1 && !cameraError && (
          <button
            onClick={handleSwitchCamera}
            className="px-5 py-3 bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 rounded-xl font-black uppercase tracking-[0.1em] text-[10px] transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
            <span>Rotar Cámara</span>
          </button>
        )}
        <button
          onClick={handleClose}
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
  const [scannedText, setScannedText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(0);

  // Keep track of the currently validated student in react state to manage form validation state in two steps
  const [validatedStudent, setValidatedStudent] = useState<{
    fullName: string;
    userName: string;
    gradeInfo: string;
    sexo: string;
    nombre: string;
    apellido: string;
    gradoSolo: string;
    seccionSolo: string;
    clave: string;
  } | null>(null);

  // Floating confirmation window state
  const [pendingStudent, setPendingStudent] = useState<{
    fullName: string;
    userName: string;
    gradeInfo: string;
    sexo: string;
    nombre: string;
    apellido: string;
    gradoSolo: string;
    seccionSolo: string;
    clave: string;
  } | null>(null);

  const handleStart = () => {
    if (validatedStudent) {
      console.log("Iniciando aventura con estudiante ya verificado:", validatedStudent);
      setPlayerInfo(
        validatedStudent.fullName, 
        validatedStudent.userName, 
        validatedStudent.gradeInfo,
        validatedStudent.nombre,
        validatedStudent.apellido,
        validatedStudent.gradoSolo,
        validatedStudent.seccionSolo
      );
      startLevel(selectedLevel);
      setPhase('intro');
    } else {
      setError('Por favor, escanea tu código QR primero para identificarte.');
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    setScanning(false);
    const candidates = getStudentUserCandidates(decodedText);
    
    // Set temporary username in name state while verifying
    const primaryUser = candidates.find(c => c === c.toLowerCase()) || candidates[0] || decodedText.trim();
    setName(primaryUser);
    setScannedText(primaryUser);

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
        const dbUsuario = studentData.usuario || studentData.Usuario || primaryUser;

        // Extremely robust extraction checking all common given name and surname schemas
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

        const gradoSolo = studentData.grado || studentData.Grado || 'Grado Indefinido';
        const seccionSolo = studentData.seccion || studentData.Seccion || '';
        const gradeInfo = seccionSolo ? `${gradoSolo} - Sección ${seccionSolo}` : gradoSolo;

        // Extraer clave o Clave o fallback
        const studentClave = studentData.clave || studentData.Clave || studentData.usuario || studentData.Usuario || primaryUser;

        const sexo = studentData.sexo || studentData.Sexo || '';

        // Instead of immediate transitions or saving to verified student, set pendingStudent for the confirmation pop-up!
        setPendingStudent({
          fullName,
          userName: dbUsuario,
          gradeInfo,
          sexo,
          nombre: nombrePart,
          apellido: apellidoPart,
          gradoSolo,
          seccionSolo,
          clave: String(studentClave)
        });
        setError('');
      } else {
        setError(`Código QR detectado ("${primaryUser}"), pero no figura en la base de datos "mate-experimental". Verifica su escritura o escanea otro QR.`);
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
        @keyframes qr-scanline {
          0% { top: 2%; opacity: 0.4; }
          50% { opacity: 1; }
          100% { top: 98%; opacity: 0.4; }
        }
        @keyframes panic-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 165, 0, 0.2); }
          50% { box-shadow: 0 0 40px rgba(255, 165, 0, 0.5); }
        }
        .animate-scanline { animation: scanline 2s linear infinite; }
        .animate-qr-scanline { animation: qr-scanline 2.5s ease-in-out infinite alternate; }
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
            {validatedStudent ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 sm:p-4 flex flex-col items-center gap-1 sm:gap-2 text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full blur-xl pointer-events-none" />
                <span className="text-[7px] sm:text-[8px] text-green-400 font-extrabold uppercase tracking-[0.2em] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                  Héroe Identificado
                </span>
                <span className="text-white font-serif font-black text-xs sm:text-lg uppercase tracking-tight">{validatedStudent.fullName}</span>
                
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 text-[7px] sm:text-[9px] text-white/70 font-mono tracking-wider font-bold">
                  <span className="bg-white/5 px-2 py-0.5 rounded">{validatedStudent.gradoSolo}</span>
                  {validatedStudent.seccionSolo && (
                    <span className="bg-white/5 px-2 py-0.5 rounded">Sección {validatedStudent.seccionSolo}</span>
                  )}
                  <span className="bg-white/5 px-2 py-0.5 rounded">Clave: {validatedStudent.clave}</span>
                </div>

                <p className="text-[6.5px] sm:text-[8px] text-yellow-500 leading-none tracking-widest font-extrabold uppercase mt-1 sm:mt-2 animate-pulse">
                  ★ ¡ELIGE TU ROL DE ABAJO Y COMENCEMOS! ★
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setValidatedStudent(null);
                    setError('');
                  }}
                  className="mt-1 sm:mt-2 text-[6.5px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-red-400/80 hover:text-red-300 transition-colors cursor-pointer bg-white/5 px-2 py-1 rounded hover:bg-white/10"
                >
                  Cambiar de Cuenta
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[8px] sm:text-[10px] text-center text-white/50 tracking-wider font-medium font-mono leading-relaxed">
                  Para acceder a Jhiro's Adventure y registrar tu progreso, por favor escanea tu código QR de alumno.
                </p>
                <button
                  onClick={startQRScanner}
                  disabled={verifying}
                  className="w-full py-3.5 bg-gradient-to-r from-green-500 via-emerald-600 to-green-600 hover:from-green-400 hover:to-emerald-500 rounded-xl text-white font-serif text-xs sm:text-sm font-black uppercase tracking-[0.15em] shadow-[0_0_30px_rgba(34,197,94,0.25)] transition-all flex items-center justify-center gap-3 active:scale-95 group cursor-pointer disabled:opacity-50"
                >
                  <QrCode size={16} className="group-hover:rotate-12 transition-transform text-white" />
                  <span>Escanear Código QR</span>
                </button>
              </div>
            )}

            {error && (
              <div className="flex flex-col gap-1 text-center mt-1">
                <p className="text-red-400 text-[9px] font-black animate-shake leading-tight">{error}</p>
              </div>
            )}
          </div>

          {validatedStudent && (
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
          )}

          <div className="pt-1 sm:pt-2 flex flex-col gap-2">
            <motion.button
               whileHover={{ scale: (!validatedStudent || verifying) ? 1 : 1.02 }}
               whileTap={{ scale: (!validatedStudent || verifying) ? 1 : 0.98 }}
               onClick={handleStart}
               disabled={!validatedStudent || verifying}
               className={`w-full py-2.5 sm:py-3.5 rounded-xl font-serif text-xs sm:text-base font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all flex items-center justify-center gap-2 sm:gap-3 group cursor-pointer disabled:opacity-50 ${
                 validatedStudent 
                   ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-[0_0_30px_rgba(249,115,22,0.45)]' 
                   : 'bg-white/5 border border-white/10 text-white/40 cursor-not-allowed'
               }`}
            >
              <div className="w-5 h-5 sm:w-7 sm:h-7 bg-black/15 rounded-full flex items-center justify-center">
                {verifying ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : !validatedStudent ? (
                  <Lock size={10} className="text-white/40" />
                ) : (
                  <Play size={10} fill="currentColor" className="ml-0.5 text-white animate-pulse" />
                )}
              </div>
              {verifying ? 'VERIFICANDO...' : !validatedStudent ? 'ESCANEA TU QR PARA COMENZAR' : 'INICIAR CRÓNICA'}
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

      {/* Student Verifying Overlay */}
      <AnimatePresence>
        {verifying && (
          <div className="fixed inset-0 z-[350] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center space-y-4 max-w-sm text-center"
            >
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-orange-500/10 border-t-orange-500 animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-emerald-500/10 border-b-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-serif text-sm sm:text-base font-black uppercase tracking-wider">Buscando Registro</h4>
                <p className="text-orange-400 font-mono text-[10px] sm:text-xs">Validando usuario: "{scannedText || name}"</p>
                <p className="text-white/40 text-[8px] sm:text-[9px] uppercase tracking-widest font-bold">Base de datos: "mate-experimental"</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Confirmation Modal */}
      <AnimatePresence>
        {pendingStudent && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#0e0904] border-2 border-orange-500/40 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-[0_0_80px_rgba(234,88,12,0.25)] relative overflow-hidden"
            >
              {/* Decorative top line accent */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
              
              <div className="text-center space-y-1 sm:space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <User size={18} />
                </div>
                <h3 className="text-white font-serif text-lg sm:text-2xl font-black uppercase tracking-tight">Confirmar Identidad</h3>
                <p className="text-white/40 text-[8px] sm:text-[10px] tracking-widest font-black uppercase">¿Son correctos tus datos de alumno?</p>
              </div>

              {/* Data Grid */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3 font-mono text-[10px] sm:text-xs">
                <div className="flex flex-col gap-0.5 pb-2.5 border-b border-white/5">
                  <span className="text-orange-400 font-extrabold uppercase tracking-widest text-[7px] sm:text-[8px]">Nombre Completo</span>
                  <span className="text-white font-bold font-serif text-sm sm:text-base">{pendingStudent.fullName}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-orange-400 font-extrabold uppercase tracking-widest text-[7px] sm:text-[8px]">Grado</span>
                    <span className="text-white font-bold">{pendingStudent.gradoSolo}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-orange-400 font-extrabold uppercase tracking-widest text-[7px] sm:text-[8px]">Sección</span>
                    <span className="text-white font-bold">{pendingStudent.seccionSolo || 'Única'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 pt-2 border-t border-white/5">
                  <span className="text-orange-400 font-extrabold uppercase tracking-widest text-[7px] sm:text-[8px]">Clave</span>
                  <span className="text-white font-bold text-xs sm:text-sm">{pendingStudent.clave}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingStudent(null);
                    setVerifying(false);
                  }}
                  className="w-full py-2.5 sm:py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 hover:text-white font-serif text-xs sm:text-sm font-black uppercase tracking-wider transition-colors active:scale-95 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Save validated details to react state and store
                    setValidatedStudent(pendingStudent);
                    setPlayerInfo(
                      pendingStudent.fullName,
                      pendingStudent.userName,
                      pendingStudent.gradeInfo,
                      pendingStudent.nombre,
                      pendingStudent.apellido,
                      pendingStudent.gradoSolo,
                      pendingStudent.seccionSolo
                    );
                    
                    // Auto select character gender
                    const sexo = pendingStudent.sexo || '';
                    if (sexo === 'Femenino' || sexo === 'femenino' || sexo === 'F' || sexo === 'f') {
                      setGender('female');
                    } else {
                      setGender('male');
                    }

                    setPendingStudent(null);
                  }}
                  className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl text-white font-serif text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all active:scale-95 cursor-pointer"
                >
                  Aceptar
                </button>
              </div>
            </motion.div>
          </div>
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
