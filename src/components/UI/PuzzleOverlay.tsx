/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { useGameStore, LEVELS } from '../../store';
import { Check, X } from 'lucide-react';

export default function PuzzleOverlay() {
  const { currentLevel, score, solvePuzzle, setPhase } = useGameStore();
  const level = LEVELS[currentLevel];
  
  // Use the puzzle according to current progress (score)
  const puzzle = level.puzzles[Math.min(score, level.puzzles.length - 1)]; 
  
  const [result, setResult] = useState<'none' | 'correct' | 'wrong'>('none');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleAnswer = (ans: string, idx: number) => {
    if (result !== 'none') return;
    
    setSelectedIdx(idx);
    const isCorrect = ans === puzzle.c;
    setResult(isCorrect ? 'correct' : 'wrong');
    
    setTimeout(() => {
      solvePuzzle(isCorrect);
      if (isCorrect || useGameStore.getState().lives > 0) {
        setPhase('playing');
      }
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-8 bg-[#050402]/95 backdrop-blur-3xl border-4 border-orange-600/20 pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 50 }}
        animate={{ scale: 0.8, opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#0a0a0a] border-[8px] sm:border-[12px] border-[#1a1c2a] rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-12 relative shadow-[0_0_120px_rgba(255,165,0,0.15)] overflow-hidden"
      >
        {/* Anime-Style Gradient Accents */}
        <div className="absolute top-0 left-0 w-full h-1 sm:h-2 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50 shadow-[0_0_20px_rgba(255,165,0,1)]" />
        <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-5 select-none pointer-events-none text-orange-500 font-serif text-6xl sm:text-9xl">
          ∑ π Ω
        </div>

        <div className="relative z-10 space-y-4 sm:space-y-6 flex flex-col items-center">
          <header className="space-y-1 sm:space-y-2 text-center">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="px-2 py-0.5 bg-orange-600/20 text-orange-500 rounded-full text-[8px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.4em] uppercase"
            >
              Enigma Sagrado {score + 1}/5
            </motion.div>
            <h2 className="text-white font-serif text-base sm:text-xl font-black tracking-tighter uppercase italic px-2">
              — {level.name.toUpperCase()} —
            </h2>
          </header>

          <div className="bg-white/[0.03] border-2 border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-8 w-full flex items-center justify-center shadow-inner group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <motion.span 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-lg sm:text-2xl font-mono font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            >
              {puzzle.q}
            </motion.span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {puzzle.a.map((ans, i) => (
              <button
                key={i}
                disabled={result !== 'none'}
                onClick={() => handleAnswer(ans, i)}
                className={`
                  p-1.5 sm:p-2 rounded-lg sm:rounded-xl border sm:border-2 font-mono text-xs sm:text-base font-black transition-all transform active:scale-95 relative overflow-hidden group
                  ${result === 'none' ? 'bg-white/5 border-white/5 text-gray-300 hover:border-orange-500 hover:bg-orange-500/10 hover:text-white' : ''}
                  ${result === 'correct' && ans === puzzle.c ? 'bg-green-600 border-green-400 text-white scale-[1.02] shadow-[0_0_20px_rgba(34,197,94,0.4)]' : ''}
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
