/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronLeft, ChevronRight, Play, BookOpen, Brain, 
  Settings, Award, Sparkles, AlertCircle, RefreshCw, 
  Gamepad2, Users, Keyboard, CheckCircle2, Copy, Check, 
  Maximize2, Minimize2, Tv, Presentation, ShieldAlert,
  FileText, Download
} from 'lucide-react';
import { MANUAL_TEXT } from './manualText';

interface GamePresentationModalProps {
  onClose: () => void;
}

export default function GamePresentationModal({ onClose }: GamePresentationModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const slides = [
    {
      id: 'slide-cover',
      title: 'Crónicas de Álgebra: El Templo de los Sabios',
      subtitle: 'Revolucionando la Educación Matemática con Videojuegos 3D e IA',
      tag: 'PORTADA',
      content: (
        <div className="flex flex-col items-center justify-center text-center h-full py-6">
          <div className="relative mb-6">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 opacity-75 blur-md animate-pulse"></div>
            <div className="relative bg-slate-950 p-4 rounded-full border border-amber-500/50">
              <Gamepad2 size={48} className="text-amber-400" />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-serif font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 uppercase mb-4 leading-normal">
            Crónicas de Álgebra
          </h1>
          <p className="text-md md:text-xl font-mono text-amber-200 tracking-widest uppercase mb-8">
            El Templo de los Sabios
          </p>

          <div className="max-w-2xl text-slate-300 text-sm md:text-base mb-10 leading-relaxed font-sans px-4">
            Un videojuego educativo de rol y plataformas 3D diseñado para transformar la enseñanza de la jerarquía de operaciones, ecuaciones de primer grado y leyes de exponentes en estudiantes de secundaria.
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 font-mono text-[10px] uppercase font-bold">
              🎮 RPG & Plataformas 3D
            </span>
            <span className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-[10px] uppercase font-bold">
              ✨ IA Generativa (Gemini)
            </span>
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] uppercase font-bold">
              📊 Portal Familiar Firestore
            </span>
          </div>
        </div>
      )
    },
    {
      id: 'slide-challenge',
      title: 'El Desafío Pedagógico',
      subtitle: 'De la Abstracción Tediosa a la Conquista Narrativa',
      tag: 'EL PROBLEMA',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-center py-4">
          <div className="p-5 rounded-xl border border-red-500/20 bg-red-950/10 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert size={24} />
              <h3 className="font-serif font-bold text-lg">Enseñanza Tradicional</h3>
            </div>
            <ul className="space-y-3.5 text-slate-300 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold">❌</span>
                <span><strong>Fórmulas Abstractas:</strong> Los estudiantes aprenden reglas algebraicas de memoria, sin contexto práctico ni motivaciones visuales.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold">❌</span>
                <span><strong>Frustración del Error:</strong> El error se castiga con bajas notas, generando ansiedad matemática y rechazo temprano de las ciencias.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold">❌</span>
                <span><strong>Padres Desconectados:</strong> Los padres no saben en qué temas específicos falla el alumno hasta el reporte final bimestral.</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <Sparkles size={24} className="animate-pulse" />
              <h3 className="font-serif font-bold text-lg">La Solución: Crónicas de Álgebra</h3>
            </div>
            <ul className="space-y-3.5 text-slate-300 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">✨</span>
                <span><strong>Empuñar el Saber:</strong> Las reglas algebraicas son "hechizos" que abren compuertas y desvelan caminos en un templo sagrado.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">✨</span>
                <span><strong>Error como Retroalimentación:</strong> Los fallos disparan explicaciones lúdicas paso a paso, invitando a la iteración inmediata.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">✨</span>
                <span><strong>Puente Digital:</strong> Un reporte en tiempo real impulsado por IA para el Portal Familiar de padres y profesores.</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'slide-mechanics',
      title: 'Mecánicas de Juego y Desafíos',
      subtitle: 'Tres Niveles de Destreza y Pensamiento Abstracto',
      tag: 'JUGABILIDAD',
      content: (
        <div className="space-y-5 py-4">
          <p className="text-slate-300 text-sm text-center max-w-2xl mx-auto leading-relaxed">
            El juego integra acción de plataformas 3D en tercera persona con portales místicos que presentan retos algebraicos adaptados a la currícula escolar de educación secundaria.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-950/5 hover:border-purple-500/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold font-mono text-sm mb-3">
                1
              </div>
              <h4 className="font-serif font-bold text-md text-purple-300 mb-1.5">Jerarquía de Operaciones</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Operaciones combinadas de suma, resta, multiplicación y división. Enseña el uso de paréntesis y el orden correcto de resolución.
              </p>
              <div className="mt-3 font-mono text-[10px] bg-purple-950/40 p-1.5 rounded text-purple-200 text-center">
                Ej: 5 + (3 × 4) = ?
              </div>
            </div>

            <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-950/5 hover:border-orange-500/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold font-mono text-sm mb-3">
                2
              </div>
              <h4 className="font-serif font-bold text-md text-orange-300 mb-1.5">Ecuaciones Lineales</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Búsqueda del valor de la incógnita "x". Permite interiorizar el concepto de equilibrio y balanza en las igualdades matemáticas.
              </p>
              <div className="mt-3 font-mono text-[10px] bg-orange-950/40 p-1.5 rounded text-orange-200 text-center">
                Ej: 3x - 5 = 10  ⇒  x = ?
              </div>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/5 hover:border-amber-500/40 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold font-mono text-sm mb-3">
                3
              </div>
              <h4 className="font-serif font-bold text-md text-amber-300 mb-1.5">Leyes de Exponentes</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multiplicación y división de potencias con la misma base. El estudiante domina el comportamiento místico de las variables y potencias.
              </p>
              <div className="mt-3 font-mono text-[10px] bg-amber-950/40 p-1.5 rounded text-amber-200 text-center">
                Ej: (x⁴ × x³) / x² = ?
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'slide-pedagogy',
      title: 'Diseño Instruccional y Aula',
      subtitle: 'El Flujo de Aprendizaje y Práctica Sin Presión',
      tag: 'PEDAGOGÍA',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-center py-4">
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-amber-300">El Ciclo de Refuerzo Positivo</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-mono text-[10px] text-amber-400">A</div>
                <p className="text-xs text-slate-300"><strong>Desafío de Plataformas:</strong> El juego mantiene al alumno atento e involucrado en la exploración.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-mono text-[10px] text-amber-400">B</div>
                <p className="text-xs text-slate-300"><strong>Enfrentamiento de Portales:</strong> Puzzles matemáticos que requieren concentración y razonamiento activo.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-mono text-[10px] text-amber-400">C</div>
                <p className="text-xs text-slate-300"><strong>Ayuda Inmediata:</strong> Consejos guiados con explicaciones paso a paso si cometen un error.</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-950/10 space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <BookOpen size={24} />
              <h3 className="font-serif font-bold text-lg">Sala de Práctica Libre</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pensada para el trabajo directo en el aula escolar. Los docentes pueden indicar a los estudiantes que ingresen a la **Sala de Práctica** sin necesidad de código QR o de atravesar los retos 3D de plataformas.
            </p>
            <div className="border border-indigo-500/10 bg-black/40 p-3 rounded-lg font-mono text-[11px] text-slate-300">
              <div className="flex justify-between border-b border-indigo-500/10 pb-1.5 mb-1.5 font-bold text-indigo-300">
                <span>Beneficios del Docente</span>
                <span>Impacto</span>
              </div>
              <div>• Asigna tareas específicas por nivel</div>
              <div>• Revisa el historial de intentos en clase</div>
              <div>• Ideal para proyectar y resolver juntos</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'slide-ai',
      title: 'Reporte de IA y Portal de Padres',
      subtitle: 'Analizando el Progreso Académico para Apoyar en el Hogar',
      tag: 'INTELIGENCIA ARTIFICIAL',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-full items-center py-4">
          <div className="md:col-span-3 space-y-4">
            <h3 className="font-serif font-bold text-lg text-emerald-400 flex items-center gap-2">
              <Brain size={20} className="animate-pulse" /> Analítica con Google Gemini
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Cada intento, error y tiempo de respuesta es recopilado. Un modelo avanzado de IA analiza este flujo de datos en tiempo real para generar un reporte psicopedagógico en lenguaje humano y comprensible para padres y profesores.
            </p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>Identificación de errores conceptuales específicos.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>Recomendaciones pedagógicas personalizadas.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>Detección de temas que se facilitan para impulsar el talento.</span>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 p-4 rounded-xl border border-emerald-500/20 bg-slate-900/50 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400 border-b border-white/5 pb-2">
              <span className="font-mono text-emerald-400 font-bold">PORTAL FAMILIAR</span>
              <span className="bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">SINCRONIZADO</span>
            </div>
            
            <div className="space-y-2 font-mono text-[10px]">
              <div className="flex justify-between bg-black/30 p-1.5 rounded">
                <span className="text-slate-400">Efectividad General:</span>
                <span className="text-emerald-400 font-bold">88%</span>
              </div>
              <div className="flex justify-between bg-black/30 p-1.5 rounded">
                <span className="text-slate-400">Tiempo Promedio:</span>
                <span className="text-slate-200">14.2 seg</span>
              </div>
              <div className="bg-black/30 p-2 rounded text-slate-300 leading-normal text-[9.5px]">
                <strong className="text-amber-400 block mb-0.5">💡 Consejo de IA:</strong>
                "Excelente dominio en jerarquía. Presenta ligera duda al despejar restas con signos negativos. Se recomienda repasar balanza de ecuaciones."
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'slide-controls',
      title: 'Guía de Controles de la Crónica',
      subtitle: 'Domina los Controles de tu Personaje Heroico',
      tag: 'CONTROLES',
      content: (
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
              <h4 className="font-serif font-bold text-md text-orange-400 flex items-center gap-2">
                <Keyboard size={18} /> Navegación y Movimiento
              </h4>
              <div className="space-y-2.5 text-xs text-slate-300 font-mono">
                <div className="flex justify-between items-center bg-black/30 p-2 rounded border border-white/5">
                  <span>Mover Personaje:</span>
                  <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-[10px] font-bold">WASD / FLECHAS</span>
                </div>
                <div className="flex justify-between items-center bg-black/30 p-2 rounded border border-white/5">
                  <span>Saltar Abismos:</span>
                  <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-[10px] font-bold">ESPACIO</span>
                </div>
                <div className="flex justify-between items-center bg-black/30 p-2 rounded border border-white/5">
                  <span>Activar Portal:</span>
                  <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-[10px] font-bold">E / CLIC EN PORTAL</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
              <h4 className="font-serif font-bold text-md text-purple-400 flex items-center gap-2">
                <Award size={18} /> Selección de Sagas y Personajes
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>El Guerrero (Fuerza):</strong> Ideal para batallar exponentes. Aplica la fuerza de su espada para quebrar potencias.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">•</span>
                  <span><strong>La Mística (Paz):</strong> Ideal para batallar paréntesis y agrupaciones con templanza mística.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Sonido Envolvente:</strong> Sintoniza con música mística y efectos de victoria para mejorar la concentración en el aula.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'slide-tech',
      title: 'Ficha Técnica de Desarrollo',
      subtitle: 'La Tecnología de Vanguardia Detrás del Videojuego',
      tag: 'FICHA TÉCNICA',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-center py-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
            <h4 className="font-serif font-bold text-md text-amber-400">Infraestructura de Desarrollo</h4>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-300">
              <div className="bg-black/30 p-2 rounded">
                <span className="text-slate-500 block text-[9px]">LENGUAJE</span>
                <strong>TypeScript</strong>
              </div>
              <div className="bg-black/30 p-2 rounded">
                <span className="text-slate-500 block text-[9px]">ENGINE</span>
                <strong>React 18 + Vite</strong>
              </div>
              <div className="bg-black/30 p-2 rounded">
                <span className="text-slate-500 block text-[9px]">3D GRAPHICS</span>
                <strong>Three.js / Canvas</strong>
              </div>
              <div className="bg-black/30 p-2 rounded">
                <span className="text-slate-500 block text-[9px]">ESTILOS</span>
                <strong>Tailwind CSS</strong>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
            <h4 className="font-serif font-bold text-md text-indigo-400">Servicios en la Nube e Inteligencia</h4>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-300">
              <div className="bg-black/30 p-2 rounded col-span-2">
                <span className="text-indigo-400 block text-[9px]">MOTOR COGNITIVO</span>
                <strong>Google Gemini API (Modelos Avanzados de Flash)</strong>
              </div>
              <div className="bg-black/30 p-2 rounded">
                <span className="text-emerald-400 block text-[9px]">PERSISTENCIA</span>
                <strong>Firebase Firestore</strong>
              </div>
              <div className="bg-black/30 p-2 rounded">
                <span className="text-emerald-400 block text-[9px]">AUTENTICACIÓN</span>
                <strong>Códigos QR Estudiante</strong>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'slide-call',
      title: 'Implementación Escolar y Próximos Pasos',
      subtitle: '¡Lleva Crónicas de Álgebra a tu Aula Hoy Mismo!',
      tag: 'CONCLUSIÓN',
      content: (
        <div className="flex flex-col items-center justify-center text-center h-full py-6">
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl max-w-xl mb-6">
            <p className="text-sm font-serif italic text-amber-200">
              "El conocimiento matemático no es un abismo que temer, sino un templo lleno de misterios por conquistar."
            </p>
          </div>

          <h3 className="font-serif font-bold text-xl text-slate-100 mb-3">Guía de Inicio para el Docente</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl text-left text-xs text-slate-300 mb-8">
            <div className="bg-black/30 p-3 rounded-lg border border-white/5">
              <strong className="text-amber-400 block mb-1">1. Generación de QRs:</strong>
              Cada estudiante recibe un código QR personalizado (puede cargarse en el navegador o distribuirse impreso).
            </div>
            <div className="bg-black/30 p-3 rounded-lg border border-white/5">
              <strong className="text-amber-400 block mb-1">2. Tiempo en Clase:</strong>
              Recomienda 15-20 minutos de juego al final de cada tema del nivel correspondiente.
            </div>
            <div className="bg-black/30 p-3 rounded-lg border border-white/5">
              <strong className="text-amber-400 block mb-1">3. Seguimiento Familiar:</strong>
              Los padres consultan el portal usando el código QR para ver el análisis de IA de Gemini y apoyan el rezago.
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 rounded-xl text-white font-serif font-black uppercase text-xs tracking-wider transition-all active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.3)] cursor-pointer"
            >
              ¡Cerrar e Iniciar el Juego!
            </button>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
      playClickSound();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
      playClickSound();
    }
  };

  const playClickSound = () => {
    if (typeof window !== 'undefined' && (window as any).playClickSound) {
      (window as any).playClickSound();
    }
  };

  // Enable arrow key and escape key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    playClickSound();
  };

  // Copy PowerPoint Structured Outline to Clipboard
  const handleCopyOutline = () => {
    const outlineText = `=========================================
PRESENTACIÓN DE DIAPOSITIVAS: CRÓNICAS DE ÁLGEBRA
=========================================

DIAPOSITIVA 1: Portada
-----------------------------------------
• Título: Crónicas de Álgebra: El Templo de los Sabios
• Subtítulo: Revolucionando la Educación Matemática con Videojuegos 3D e IA
• Resumen: Un videojuego de rol y plataformas 3D diseñado para transformar la enseñanza de la jerarquía de operaciones, ecuaciones de primer grado y leyes de exponentes en estudiantes de secundaria.
• Componentes Clave: RPG de Acción, Inteligencia Artificial de Google Gemini y Persistencia en la Nube con Firebase Firestore.

DIAPOSITIVA 2: El Desafío Pedagógico (El Problema)
-----------------------------------------
• Enfoque de Enseñanza Tradicional (El Desafío):
  - Fórmulas Abstractas: Los estudiantes memorizan reglas sin contexto práctico ni motivaciones visuales.
  - Frustración del Error: El error se penaliza, lo que genera ansiedad matemática y rechazo de la materia.
  - Padres Desconectados: Retraso de reportes de rezago académico hasta el final de cada bimestre.
• Solución con "Crónicas de Álgebra":
  - Empuñar el Saber: Las reglas matemáticas son "hechizos" mágicos que abren compuertas y desvelan caminos.
  - Error como Retroalimentación: Los fallos disparan explicaciones detalladas y lúdicas al instante.
  - Puente Digital: Reportes automatizados de desempeño en tiempo real enviados al Portal de Padres.

DIAPOSITIVA 3: Mecánicas de Juego y Desafíos
-----------------------------------------
• Resumen de Jugabilidad: Combina la exploración en tercera persona en un entorno 3D místico con la resolución interactiva de algebra.
• Tres Niveles Curriculares:
  - Nivel 1: Jerarquía de Operaciones. Operaciones combinadas, orden correcto de operaciones y uso de paréntesis.
  - Nivel 2: Ecuaciones de Primer Grado. Búsqueda de incógnita "x", concepto de balanza e igualdad matemática.
  - Nivel 3: Leyes de los Exponentes. Multiplicación/división de potencias con bases iguales y variables complejas.

DIAPOSITIVA 4: Diseño Instruccional y Trabajo en Aula
-----------------------------------------
• El Ciclo de Aprendizaje:
  - Desafío de Plataformas: Mantiene al estudiante en un estado de flujo, alerta y motivado en el aula.
  - Portales de Sabiduría: Ejercitación activa bajo una envoltura narrativa y heroica.
  - Consejos de IA: Explicaciones directas paso a paso que mitigan la frustración.
• Sala de Práctica Libre (Especial para Docentes):
  - Pensado para la computación en el aula de clases.
  - Permite a los profesores asignar ejercicios o niveles específicos sin necesidad de registrarse con código QR ni jugar las plataformas 3D.
  - Permite resolución grupal en proyector.

DIAPOSITIVA 5: Reporte de IA y Portal de Padres
-----------------------------------------
• Analítica con Google Gemini:
  - Analiza de forma inteligente el flujo de respuestas incorrectas, tiempos promedio de solución e historial.
  - Formula recomendaciones psicopedagógicas personalizadas en lenguaje claro.
• Sincronización en la Nube (Firebase):
  - Guarda los reportes automáticamente bajo la cuenta del estudiante.
  - Provee a los padres un canal de comunicación místico para estar al tanto de los aciertos y bloqueos de sus hijos al instante.

DIAPOSITIVA 6: Guía de Controles Rápidos
-----------------------------------------
• Navegación por el Templo:
  - Moverse: Teclas WASD o Flechas de teclado.
  - Saltar: Barra Espaciadora.
  - Interactuar/Abrir Portal: Tecla 'E' o Clic de Mouse.
• Selección de Héroes:
  - El Guerrero (enfocado en Exponentes y Poder de Espada).
  - La Mística (enfocada en Paréntesis y Calma Espiritual).

DIAPOSITIVA 7: Implementación Escolar
-----------------------------------------
• Plan de Inicio para Docentes:
  1. Descarga e imprime el código QR único para los estudiantes de tu grupo.
  2. Dedica de 15 a 20 minutos de juego al finalizar un bloque temático en clase.
  3. Promueve que los estudiantes revisen su Portal de Padres junto a sus familiares para planear el estudio semanal.
`;

    navigator.clipboard.writeText(outlineText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        console.error('Error al copiar el texto: ', err);
      });
    
    playClickSound();
  };

  const handleDownloadManual = () => {
    const blob = new Blob([MANUAL_TEXT], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'MANUAL_DE_USUARIO_CRONICAS.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
    playClickSound();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-3 sm:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`relative ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-4xl h-[90vh] rounded-2xl'
        } bg-slate-950 border border-amber-500/30 flex flex-col justify-between overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)]`}
        id="game-presentation-container"
      >
        {/* Background mistic glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-to-t from-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Slide Header */}
        <div className="relative px-4 sm:px-6 py-3.5 border-b border-white/10 bg-black/30 flex items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-2">
            <Presentation size={18} className="text-amber-400 animate-pulse" />
            <div>
              <span className="font-mono text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded tracking-wider uppercase">
                {slides[currentSlide].tag}
              </span>
              <span className="text-white/40 text-[10px] ml-2 font-mono">Diapositiva {currentSlide + 1} de {slides.length}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download Manual Button */}
            <button
              onClick={handleDownloadManual}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs font-mono font-bold text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all cursor-pointer"
              title="Descargar Manual de Usuario Completo para NotebookLM"
              id="btn-download-manual"
            >
              {downloaded ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-emerald-400 font-bold">¡Descargado!</span>
                </>
              ) : (
                <>
                  <Download size={12} className="animate-bounce" />
                  <span>Descargar Manual (.md)</span>
                </>
              )}
            </button>

            {/* Copy Outline Button */}
            <button
              onClick={handleCopyOutline}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs font-mono font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 rounded-lg transition-all cursor-pointer"
              title="Copiar esquema para hacer un PowerPoint real"
              id="btn-copy-outline"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-emerald-400 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copiar Esquema PPT</span>
                </>
              )}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              title={isFullscreen ? "Minimizar" : "Pantalla Completa"}
              id="btn-toggle-fullscreen"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 transition-all cursor-pointer"
              title="Cerrar Presentación"
              id="btn-close-presentation"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Slide Content Area */}
        <div className="relative flex-1 overflow-y-auto px-4 sm:px-10 py-6 flex flex-col justify-center">
          <div className="max-w-3xl mx-auto w-full">
            {/* Subtitle / Topic indicator */}
            {currentSlide > 0 && (
              <div className="text-center mb-2">
                <p className="text-amber-400/90 font-mono text-[10px] sm:text-xs uppercase tracking-widest font-black">
                  {slides[currentSlide].subtitle}
                </p>
                <h2 className="text-white font-serif font-black tracking-wide text-lg sm:text-2xl mt-1 uppercase border-b border-white/5 pb-2">
                  {slides[currentSlide].title}
                </h2>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: direction * 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 50 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="w-full text-left"
              >
                {slides[currentSlide].content}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Slide Footer Navigation */}
        <div className="px-4 sm:px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between gap-4 z-10">
          <div className="hidden sm:block text-[10px] font-mono text-white/30">
            Pista: Usa las teclas <kbd className="bg-white/5 px-1 rounded text-white/60">←</kbd> y <kbd className="bg-white/5 px-1 rounded text-white/60">→</kbd> para navegar
          </div>

          {/* Slide dots indicators */}
          <div className="flex gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentSlide ? 1 : -1);
                  setCurrentSlide(idx);
                  playClickSound();
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === idx 
                    ? 'bg-amber-400 w-5 shadow-[0_0_8px_rgba(245,158,11,0.6)]' 
                    : 'bg-white/20 hover:bg-white/40'
                }`}
                id={`dot-slide-${idx}`}
                title={`Ir a diapositiva ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              id="btn-prev-slide"
            >
              <ChevronLeft size={14} />
              <span>Anterior</span>
            </button>
            <button
              onClick={handleNext}
              disabled={currentSlide === slides.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-xs text-black font-serif font-black uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer"
              id="btn-next-slide"
            >
              <span>Siguiente</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
