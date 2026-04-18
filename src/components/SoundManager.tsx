import { useEffect, useRef } from 'react';
import { useGameStore } from '../store';

export default function SoundManager() {
  const muted = useGameStore((state) => state.muted);
  const phase = useGameStore((state) => state.phase);
  const audioCtx = useRef<AudioContext | null>(null);
  const masterGain = useRef<GainNode | null>(null);
  const droneOsc = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    // Resume context on interaction
    const initAudio = () => {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        masterGain.current = audioCtx.current.createGain();
        masterGain.current.connect(audioCtx.current.destination);
        
        // Ambient Drone
        droneOsc.current = audioCtx.current.createOscillator();
        const droneGain = audioCtx.current.createGain();
        
        droneOsc.current.type = 'triangle';
        droneOsc.current.frequency.setValueAtTime(55, audioCtx.current.currentTime); // Low A
        
        droneGain.gain.setValueAtTime(0, audioCtx.current.currentTime);
        droneGain.gain.exponentialRampToValueAtTime(0.05, audioCtx.current.currentTime + 4);
        
        droneOsc.current.connect(droneGain);
        droneGain.connect(masterGain.current);
        droneOsc.current.start();

        // Add some harmonics
        const harmonic = audioCtx.current.createOscillator();
        const harmonicGain = audioCtx.current.createGain();
        harmonic.type = 'sine';
        harmonic.frequency.setValueAtTime(110.5, audioCtx.current.currentTime);
        harmonicGain.gain.setValueAtTime(0, audioCtx.current.currentTime);
        harmonicGain.gain.exponentialRampToValueAtTime(0.02, audioCtx.current.currentTime + 6);
        harmonic.connect(harmonicGain);
        harmonicGain.connect(masterGain.current);
        harmonic.start();
      }
      
      if (audioCtx.current.state === 'suspended') {
        audioCtx.current.resume();
      }
    };

    window.addEventListener('mousedown', initAudio);
    window.addEventListener('keydown', initAudio);
    window.addEventListener('touchstart', initAudio);

    return () => {
      window.removeEventListener('mousedown', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  useEffect(() => {
    if (masterGain.current && audioCtx.current) {
      const volume = (muted || phase === 'start') ? 0 : 0.4;
      masterGain.current.gain.setTargetAtTime(volume, audioCtx.current.currentTime, 0.5);
    }
  }, [muted, phase]);

  return null;
}
