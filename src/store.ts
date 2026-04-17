/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';

export type GamePhase = 'start' | 'playing' | 'puzzle' | 'victory' | 'gameover' | 'certificate';

export interface Puzzle {
  q: string;
  a: string[];
  c: string;
}

export interface Level {
  id: number;
  name: string;
  theme: 'cave' | 'water' | 'library' | 'abyss' | 'crystal';
  fog: string;
  puzzles: Puzzle[];
  treasure: string;
}

interface GameState {
  phase: GamePhase;
  currentLevel: number;
  unlockedLevels: number;
  score: number;
  lives: number;
  retries: number;
  playerName: string;
  playerUser: string;
  playerGrade: string;
  gender: 'male' | 'female';
  nearGateIndex: number | null;
  
  // Actions
  setPhase: (phase: GamePhase) => void;
  setPlayerInfo: (name: string, user: string, grade: string) => void;
  setGender: (gender: 'male' | 'female') => void;
  setNearGate: (index: number | null) => void;
  solvePuzzle: (correct: boolean) => void;
  startLevel: (levelIndex: number) => void;
  resetGame: () => void;
  unlockNextLevel: () => void;
  useRetry: () => boolean;
}

export const LEVELS: Level[] = [
  { 
    id: 1, name: 'Atrio de los Enteros', theme: 'cave', fog: '#1a0e06',
    puzzles: [
      { q: "8 + (-5) =", a: ["3", "-3", "13", "-13"], c: "3" },
      { q: "-10 - 4 =", a: ["-14", "-6", "14", "6"], c: "-14" },
      { q: "(-3)×(-4) =", a: ["12", "-12", "7", "-7"], c: "12" },
      { q: "-15 + 15 =", a: ["0", "30", "-30", "1"], c: "0" },
      { q: "(-20) ÷ 5 =", a: ["-4", "4", "-100", "100"], c: "-4" }
    ], 
    treasure: "Cristal de los Enteros" 
  },
  { 
    id: 2, name: 'Catacumbas del Álgebra', theme: 'water', fog: '#021020',
    puzzles: [
      { q: "2x+4=10, x=", a: ["3", "2", "5", "4"], c: "3" },
      { q: "3x-6=9, x=", a: ["5", "3", "7", "1"], c: "5" },
      { q: "x/2+1=4, x=", a: ["6", "4", "8", "2"], c: "6" },
      { q: "4x+2=18, x=", a: ["4", "5", "3", "6"], c: "4" },
      { q: "5x-10=15, x=", a: ["5", "3", "7", "4"], c: "5" }
    ], 
    treasure: "Orbe del Álgebra" 
  },
  { 
    id: 3, name: 'Biblioteca Prohibida', theme: 'library', fog: '#120a04',
    puzzles: [
      { q: "1/2 + 1/4 =", a: ["3/4", "1/2", "1/4", "2/3"], c: "3/4" },
      { q: "3/4 - 1/4 =", a: ["1/2", "1/4", "3/4", "2/4"], c: "1/2" },
      { q: "2/3 × 3/4 =", a: ["1/2", "2/3", "3/4", "1/3"], c: "1/2" },
      { q: "0.5 + 0.25 =", a: ["0.75", "0.5", "1.0", "0.25"], c: "0.75" },
      { q: "3/5 de 20 =", a: ["12", "10", "15", "8"], c: "12" }
    ], 
    treasure: "Tomo de las Fracciones" 
  },
  { 
    id: 4, name: 'Puente sobre el Abismo', theme: 'abyss', fog: '#020412',
    puzzles: [
      { q: "2³ =", a: ["8", "6", "12", "4"], c: "8" },
      { q: "√144 =", a: ["12", "14", "10", "11"], c: "12" },
      { q: "5²+3² =", a: ["34", "25", "30", "40"], c: "34" },
      { q: "√64+2² =", a: ["12", "10", "14", "8"], c: "12" },
      { q: "2⁴-3² =", a: ["7", "5", "9", "12"], c: "7" }
    ], 
    treasure: "Estrella de las Potencias" 
  },
  { 
    id: 5, name: 'Cámara del Cristal', theme: 'crystal', fog: '#08021a',
    puzzles: [
      { q: "x²+2x+1,x=2:", a: ["9", "8", "10", "7"], c: "9" },
      { q: "2x²-x, x=3:", a: ["15", "12", "18", "9"], c: "15" },
      { q: "x²-4, x=3:", a: ["5", "8", "3", "7"], c: "5" },
      { q: "3x+x², x=2:", a: ["10", "8", "12", "6"], c: "10" },
      { q: "x²+x-2,x=2:", a: ["4", "2", "6", "8"], c: "4" }
    ], 
    treasure: "Diamante de los Polinomios" 
  },
  { 
    id: 6, name: 'Glaciar de la Estadística', theme: 'water', fog: '#a0d0f0',
    puzzles: [
      { q: "Media de 2, 4, 6:", a: ["4", "3", "5", "6"], c: "4" },
      { q: "Moda de 1, 2, 2, 3:", a: ["2", "1", "3", "3.5"], c: "2" },
      { q: "Probabilidad moneda Cara:", a: ["1/2", "1/4", "1", "0"], c: "1/2" },
      { q: "Rango de 10, 20, 30:", a: ["20", "10", "30", "40"], c: "20" },
      { q: "Mediana de 1, 5, 10:", a: ["5", "1", "10", "6"], c: "5" }
    ], 
    treasure: "Cetro del Análisis" 
  },
  {
    id: 7, name: 'Santuario de la Geometría', theme: 'crystal', fog: '#102005',
    puzzles: [
      { q: "Área cuadrado lado 5:", a: ["25", "20", "10", "15"], c: "25" },
      { q: "Perímetro círculo r=1:", a: ["2π", "π", "4π", "1"], c: "2π" },
      { q: "Suma ángulos triángulo:", a: ["180°", "90°", "360°", "270°"], c: "180°" },
      { q: "Lados de un Hexágono:", a: ["6", "5", "8", "4"], c: "6" },
      { q: "Área triángulo b=4,h=5:", a: ["10", "20", "9", "15"], c: "10" }
    ],
    treasure: "Escudo del Geómetra"
  }
];

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'start',
  currentLevel: 0,
  unlockedLevels: 1,
  score: 0,
  lives: 3,
  retries: 3,
  playerName: '',
  playerUser: '',
  playerGrade: '',
  gender: 'male',
  nearGateIndex: null,

  setPhase: (phase) => set({ phase }),
  
  setPlayerInfo: (name, user, grade) => set({ playerName: name, playerUser: user, playerGrade: grade }),
  
  setGender: (gender) => set({ gender }),
  
  setNearGate: (index) => set({ nearGateIndex: index }),
  
  solvePuzzle: (correct) => {
    if (correct) {
      set((state) => ({ score: state.score + 1 }));
    } else {
      const newLives = get().lives - 1;
      set({ lives: newLives });
      if (newLives <= 0) {
        set({ phase: 'gameover' });
      }
    }
  },

  startLevel: (levelIndex) => set({ 
    currentLevel: levelIndex, 
    score: 0, 
    lives: 3, 
    phase: 'playing',
    nearGateIndex: null 
  }),

  resetGame: () => set({ 
    phase: 'start', 
    currentLevel: 0, 
    score: 0, 
    lives: 3, 
    retries: 3 
  }),

  unlockNextLevel: () => set((state) => ({ 
    unlockedLevels: Math.max(state.unlockedLevels, state.currentLevel + 2) 
  })),

  useRetry: () => {
    const { retries } = get();
    if (retries > 0) {
      set({ retries: retries - 1, lives: 3, phase: 'playing', score: 0 });
      return true;
    }
    return false;
  }
}));
