import { useEffect, useRef } from 'react';
import { useGameStore } from '../store';

// Frequencies for our mystical chord progression
const CHORDS = [
  // Am9: A3, C4, E4, B4
  [220.00, 261.63, 329.63, 493.88],
  // Em7: E3, G3, D4, G4
  [164.81, 196.00, 293.66, 392.00],
  // Fmaj7: F3, A3, C4, E4
  [174.61, 220.00, 261.63, 329.63],
  // G6: G3, B3, D4, E4
  [196.00, 246.94, 293.66, 329.63],
  // Dm7: D3, F3, A3, C4
  [146.83, 174.61, 220.00, 261.63]
];

const MELODY_SCALE = [440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // A minor pentatonic

export default function SoundManager() {
  const muted = useGameStore((state) => state.muted);
  const phase = useGameStore((state) => state.phase);
  
  const audioCtx = useRef<AudioContext | null>(null);
  const masterGain = useRef<GainNode | null>(null);
  
  // Keep track of active sound generators to stop/mute them
  const activeMusicNodes = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);

  useEffect(() => {
    // Expose sound effect functions to the window object so they can be triggered from any React component
    const playCorrectSound = () => {
      if (!audioCtx.current || muted) return;
      if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
      
      const now = audioCtx.current.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, idx) => {
        const osc = audioCtx.current!.createOscillator();
        const gainNode = audioCtx.current!.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gainNode.gain.setValueAtTime(0, now + idx * 0.08);
        gainNode.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        
        osc.connect(gainNode);
        gainNode.connect(masterGain.current!);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    };

    const playWrongSound = () => {
      if (!audioCtx.current || muted) return;
      if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
      
      const now = audioCtx.current.currentTime;
      
      // Low buzzy disharmony
      [220, 226].forEach((freq) => {
        const osc = audioCtx.current!.createOscillator();
        const gainNode = audioCtx.current!.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq - 40, now + 0.25);
        
        gainNode.gain.setValueAtTime(0.18, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.25);
        
        osc.connect(gainNode);
        gainNode.connect(masterGain.current!);
        
        osc.start(now);
        osc.stop(now + 0.3);
      });
    };

    const playVictorySound = () => {
      if (!audioCtx.current || muted) return;
      if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
      
      const now = audioCtx.current.currentTime;
      const notes = [440.00, 523.25, 659.25, 783.99, 880.00, 1046.50, 1318.51]; // Rising A minor pentatonic
      
      notes.forEach((freq, idx) => {
        const osc = audioCtx.current!.createOscillator();
        const gainNode = audioCtx.current!.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        
        gainNode.gain.setValueAtTime(0, now + idx * 0.07);
        gainNode.gain.linearRampToValueAtTime(0.12, now + idx * 0.07 + 0.03);
        // Last note sustains longer
        const decayTime = idx === notes.length - 1 ? 1.5 : 0.4;
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + decayTime);
        
        osc.connect(gainNode);
        gainNode.connect(masterGain.current!);
        
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + decayTime + 0.1);
      });
    };

    const playJumpSound = () => {
      if (!audioCtx.current || muted) return;
      if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
      
      const now = audioCtx.current.currentTime;
      const osc = audioCtx.current!.createOscillator();
      const gainNode = audioCtx.current!.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.18);
      
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      
      osc.connect(gainNode);
      gainNode.connect(masterGain.current!);
      
      osc.start(now);
      osc.stop(now + 0.2);
    };

    const playClickSound = () => {
      if (!audioCtx.current || muted) return;
      if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
      
      const now = audioCtx.current.currentTime;
      const osc = audioCtx.current!.createOscillator();
      const gainNode = audioCtx.current!.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      
      osc.connect(gainNode);
      gainNode.connect(masterGain.current!);
      
      osc.start(now);
      osc.stop(now + 0.05);
    };

    (window as any).playCorrectSound = playCorrectSound;
    (window as any).playWrongSound = playWrongSound;
    (window as any).playVictorySound = playVictorySound;
    (window as any).playJumpSound = playJumpSound;
    (window as any).playClickSound = playClickSound;

    return () => {
      delete (window as any).playCorrectSound;
      delete (window as any).playWrongSound;
      delete (window as any).playVictorySound;
      delete (window as any).playJumpSound;
      delete (window as any).playClickSound;
    };
  }, [muted]);

  useEffect(() => {
    // Resume context and run ambient synthesis on first user action
    const initAudio = () => {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        masterGain.current = audioCtx.current.createGain();
        masterGain.current.connect(audioCtx.current.destination);
        
        // Start background music loop
        startMysticMusicLoop();
      }
      
      if (audioCtx.current.state === 'suspended') {
        audioCtx.current.resume();
      }
    };

    // Synthesizes soft, layered background pad chords
    const startMysticMusicLoop = () => {
      let chordIndex = 0;
      
      const playNextChord = () => {
        if (!audioCtx.current || !masterGain.current) return;
        
        const now = audioCtx.current.currentTime;
        const notes = CHORDS[chordIndex % CHORDS.length];
        chordIndex++;
        
        // Duration metrics for overlapping chords (6s cycle, 4s transition)
        const attack = 2.5;
        const sustain = 2.0;
        const release = 2.5;
        const duration = attack + sustain + release;
        
        // Create an oscillator for each note in the chord to build a full warm synth pad
        const chordNodes = notes.map((freq) => {
          const osc = audioCtx.current!.createOscillator();
          const gainNode = audioCtx.current!.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          
          // Smooth gain envelope (Attack - Sustain - Release)
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.015, now + attack); // Very soft base note
          gainNode.gain.setValueAtTime(0.015, now + attack + sustain);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
          
          osc.connect(gainNode);
          gainNode.connect(masterGain.current!);
          
          osc.start(now);
          osc.stop(now + duration + 0.1);
          
          return { osc, gain: gainNode };
        });

        // Store active nodes so we can clean up if muted
        activeMusicNodes.current.push(...chordNodes);
        
        // Filter out stopped nodes from the tracking list
        setTimeout(() => {
          activeMusicNodes.current = activeMusicNodes.current.filter(
            (node) => node.osc.frequency.value !== notes[0]
          );
        }, duration * 1000 + 500);
      };

      // Play soft random melody sparkle notes occasionally
      const playMelodySparkle = () => {
        if (!audioCtx.current || !masterGain.current || muted) return;
        const now = audioCtx.current.currentTime;
        
        const randomNote = MELODY_SCALE[Math.floor(Math.random() * MELODY_SCALE.length)];
        
        const osc = audioCtx.current.createOscillator();
        const gainNode = audioCtx.current.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(randomNote, now);
        
        // Soft sparkling attack and long fading delay
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.008, now + 0.8);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
        
        osc.connect(gainNode);
        gainNode.connect(masterGain.current!);
        
        osc.start(now);
        osc.stop(now + 5.0);
      };

      // Trigger chord progression every 5 seconds (creates a continuous lush overlap)
      playNextChord();
      const chordInterval = setInterval(playNextChord, 5000);
      
      // Play starry sparkles every 2.8 seconds
      const sparkleInterval = setInterval(playMelodySparkle, 2800);

      return () => {
        clearInterval(chordInterval);
        clearInterval(sparkleInterval);
      };
    };

    window.addEventListener('mousedown', initAudio);
    window.addEventListener('keydown', initAudio);
    window.addEventListener('touchstart', initAudio);

    return () => {
      window.removeEventListener('mousedown', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, [muted]);

  useEffect(() => {
    if (masterGain.current && audioCtx.current) {
      // Background volume: slightly lower on start screen, normal during play, fully silent if muted
      const volume = muted ? 0 : (phase === 'start' ? 0.25 : 0.45);
      masterGain.current.gain.setTargetAtTime(volume, audioCtx.current.currentTime, 0.4);
    }
  }, [muted, phase]);

  return null;
}
