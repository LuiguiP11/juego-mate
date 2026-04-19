/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Printer, Home, Share2, ArrowRight } from 'lucide-react';
import { useGameStore, LEVELS } from '../../store';

export default function CertificateScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playerName, currentLevel, score, lives, resetGame, nextLevel, totalPoints } = useGameStore();
  const level = LEVELS[currentLevel];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0e0804');
    bg.addColorStop(0.5, '#1a1206');
    bg.addColorStop(1, '#0a0604');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Borders
    ctx.strokeStyle = '#c8900a';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, W - 70, H - 70);

    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 42px serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICADO DE LOGRO', W / 2, 110);
    
    ctx.fillStyle = 'rgba(255, 165, 0, 0.6)';
    ctx.font = 'italic 18px serif';
    ctx.fillText('Jairo\'s Adventure 3D: Maestría Matemática', W / 2, 140);

    // Content
    ctx.fillStyle = '#eee';
    ctx.font = '22px sans-serif';
    ctx.fillText('Hacemos constar que el explorador', W / 2, 210);

    // Name
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 52px serif';
    ctx.fillText(playerName.toUpperCase() || 'INVESTIGADOR DESCONOCIDO', W / 2, 280);

    // Divider
    ctx.strokeStyle = 'rgba(200, 144, 10, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 200, 300);
    ctx.lineTo(W / 2 + 200, 300);
    ctx.stroke();

    // Achievement
    ctx.fillStyle = '#ccc';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Ha superado los desafíos ancestrales del NIVEL ${currentLevel + 1}:`, W / 2, 340);
    
    ctx.fillStyle = '#ffa500';
    ctx.font = 'bold 32px serif';
    ctx.fillText(level.name.toUpperCase(), W / 2, 385);

    // Stats
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`PUNTOS ACUMULADOS: ${totalPoints} PTS`, W / 2, 440);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '14px sans-serif';
    ctx.fillText(`LOGRO: 2 PUNTOS POR NIVEL  |  VIDAS RESTANTES: ${lives}`, W / 2, 470);

    // Inventory
    const inventory = useGameStore.getState().inventory;
    if (inventory.length > 0) {
        ctx.fillStyle = '#39ff14';
        ctx.font = 'italic 12px monospace';
        ctx.fillText(`COLECCIÓN: ${inventory.join(' • ')}`, W / 2, 500);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '10px monospace';
    ctx.fillText(`FECHA DE EXPEDICIÓN: ${new Date().toLocaleDateString()}  |  ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, W / 2, 510);

    // Badge
    ctx.beginPath();
    ctx.arc(W - 120, H - 120, 60, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200, 144, 10, 0.1)';
    ctx.fill();
    ctx.strokeStyle = '#c8900a';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px serif';
    ctx.fillText('OFICIAL', W - 120, H - 110);
  }, [playerName, currentLevel, score, lives]);

  const download = () => {
    const link = document.createElement('a');
    link.download = `Certificado_Jhiro_${playerName}.png`;
    link.href = canvasRef.current?.toDataURL() || '';
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center p-8 overflow-y-auto pointer-events-auto"
    >
      <div className="max-w-3xl w-full flex flex-col items-center gap-6">
        <header className="text-center space-y-2">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="flex items-center justify-center gap-2 text-yellow-400"
          >
            <Trophy size={32} />
            <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight">¡HONOR Y GLORIA!</h1>
          </motion.div>
          <p className="text-gray-400 font-sans tracking-widest text-[10px] uppercase">Reclama tu pergamino de reconocimiento</p>
        </header>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative bg-black rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(255,215,0,0.15)] group"
        >
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={550} 
            className="w-full h-auto max-w-[600px] block"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 p-2">
            <p className="text-white/60 text-[8px] uppercase font-bold tracking-[0.3em]">Certificado Digital Autenticado</p>
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 w-full">
          <button
            onClick={download}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-black rounded-xl font-black uppercase text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-yellow-500/20"
          >
            <Download size={16} />
            Imagen
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-xl border border-white/20 font-black uppercase text-[10px] hover:bg-white/20 transition-all"
          >
            <Printer size={16} />
            Imprimir
          </button>
          <button
            onClick={nextLevel}
            className="w-full sm:flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 text-white rounded-xl font-black uppercase text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-600/30 ring-2 ring-orange-400/20"
          >
            <ArrowRight size={18} />
            {currentLevel < LEVELS.length - 1 ? 'Siguiente Nivel' : 'Finalizar Crónica'}
          </button>
          <button
            onClick={resetGame}
            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 bg-white/5 text-gray-400 rounded-xl border border-white/10 font-black uppercase text-[9px] hover:bg-white/10 transition-all"
          >
            <Home size={16} />
            Inicio
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Trophy({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 22V18" />
      <path d="M14 22V18" />
      <path d="M18 4H6v11a6 6 0 0 0 12 0V4Z" />
    </svg>
  );
}
