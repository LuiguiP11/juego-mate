/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UI/UIOverlay';
import SoundManager from './components/SoundManager';

export default function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans text-white select-none">
      <SoundManager />
      {/* Main 3D Layer */}
      <div className="absolute inset-0 z-0">
        <GameCanvas />
      </div>

      {/* UI Interaction/HUD Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UIOverlay />
      </div>

      {/* Global CSS to handle custom fonts and utility keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=MedievalSharp&family=Nunito:wght@700;800;900&display=swap');
        
        .font-serif { font-family: 'MedievalSharp', serif; }
        .font-sans { font-family: 'Nunito', sans-serif; }
        .font-mono { font-family: 'Orbitron', monospace; }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

