/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export type GamePhase = 'start' | 'intro' | 'playing' | 'puzzle' | 'victory' | 'gameover' | 'certificate';

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
  resetGame: () => void;
  nextLevel: () => void;
  unlockNextLevel: () => void;
  useRetry: () => boolean;
  addInventory: (item: string) => void;
  toggleMute: () => void;
  saveScoreToFirebase: (levelIndex: number, scoreValue: number) => Promise<boolean>;
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
      { q: "2x + 4 = 10, x =", a: ["3", "2", "5", "4"], c: "3" },
      { q: "3x - 6 = 9, x =", a: ["5", "3", "7", "1"], c: "5" },
      { q: "x/2 + 1 = 4, x =", a: ["6", "4", "8", "2"], c: "6" },
      { q: "4x + 2 = 18, x =", a: ["4", "5", "3", "6"], c: "4" },
      { q: "5x - 10 = 15, x =", a: ["5", "3", "7", "4"], c: "5" }
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
      { q: "5² + 3² =", a: ["34", "25", "30", "40"], c: "34" },
      { q: "√64 + 2² =", a: ["12", "10", "14", "8"], c: "12" },
      { q: "2⁴ - 3² =", a: ["7", "5", "9", "12"], c: "7" }
    ], 
    treasure: "Estrella de las Potencias" 
  },
  { 
    id: 5, name: 'Cámara del Cristal', theme: 'crystal', fog: '#08021a',
    puzzles: [
      { q: "x² + 2x + 1, x=2:", a: ["9", "8", "10", "7"], c: "9" },
      { q: "2x² - x, x=3:", a: ["15", "12", "18", "9"], c: "15" },
      { q: "x² - 4, x=3:", a: ["5", "8", "3", "7"], c: "5" },
      { q: "3x + x², x=2:", a: ["10", "8", "12", "6"], c: "10" },
      { q: "x² + x - 2, x=2:", a: ["4", "2", "6", "8"], c: "4" }
    ], 
    treasure: "Diamante de los Polinomios" 
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

  setPhase: (phase) => set({ phase }),
  
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
      const newScore = get().score + 1;
      set({ score: newScore });
      if (newScore === 5) {
        const currentLevel = get().currentLevel;
        const level = LEVELS[currentLevel];
        get().addInventory(level.treasure);
        // Add 2 points per level won
        const newTotalPoints = get().totalPoints + 2;
        set({ totalPoints: newTotalPoints });
        
        // Trigger automated saving to Firebase with the cumulative total points
        get().saveScoreToFirebase(currentLevel, newTotalPoints);
      }
    } else {
      const newLives = get().lives - 1;
      set({ lives: newLives });
      if (newLives <= 0) {
        set({ phase: 'gameover' });
      }
    }
  },

  startLevel: (levelIndex) => {
    set({ 
      currentLevel: levelIndex, 
      score: 0, 
      lives: 3, 
      phase: 'playing',
      nearGateIndex: null 
    });
  },

  resetGame: () => set({ 
    phase: 'start', 
    currentLevel: 0, 
    score: 0, 
    lives: 3, 
    retries: 3,
    inventory: [],
    totalPoints: 0
  }),

  nextLevel: () => {
    const { currentLevel, unlockedLevels } = get();
    const nextIdx = currentLevel + 1;
    if (nextIdx < LEVELS.length) {
      set({
        currentLevel: nextIdx,
        unlockedLevels: Math.max(unlockedLevels, nextIdx + 1),
        score: 0,
        lives: 3,
        phase: 'playing',
        nearGateIndex: null
      });
    } else {
      set({ phase: 'start' });
    }
  },

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
