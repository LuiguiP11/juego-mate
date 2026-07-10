import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Play, Pause, ChevronLeft, ChevronRight, 
  Tv, Sparkles, Gamepad2, CheckCircle, Volume2, VolumeX, ArrowRight, HelpCircle,
  QrCode, Upload, Layers, Shield, Heart, Smartphone, Keyboard, HelpCircle as HelpIcon
} from 'lucide-react';
import { useGameStore } from '../../store';

interface VideoTutorialModalProps {
  onClose: () => void;
}

interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  duration: number; // in seconds
  description: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "1. Acceso con QR o Archivo",
    subtitle: "Cómo ingresar al juego usando el código del maestro",
    duration: 10,
    description: "Cada alumno tiene un código QR único entregado por su maestro. En la pantalla de inicio, presiona 'ESCANEAR QR' y permite el acceso a la cámara para leerlo desde tu teléfono o tablet. Si estás en una computadora, también puedes presionar 'SUBIR IMAGEN' para cargar una captura de pantalla, foto o PDF con tu código QR. ¡Esto valida de inmediato tu identidad!"
  },
  {
    id: 2,
    title: "2. Sala de Práctica (Sin Registro)",
    subtitle: "Entrena libremente sin necesidad de códigos ni notas",
    duration: 9,
    description: "Para los padres que quieren probar el juego, o para alumnos que desean un calentamiento antes de la evaluación real: en el menú principal presiona el botón morado '📚 SALA DE PRÁCTICA'. Podrás jugar, saltar y resolver ecuaciones de forma totalmente libre, sin registrar ninguna calificación en el servidor."
  },
  {
    id: 3,
    title: "3. Selección de Niveles",
    subtitle: "Explora los diferentes templos de álgebra",
    duration: 8,
    description: "En la parte superior de la pantalla de inicio se ubica el Selector de Niveles. Puedes alternar entre el 'Nivel 1: Ecuaciones de 1er Grado' y el 'Nivel 2: Sistemas de Ecuaciones 2x2'. Asegúrate de seleccionar el nivel indicado por el profesor antes de ingresar con tu código QR."
  },
  {
    id: 4,
    title: "4. Movimiento del Personaje",
    subtitle: "Controles sencillos para computadoras y celulares",
    duration: 9,
    description: "Mover a tu héroe es muy fácil. En computadoras (PC/Laptop), usa las teclas A / D o las Flechas Izquierda / Derecha para caminar, y presiona la barra ESPACIADORA para saltar entre plataformas. En celulares o tablets, aparecerá un joystick táctil en el lado izquierdo para caminar y un botón circular a la derecha para saltar."
  },
  {
    id: 5,
    title: "5. Cristales Algebraicos y Vidas",
    subtitle: "Resuelve los enigmas para salvar la partida",
    duration: 11,
    description: "Explora el mapa y salta hacia los Cristales Dorados. Al tocarlos, se revelará un portal matemático con una ecuación y 3 opciones de respuesta. Tienes 3 vidas (corazones). Responder correctamente purifica el cristal; fallar te restará una vida. ¡Al resolver con éxito los 5 cristales, tu nota se registrará automáticamente!"
  }
];

export default function VideoTutorialModal({ onClose }: VideoTutorialModalProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100
  const muted = useGameStore((state) => state.muted);
  const toggleMute = useGameStore((state) => state.toggleMute);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chapter = CHAPTERS[currentChapterIndex];

  // Sound triggers
  const playSound = (type: 'jump' | 'correct' | 'wrong' | 'click' | 'victory') => {
    if (muted) return;
    const win = window as any;
    if (type === 'jump' && win.playJumpSound) win.playJumpSound();
    if (type === 'correct' && win.playCorrectSound) win.playCorrectSound();
    if (type === 'wrong' && win.playWrongSound) win.playWrongSound();
    if (type === 'click' && win.playClickSound) win.playClickSound();
    if (type === 'victory' && win.playVictorySound) win.playVictorySound();
  };

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 100;
      const step = (intervalMs / 1000) / chapter.duration * 100;

      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Move to next chapter or loop
            if (currentChapterIndex < CHAPTERS.length - 1) {
              setCurrentChapterIndex((prevIdx) => prevIdx + 1);
              return 0;
            } else {
              // Loop back to start or pause at end
              setIsPlaying(false);
              return 100;
            }
          }
          return prev + step;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentChapterIndex, chapter.duration]);

  // Handle manual chapter selection
  const selectChapter = (index: number) => {
    playSound('click');
    setCurrentChapterIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (currentChapterIndex > 0) {
      selectChapter(currentChapterIndex - 1);
    } else {
      selectChapter(CHAPTERS.length - 1); // Loop to end
    }
  };

  const handleNext = () => {
    if (currentChapterIndex < CHAPTERS.length - 1) {
      selectChapter(currentChapterIndex + 1);
    } else {
      selectChapter(0); // Loop to start
    }
  };

  const handlePlayPause = () => {
    playSound('click');
    if (progress >= 100 && currentChapterIndex === CHAPTERS.length - 1) {
      // Restart whole tutorial
      setCurrentChapterIndex(0);
      setProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        className="relative w-full max-w-4xl bg-[#0e0c12] border-2 border-orange-500/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(249,115,22,0.25)] flex flex-col max-h-[96vh] sm:max-h-[92vh]"
      >
        {/* Top Header - Ancient Chronicle Style */}
        <div className="bg-[#15121b] border-b border-orange-500/20 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <div className="flex items-center gap-1.5 font-serif text-xs sm:text-sm font-black text-orange-400 tracking-wider">
              <Tv size={14} className="text-orange-400 animate-pulse" />
              <span>GUÍA COMPLETA: TUTORIAL DEL SABIO MATEMÁTICO</span>
            </div>
          </div>
          
          <button 
            onClick={() => { playSound('click'); onClose(); }}
            className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>CERRAR</span>
            <X size={14} />
          </button>
        </div>

        {/* Main Split Layout */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Simulated Video Frame Viewport (Left Side) */}
          <div className="w-full md:w-[58%] bg-[#060508] p-3 sm:p-4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 min-h-[280px] sm:min-h-[380px] overflow-hidden">
            
            {/* The Screen Canvas Box */}
            <div className="relative flex-1 rounded-xl overflow-hidden border border-white/10 bg-[#000000] shadow-inner flex items-center justify-center">
              
              {/* Dynamic Video Simulation based on current Chapter */}
              <AnimatePresence mode="wait">
                
                {/* CHAPTER 1: QR & FILE UPLOAD SIMULATION */}
                {currentChapterIndex === 0 && (
                  <motion.div 
                    key="sim-qr"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1c142d]/30 to-[#000]/95 p-4"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
                    
                    <div className="relative w-full max-w-[290px] bg-[#120f1a] border border-orange-500/20 rounded-xl p-3 flex flex-col items-center gap-2.5 z-10">
                      
                      {/* Top Header Mock */}
                      <div className="w-full flex justify-between items-center border-b border-white/5 pb-1">
                        <span className="text-[8px] font-mono text-orange-400 font-bold">CÁMARA DEL PORTAL</span>
                        <span className="text-[7px] font-mono text-white/40">ACTIVO</span>
                      </div>

                      {/* Mock QR Scan Box */}
                      <div className="relative w-28 h-28 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden">
                        
                        {/* Dummy QR Code Symbol */}
                        <QrCode size={64} className="text-white/80" />

                        {/* Scanner Laser Beam Animation */}
                        <motion.div 
                          animate={isPlaying ? {
                            top: ["4%", "94%", "4%"]
                          } : { top: "50%" }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute left-2 right-2 h-[2px] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] z-20"
                        />
                        
                        {/* Corner Target brackets */}
                        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-orange-400" />
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-orange-400" />
                        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-orange-400" />
                        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-orange-400" />
                      </div>

                      {/* Interactive mock validation states */}
                      <div className="w-full text-center py-1 rounded bg-black/40 border border-white/5">
                        <motion.div
                          animate={isPlaying ? {
                            opacity: [0.5, 1, 0.5],
                          } : {}}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="text-[9px] font-mono text-emerald-400 flex items-center justify-center gap-1"
                        >
                          <CheckCircle size={10} className="text-emerald-400" />
                          <span>¡CÓDIGO QR DETECTADO!</span>
                        </motion.div>
                        <p className="text-[8px] font-sans text-white/50 mt-0.5">Estudiante: Linday Torres (7° B)</p>
                      </div>

                      {/* Alternate mock file upload indicator */}
                      <div className="w-full flex items-center justify-center gap-1.5 py-1 border border-dashed border-white/15 rounded text-[8px] text-white/40 font-mono">
                        <Upload size={8} />
                        <span>O SUBE TU IMAGEN / CAPTURA</span>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* CHAPTER 2: PRACTICE MODE SIMULATION */}
                {currentChapterIndex === 1 && (
                  <motion.div 
                    key="sim-practice"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#18112d]/30 to-[#000]/95 p-4"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1)_0%,transparent_75%)]" />

                    <div className="w-full max-w-[280px] bg-[#120f18] border border-purple-500/20 rounded-xl p-3 flex flex-col gap-2.5 z-10 text-center">
                      <span className="text-[7.5px] font-mono text-purple-400 tracking-widest font-black uppercase">¿NO TIENES CÓDIGO QR?</span>
                      
                      <div className="p-2 bg-purple-950/20 border border-purple-500/10 rounded-lg">
                        <p className="text-[9px] text-gray-300 leading-normal font-sans">
                          Los alumnos pueden practicar y los padres probar el juego de inmediato sin usar códigos de maestro.
                        </p>
                      </div>

                      {/* Blinking Button mockup */}
                      <motion.div 
                        animate={isPlaying ? {
                          scale: [1, 1.02, 1],
                          boxShadow: [
                            "0 0 0px rgba(168,85,247,0)", 
                            "0 0 15px rgba(168,85,247,0.3)", 
                            "0 0 0px rgba(168,85,247,0)"
                          ]
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="py-2.5 rounded-lg bg-gradient-to-r from-purple-900/60 to-purple-800/40 text-purple-200 border border-purple-500/50 text-[10px] font-serif font-black tracking-wider flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={11} className="text-purple-300 animate-pulse" />
                        <span>📚 SALA DE PRÁCTICA (SIN QR)</span>
                      </motion.div>

                      <div className="flex items-center justify-center gap-1 text-[8px] text-white/40 font-mono">
                        <Shield size={9} className="text-purple-400" />
                        <span>No guarda datos en el servidor • Ideal para calentar</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* CHAPTER 3: LEVEL SELECTION SIMULATION */}
                {currentChapterIndex === 2 && (
                  <motion.div 
                    key="sim-levels"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1e1711]/30 to-[#000]/95 p-4"
                  >
                    <div className="w-full max-w-[280px] bg-[#120e0a] border border-amber-500/20 rounded-xl p-3 flex flex-col gap-2.5 z-10">
                      <span className="text-[7.5px] font-mono text-amber-400 tracking-widest font-black uppercase text-center">CAMBIAR TEMPLO DE ÁLGEBRA</span>

                      {/* Mock Level Select Grid */}
                      <div className="space-y-1.5 text-left">
                        {/* Level 1 Item */}
                        <motion.div 
                          animate={isPlaying ? {
                            borderColor: ["rgba(245,158,11,0.5)", "rgba(245,158,11,0.1)", "rgba(245,158,11,0.5)"],
                            backgroundColor: ["rgba(245,158,11,0.08)", "rgba(245,158,11,0.01)", "rgba(245,158,11,0.08)"]
                          } : {}}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="p-2 rounded-lg border bg-amber-500/10 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-[9.5px] font-bold text-amber-300 font-serif">TEMPLO 1: ECUACIONES</p>
                            <span className="text-[7.5px] text-white/40">Grado sugerido: 7° y superior</span>
                          </div>
                          <span className="text-[7px] font-mono bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded">ACTIVO</span>
                        </motion.div>

                        {/* Level 2 Item */}
                        <div className="p-2 rounded-lg border border-white/5 bg-white/5 flex items-center justify-between opacity-60">
                          <div>
                            <p className="text-[9.5px] font-bold text-gray-300 font-serif">TEMPLO 2: SISTEMAS 2x2</p>
                            <span className="text-[7.5px] text-white/30">Grado sugerido: 8° y superior</span>
                          </div>
                          <span className="text-[7px] font-mono bg-white/10 text-white/50 px-1 py-0.5 rounded">OPCIONAL</span>
                        </div>
                      </div>

                      <p className="text-[8px] font-sans text-center text-white/40 italic leading-snug">
                        💡 Presiona sobre los botones de niveles en la parte superior para ajustar tu grado antes de validar tu QR.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* CHAPTER 4: PLAYER MOVEMENT & CONTROLS */}
                {currentChapterIndex === 3 && (
                  <motion.div 
                    key="sim-movement"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#14231b]/30 to-[#000]/95 p-4"
                  >
                    {/* Level Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                    
                    {/* Simulated Game Stage */}
                    <div className="w-full h-2/3 relative flex items-end justify-center">
                      
                      {/* Ground */}
                      <div className="absolute bottom-6 inset-x-4 h-2 bg-gradient-to-r from-emerald-500/40 via-teal-500/40 to-emerald-500/40 rounded" />
                      
                      {/* Platform */}
                      <div className="absolute bottom-20 left-1/4 right-1/4 h-2 bg-teal-500/30 rounded border border-teal-500/20" />
                      
                      {/* Character Sprite Simulation */}
                      <motion.div 
                        animate={isPlaying ? { 
                          x: [ -70, 70, 70, -70, -70, 0, 0 ],
                          y: [ 0, 0, -65, -65, 0, 0, -65 ]
                        } : {}}
                        transition={{ 
                          duration: chapter.duration, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        onUpdate={(latest: any) => {
                          if (latest.y < -25 && Math.abs(latest.y % 30) < 4) {
                            playSound('jump');
                          }
                        }}
                        className="w-7 h-9 bg-gradient-to-b from-orange-400 to-red-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10 relative mb-8"
                      >
                        <div className="flex gap-0.5">
                          <div className="w-1.5 h-1.5 bg-white rounded-full flex items-center justify-center">
                            <div className="w-0.5 h-0.5 bg-black" />
                          </div>
                          <div className="w-1.5 h-1.5 bg-white rounded-full flex items-center justify-center">
                            <div className="w-0.5 h-0.5 bg-black" />
                          </div>
                        </div>
                      </motion.div>

                      {/* Keyboard UI Mockup */}
                      <div className="absolute top-2 left-4 flex flex-col gap-1 text-[8px] font-mono text-white/50 bg-black/40 p-1.5 rounded border border-white/5">
                        <div className="flex gap-1 items-center">
                          <Keyboard size={10} className="text-orange-400" />
                          <span>CONTROLES PC:</span>
                        </div>
                        <div className="flex gap-0.5 mt-0.5">
                          <kbd className="px-1 bg-white/10 rounded border border-white/20">A</kbd>
                          <kbd className="px-1 bg-white/10 rounded border border-white/20">D</kbd>
                          <span>/</span>
                          <kbd className="px-1 bg-white/10 rounded border border-white/20">←</kbd>
                          <kbd className="px-1 bg-white/10 rounded border border-white/20">→</kbd>
                        </div>
                        <div className="flex gap-0.5 mt-0.5">
                          <kbd className="px-2 bg-white/10 rounded border border-white/20">Espacio (Saltar)</kbd>
                        </div>
                      </div>

                      {/* Mobile UI Mockup */}
                      <div className="absolute top-2 right-4 flex flex-col gap-1 text-[8px] font-mono text-white/50 bg-black/40 p-1.5 rounded border border-white/5">
                        <div className="flex gap-1 items-center">
                          <Smartphone size={10} className="text-teal-400" />
                          <span>EN CELULAR:</span>
                        </div>
                        <span>🕹️ Joystick Táctil Izq</span>
                        <span>🔘 Botón Salto Der</span>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* CHAPTER 5: CRISTALS, LIFE, AND ALGEBRA */}
                {currentChapterIndex === 4 && (
                  <motion.div 
                    key="sim-crystal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#2d1414]/30 to-[#000]/95 p-4"
                  >
                    {/* Simulated Quiz Window */}
                    <div className="w-full max-w-[270px] bg-[#140c0c] border border-red-500/30 rounded-xl p-3 flex flex-col gap-2 z-10 font-sans shadow-2xl">
                      
                      {/* Top Header */}
                      <div className="flex justify-between items-center text-[7.5px] font-mono text-red-400 border-b border-white/5 pb-1">
                        <span>CRISTAL DORADO ACTIVADO</span>
                        <div className="flex gap-0.5">
                          <Heart size={8} fill="red" className="text-red-500" />
                          <Heart size={8} fill="red" className="text-red-500" />
                          <Heart size={8} fill="red" className="text-red-500" />
                        </div>
                      </div>

                      {/* Equation display */}
                      <div className="text-center py-2 bg-black/60 rounded border border-red-500/10">
                        <span className="text-[7.5px] font-mono text-white/40 uppercase tracking-widest block">Resuelve la ecuación</span>
                        <h4 className="text-sm font-black text-white font-mono tracking-tight mt-0.5">3x - 5 = 10</h4>
                      </div>

                      {/* Answers simulation */}
                      <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
                        <div className="py-1 rounded bg-white/5 border border-white/10 text-center text-white/50">x = 3</div>
                        
                        <motion.div 
                          animate={isPlaying ? {
                            backgroundColor: ["rgba(255,255,255,0.05)", "rgba(34,197,94,0.3)", "rgba(34,197,94,0.3)"],
                            borderColor: ["rgba(255,255,255,0.1)", "rgba(34,197,94,0.5)", "rgba(34,197,94,0.5)"],
                            scale: [1, 1.04, 1]
                          } : {}}
                          transition={{ duration: 4, repeat: Infinity }}
                          onUpdate={(latest: any) => {
                            if (latest.backgroundColor?.includes('34,197,94') && Math.random() < 0.04) {
                              playSound('correct');
                            }
                          }}
                          className="py-1 rounded border text-center text-white font-black"
                        >
                          x = 5
                        </motion.div>
                        
                        <div className="py-1 rounded bg-white/5 border border-white/10 text-center text-white/50">x = 15</div>
                      </div>

                      {/* Bottom result indicator */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-1 text-[8px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle size={8} className="text-emerald-400 shrink-0" />
                        <span>¡Correcto! Nota guardada en "mate-experimental".</span>
                      </div>

                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Watermark/Subtitle Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 py-2.5 flex items-center justify-center min-h-[48px]">
                <p className="text-center text-[10px] sm:text-[11px] text-orange-200 leading-tight font-serif italic max-w-[92%]">
                  "{chapter.subtitle}"
                </p>
              </div>

              {/* Live Overlay Indicators */}
              <div className="absolute top-2 left-2 flex gap-1.5">
                <span className="text-[8px] bg-orange-600 text-white font-mono px-1.5 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                  REPRODUCCIÓN EN VIVO
                </span>
                <span className="text-[8px] bg-black/70 backdrop-blur-sm text-white/80 font-mono px-1.5 py-0.5 rounded border border-white/10 shadow">
                  GUÍA {chapter.id}/5
                </span>
              </div>
            </div>

            {/* Video Control Bar */}
            <div className="mt-3 space-y-2">
              {/* Seek Slider bar */}
              <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Interaction Row */}
              <div className="flex items-center justify-between text-white/70">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handlePrev} 
                    className="hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <button 
                    onClick={handlePlayPause}
                    className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(249,115,22,0.3)] cursor-pointer"
                  >
                    {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
                  </button>

                  <button 
                    onClick={handleNext} 
                    className="hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Siguiente"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <span className="text-[9px] font-mono text-white/40">
                    0:0{Math.floor((progress / 100) * chapter.duration)} / 0:0{chapter.duration}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { playSound('click'); toggleMute(); }}
                    className="hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {muted ? <VolumeX size={15} className="text-red-400 animate-pulse" /> : <Volume2 size={15} className="text-orange-400" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Text Steps & Chapter Navigation */}
          <div className="w-full md:w-[42%] p-3 sm:p-4 bg-[#09080c] flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs text-orange-400 uppercase font-black tracking-widest font-mono">
                <Gamepad2 size={13} />
                <span>INSTRUCCIONES PARA PADRES Y ALUMNOS</span>
              </div>

              {/* Dynamic Text Box detailing the active Chapter */}
              <div className="bg-[#121017] border border-orange-500/10 rounded-xl p-3.5 space-y-1.5 shadow-md">
                <h4 className="font-serif text-xs sm:text-sm font-black text-orange-300 uppercase tracking-tight">{chapter.title}</h4>
                <p className="text-[10.5px] sm:text-[11px] text-gray-300 leading-relaxed font-sans">{chapter.description}</p>
              </div>

              {/* Interactive Chapter List */}
              <div className="space-y-2">
                <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider font-mono block border-b border-white/5 pb-1">ÍNDICE DE LA GUÍA</span>
                <div className="space-y-1">
                  {CHAPTERS.map((ch, idx) => (
                    <button
                      key={ch.id}
                      onClick={() => selectChapter(idx)}
                      className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-all select-none cursor-pointer ${
                        currentChapterIndex === idx 
                          ? 'bg-orange-500/10 border-orange-500/40 text-orange-300 shadow-sm' 
                          : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold font-serif">{ch.title}</span>
                        <span className="text-[8px] text-white/30 truncate max-w-[180px]">{ch.subtitle}</span>
                      </div>
                      <span className="text-[8px] font-mono text-white/30 shrink-0">{ch.duration}s</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Play Advice footer */}
            <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
              <div className="flex gap-2 p-2 bg-purple-950/20 border border-purple-500/10 rounded-lg text-[9px] leading-relaxed text-purple-300 font-sans">
                <HelpIcon size={14} className="shrink-0 text-purple-400 mt-0.5 animate-bounce" />
                <span>
                  <strong>Información de Seguridad:</strong> El sistema solo permite un (1) intento oficial por alumno con código QR para registrar la nota final. ¡Usa la sala de práctica para entrenar libremente antes de empezar!
                </span>
              </div>
              
              <button
                onClick={() => { playSound('click'); onClose(); }}
                className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-serif font-black text-[11px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-[0_0_15px_rgba(249,115,22,0.25)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)]"
              >
                <span>¡ENTENDIDO, QUIERO JUGAR!</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
