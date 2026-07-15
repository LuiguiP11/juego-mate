/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getPuzzleSubcategory } from './utils/mathUtils';

export type GamePhase = 'start' | 'intro' | 'playing' | 'puzzle' | 'victory' | 'gameover' | 'certificate' | 'practice';

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
  playerNombre: string;
  playerApellido: string;
  playerGradoSolo: string;
  playerSeccionSolo: string;
  playerActividad: string;
  playerTrimestre: string;
  gender: 'male' | 'female';
  nearGateIndex: number | null;
  inventory: string[];
  muted: boolean;
  totalPoints: number;
  graphicsQuality: 'high' | 'low';
  mobileControls: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
  };
  activePuzzles: Puzzle[];
  
  // Stats tracking
  puzzleStartTime: number;
  attemptHistory: {
    q: string;
    subcatId: string;
    subcatName: string;
    correct: boolean;
    duration: number;
  }[];
  recordAttempt: (q: string, correct: boolean, duration: number) => void;
  resetAttempts: () => void;
  
  // Actions
  setPhase: (phase: GamePhase) => void;
  setGraphicsQuality: (quality: 'high' | 'low') => void;
  setPlayerInfo: (
    name: string,
    user: string,
    grade: string,
    nombre?: string,
    apellido?: string,
    gradoSolo?: string,
    seccionSolo?: string
  ) => void;
  setPlayerActividad: (actividad: string) => void;
  setPlayerTrimestre: (trimestre: string) => void;
  setGender: (gender: 'male' | 'female') => void;
  setNearGate: (index: number | null) => void;
  setMobileControl: (control: 'forward' | 'backward' | 'left' | 'right' | 'jump', val: boolean) => void;
  solvePuzzle: (correct: boolean) => void;
  startLevel: (levelIndex: number) => void;
  startPractice: (levelIndex: number) => void;
  resetGame: () => void;
  nextLevel: () => void;
  unlockNextLevel: () => void;
  useRetry: () => boolean;
  addInventory: (item: string) => void;
  toggleMute: () => void;
  saveScoreToFirebase: (levelIndex: number, scoreValue: number) => Promise<boolean>;
}

// 25 structured educational exercises for each of the 5 levels
export const EXERCISE_POOLS: Puzzle[][] = [
  // Nivel 1: Potencias con exponentes 2 y 3 (Cuadrados, cubos, bases positivas/negativas y diferencia clave)
  [
    { q: "2² =", a: ["4", "2", "6", "8"], c: "4" },
    { q: "(-2)² =", a: ["4", "-4", "2", "-2"], c: "4" },
    { q: "-2² =", a: ["-4", "4", "-2", "2"], c: "-4" },
    { q: "3² =", a: ["9", "6", "5", "12"], c: "9" },
    { q: "(-3)² =", a: ["9", "-9", "6", "-6"], c: "9" },
    { q: "-3² =", a: ["-9", "9", "-6", "6"], c: "-9" },
    { q: "2³ =", a: ["8", "6", "16", "5"], c: "8" },
    { q: "(-2)³ =", a: ["-8", "8", "-6", "6"], c: "-8" },
    { q: "-2³ =", a: ["-8", "8", "-6", "6"], c: "-8" },
    { q: "3³ =", a: ["27", "9", "6", "18"], c: "27" },
    { q: "(-3)³ =", a: ["-27", "27", "-9", "9"], c: "-27" },
    { q: "-3³ =", a: ["-27", "27", "-9", "9"], c: "-27" },
    { q: "4² =", a: ["16", "8", "12", "20"], c: "16" },
    { q: "(-4)² =", a: ["16", "-16", "8", "-8"], c: "16" },
    { q: "-4² =", a: ["-16", "16", "-8", "8"], c: "-16" },
    { q: "5² =", a: ["25", "10", "15", "30"], c: "25" },
    { q: "(-5)² =", a: ["25", "-25", "10", "-10"], c: "25" },
    { q: "-5² =", a: ["-25", "25", "-10", "10"], c: "-25" },
    { q: "1³ =", a: ["1", "3", "0", "2"], c: "1" },
    { q: "(-1)³ =", a: ["-1", "1", "-3", "3"], c: "-1" },
    { q: "-1³ =", a: ["-1", "1", "-3", "3"], c: "-1" },
    { q: "10² =", a: ["100", "20", "10", "50"], c: "100" },
    { q: "(-10)² =", a: ["100", "-100", "20", "-20"], c: "100" },
    { q: "-10² =", a: ["-100", "100", "-20", "20"], c: "-100" },
    { q: "(-4)³ =", a: ["-64", "64", "-12", "12"], c: "-64" }
  ],
  // Nivel 2: Valor numérico (Evaluar expresiones simples con una variable)
  [
    { q: "Si x = 3, calcular 2x + 5", a: ["11", "8", "10", "13"], c: "11" },
    { q: "Si x = 2, calcular 3x - 1", a: ["5", "4", "6", "7"], c: "5" },
    { q: "Si a = 5, calcular 4a + 2", a: ["22", "18", "24", "20"], c: "22" },
    { q: "Si y = 6, calcular y/2 + 4", a: ["7", "6", "8", "9"], c: "7" },
    { q: "Si m = 4, calcular 10 - 2m", a: ["2", "6", "4", "8"], c: "2" },
    { q: "Si n = 3, calcular 3n + 2", a: ["11", "9", "12", "8"], c: "11" },
    { q: "Si x = -1, calcular 5x + 8", a: ["3", "-3", "13", "-13"], c: "3" },
    { q: "Si y = -2, calcular 2y + 10", a: ["6", "-6", "14", "-14"], c: "6" },
    { q: "Si a = 3, calcular a² + 1", a: ["10", "7", "9", "12"], c: "10" },
    { q: "Si b = 2, calcular b³ - 3", a: ["5", "3", "7", "9"], c: "5" },
    { q: "Si z = 5, calcular 3z - 7", a: ["8", "10", "15", "5"], c: "8" },
    { q: "Si x = 4, calcular x/4 + 6", a: ["7", "6", "8", "5"], c: "7" },
    { q: "Si m = -3, calcular 2m + 9", a: ["3", "-3", "15", "-15"], c: "3" },
    { q: "Si a = 2, calcular 5a - 8", a: ["2", "1", "3", "0"], c: "2" },
    { q: "Si x = 10, calcular x/2 - 3", a: ["2", "5", "8", "1"], c: "2" },
    { q: "Si y = 5, calcular 15 - 3y", a: ["0", "5", "10", "15"], c: "0" },
    { q: "Si n = -4, calcular n + 10", a: ["6", "-6", "14", "-14"], c: "6" },
    { q: "Si x = 3, calcular 4x - 12", a: ["0", "3", "6", "12"], c: "0" },
    { q: "Si z = 2, calcular 3z + 5", a: ["11", "8", "9", "10"], c: "11" },
    { q: "Si a = -2, calcular 3a + 8", a: ["2", "-2", "14", "-14"], c: "2" },
    { q: "Si x = 5, calcular x² - 10", a: ["15", "25", "5", "20"], c: "15" },
    { q: "Si b = -1, calcular 4b + 5", a: ["1", "-1", "9", "-9"], c: "1" },
    { q: "Si m = 3, calcular m² + m", a: ["12", "9", "6", "15"], c: "12" },
    { q: "Si y = 4, calcular 2y - y", a: ["4", "2", "6", "8"], c: "4" },
    { q: "Si x = -5, calcular 2x + 15", a: ["5", "-5", "25", "-25"], c: "5" }
  ],
  // Nivel 3: Sustitución en expresiones algebraicas (Dos o más variables, positivas y negativas)
  [
    { q: "Si a = -2; b = 3, calcular a² + 2b", a: ["10", "8", "6", "12"], c: "10" },
    { q: "Si x = 2; y = -1, calcular 3x + y", a: ["5", "7", "6", "4"], c: "5" },
    { q: "Si a = 3; b = 2, calcular 2a - b²", a: ["2", "4", "0", "6"], c: "2" },
    { q: "Si m = -1; n = -2, calcular m + n", a: ["-3", "3", "-1", "1"], c: "-3" },
    { q: "Si x = 4; y = 2, calcular x² - y²", a: ["12", "16", "8", "14"], c: "12" },
    { q: "Si a = 5; b = -3, calcular a + b", a: ["2", "-2", "8", "-8"], c: "2" },
    { q: "Si x = -3; y = 2, calcular x² + y²", a: ["13", "5", "-5", "25"], c: "13" },
    { q: "Si m = 2; n = 5, calcular 3m + 2n", a: ["16", "11", "21", "13"], c: "16" },
    { q: "Si a = 1; b = -4, calcular ab + 5", a: ["1", "-1", "9", "-9"], c: "1" },
    { q: "Si x = -2; y = -3, calcular xy", a: ["6", "-6", "5", "-5"], c: "6" },
    { q: "Si a = 3; b = -1, calcular a²b", a: ["-9", "9", "-6", "6"], c: "-9" },
    { q: "Si m = 4; n = -2, calcular m/n + 3", a: ["1", "-1", "5", "-5"], c: "1" },
    { q: "Si x = 3; y = 3, calcular 2x - 2y", a: ["0", "6", "-6", "12"], c: "0" },
    { q: "Si a = -5; b = 2, calcular 2a + 3b", a: ["-4", "4", "-16", "16"], c: "-4" },
    { q: "Si x = -1; y = -1, calcular x² - y²", a: ["0", "2", "-2", "1"], c: "0" },
    { q: "Si a = 2; b = 4, calcular 3a - b", a: ["2", "10", "6", "4"], c: "2" },
    { q: "Si m = -3; n = 3, calcular m + n", a: ["0", "6", "-6", "9"], c: "0" },
    { q: "Si x = 5; y = -2, calcular xy + 10", a: ["0", "20", "-20", "10"], c: "0" },
    { q: "Si a = -2; b = -2, calcular a² + b²", a: ["8", "-8", "4", "0"], c: "8" },
    { q: "Si x = 3; y = -1, calcular x - 2y", a: ["5", "1", "4", "2"], c: "5" },
    { q: "Si m = 1; n = 10, calcular 5m + n", a: ["15", "11", "50", "5"], c: "15" },
    { q: "Si a = -4; b = 1, calcular a/2 + 3b", a: ["1", "-1", "5", "-5"], c: "1" },
    { q: "Si x = 2; y = 3, calcular x³ - y", a: ["5", "3", "6", "1"], c: "5" },
    { q: "Si a = -3; b = -2, calcular a - b", a: ["-1", "1", "-5", "5"], c: "-1" },
    { q: "Si m = 2; n = -3, calcular m² + n", a: ["1", "7", "-2", "4"], c: "1" }
  ],
  // Nivel 4: Reducción de términos semejantes / clanes de términos (Agrupar términos semejantes)
  [
    { q: "Reduce: 3x + 5x - 2y + y =", a: ["8x - y", "8x + y", "8x - 2y", "8x"], c: "8x - y" },
    { q: "Reduce: 4a + 2a - b =", a: ["6a - b", "6a + b", "8a - b", "6ab"], c: "6a - b" },
    { q: "Reduce: x² + 2x² + 3x =", a: ["3x² + 3x", "3x²", "6x", "3x³"], c: "3x² + 3x" },
    { q: "Reduce: 5m - 2m + n - 3n =", a: ["3m - 2n", "3m + 2n", "7m - 4n", "3mn"], c: "3m - 2n" },
    { q: "Reduce: -3a + 5a - 2 =", a: ["2a - 2", "-2a - 2", "8a - 2", "0"], c: "2a - 2" },
    { q: "Reduce: x + y + x - y =", a: ["2x", "2y", "2x + 2y", "0"], c: "2x" },
    { q: "Reduce: 2ab + 3ab - ab =", a: ["4ab", "5ab", "3ab", "4"], c: "4ab" },
    { q: "Reduce: 6x²y - 2x²y =", a: ["4x²y", "4xy", "8x²y", "4"], c: "4x²y" },
    { q: "Reduce: 10z - z + 5 =", a: ["9z + 5", "10 + 5", "9z", "14z"], c: "9z + 5" },
    { q: "Reduce: -a - a - a =", a: ["-3a", "3a", "-a³", "a"], c: "-3a" },
    { q: "Reduce: 4x³ + 2x³ - x³ =", a: ["5x³", "6x³", "5x", "5"], c: "5x³" },
    { q: "Reduce: 2x + 3y + x - 2y =", a: ["3x + y", "3x - y", "2x + y", "3xy"], c: "3x + y" },
    { q: "Reduce: 5a² - 2a² + a =", a: ["3a² + a", "3a²", "3a³", "4a²"], c: "3a² + a" },
    { q: "Reduce: -2m + 8m - 3n =", a: ["6m - 3n", "-6m - 3n", "10m - 3n", "3mn"], c: "6m - 3n" },
    { q: "Reduce: 3xy + xy - 4xy =", a: ["0", "xy", "2xy", "8xy"], c: "0" },
    { q: "Reduce: 7p - 3p + 2q - q =", a: ["4p + q", "4p - q", "10p + q", "4pq"], c: "4p + q" },
    { q: "Reduce: x² + x + x² + x =", a: ["2x² + 2x", "4x", "2x³", "2x²"], c: "2x² + 2x" },
    { q: "Reduce: 8 - 3 + 2x - 5x =", a: ["-3x + 5", "3x + 5", "-3x - 5", "5x"], c: "-3x + 5" },
    { q: "Reduce: -4a - 2a + 3b =", a: ["-6a + 3b", "6a + 3b", "-2a + 3b", "-6ab"], c: "-6a + 3b" },
    { q: "Reduce: 2z² + 3z - z² =", a: ["z² + 3z", "3z²", "4z", "z² - 3z"], c: "z² + 3z" },
    { q: "Reduce: 6xy - xy + 2 =", a: ["5xy + 2", "5xy", "6xy + 2", "7xy"], c: "5xy + 2" },
    { q: "Reduce: a + b - a - b =", a: ["0", "2a + 2b", "2a", "2b"], c: "0" },
    { q: "Reduce: 5x³ - 2x³ + 3 =", a: ["3x³ + 3", "3x³", "3x + 3", "6x³"], c: "3x³ + 3" },
    { q: "Reduce: -3y² + 7y² - 4y² =", a: ["0", "4y²", "-4y²", "8y²"], c: "0" },
    { q: "Reduce: x + 2x + 3x =", a: ["6x", "5x", "6", "x³"], c: "6x" }
  ],
  // Nivel 5: Signos de agrupación (Paréntesis, corchetes, llaves, ley de signos y reducción final)
  [
    { q: "Reduce: 3x - (2x - 5) + [4x - 3] =", a: ["5x + 2", "5x - 2", "9x + 2", "5x + 8"], c: "5x + 2" },
    { q: "Reduce: 2a + (3a - b) =", a: ["5a - b", "5a + b", "6a - b", "5ab"], c: "5a - b" },
    { q: "Reduce: 5x - (x + 2) =", a: ["4x - 2", "4x + 2", "6x - 2", "4"], c: "4x - 2" },
    { q: "Reduce: a - (2a - b) =", a: ["-a + b", "-a - b", "a + b", "-3a + b"], c: "-a + b" },
    { q: "Reduce: -(x - y) + x =", a: ["y", "-y", "2x - y", "x"], c: "y" },
    { q: "Reduce: 4m + [2m - (m + 1)] =", a: ["5m - 1", "5m + 1", "7m - 1", "5m"], c: "5m - 1" },
    { q: "Reduce: 3x - [x - (2x - 1)] =", a: ["4x - 1", "4x + 1", "2x - 1", "4x"], c: "4x - 1" },
    { q: "Reduce: a + (b - a) - b =", a: ["0", "2a", "2b", "a + b"], c: "0" },
    { q: "Reduce: 2x - (x - 3) =", a: ["x + 3", "x - 3", "3x - 3", "x"], c: "x + 3" },
    { q: "Reduce: -(-a - b) - a =", a: ["b", "2a + b", "-b", "a + b"], c: "b" },
    { q: "Reduce: 5y - [2y + (y - 1)] =", a: ["2y + 1", "2y - 1", "3y + 1", "2y"], c: "2y + 1" },
    { q: "Reduce: (x + 3) + (2x - 1) =", a: ["3x + 2", "3x + 4", "2x + 2", "3x"], c: "3x + 2" },
    { q: "Reduce: 4a - (3a + 2b) + b =", a: ["a - b", "a + b", "a - 3b", "7a - b"], c: "a - b" },
    { q: "Reduce: x - [y - (x + y)] =", a: ["2x", "0", "2x - 2y", "2x + 2y"], c: "2x" },
    { q: "Reduce: -2x - (3 - 2x) =", a: ["-3", "-4x - 3", "4x - 3", "3"], c: "-3" },
    { q: "Reduce: 3a + [2a - (5a - 1)] =", a: ["1", "10a - 1", "-1", "5a + 1"], c: "1" },
    { q: "Reduce: 2x - (y - x) + y =", a: ["3x", "x", "3x + 2y", "3x - 2y"], c: "3x" },
    { q: "Reduce: -[a - (b - a)] =", a: ["-2a + b", "2a - b", "-2a - b", "b"], c: "-2a + b" },
    { q: "Reduce: (3x + 2y) - (2x + y) =", a: ["x + y", "x - y", "5x + 3y", "xy"], c: "x + y" },
    { q: "Reduce: 5 - (2x - 3) + 2x =", a: ["8", "2", "-4x + 8", "8x"], c: "8" },
    { q: "Reduce: -a + [a - (2b - a)] =", a: ["a - 2b", "-a - 2b", "3a - 2b", "a + 2b"], c: "a - 2b" },
    { q: "Reduce: 4x - (3x - 2) - 2 =", a: ["x", "x + 4", "x - 4", "7x - 4"], c: "x" },
    { q: "Reduce: 2m - [m + (3 - m)] =", a: ["2m - 3", "2m + 3", "3", "2m"], c: "2m - 3" },
    { q: "Reduce: (a + b) - (a - b) =", a: ["2b", "2a", "0", "2a + 2b"], c: "2b" },
    { q: "Reduce: -x - (-x - y) =", a: ["y", "-y", "-2x - y", "x"], c: "y" }
  ]
];

// Shuffles the selected 5 questions, and shuffles their choices dynamically for complete variety
function getRandomPuzzles(pool: Puzzle[], count: number): Puzzle[] {
  if (!pool || pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(p => {
    const shuffledChoices = [...p.a].sort(() => Math.random() - 0.5);
    return {
      ...p,
      a: shuffledChoices
    };
  });
}

export const LEVELS: Level[] = [
  { 
    id: 1, name: 'Atrio de las Potencias', theme: 'cave', fog: '#1a0e06',
    puzzles: EXERCISE_POOLS[0].slice(0, 5), 
    treasure: "Cristal de las Potencias" 
  },
  { 
    id: 2, name: 'Valle del Valor Numérico', theme: 'water', fog: '#021020',
    puzzles: EXERCISE_POOLS[1].slice(0, 5), 
    treasure: "Orbe del Valor Numérico" 
  },
  { 
    id: 3, name: 'Biblioteca de la Sustitución', theme: 'library', fog: '#120a04',
    puzzles: EXERCISE_POOLS[2].slice(0, 5), 
    treasure: "Tomo de la Sustitución" 
  },
  { 
    id: 4, name: 'Puente de la Reducción', theme: 'abyss', fog: '#020412',
    puzzles: EXERCISE_POOLS[3].slice(0, 5), 
    treasure: "Cáliz de la Reducción" 
  },
  { 
    id: 5, name: 'Santuario de los Agrupamientos', theme: 'crystal', fog: '#08021a',
    puzzles: EXERCISE_POOLS[4].slice(0, 5), 
    treasure: "Diamante de los Agrupamientos" 
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
  playerNombre: '',
  playerApellido: '',
  playerGradoSolo: '',
  playerSeccionSolo: '',
  playerActividad: 'Tarea 3',
  playerTrimestre: 'T2',
  gender: 'male',
  nearGateIndex: null,
  inventory: [],
  muted: false,
  totalPoints: 0,
  graphicsQuality: (typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent)) ? 'low' : 'high',
  mobileControls: {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  },
  activePuzzles: getRandomPuzzles(EXERCISE_POOLS[0], 5),
  
  // Stats tracking initial state and actions
  puzzleStartTime: Date.now(),
  attemptHistory: [],
  recordAttempt: (q, correct, duration) => {
    const { currentLevel, attemptHistory } = get();
    const subcat = getPuzzleSubcategory(q, currentLevel);
    set({
      attemptHistory: [
        ...attemptHistory,
        {
          q,
          subcatId: subcat.id,
          subcatName: subcat.name,
          correct,
          duration,
        }
      ]
    });
  },
  resetAttempts: () => set({ attemptHistory: [], puzzleStartTime: Date.now() }),

  setPhase: (phase) => {
    set({ phase });
    if (phase === 'victory') {
      if (typeof window !== 'undefined' && (window as any).playVictorySound) {
        (window as any).playVictorySound();
      }
    }
  },
  
  setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),
  
  setMobileControl: (control, val) => set((state) => ({
    mobileControls: {
      ...state.mobileControls,
      [control]: val
    }
  })),
  
  setPlayerInfo: (name, user, grade, nombre, apellido, gradoSolo, seccionSolo) => {
    let finalNombre = nombre || '';
    let finalApellido = apellido || '';
    let finalGrado = gradoSolo || '';
    let finalSeccion = seccionSolo || '';

    if (!finalNombre && name) {
      const parts = name.trim().split(/\s+/);
      finalNombre = parts[0] || '';
      if (parts.length > 1) {
        finalApellido = parts.slice(1).join(' ');
      }
    }

    if (!finalGrado && grade) {
      if (grade.includes(' - ')) {
        const parts = grade.split(' - ');
        finalGrado = parts[0] || '';
        finalSeccion = parts[1] ? parts[1].replace(/Sección\s+/i, '').trim() : '';
      } else {
        finalGrado = grade;
      }
    }

    set({ 
      playerName: name, 
      playerUser: user, 
      playerGrade: grade,
      playerNombre: finalNombre,
      playerApellido: finalApellido,
      playerGradoSolo: finalGrado,
      playerSeccionSolo: finalSeccion
    });
  },
  
  setPlayerActividad: (actividad) => set({ playerActividad: actividad }),

  setPlayerTrimestre: (trimestre) => set({ playerTrimestre: trimestre }),
  
  setGender: (gender) => set({ gender }),
  
  setNearGate: (index) => set({ nearGateIndex: index }),

  addInventory: (item) => set((state) => ({ 
    inventory: state.inventory.includes(item) ? state.inventory : [...state.inventory, item] 
  })),

  toggleMute: () => set((state) => ({ muted: !state.muted })),
  
  solvePuzzle: (correct) => {
    if (correct) {
      if (typeof window !== 'undefined' && (window as any).playCorrectSound) {
        (window as any).playCorrectSound();
      }
      const newScore = get().score + 1;
      const currentLevel = get().currentLevel;
      if (newScore === 5) {
        const level = LEVELS[currentLevel];
        get().addInventory(level.treasure);
        // Add 2 points per level won
        const newTotalPoints = get().totalPoints + 2;
        set({ score: newScore, totalPoints: newTotalPoints, phase: 'playing' });
        
        // Trigger automated saving to Firebase with the cumulative total points
        get().saveScoreToFirebase(currentLevel, newTotalPoints);
      } else {
        set({ score: newScore, phase: 'playing' });
      }
    } else {
      if (typeof window !== 'undefined' && (window as any).playWrongSound) {
        (window as any).playWrongSound();
      }
      const newLives = get().lives - 1;
      if (newLives <= 0) {
        set({ lives: 0, phase: 'gameover' });
      } else {
        set({ lives: newLives, phase: 'playing' });
      }
    }
  },

  startLevel: (levelIndex) => {
    const pool = EXERCISE_POOLS[levelIndex] || [];
    const activePuzzles = getRandomPuzzles(pool, 5);
    set({ 
      currentLevel: levelIndex, 
      score: 0, 
      lives: 3, 
      phase: 'playing',
      nearGateIndex: null,
      activePuzzles,
      attemptHistory: [],
      puzzleStartTime: Date.now()
    });
  },

  startPractice: (levelIndex) => {
    const pool = EXERCISE_POOLS[levelIndex] || [];
    const activePuzzles = getRandomPuzzles(pool, pool.length);
    set({ 
      currentLevel: levelIndex, 
      score: 0, 
      phase: 'practice',
      nearGateIndex: null,
      activePuzzles,
      attemptHistory: [],
      puzzleStartTime: Date.now()
    });
  },

  resetGame: () => {
    const pool = EXERCISE_POOLS[0] || [];
    const activePuzzles = getRandomPuzzles(pool, 5);
    set({ 
      phase: 'start', 
      currentLevel: 0, 
      score: 0, 
      lives: 3, 
      retries: 3,
      inventory: [],
      totalPoints: 0,
      activePuzzles,
      attemptHistory: [],
      puzzleStartTime: Date.now()
    });
  },

  nextLevel: () => {
    const { currentLevel, unlockedLevels } = get();
    const nextIdx = currentLevel + 1;
    if (nextIdx < LEVELS.length) {
      const pool = EXERCISE_POOLS[nextIdx] || [];
      const activePuzzles = getRandomPuzzles(pool, 5);
      set({
        currentLevel: nextIdx,
        unlockedLevels: Math.max(unlockedLevels, nextIdx + 1),
        score: 0,
        lives: 3,
        phase: 'playing',
        nearGateIndex: null,
        activePuzzles
      });
    } else {
      set({ phase: 'start' });
    }
  },

  unlockNextLevel: () => set((state) => ({ 
    unlockedLevels: Math.max(state.unlockedLevels, state.currentLevel + 2) 
  })),

  useRetry: () => {
    const { retries, currentLevel } = get();
    if (retries > 0) {
      const pool = EXERCISE_POOLS[currentLevel] || [];
      const activePuzzles = getRandomPuzzles(pool, 5);
      set({ 
        retries: retries - 1, 
        lives: 3, 
        phase: 'playing', 
        score: 0,
        activePuzzles
      });
      return true;
    }
    return false;
  },

  saveScoreToFirebase: async (levelIndex, scoreValue) => {
    const { 
      playerUser, 
      playerNombre, 
      playerApellido, 
      playerGradoSolo, 
      playerSeccionSolo, 
      playerTrimestre 
    } = get();

    if (!playerUser) {
      console.warn("No player logged in. Skipping Firestore write.");
      return false;
    }

    const level = LEVELS[levelIndex];
    if (!level) return false;

    // Requirement: The activity must appear as "Tarea 3: Juego Algebra" in the T2 section
    const cleanUnidad = "t2"; // Explicitly save under 't2' trimester
    const cleanActividadId = "juego_algebra"; // Matches Tarea 3: Juego Algebra

    // Document ID = [usuario]_[unidad]_[actividad] in lowercase, without spaces
    const docId = `${playerUser.toLowerCase().trim()}_${cleanUnidad}_${cleanActividadId}`;

    // Date in YYYY-MM-DD
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    try {
      const docRef = doc(db, 'notas', docId);
      
      const docData = {
        usuario: playerUser,
        nombre: playerNombre,
        apellido: playerApellido,
        grado: playerGradoSolo,
        seccion: playerSeccionSolo,
        actividad: "Tarea 3: Juego Algebra",
        punteo: scoreValue, // Reflection of total cumulative points (2, 4, 6, 8, or 10)
        unidad: cleanUnidad,
        trimestre: cleanUnidad.toUpperCase(),
        fecha: formattedDate,
        timestamp: serverTimestamp()
      };

      console.log("Saving student score to Firestore with ID:", docId, docData);
      await setDoc(docRef, docData);
      return true;
    } catch (err) {
      console.error("Error saving score to Firestore:", err);
      return false;
    }
  }
}));
