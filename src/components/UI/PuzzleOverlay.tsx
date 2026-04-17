/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { useGameStore, LEVELS } from '../../store';
import { Check, X } from 'lucide-react';

export default function PuzzleOverlay() {
  const { currentLevel, solvePuzzle, setPhase } = useGameStore();
  const level = LEVELS[currentLevel];
  
  // In a real implementation we would track WHICH gate we are at
  // For now let's use the first unsolved puzzle or random logic
  const puzzle = level.puzzles[0]; 
  
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
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-[#1a1206] border-[10px] border-[#2a1c0a] rounded-3xl p-10 relative shadow-[0_0_100px_rgba(255,165,0,0.2)] overflow-hidden"
      >
        {/* Glow behind */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-8 flex flex-col items-center">
          <header className="space-y-2 text-center">
            <h2 className="text-orange-500 font-serif text-sm tracking-[0.4em] uppercase font-black italic">
              Jeroglífico Ancestral
            </h2>
            <p className="text-gray-400 text-[10px] uppercase tracking-widest leading-loose">
              Resuelve el enigma para desbloquear la puerta del {level.name}
            </p>
          </header>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-8 w-full flex items-center justify-center">
            <span className="text-4xl md:text-5xl font-mono font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]">
              {puzzle.q}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            {puzzle.a.map((ans, i) => (
              <button
                key={i}
                disabled={result !== 'none'}
                onClick={() => handleAnswer(ans, i)}
                className={`
                  p-5 rounded-2xl border-2 font-mono text-xl font-bold transition-all transform
                  ${result === 'none' ? 'bg-white/5 border-white/10 hover:border-orange-500 hover:bg-orange-500/10 hover:scale-[1.02]' : ''}
                  ${result === 'correct' && ans === puzzle.c ? 'bg-green-500/20 border-green-500 text-green-400 scale-[1.05]' : ''}
                  ${result === 'wrong' && i === selectedIdx ? 'bg-red-500/20 border-red-500 text-red-400 animate-shake' : ''}
                  ${result !== 'none' && ans === puzzle.c && result === 'wrong' ? 'border-green-500' : ''}
                  ${result !== 'none' && ans !== puzzle.c && i !== selectedIdx ? 'opacity-30' : ''}
                `}
              >
                <div className="flex items-center justify-center gap-3">
                  {result === 'correct' && ans === puzzle.c && <Check size={20} />}
                  {result === 'wrong' && i === selectedIdx && <X size={20} />}
                  x = {ans}
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
