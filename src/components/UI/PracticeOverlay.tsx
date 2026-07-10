/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore, LEVELS, EXERCISE_POOLS } from '../../store';
import { 
  Check, X, Lightbulb, BookOpen, ArrowRight, Home, 
  Flame, Trophy, Star, Brain, Sparkles, AlertCircle, RefreshCw 
} from 'lucide-react';

interface Puzzle {
  q: string;
  a: string[];
  c: string;
}

export interface SubcategoryDetails {
  name: string;
  tip: string;
  id: string;
}

export function getPuzzleSubcategory(q: string, levelIndex: number): SubcategoryDetails {
  if (levelIndex === 0) {
    if (q.includes('²')) {
      if (q.startsWith('(-')) {
        return {
          id: 'pot_sq_neg_paren',
          name: 'Cuadrados con Base Negativa entre Paréntesis',
          tip: '¡Recuerda que todo número negativo elevado al cuadrado (par) con paréntesis da POSITIVO! P. ej. (-3) × (-3) = +9.'
        };
      } else if (q.startsWith('-')) {
        return {
          id: 'pot_sq_neg_noparen',
          name: 'Cuadrados con Signo Negativo sin Paréntesis',
          tip: '¡Cuidado! Si no hay paréntesis, el signo menos (-) se queda afuera y no se eleva. P. ej. -3² = -(3 × 3) = -9.'
        };
      } else {
        return {
          id: 'pot_sq_pos',
          name: 'Cuadrados de Números Positivos',
          tip: 'Es muy sencillo, solo multiplica el número por sí mismo una vez. P. ej. 4² = 4 × 4 = 16.'
        };
      }
    } else if (q.includes('³')) {
      if (q.startsWith('(-')) {
        return {
          id: 'pot_cb_neg_paren',
          name: 'Cubos con Base Negativa entre Paréntesis',
          tip: 'Un número negativo elevado al cubo (impar) con paréntesis conserva su signo negativo. P. ej. (-2)³ = (-2) × (-2) × (-2) = -8.'
        };
      } else if (q.startsWith('-')) {
        return {
          id: 'pot_cb_neg_noparen',
          name: 'Cubos con Signo Negativo sin Paréntesis',
          tip: 'Al no tener paréntesis, el signo menos se queda afuera. Al ser impar, de todas formas el resultado es negativo. P. ej. -2³ = -8.'
        };
      } else {
        return {
          id: 'pot_cb_pos',
          name: 'Cubos de Números Positivos',
          tip: 'Multiplica el número por sí mismo tres veces. P. ej. 3³ = 3 × 3 × 3 = 27.'
        };
      }
    }
  }

  if (levelIndex === 1) {
    if (q.includes('/')) {
      return {
        id: 'val1_div',
        name: 'Evaluación con Divisiones o Fracciones',
        tip: 'Recuerda hacer primero la división (p. ej. y/2) antes de sumar o restar el resto de la expresión.'
      };
    } else if (q.includes('²') || q.includes('³')) {
      return {
        id: 'val1_power',
        name: 'Evaluación de Variables con Potencias',
        tip: 'Primero eleva el valor de la variable a la potencia indicada, y luego realiza las multiplicaciones, sumas o restas.'
      };
    } else if (q.includes('=-')) {
      return {
        id: 'val1_neg',
        name: 'Sustitución de Variables con Valores Negativos',
        tip: 'Al multiplicar un número por un valor negativo, recuerda la ley de signos: más por menos es menos, y menos por menos es más.'
      };
    } else {
      return {
        id: 'val1_simple',
        name: 'Evaluación Lineal Simple de 1 Variable',
        tip: 'Reemplaza la letra por el número. Recuerda que si el número está pegado a la letra, se están multiplicando.'
      };
    }
  }

  if (levelIndex === 2) {
    if (q.includes('²') || q.includes('³')) {
      return {
        id: 'val2_power',
        name: 'Sustitución con Exponentes (Dos Variables)',
        tip: 'Si una de las variables tiene exponente, haz esa operación primero. ¡Ojo con el signo si la base es negativa!'
      };
    } else if (q.includes('/') || q.includes('ab') || q.includes('xy')) {
      return {
        id: 'val2_mult_div',
        name: 'Multiplicación o División de Dos Variables',
        tip: 'Para "xy" o "ab", multiplica los dos valores sustituidos directamente. Aplica la ley de signos con cuidado.'
      };
    } else if (q.includes('=-') && (q.match(/=-/g) || []).length > 1) {
      return {
        id: 'val2_double_neg',
        name: 'Sustitución con Múltiples Valores Negativos',
        tip: 'Ambas variables son negativas. Pon paréntesis al reemplazarlas para no equivocarte con los signos continuos.'
      };
    } else {
      return {
        id: 'val2_simple',
        name: 'Evaluación Lineal con Dos Variables',
        tip: 'Sustituye ordenadamente cada letra en su lugar y opera respetando la jerarquía: primero multiplicaciones, luego sumas/restas.'
      };
    }
  }

  if (levelIndex === 3) {
    if (q.includes('²') || q.includes('³')) {
      return {
        id: 'red_power',
        name: 'Reducción de Términos con Exponentes',
        tip: 'Solo puedes agrupar x² con otros x² y x³ con otros x³. ¡No los mezcles con términos lineales como x!'
      };
    } else if (q.includes('xy') || q.includes('ab')) {
      return {
        id: 'red_compound',
        name: 'Reducción de Términos Compuestos (ab, xy)',
        tip: 'Los términos con letras unidas como "xy" solo se reducen con otros que tengan exactamente las mismas letras unidas.'
      };
    } else if (q.includes('y') && q.includes('x')) {
      return {
        id: 'red_two_vars',
        name: 'Agrupamiento de Clanes con Dos Letras (x, y)',
        tip: 'Suma o resta las x por un lado, y las y por otro lado. Al final quedan como clanes separados, ej: 3x + y.'
      };
    } else {
      return {
        id: 'red_simple',
        name: 'Reducción de una Sola Variable',
        tip: 'Agrupa todos los términos con la misma letra sumando o restando sus coeficientes numéricos.'
      };
    }
  }

  if (levelIndex === 4) {
    if (q.includes('[') || q.includes(']')) {
      return {
        id: 'grp_nested',
        name: 'Signos de Agrupación Anidados (Corchetes)',
        tip: 'Comienza eliminando los paréntesis () más internos, y luego elimina los corchetes [] externos.'
      };
    } else if (q.includes('-(') || q.includes('-[')) {
      return {
        id: 'grp_minus',
        name: 'Cambio de Signos por Signo Menos Exterior',
        tip: '¡REGLA DE ORO! Un signo menos justo antes de un paréntesis le cambia el signo a TODO lo que esté adentro.'
      };
    } else {
      return {
        id: 'grp_simple',
        name: 'Eliminación Simple de Paréntesis',
        tip: 'Si hay un signo más (+) antes del paréntesis, puedes quitarlo sin alterar los signos de adentro.'
      };
    }
  }

  return {
    id: 'general',
    name: 'Álgebra Básica General',
    tip: 'Opera con cuidado, paso a paso, prestando atención a la jerarquía de operadores y a la ley de signos.'
  };
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

  const [solvedCount, setSolvedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [result, setResult] = useState<'none' | 'correct' | 'wrong'>('none');
  const [showExplanation, setShowExplanation] = useState(false);
  const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([]);
  const [hasUsedHint, setHasUsedHint] = useState(false);

  // Adaptive logic states
  const [wrongCounts, setWrongCounts] = useState<Record<string, number>>({});
  const [correctCounts, setCorrectCounts] = useState<Record<string, number>>({});
  const [showTutorAdvice, setShowTutorAdvice] = useState(true);
  const [isAdaptiveSuggestion, setIsAdaptiveSuggestion] = useState(false);

  const currentPool = useMemo(() => {
    return activePuzzles && activePuzzles.length > 0 ? activePuzzles : EXERCISE_POOLS[currentLevel];
  }, [activePuzzles, currentLevel]);

  const [puzzle, setPuzzle] = useState<Puzzle>(() => currentPool[0]);

  // Sync puzzle when currentLevel or currentPool changes
  useEffect(() => {
    setPuzzle(currentPool[0]);
    setWrongCounts({});
    setCorrectCounts({});
    setIsAdaptiveSuggestion(false);
  }, [currentLevel, currentPool]);

  // Unique subcategories in current level pool for stats
  const uniqueSubcatsInPool = useMemo(() => {
    const ids = new Set<string>();
    currentPool.forEach(p => {
      ids.add(getPuzzleSubcategory(p.q, currentLevel).id);
    });
    return Array.from(ids);
  }, [currentPool, currentLevel]);

  const subIdsToNames = useMemo(() => {
    const mapping: Record<string, string> = {};
    currentPool.forEach(p => {
      const sub = getPuzzleSubcategory(p.q, currentLevel);
      mapping[sub.id] = sub.name;
    });
    return mapping;
  }, [currentPool, currentLevel]);

  // Identify weakest subcategory (with any wrong count > 0)
  const weakestCategory = useMemo(() => {
    let weakestId = '';
    let maxWrong = 0;
    Object.entries(wrongCounts).forEach(([id, count]) => {
      if (count > maxWrong) {
        maxWrong = count;
        weakestId = id;
      }
    });
    if (weakestId && maxWrong > 0) {
      const foundMatch = currentPool.find(p => getPuzzleSubcategory(p.q, currentLevel).id === weakestId);
      if (foundMatch) {
        return getPuzzleSubcategory(foundMatch.q, currentLevel);
      }
    }
    return null;
  }, [wrongCounts, currentLevel, currentPool]);

  // Get active tip (either weakest or current puzzle)
  const activeTip = useMemo(() => {
    if (weakestCategory) {
      return weakestCategory.tip;
    }
    return getPuzzleSubcategory(puzzle.q, currentLevel).tip;
  }, [weakestCategory, puzzle, currentLevel]);

  // Tutor's message
  const tutorMessage = useMemo(() => {
    if (solvedCount === 0 && Object.keys(wrongCounts).length === 0) {
      return "¡Hola! Soy tu Tutor de Calentamiento. Practicaremos sin guardar notas. Analizaré tus respuestas para sugerirte ejercicios personalizados según lo que necesites reforzar.";
    }
    if (weakestCategory) {
      return `¡Buen esfuerzo! Veo que te vendría genial repasar "${weakestCategory.name}". He adaptado la Sala de Práctica para darte más ejercicios similares de forma progresiva. ¡Tú puedes!`;
    }
    if (streak >= 3) {
      return `¡Fantástico! Llevas una racha de ${streak} respuestas correctas. Estás en perfectas condiciones de afrontar el examen oficial con tu código QR.`;
    }
    return "¡Vas muy bien! Estás entrenando con una racha impecable. Sigue resolviendo para perfeccionar tu destreza en álgebra.";
  }, [solvedCount, wrongCounts, weakestCategory, streak]);

  const handleAnswer = (ans: string, idx: number) => {
    if (result !== 'none') return;
    
    setSelectedIdx(idx);
    const isCorrect = ans === puzzle.c;
    setResult(isCorrect ? 'correct' : 'wrong');
    setShowExplanation(true);
    
    const subcat = getPuzzleSubcategory(puzzle.q, currentLevel);

    if (isCorrect) {
      setSolvedCount((p) => p + 1);
      setStreak((p) => {
        const next = p + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      
      // Save correct trace
      setCorrectCounts(prev => ({
        ...prev,
        [subcat.id]: (prev[subcat.id] || 0) + 1
      }));
      
      // Decrease wrong count representation on success to represent learning/mastery
      setWrongCounts(prev => {
        if (prev[subcat.id] && prev[subcat.id] > 0) {
          return {
            ...prev,
            [subcat.id]: Math.max(0, prev[subcat.id] - 1)
          };
        }
        return prev;
      });
    } else {
      setStreak(0);
      
      // Save wrong trace
      setWrongCounts(prev => ({
        ...prev,
        [subcat.id]: (prev[subcat.id] || 0) + 1
      }));
    }
  };

  const handleNext = () => {
    setSelectedIdx(null);
    setResult('none');
    setShowExplanation(false);
    setEliminatedIndices([]);
    setHasUsedHint(false);

    // Dynamic adaptive selection
    let weakestId = '';
    let maxWrong = 0;
    Object.entries(wrongCounts).forEach(([id, count]) => {
      if (count > maxWrong) {
        maxWrong = count;
        weakestId = id;
      }
    });

    let nextPuzzle: Puzzle | null = null;

    // 70% chance to prioritize weak area if there is one with mistakes
    if (weakestId && maxWrong > 0 && Math.random() < 0.7) {
      const weakPuzzles = currentPool.filter(p => {
        const sub = getPuzzleSubcategory(p.q, currentLevel);
        return sub.id === weakestId && p.q !== puzzle.q;
      });

      if (weakPuzzles.length > 0) {
        const randIdx = Math.floor(Math.random() * weakPuzzles.length);
        nextPuzzle = weakPuzzles[randIdx];
        setIsAdaptiveSuggestion(true);
      }
    }

    // Fallback: Pick another random puzzle from the pool (excluding current) or next sequential
    if (!nextPuzzle) {
      setIsAdaptiveSuggestion(false);
      const remainingPuzzles = currentPool.filter(p => p.q !== puzzle.q);
      if (remainingPuzzles.length > 0) {
        const randIdx = Math.floor(Math.random() * remainingPuzzles.length);
        nextPuzzle = remainingPuzzles[randIdx];
      } else {
        const nextIdx = (currentPool.indexOf(puzzle) + 1) % currentPool.length;
        nextPuzzle = currentPool[nextIdx];
      }
    }

    setPuzzle(nextPuzzle);
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
        className="w-full max-w-2xl bg-[#08090f] border-[3px] sm:border-[8px] border-[#131522] rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-7 relative shadow-[0_0_100px_rgba(168,85,247,0.15)] overflow-hidden my-auto"
      >
        {/* Design Accents */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-amber-500 to-purple-500 opacity-80" />
        <div className="absolute top-0 right-0 p-4 opacity-5 select-none pointer-events-none text-purple-500 font-serif text-8xl">
          α β γ
        </div>

        <div className="relative z-10 space-y-4 flex flex-col items-center">
          {/* Header */}
          <header className="w-full flex justify-between items-center pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20 text-xs font-black uppercase tracking-wider font-mono">
                SALA DE PRÁCTICA
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

          {/* Adaptive Warm-up Tutor Companion Panel */}
          <div className="w-full bg-[#12101b] border border-purple-500/20 rounded-2xl p-3 sm:p-4 relative overflow-hidden shadow-[0_4px_20px_rgba(168,85,247,0.05)] text-left">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
              <Brain size={48} className="text-purple-400" />
            </div>
            
            <div className="flex items-start gap-3">
              {/* Wise Owl Avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center border border-purple-400/30 text-lg shadow-md">
                  🦉
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-500 border-2 border-[#12101b] flex items-center justify-center">
                  <Sparkles size={8} className="text-white animate-spin" />
                </div>
              </div>

              {/* Tutor Dialogue & Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-mono text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    🦉 Tutor Inteligente de Calentamiento
                  </span>
                  <button
                    onClick={() => setShowTutorAdvice(!showTutorAdvice)}
                    className="text-[9px] font-mono text-white/40 hover:text-white/80 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded transition-colors cursor-pointer"
                  >
                    {showTutorAdvice ? "Ocultar Diagnóstico" : "Ver Diagnóstico"}
                  </button>
                </div>

                <p className="text-[10.5px] text-gray-200 font-sans leading-relaxed">
                  {tutorMessage}
                </p>

                {/* Expanded Diagnosis and Tip Box */}
                <AnimatePresence>
                  {showTutorAdvice && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 mt-2 border-t border-white/5 space-y-2">
                        {/* Current focus target */}
                        {weakestCategory ? (
                          <div className="flex items-center gap-1.5 text-[9.5px] text-amber-400 font-mono font-bold">
                            <AlertCircle size={11} className="text-amber-500 animate-pulse shrink-0" />
                            <span>Enfoque actual: Reforzar "{weakestCategory.name}"</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[9.5px] text-green-400 font-mono font-bold">
                            <Check size={11} className="text-green-400 shrink-0" />
                            <span>Estado: ¡Rendimiento óptimo en todos los temas de práctica!</span>
                          </div>
                        )}

                        {/* Interactive Tip Box */}
                        <div className="bg-purple-950/20 border border-purple-500/10 rounded-lg p-2.5">
                          <span className="text-[8px] font-mono text-purple-300 font-bold uppercase block tracking-wider mb-1">
                            💡 RECOMENDACIÓN MATEMÁTICA:
                          </span>
                          <p className="text-[10px] sm:text-[10.5px] text-purple-200 italic font-serif leading-relaxed">
                            "{activeTip}"
                          </p>
                        </div>

                        {/* Subcategory mastery list */}
                        <div className="pt-1">
                          <span className="text-[8px] font-mono text-white/30 uppercase block mb-1">
                            Diagnóstico de destrezas en este nivel:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {uniqueSubcatsInPool.map((subId) => {
                              const subName = subIdsToNames[subId] || subId;
                              const wr = wrongCounts[subId] || 0;
                              const co = correctCounts[subId] || 0;
                              const total = wr + co;
                              const accuracy = total > 0 ? Math.round((co / total) * 100) : null;
                              
                              return (
                                <div key={subId} className="bg-black/35 p-1.5 rounded border border-white/5 flex items-center justify-between text-[9px]">
                                  <span className="text-white/60 font-sans truncate max-w-[170px]" title={subName}>
                                    {subName}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {accuracy !== null ? (
                                      <span className={`font-mono font-bold ${accuracy >= 80 ? 'text-green-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {accuracy}%
                                      </span>
                                    ) : (
                                      <span className="text-white/20 font-mono">-</span>
                                    )}
                                    <div className="flex gap-0.5 text-[7px] font-mono ml-1">
                                      <span className="text-green-400">+{co}</span>
                                      <span className="text-red-400">-{wr}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Question Box */}
          <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/15 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
            <div className="absolute top-2 left-2 text-[8px] font-mono text-white/20 uppercase font-bold">
              Pregunta de Entrenamiento
            </div>
            
            {isAdaptiveSuggestion && (
              <div className="absolute top-2 right-2 text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 animate-pulse">
                <Sparkles size={8} className="text-purple-400" />
                <span>🎯 REFUERZO DE PUNTO DÉBIL</span>
              </div>
            )}

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
