/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useGameStore, LEVELS } from '../../store';
import { Check, X, Lightbulb, Clock, BookOpen, ArrowRight } from 'lucide-react';

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
      return `¡Sustituir es como cambiar piezas!\n\nEn la expresión "${expr}", cambia cada letra "${varName}" por el número (${varVal}):\n\nResolvemos paso a paso:\n1. Reemplazar: cambia la letra por el número.\n2. Multiplicar primero (si la letra está junto a un número, significa multiplicación).\n3. Hacer sumas o restas al final.\n\nResultado correcto: ${puzzle.c}`;
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

export default function PuzzleOverlay() {
  const { currentLevel, score, solvePuzzle, activePuzzles, recordAttempt } = useGameStore();
  const level = LEVELS[currentLevel];
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  
  // Use the puzzle according to current progress (score) from the dynamically selected active puzzles
  const puzzle = activePuzzles && activePuzzles.length > 0
    ? activePuzzles[Math.min(score, activePuzzles.length - 1)]
    : level.puzzles[Math.min(score, level.puzzles.length - 1)]; 
  
  const maxTime = currentLevel === 4 ? 240 : 150; // 4 minutes (240s) for level 5, 2.5 minutes (150s) for others
  const [result, setResult] = useState<'none' | 'correct' | 'wrong'>('none');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(maxTime);

  // Educational State Variables
  const [hasUsedHint, setHasUsedHint] = useState(false);
  const [hasUsedExtraTime, setHasUsedExtraTime] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([]);

  useEffect(() => {
    if (result !== 'none') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResult('wrong');
          recordAttempt(puzzle.q, false, maxTime);
          setShowExplanation(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [result, puzzle, maxTime, recordAttempt]);

  const handleAnswer = (ans: string, idx: number) => {
    if (result !== 'none') return;
    
    setSelectedIdx(idx);
    const isCorrect = ans === puzzle.c;
    setResult(isCorrect ? 'correct' : 'wrong');
    
    // Record attempt for stats tracking
    const duration = Math.max(1, maxTime - timeLeft);
    recordAttempt(puzzle.q, isCorrect, duration);
    
    if (isCorrect) {
      setTimeout(() => {
        solvePuzzle(true);
      }, 900);
    } else {
      setShowExplanation(true);
    }
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
    setShowExplanation(true);
  };

  const useExtraTime = () => {
    if (hasUsedExtraTime || result !== 'none') return;
    setTimeLeft((prev) => prev + 60);
    setHasUsedExtraTime(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[400] flex items-center justify-center p-3 sm:p-8 bg-black/95 ${
        graphicsQuality === 'high' ? 'backdrop-blur-xl' : ''
      } border-2 sm:border-4 border-orange-600/20 pointer-events-auto overflow-y-auto`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0a0a0a] border-[3px] sm:border-[10px] border-[#1a1c2a] rounded-2xl sm:rounded-[2.5rem] p-3.5 sm:p-8 relative shadow-[0_0_80px_rgba(255,165,0,0.15)] overflow-hidden my-auto"
      >
        {/* Anime-Style Gradient Accents */}
        <div className="absolute top-0 left-0 w-full h-1 sm:h-2 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50 shadow-[0_0_20px_rgba(255,165,0,1)]" />
        <div className="absolute top-0 right-0 p-2 sm:p-8 opacity-5 select-none pointer-events-none text-orange-500 font-serif text-5xl sm:text-9xl">
          ∑ π Ω
        </div>

        <div className="relative z-10 space-y-3 sm:space-y-4 flex flex-col items-center">
          <header className="space-y-1 text-center animate-fade-in">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="px-2 py-0.5 bg-orange-600/20 text-orange-500 rounded-full text-[7px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.4em] uppercase"
            >
              Enigma Sagrado {score + 1}/5
            </motion.div>
            <h2 className="text-white font-serif text-sm sm:text-xl font-black tracking-tighter uppercase italic px-2">
              — {level.name.toUpperCase()} —
            </h2>
          </header>

          {/* Timer Display */}
          <div className="w-full flex flex-col items-center space-y-1 sm:space-y-2 px-2">
            <div className="flex items-center gap-1.5 font-mono text-xs sm:text-base font-black">
              <span className={timeLeft <= 30 ? "text-red-500 animate-pulse font-bold" : "text-orange-400"}>
                ⏱️ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
              {timeLeft <= 30 && (
                <span className="text-[10px] sm:text-xs text-red-500 font-bold uppercase tracking-wider animate-pulse">
                  ¡Rápido!
                </span>
              )}
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full h-1.5 sm:h-2.5 bg-white/5 rounded-full overflow-hidden relative border border-white/10">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeLeft <= 30 
                    ? "bg-gradient-to-r from-red-500 to-red-600 shadow-[0_0_10px_#ef4444]" 
                    : "bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_10px_#f97316]"
                }`}
                style={{ width: `${(timeLeft / maxTime) * 100}%` }}
              />
            </div>
          </div>

          {/* Power-up Buttons */}
          {result === 'none' && (
            <div className="w-full flex justify-center gap-2 sm:gap-4 px-2 py-0.5">
              <button
                onClick={useHint}
                disabled={hasUsedHint}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[9px] sm:text-xs font-black transition-all border cursor-pointer select-none ${
                  hasUsedHint
                    ? "bg-gray-500/5 border-gray-500/10 text-gray-500 cursor-not-allowed opacity-50"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
                }`}
              >
                <Lightbulb size={12} className={hasUsedHint ? "" : "animate-pulse"} />
                <span>💡 Ver Pista {hasUsedHint ? "(Usada)" : ""}</span>
              </button>
              <button
                onClick={useExtraTime}
                disabled={hasUsedExtraTime}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[9px] sm:text-xs font-black transition-all border cursor-pointer select-none ${
                  hasUsedExtraTime
                    ? "bg-gray-500/5 border-gray-500/10 text-gray-500 cursor-not-allowed opacity-50"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 active:scale-95 shadow-[0_0_10px_rgba(59,130,246,0.05)]"
                }`}
              >
                <Clock size={12} />
                <span>⏱️ +60s Extra {hasUsedExtraTime ? "(Usado)" : ""}</span>
              </button>
            </div>
          )}

          {/* Question Box */}
          <div className="bg-white/[0.03] border border-white/10 rounded-lg sm:rounded-2xl p-3 sm:p-5 w-full flex items-center justify-center shadow-inner group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <motion.span 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`text-base sm:text-2xl font-mono font-black text-center ${
                timeLeft === 0 ? "text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse" : "text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
              }`}
            >
              {timeLeft === 0 ? "¡TIEMPO AGOTADO!" : puzzle.q}
            </motion.span>
          </div>

          {/* Answers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5 w-full">
            {puzzle.a.map((ans, i) => {
              const isEliminated = eliminatedIndices.includes(i);
              return (
                <button
                  key={i}
                  disabled={result !== 'none' || isEliminated}
                  onClick={() => handleAnswer(ans, i)}
                  className={`
                    p-2 sm:p-3 rounded-lg sm:rounded-xl border sm:border-2 font-mono text-xs sm:text-base font-black transition-all transform active:scale-95 relative overflow-hidden group cursor-pointer
                    ${isEliminated ? 'opacity-10 border-white/5 text-gray-700 line-through scale-95 cursor-not-allowed pointer-events-none' : ''}
                    ${result === 'none' && !isEliminated ? 'bg-white/5 border-white/15 text-gray-300 hover:border-orange-500 hover:bg-orange-500/10 hover:text-white' : ''}
                    ${result === 'correct' && ans === puzzle.c ? 'bg-green-600 border-green-400 text-white scale-[1.01] shadow-[0_0_20px_rgba(34,197,94,0.4)]' : ''}
                    ${result === 'wrong' && i === selectedIdx ? 'bg-red-600 border-red-400 text-white animate-shake shadow-[0_0_20px_rgba(220,38,38,0.4)]' : ''}
                    ${result !== 'none' && ans === puzzle.c && result === 'wrong' ? 'border-green-500 ring-1 ring-green-500/50' : ''}
                    ${result !== 'none' && ans !== puzzle.c && i !== selectedIdx ? 'opacity-20 grayscale scale-95' : ''}
                  `}
                >
                  <div className="flex items-center justify-between gap-1 relative z-10 px-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] sm:text-[10px] text-white/40 uppercase font-black tracking-widest leading-none">R:</span>
                      <span>{ans}</span>
                    </div>
                    {result === 'correct' && ans === puzzle.c && <Check size={14} className="sm:size-4 text-white" />}
                    {result === 'wrong' && i === selectedIdx && <X size={14} className="sm:size-4 text-white" />}
                  </div>
                  {result === 'none' && !isEliminated && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 transform translate-y-full group-hover:translate-y-0 transition-transform" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Area */}
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full border border-orange-500/30 bg-orange-950/20 rounded-xl p-3 sm:p-4 mt-1 text-left"
            >
              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs sm:text-sm mb-1.5">
                <BookOpen size={14} className="sm:size-4 text-orange-400 animate-bounce" />
                <span>Explicación didáctica:</span>
              </div>
              <p className="text-gray-300 text-[10px] sm:text-xs font-medium leading-relaxed whitespace-pre-line font-mono bg-black/40 p-2.5 rounded-lg border border-white/5">
                {getExplanation(puzzle, currentLevel)}
              </p>

              {/* Confirm / Continue Button on incorrect answer or timeout */}
              {result === 'wrong' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => solvePuzzle(false)}
                  className="w-full mt-3 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-mono text-xs sm:text-sm font-black tracking-wider uppercase shadow-[0_0_15px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Entendido, Continuar</span>
                  <ArrowRight size={14} className="sm:size-4 text-white" />
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
