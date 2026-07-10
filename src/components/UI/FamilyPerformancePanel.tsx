/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore, LEVELS } from '../../store';
import { 
  TrendingUp, Award, Clock, AlertCircle, Share2, 
  Brain, CheckCircle2, ChevronRight, RefreshCw, Smartphone, Mail, Sparkles 
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function FamilyPerformancePanel() {
  const { attemptHistory, playerName, currentLevel, playerUser } = useGameStore();
  const level = LEVELS[currentLevel];

  const [analysisData, setAnalysisData] = useState<{
    analysis: string;
    strengths: string[];
    recommendations: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [copied, setCopied] = useState(false);

  // Compute Core Metrics
  const stats = useMemo(() => {
    if (!attemptHistory || attemptHistory.length === 0) {
      return {
        total: 0,
        correct: 0,
        efficiency: 0,
        averageDuration: 0,
        subcats: [] as { id: string; name: string; total: number; correct: number; pct: number }[]
      };
    }

    const total = attemptHistory.length;
    const correct = attemptHistory.filter(a => a.correct).length;
    const efficiency = total > 0 ? (correct / total) : 0;
    const averageDuration = total > 0 ? Math.round(attemptHistory.reduce((sum, a) => sum + a.duration, 0) / total) : 0;

    // Group by subcategory
    const groups: Record<string, { name: string; total: number; correct: number }> = {};
    attemptHistory.forEach(a => {
      if (!groups[a.subcatId]) {
        groups[a.subcatId] = { name: a.subcatName, total: 0, correct: 0 };
      }
      groups[a.subcatId].total += 1;
      if (a.correct) {
        groups[a.subcatId].correct += 1;
      }
    });

    const subcats = Object.entries(groups).map(([id, g]) => ({
      id,
      name: g.name,
      total: g.total,
      correct: g.correct,
      pct: Math.round((g.correct / g.total) * 100)
    }));

    return {
      total,
      correct,
      efficiency,
      averageDuration,
      subcats
    };
  }, [attemptHistory]);

  // Find hardest and easiest subcategories
  const topicInsights = useMemo(() => {
    if (stats.subcats.length === 0) return { hardest: null, easiest: null };
    
    let hardest = stats.subcats[0];
    let easiest = stats.subcats[0];

    stats.subcats.forEach(s => {
      // Hardest has lowest pct (or in case of tie, more questions)
      if (s.pct < hardest.pct || (s.pct === hardest.pct && s.total > hardest.total)) {
        hardest = s;
      }
      // Easiest has highest pct
      if (s.pct > easiest.pct || (s.pct === easiest.pct && s.total > easiest.total)) {
        easiest = s;
      }
    });

    return { hardest, easiest };
  }, [stats]);

  // Fetch AI-powered Analysis from the backend API proxy
  const fetchAIAnalysis = async () => {
    if (attemptHistory.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerName: playerName || 'El alumno',
          levelName: level.name,
          attempts: attemptHistory,
          averageDuration: stats.averageDuration,
          efficiency: stats.efficiency
        })
      });
      if (!response.ok) throw new Error('No se pudo establecer conexión con el servidor de análisis.');
      const data = await response.json();
      setAnalysisData(data);
    } catch (err: any) {
      console.error(err);
      setError('Surgió un contratiempo al consultar la IA. Mostraremos el análisis predeterminado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIAnalysis();
  }, [attemptHistory]);

  // Sync to Parent Portals
  const handleSyncToPortal = async () => {
    if (!playerUser) {
      console.warn("No logged in student to sync with family portal.");
      setError("Inicia sesión con tu código QR para poder sincronizar.");
      return;
    }
    setSyncStatus('syncing');
    try {
      const cleanUnidad = "t2";
      const cleanActividadId = "juego_algebra";
      const docId = `${playerUser.toLowerCase().trim()}_${cleanUnidad}_${cleanActividadId}`;
      const docRef = doc(db, 'notas', docId);

      // Save the performance report fields under a structured 'reporteFamilia' object
      const reportData = {
        reporteFamilia: {
          analisisIA: analysisData?.analysis || 'Desempeño óptimo de álgebra. Sigue practicando.',
          fortalezas: analysisData?.strengths || [],
          recomendaciones: analysisData?.recommendations || [],
          tiempoPromedio: stats.averageDuration,
          efectividad: Math.round(stats.efficiency * 100),
          temaDificil: topicInsights.hardest?.name || 'Ninguno',
          temaFacil: topicInsights.easiest?.name || 'Ninguno',
          fechaReporte: new Date().toISOString()
        }
      };

      await setDoc(docRef, reportData, { merge: true });
      setSyncStatus('synced');
    } catch (err) {
      console.error("Error syncing family report to Firestore:", err);
      setError("No se pudo guardar el reporte en el portal familiar.");
      setSyncStatus('idle');
    }
  };

  // Copy shareable summary to clipboard
  const handleCopySummary = () => {
    const efficiencyPct = Math.round(stats.efficiency * 100);
    const text = `📊 *Reporte de Desempeño Familiar: ${playerName || 'Explorador'}*
🏫 Nivel: ${level.name}
✨ Efectividad de la sesión: ${efficiencyPct}%
⏱️ Tiempo promedio: ${stats.averageDuration}s por ecuación

🧠 *Fortaleza Clave:* ${topicInsights.easiest ? topicInsights.easiest.name : 'Álgebra General'}
⚠️ *Tema a Reforzar:* ${topicInsights.hardest ? topicInsights.hardest.name : 'Ninguno'}

🔮 *Análisis del Tutor IA:*
"${analysisData?.analysis || '¡Rendimiento sobresaliente! Sigue así para perfeccionar el razonamiento algebraico.'}"

¡Apoyemos juntos el crecimiento matemático de nuestros hijos! 🚀`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (attemptHistory.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-gray-400">
        <AlertCircle className="mx-auto text-amber-500 mb-2" size={32} />
        <p className="text-xs font-mono">No se han registrado ecuaciones resueltas en esta sesión de juego para generar el informe.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-left">
      {/* Upper Title with sparkles */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Brain className="text-purple-400 animate-pulse" size={24} />
          <div>
            <h3 className="font-serif font-black text-lg text-white leading-none">Reporte de Desempeño Familiar</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Monitoreo pedagógico y diagnóstico familiar</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAIAnalysis}
            title="Actualizar diagnóstico"
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Grid of Core Metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Efficiency */}
        <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-xl p-3.5 relative overflow-hidden group">
          <div className="absolute top-2 right-2 p-1 bg-green-500/20 text-green-400 rounded-lg">
            <TrendingUp size={16} />
          </div>
          <span className="text-[8px] uppercase tracking-widest font-mono text-gray-400 font-bold block">Efectividad General</span>
          <span className="text-2xl font-serif font-black text-green-400 block mt-1">
            {Math.round(stats.efficiency * 100)}%
          </span>
          <p className="text-[9px] text-gray-400 mt-1.5 leading-snug">
            {stats.correct} aciertos de {stats.total} ecuaciones planteadas.
          </p>
        </div>

        {/* Metric 2: Average Time */}
        <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-3.5 relative overflow-hidden group">
          <div className="absolute top-2 right-2 p-1 bg-amber-500/20 text-amber-400 rounded-lg">
            <Clock size={16} />
          </div>
          <span className="text-[8px] uppercase tracking-widest font-mono text-gray-400 font-bold block">Tiempo Promedio</span>
          <span className="text-2xl font-serif font-black text-amber-400 block mt-1">
            {stats.averageDuration}s
          </span>
          <p className="text-[9px] text-gray-400 mt-1.5 leading-snug">
            Tiempo de resolución promedio por ecuación.
          </p>
        </div>

        {/* Metric 3: Session State */}
        <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-xl p-3.5 relative overflow-hidden group">
          <div className="absolute top-2 right-2 p-1 bg-purple-500/20 text-purple-400 rounded-lg">
            <Award size={16} />
          </div>
          <span className="text-[8px] uppercase tracking-widest font-mono text-gray-400 font-bold block">Estado de la Sesión</span>
          <span className="text-base sm:text-lg font-serif font-black text-purple-400 block mt-1 truncate">
            {stats.efficiency >= 0.8 ? 'Sobresaliente 🌟' : stats.efficiency >= 0.5 ? 'Buen Avance 👍' : 'Requiere Refuerzo 📐'}
          </span>
          <p className="text-[9px] text-gray-400 mt-1.5 leading-snug truncate">
            Desempeño según escala de competencia.
          </p>
        </div>
      </div>

      {/* SVG STATISTICAL CHARTS (Saves overhead and works flawlessly) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart 1: Time per Equation */}
        <div className="bg-[#0f0f12] border border-white/5 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold flex items-center gap-1">
              ⏱️ Cronometrado de Ecuaciones
            </span>
            <span className="text-[8px] font-mono text-gray-500">Eje Y: Segundos</span>
          </div>

          <div className="w-full h-[150px] relative mt-2 flex items-end justify-between px-2 pt-6 pb-2 bg-black/40 rounded-lg border border-white/5">
            {attemptHistory.map((item, idx) => {
              // Scale height. Say 60s is max visual height (100%)
              const maxHeight = 60;
              const pct = Math.min(100, (item.duration / maxHeight) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-[105%] opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[8px] font-mono text-white p-1 rounded border border-white/10 pointer-events-none z-20 whitespace-nowrap">
                    {item.duration} segundos ({item.correct ? 'Correcta' : 'Incorrecta'})
                  </div>
                  {/* Visual Bar */}
                  <div className="w-4 sm:w-6 bg-white/5 rounded-t-sm h-full flex items-end relative overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ delay: idx * 0.1, type: 'spring' }}
                      className={`w-full rounded-t-sm ${
                        item.correct 
                          ? 'bg-gradient-to-t from-green-600 to-green-400 shadow-[0_0_8px_rgba(34,197,94,0.3)]' 
                          : 'bg-gradient-to-t from-red-600 to-red-400 shadow-[0_0_8px_rgba(220,38,38,0.3)]'
                      }`}
                    />
                  </div>
                  {/* X Axis Label */}
                  <span className="text-[7.5px] font-mono text-gray-500">Ec {idx + 1}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-gray-500 italic text-center">
            *Las barras verdes indican acierto inmediato; las rojas indican que requirió revisión de la explicación.
          </p>
        </div>

        {/* Chart 2: Category Effectiveness */}
        <div className="bg-[#0f0f12] border border-white/5 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold flex items-center gap-1">
              🎯 Dominio por Subcategoría
            </span>
            <span className="text-[8px] font-mono text-gray-500">Porcentaje de acierto</span>
          </div>

          <div className="space-y-2.5 mt-2 overflow-y-auto max-h-[150px] pr-1">
            {stats.subcats.map((sub, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-white font-medium truncate max-w-[190px] sm:max-w-xs" title={sub.name}>
                    {sub.name}
                  </span>
                  <span className={`font-black ${sub.pct >= 80 ? 'text-green-400' : sub.pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {sub.pct}%
                  </span>
                </div>
                {/* Horizontal Progress bar container */}
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${sub.pct}%` }}
                    transition={{ delay: idx * 0.15, duration: 0.8 }}
                    className={`h-full rounded-full ${
                      sub.pct >= 80 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                        : sub.pct >= 50 
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-400' 
                          : 'bg-gradient-to-r from-red-500 to-rose-400'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI PEDAGOGICAL ANALYSIS SECTION */}
      <div className="relative bg-gradient-to-br from-purple-950/20 to-[#0e0c15] border border-purple-500/25 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(168,85,247,0.06)]">
        {/* Absolute Glowing Badge */}
        <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-purple-600 text-white rounded-full text-[8.5px] font-bold uppercase tracking-widest font-mono flex items-center gap-1 shadow-lg shadow-purple-500/25 border border-purple-400/30">
          <Sparkles size={10} className="animate-pulse" />
          <span>Análisis con Inteligencia Artificial</span>
        </div>

        <div className="space-y-4 pt-1">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="text-purple-400 animate-spin" size={28} />
              <div className="text-center">
                <p className="text-xs font-mono text-purple-300 font-black tracking-wider animate-pulse uppercase">Consultando al Tutor Psicopedagógico IA...</p>
                <p className="text-[9px] text-gray-500 mt-0.5">Analizando tiempos de respuesta y patrones de error</p>
              </div>
            </div>
          ) : error || !analysisData ? (
            <div className="space-y-3">
              {/* Error fallback message */}
              {error && (
                <p className="text-[9.5px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 leading-snug">
                  💡 {error}
                </p>
              )}
              {/* Fallback diagnostic paragraph */}
              <div className="bg-black/35 p-3.5 rounded-xl border border-white/5 font-serif text-[11.5px] leading-relaxed text-gray-300 italic">
                "¡Excelente trabajo del estudiante en el nivel actual! Ha completado la sesión con solidez en sus ecuaciones, demostrando compromiso y tenacidad. En casa, sugerimos seguir practicando con juegos lúdicos de balanceo de términos y operaciones aritméticas paso a paso, celebrando siempre el esfuerzo diario para fortalecer su autoeficacia matemática."
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-4"
            >
              {/* AI Diagnostic Text Paragraph */}
              <div className="bg-black/30 p-3.5 sm:p-4 rounded-xl border border-white/5 relative">
                <span className="text-[24px] font-serif font-black text-purple-500/20 absolute top-1 left-2 select-none">“</span>
                <p className="font-serif text-[11.5px] sm:text-xs leading-relaxed text-gray-300 italic px-2 pl-4">
                  {analysisData.analysis}
                </p>
                <span className="text-[24px] font-serif font-black text-purple-500/20 absolute bottom-1 right-2 select-none">”</span>
              </div>

              {/* Strengths & Recommendations Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Fortalezas (Strengths) */}
                <div className="space-y-2">
                  <span className="text-[8px] uppercase tracking-widest font-mono text-green-400 font-bold block flex items-center gap-1">
                    <CheckCircle2 size={10} /> Fortalezas del Alumno
                  </span>
                  <ul className="space-y-1.5 pl-1">
                    {analysisData.strengths?.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[10.5px] text-gray-300">
                        <ChevronRight size={12} className="text-green-500 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sugerencias para el hogar (Recommendations) */}
                <div className="space-y-2">
                  <span className="text-[8px] uppercase tracking-widest font-mono text-purple-400 font-bold block flex items-center gap-1">
                    <Brain size={10} /> Consejos de Apoyo en Casa
                  </span>
                  <ul className="space-y-1.5 pl-1">
                    {analysisData.recommendations?.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[10.5px] text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* PORTAL SYNC & SHARING ACTIONS */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {/* Sync with Parent Portal Button */}
        <button
          onClick={handleSyncToPortal}
          disabled={syncStatus !== 'idle'}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
            syncStatus === 'synced'
              ? 'bg-green-600/10 border-green-500/30 text-green-400 cursor-default'
              : syncStatus === 'syncing'
                ? 'bg-white/5 border-white/10 text-gray-500 cursor-wait'
                : 'bg-[#120a1c] hover:bg-[#1a0e2a] border-purple-500/30 text-purple-300 hover:border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:scale-[1.01]'
          }`}
        >
          {syncStatus === 'synced' ? (
            <>
              <CheckCircle2 size={14} className="text-green-400 animate-bounce" />
              <span>Sincronizado con Portal Familiar</span>
            </>
          ) : syncStatus === 'syncing' ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Sincronizando con Portal...</span>
            </>
          ) : (
            <>
              <Smartphone size={14} />
              <span>Sincronizar con Portal Familiar</span>
            </>
          )}
        </button>

        {/* Copy Report / Share Report Button */}
        <button
          onClick={handleCopySummary}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
            copied
              ? 'bg-green-600/10 border-green-500/30 text-green-400'
              : 'bg-white/5 hover:bg-white/10 border-white/15 text-white hover:border-white/30 hover:scale-[1.01]'
          }`}
        >
          <Share2 size={14} />
          <span>{copied ? '¡Reporte Copiado!' : 'Compartir con Padres (WhatsApp)'}</span>
        </button>
      </div>
    </div>
  );
}
