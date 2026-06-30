/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore, LEVELS, EXERCISE_POOLS } from '../../store';
import { Check, X, Lightbulb, BookOpen, ArrowRight, Home, Flame, Trophy, Star } from 'lucide-react';

interface Puzzle {
  q: string;
  a: string[];
  c: string;
}

function getExplanation(puzzle: Puzzle, currentLevel: number): string {
  // Level 1: Potencias (currentLevel === 0)
  if (currentLevel === 0) {
    if (puzzle.q.includes('³')) {
      const isNegativeGrouped = puzzle.q.startsWith('(-');
      const isNegative = puzzle.q.startsWith('-');
      const match = puzzle.q.match(/\d+/);
      const val = match ? match[0] : '3';
      if (isNegativeGrouped) {
        return `Recuerda: (-${val})³ significa multiplicar la base con todo y su signo tres veces:\n\n(-${val}) × (-${val}) × (-${val}) = ${puzzle.c}\n\nMultiplicación de signos paso a paso:\n1) (-${val}) × (-${val}) = +${Number(val)*Number(val)}\n2) (+${Number(val)*Number(val)}) × (-${val}) = ${puzzle.c}\n\n¡Por eso el resultado final es negativo!`;
      } else if (isNegative) {
        return `Recuerda: -${val}³ tiene el signo negativo afuera de la potencia. El exponente 3 solo afecta al número:\n\n-( ${val} × ${val} × ${val} ) = -( ${Number(val)*Number(val)*Number(val)} ) = ${puzzle.c}\n\n¡Al no tener paréntesis, el signo menos se queda igual al final!`;
      } else {
        return `Recuerda: ${val}³ es simplemente elevar al cubo, es decir, multiplicar el número tres veces por sí mismo:\n\n${val} × ${val} × ${val} = ${puzzle.c}`;
      }
    } else if (puzzle.q.includes('²')) {
      const isNegativeGrouped = puzzle.q.startsWith('(-');
      const isNegative = puzzle.q.startsWith('-');
      const match = puzzle.q.match(/\d+/);
      const val = match ? match[0] : '4';
      if (isNegativeGrouped) {
        return `Recuerda: (-${val})² significa multiplicar la base completa, incluyendo su signo negativo, por sí misma:\n\n(-${val}) × (-${val}) = ${puzzle.c}\n\n¡Menos por menos siempre da MÁS! Todo número negativo elevado a una potencia par da un resultado positivo.`;
      } else if (isNegative) {
        return `Recuerda: Según lo aprendido en nuestra clase, calculamos -${val}² multiplicando la base negativa por sí misma completo:\n\n(-${val}) × (-${val}) = ${puzzle.c}\n\n¡Menos por menos siempre da MÁS! Por lo tanto, el resultado final es positivo.`;
      } else {
        return `Recuerda: ${val}² es elevar al cuadrado, es decir, multiplicar el número por sí mismo:\n\n${val} × ${val} = ${puzzle.c}`;
      }
    }
  }

  // Level 2: Valor numérico 1 variable (currentLevel === 1)
  if (currentLevel === 1) {
    const matchVar = puzzle.q.match(/([a-zA-Z])\s*=\s*(-?\d+)/);
    const formulaMatch = puzzle.q.match(/calcular\s+(.+)$/i);
    if (matchVar && formulaMatch) {
      const varName = matchVar[1];
      const varVal = matchVar[2];
      const expr = formulaMatch[1];
      return `¡Sustituir es como cambiar piezas de un rompecabezas!\n\nEn la expresión "${expr}", cambia cada letra "${varName}" por el número (${varVal}):\n\nResolvemos paso a paso:\n1. Reemplazar: cambia la letra por el número.\n2. Multiplicar primero (si la letra está junto a un número, significa multiplicación).\n3. Hacer sumas o restas al final.\n\nResultado correcto: ${puzzle.c}`;
    }
  }

  // Level 3: Valor numérico 2 variables (currentLevel === 2)
  if (currentLevel === 2) {
    const vars: { name: string, val: string }[] = [];
    const varMatches = puzzle.q.matchAll(/([a-zA-Z])\s*=\s*(-?\d+)/g);
    for (const m of varMatches) {
      vars.push({ name: m[1], val: m[2] });
    }
    const formulaMatch = puzzle.q.match(/calcular\s+(.+)$/i);
    const expr = formulaMatch ? formulaMatch[1] : '';
    
    let replacementTip = '';
    if (vars.length > 0) {
      replacementTip = vars.map(v => `Reemplaza '${v.name}' por (${v.val})`).join(',\n') + ` en la fórmula "${expr}".`;
    }

    return `¡Sustitución doble!\n\n${replacementTip}\n\nSigue estos consejos clave:\n- Si sustituyes un número negativo, ponlo entre paréntesis antes de elevarlo al cuadrado, ej. (${vars[0]?.val || '-2'})².\n- Haz primero las potencias y multiplicaciones, y luego suma o resta los resultados.\n\nResultado correcto: ${puzzle.c}`;
  }

  // Level 4: Términos semejantes (currentLevel === 3)
  if (currentLevel === 3) {
    return `¡Agrupemos clanes de términos semejantes!\n\nLos términos semejantes son aquellos que tienen exactamente las mismas letras y exponentes.\n\nSuma o resta todos los números que acompañan a la letra x.\nHaz lo mismo por separado para el clan y o los números solos.\n\nResultado correcto agrupado: ${puzzle.c}`;
  }

  // Level 5: Signos de agrupación (currentLevel === 4)
  if (currentLevel === 4) {
    return `¡Cuidado con los signos de agrupación!\n\nReglas de oro para resolver:\n1. Empieza eliminando los paréntesis () desde adentro.\n2. Sigue con los corchetes [] y luego las llaves {}.\n3. ¡ATENCIÓN! Si hay un signo MENOS (-) justo antes de un paréntesis, al quitar el paréntesis debes CAMBIAR el signo de todos los términos que estaban adentro de él.\n\nResultado correcto paso a paso: ${puzzle.c}`;
  }

  return `Resuelve la expresión algebraica paso a paso respetando la ley de signos y la jerarquía de operaciones.\n\nResultado correcto: ${puzzle.c}`;
}

export default function PracticeOverlay() {
  const { currentLevel, setPhase, activePuzzles } = useGameStore();
  const level = LEVELS[currentLevel];
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [result, setResult] = useState<'none' | 'correct' | 'wrong'>('none');
  const [showExplanation, setShowExplanation] = useState(false);
  const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([]);
  const [hasUsedHint, setHasUsedHint] = useState(false);

  // Get current puzzle safely
  const currentPool = activePuzzles && activePuzzles.length > 0 ? activePuzzles : EXERCISE_POOLS[currentLevel];
  const puzzle = currentPool[currentIndex % currentPool.length];

  const handleAnswer = (ans: string, idx: number) => {
    if (result !== 'none') return;
    
    setSelectedIdx(idx);
    const isCorrect = ans === puzzle.c;
    setResult(isCorrect ? 'correct' : 'wrong');
    setShowExplanation(true);
    
    if (isCorrect) {
      setSolvedCount((p) => p + 1);
      setStreak((p) => {
        const next = p + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    setSelectedIdx(null);
    setResult('none');
    setShowExplanation(false);
    setEliminatedIndices([]);
    setHasUsedHint(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const useHint = () => {
    if (hasUsedHint || result !== 'none') return;
    
    // Find all indices that are incorrect
    const incorrectIndices: number[] = [];
    puzzle.a.forEach((ans, i) => {
      if (ans !== puzzle.c) {
        incorrectIndices.push(i);
      }
    });

    // Shuffle and pick 2 to eliminate
    const shuffled = [...incorrectIndices].sort(() => Math.random() - 0.5);
    const toEliminate = shuffled.slice(0, 2);
    
    setEliminatedIndices(toEliminate);
    setHasUsedHint(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[400] flex items-center justify-center p-3 sm:p-8 bg-[#05060b]/98 ${
        graphicsQuality === 'high' ? 'backdrop-blur-xl' : ''
      } border-2 sm:border-4 border-amber-500/25 pointer-events-auto overflow-y-auto`}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-[#08090f] border-[3px] sm:border-[8px] border-[#131522] rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 relative shadow-[0_0_100px_rgba(245,158,11,0.15)] overflow-hidden my-auto"
      >
        {/* Design Accents */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-80" />
        <div className="absolute top-0 right-0 p-4 opacity-5 select-none pointer-events-none text-amber-500 font-serif text-8xl">
          α β γ
        </div>

        <div className="relative z-10 space-y-4 flex flex-col items-center">
          {/* Header */}
          <header className="w-full flex justify-between items-center pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 text-xs font-black uppercase tracking-wider font-mono">
                Sala de Práctica
              </span>
              <span className="text-white/60 font-mono text-[10px] sm:text-xs">
                {level.name}
              </span>
            </div>
            
            <button
              onClick={() => setPhase('start')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 active:scale-95 transition-all text-[10px] sm:text-xs font-mono font-bold cursor-pointer"
            >
              <Home size={12} />
              <span>Salir al Templo</span>
            </button>
          </header>

          {/* Stats Bar */}
          <div className="w-full grid grid-cols-3 gap-2 py-1 px-1 bg-white/[0.02] border border-white/5 rounded-xl text-center">
            <div className="space-y-0.5">
              <span className="text-[7.5px] uppercase tracking-wider text-white/40 block font-bold">Resueltos</span>
              <span className="text-white font-mono text-xs sm:text-sm font-black flex items-center justify-center gap-1">
                <Check size={12} className="text-green-500" />
                {solvedCount}
              </span>
            </div>
            
            <div className="space-y-0.5 relative group">
              <span className="text-[7.5px] uppercase tracking-wider text-amber-400 block font-bold flex items-center justify-center gap-1 animate-pulse">
                <Flame size={10} className="text-amber-500 fill-amber-500" />
                Racha Activa
              </span>
              <span className="text-amber-400 font-mono text-xs sm:text-sm font-black flex items-center justify-center gap-1">
                {streak}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[7.5px] uppercase tracking-wider text-white/40 block font-bold">Mejor Racha</span>
              <span className="text-yellow-400 font-mono text-xs sm:text-sm font-black flex items-center justify-center gap-1">
                <Trophy size={12} className="text-yellow-500" />
                {maxStreak}
              </span>
            </div>
          </div>

          {/* Practice Motivation text */}
          <div className="text-center">
            <p className="text-[8.5px] sm:text-[10.5px] text-white/50 italic max-w-md mx-auto">
              "Aquí puedes equivocarte las veces que quieras. Cada error es una llave secreta que te enseña el camino."
            </p>
          </div>

          {/* Question Box */}
          <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/15 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
            <div className="absolute top-2 left-2 text-[8px] font-mono text-white/20 uppercase font-bold">
              Pregunta de Entrenamiento
            </div>
            <motion.span 
              key={puzzle.q}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-lg sm:text-3xl font-mono font-black text-center text-white drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] mt-2"
            >
              {puzzle.q}
            </motion.span>
          </div>

          {/* Help Actions */}
          {result === 'none' && (
            <div className="w-full flex justify-end px-1">
              <button
                onClick={useHint}
                disabled={hasUsedHint}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[9px] sm:text-xs font-black transition-all border cursor-pointer select-none ${
                  hasUsedHint
                    ? "bg-gray-500/5 border-gray-500/10 text-gray-500 cursor-not-allowed opacity-40"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 active:scale-95"
                }`}
              >
                <Lightbulb size={12} className={hasUsedHint ? "" : "animate-pulse"} />
                <span>💡 Descartar dos alternativas {hasUsedHint ? "(Usado)" : ""}</span>
              </button>
            </div>
          )}

          {/* Answers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {puzzle.a.map((ans, i) => {
              const isEliminated = eliminatedIndices.includes(i);
              return (
                <button
                  key={i}
                  disabled={result !== 'none' || isEliminated}
                  onClick={() => handleAnswer(ans, i)}
                  className={`
                    p-3 rounded-xl border sm:border-2 font-mono text-xs sm:text-base font-black transition-all transform active:scale-95 relative overflow-hidden group cursor-pointer
                    ${isEliminated ? 'opacity-10 border-white/5 text-gray-700 line-through scale-95 cursor-not-allowed pointer-events-none' : ''}
                    ${result === 'none' && !isEliminated ? 'bg-white/5 border-white/10 text-gray-300 hover:border-amber-500 hover:bg-amber-500/10 hover:text-white' : ''}
                    ${result === 'correct' && ans === puzzle.c ? 'bg-green-600 border-green-400 text-white scale-[1.01] shadow-[0_0_20px_rgba(34,197,94,0.35)]' : ''}
                    ${result === 'wrong' && i === selectedIdx ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.35)]' : ''}
                    ${result !== 'none' && ans === puzzle.c && result === 'wrong' ? 'border-green-500 ring-1 ring-green-500/50' : ''}
                    ${result !== 'none' && ans !== puzzle.c && i !== selectedIdx ? 'opacity-20 grayscale scale-95' : ''}
                  `}
                >
                  <div className="flex items-center justify-between gap-1 relative z-10 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] sm:text-[10px] text-white/30 uppercase font-black tracking-widest leading-none">R:</span>
                      <span>{ans}</span>
                    </div>
                    {result === 'correct' && ans === puzzle.c && <Check size={14} className="text-white animate-bounce" />}
                    {result === 'wrong' && i === selectedIdx && <X size={14} className="text-white" />}
                  </div>
                  {result === 'none' && !isEliminated && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 transform translate-y-full group-hover:translate-y-0 transition-transform" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Area */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="w-full border border-amber-500/30 bg-amber-950/10 rounded-xl p-3 sm:p-4 mt-1 text-left space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
                    <BookOpen size={14} className="text-amber-400" />
                    <span>Teoría y paso a paso didáctico:</span>
                  </div>
                  
                  {result === 'correct' ? (
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 font-black flex items-center gap-1">
                      <Star size={10} className="fill-green-400" />
                      ¡RESPUESTA CORRECTA!
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 font-black">
                      ¡Vuelve a intentarlo en la siguiente!
                    </span>
                  )}
                </div>

                <p className="text-gray-300 text-[10px] sm:text-xs font-medium leading-relaxed whitespace-pre-line font-mono bg-black/60 p-3 rounded-lg border border-white/5">
                  {getExplanation(puzzle, currentLevel)}
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-mono text-xs sm:text-sm font-black tracking-wider uppercase shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Siguiente Ejercicio</span>
                  <ArrowRight size={14} className="text-white" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
