/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UI/UIOverlay';
import SoundManager from './components/SoundManager';

export default function App() {
  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#050402] font-sans text-white select-none touch-none">
      <SoundManager />
      {/* Main 3D Layer */}
      <div className="absolute inset-0 z-0">
        <GameCanvas />
      </div>

      {/* UI Interaction/HUD Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UIOverlay />
      </div>

      {/* Global CSS for JHIROS Brand and Mobile Fixes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=MedievalSharp&family=Nunito:wght@700;800;900&display=swap');
        
        :root {
          --jhiros-blue: #00BFFF;
          --jhiros-orange: #FFA500;
          --jhiros-pink: #FF69B4;
        }

        .font-serif { font-family: 'MedievalSharp', serif; }
        .font-sans { font-family: 'Nunito', sans-serif; }
        .font-mono { font-family: 'Orbitron', monospace; }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        /* Mobile specific fixes */
        canvas { touch-action: none; outline: none; }
        
        .glass-panel {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 165, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

