/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useGameStore, LEVELS } from '../../store';
import { Check, X } from 'lucide-react';

export default function PuzzleOverlay() {
  const { currentLevel, score, solvePuzzle, setPhase, activePuzzles } = useGameStore();
  const level = LEVELS[currentLevel];
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  
  // Use the puzzle according to current progress (score) from the dynamically selected active puzzles
  const puzzle = activePuzzles && activePuzzles.length > 0
    ? activePuzzles[Math.min(score, activePuzzles.length - 1)]
    : level.puzzles[Math.min(score, level.puzzles.length - 1)]; 
  
  const [result, setResult] = useState<'none' | 'correct' | 'wrong'>('none');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(150); // 2 minutes and 30 seconds

  useEffect(() => {
    if (result !== 'none') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResult('wrong');
          
          // Timeout: considered wrong answer
          setTimeout(() => {
            solvePuzzle(false);
            if (useGameStore.getState().lives > 0) {
              setPhase('playing');
            }
          }, 1200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [result, solvePuzzle, setPhase]);

  const handleAnswer = (ans: string, idx: number) => {
    if (result !== 'none') return;
    
    setSelectedIdx(idx);
    const isCorrect = ans === puzzle.c;
    setResult(isCorrect ? 'correct' : 'wrong');
    
    // Quickened response timeout slightly from 1200ms to 900ms to feel snappier
    setTimeout(() => {
      solvePuzzle(isCorrect);
      if (isCorrect || useGameStore.getState().lives > 0) {
        setPhase('playing');
      }
    }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[400] flex items-center justify-center p-3 sm:p-8 bg-black/95 ${
        graphicsQuality === 'high' ? 'backdrop-blur-xl' : ''
      } border-2 sm:border-4 border-orange-600/20 pointer-events-auto`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0a0a0a] border-[3px] sm:border-[10px] border-[#1a1c2a] rounded-2xl sm:rounded-[2.5rem] p-3.5 sm:p-10 relative shadow-[0_0_80px_rgba(255,165,0,0.15)] overflow-hidden"
      >
        {/* Anime-Style Gradient Accents */}
        <div className="absolute top-0 left-0 w-full h-1 sm:h-2 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50 shadow-[0_0_20px_rgba(255,165,0,1)]" />
        <div className="absolute top-0 right-0 p-2 sm:p-8 opacity-5 select-none pointer-events-none text-orange-500 font-serif text-5xl sm:text-9xl">
          ∑ π Ω
        </div>

        <div className="relative z-10 space-y-3 sm:space-y-6 flex flex-col items-center">
          <header className="space-y-1 text-center">
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
                style={{ width: `${(timeLeft / 150) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-lg sm:rounded-2xl p-3 sm:p-6 w-full flex items-center justify-center shadow-inner group overflow-hidden relative">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3 w-full">
            {puzzle.a.map((ans, i) => (
              <button
                key={i}
                disabled={result !== 'none'}
                onClick={() => handleAnswer(ans, i)}
                className={`
                  p-2 sm:p-3 rounded-lg sm:rounded-xl border sm:border-2 font-mono text-xs sm:text-base font-black transition-all transform active:scale-95 relative overflow-hidden group cursor-pointer
                  ${result === 'none' ? 'bg-white/5 border-white/15 text-gray-300 hover:border-orange-500 hover:bg-orange-500/10 hover:text-white' : ''}
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
                {result === 'none' && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 transform translate-y-full group-hover:translate-y-0 transition-transform" />
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
