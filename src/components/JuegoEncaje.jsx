import React, { useState, useEffect } from 'react';
import { Play, PauseCircle, AlertTriangle, Clock, Radio, ChevronRight, Mic, Timer, CheckCircle, ShieldAlert, LogOut } from 'lucide-react';

export default function JuegoEncaje({
  currentSession,
  activeState,
  activeNovelty,
  opAccumulatedSeconds = 0,
  isOpRunning = true,
  isOpBlocked = false,
  onStartProduction,
  onOpenPauseView,
  onOpenIncidenciaView,
  onOpenNfcSimulator,
  onOpenVoiceModal,
  onFinalizeOpOrShift
}) {
  const [mttrSeconds, setMttrSeconds] = useState(0);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  // Live MTTR Stopwatch for active novelty
  useEffect(() => {
    if (!activeNovelty || !activeNovelty.startTime) {
      setMttrSeconds(0);
      return;
    }

    const startMs = new Date(activeNovelty.startTime).getTime();
    const update = () => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setMttrSeconds(diffSecs);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeNovelty]);

  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? String(hrs).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isProductionActive = activeState && activeState.category === 'Operación Normal';

  return (
    <div className="flex-1 flex flex-col p-3 bg-slate-100 text-slate-900 justify-between select-none overflow-y-auto">
      {/* 1. Header: Station NFC pill & Quick Voice Trigger */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <div 
            onClick={onOpenNfcSimulator}
            className="flex-1 flex items-center justify-between bg-white border border-slate-300 px-2.5 py-1.5 rounded-xl text-xs cursor-pointer hover:border-slate-400 transition-colors shadow-sm"
            title="Toca para cambiar de máquina u operario"
          >
            <div className="flex items-center gap-2 truncate">
              <Radio className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0 animate-pulse" />
              <span className="font-extrabold text-slate-900 text-[11px] truncate">
                {currentSession.maquinaZona}
              </span>
              <span className="text-[10px] text-amber-600 font-mono font-bold">
                {currentSession.ordenProduccion}
              </span>
            </div>
            <span className="text-[9px] bg-slate-200 text-slate-700 border border-slate-300 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
              NFC
            </span>
          </div>

          <button
            onClick={onOpenVoiceModal}
            className="tactile-btn p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm flex items-center justify-center transition-transform active:scale-95"
            title="Reportar Novedad por Voz (IA)"
          >
            <Mic className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* 2. DUAL CHRONOMETER SYSTEM (OP TIME vs MTTR RESOLUTION) */}
        <div className="space-y-1.5">
          {/* Main Production OP Chronometer */}
          <div className={`px-3 py-2 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
            isOpBlocked 
              ? 'bg-rose-50 border-rose-400 text-rose-950' 
              : isProductionActive 
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950' 
              : 'bg-amber-50 border-amber-400 text-amber-950'
          }`}>
            <div className="flex items-center gap-2 truncate">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                isOpBlocked 
                  ? 'bg-rose-500' 
                  : isProductionActive 
                  ? 'bg-emerald-500 animate-ping' 
                  : 'bg-amber-500 animate-pulse'
              }`}></div>
              <div className="truncate">
                <div className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                  {isOpBlocked 
                    ? 'OP DETENIDA (BLOQUEO CRÍTICO)' 
                    : isProductionActive 
                    ? `TIEMPO PRODUCCIÓN (${currentSession.ordenProduccion})` 
                    : `OP EN SEGUNDO PLANO (${currentSession.ordenProduccion})`}
                </div>
                <div className="text-[10px] font-bold truncate max-w-[145px] text-slate-900">
                  {isOpBlocked 
                    ? 'Máquina parada por avería/insumos' 
                    : activeState?.detail || 'Operación activa'}
                </div>
              </div>
            </div>

            <div className="font-mono text-sm font-black tracking-tight text-slate-900 flex items-center gap-1 flex-shrink-0">
              <Clock className={`w-3.5 h-3.5 ${isOpBlocked ? 'text-rose-500' : 'text-slate-600'}`} />
              <span>{formatTimer(opAccumulatedSeconds)}</span>
            </div>
          </div>

          {/* Parallel Sub-Chronometer: MTTR Novelty Duration */}
          {activeNovelty && (
            <div className="px-3 py-2 rounded-2xl bg-white border-2 border-orange-400 shadow-md flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2 truncate">
                <Timer className="w-4 h-4 text-orange-600 animate-spin flex-shrink-0" />
                <div className="truncate">
                  <div className="text-[9px] font-black uppercase text-orange-700 tracking-wider flex items-center gap-1">
                    <span>SUB-CRONÓMETRO MTTR (RESOLUCIÓN)</span>
                    {activeNovelty.isBlocking && (
                      <span className="bg-rose-500 text-white text-[8px] px-1 rounded font-black">BLOQUEO</span>
                    )}
                  </div>
                  <div className="text-[10px] font-extrabold text-slate-900 truncate max-w-[140px]">
                    {activeNovelty.category}: {activeNovelty.detail}
                  </div>
                </div>
              </div>

              <div className="font-mono text-sm font-black text-orange-700 bg-orange-100 px-2 py-0.5 rounded-lg border border-orange-300 flex-shrink-0">
                {formatTimer(mttrSeconds)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. THREE GIANT ERGONOMIC ACTION BUTTONS */}
      <div className="flex-1 my-3 flex flex-col gap-2.5 justify-center">
        {/* BUTTON 1: OPERACIÓN NORMAL (VIBRANT GREEN CTA) */}
        <button
          onClick={onStartProduction}
          className={`tactile-btn flex-1 min-h-[90px] w-full p-4 rounded-3xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-4 border-emerald-300 shadow-lg flex items-center justify-between transition-all ${
            isProductionActive ? 'animate-glow-green ring-4 ring-emerald-400/50' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center font-black shadow-md flex-shrink-0">
              <Play className="w-7 h-7 fill-emerald-400 ml-0.5" />
            </div>
            <div className="text-left">
              <div className="text-base font-black uppercase tracking-tight leading-none text-slate-950">
                {isProductionActive ? 'OPERACIÓN NORMAL' : 'RESOLVER / REANUDAR'}
              </div>
              <div className="text-[11px] font-extrabold text-slate-900/80 mt-1">
                🟢 {activeNovelty ? 'Cierra MTTR y reanuda OP' : 'Operación normal en planta'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-7 h-7 text-slate-950 stroke-[3]" />
        </button>

        {/* BUTTON 2: REGISTRAR PAUSA (INTENSE AMBER BUTTON) */}
        <button
          onClick={onOpenPauseView}
          className="tactile-btn flex-1 min-h-[85px] w-full p-4 rounded-3xl bg-amber-400 hover:bg-amber-300 text-slate-950 border-3 border-amber-200 shadow-md flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black shadow-md flex-shrink-0">
              <PauseCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div className="text-left">
              <div className="text-base font-black uppercase tracking-tight leading-none text-slate-950">
                REGISTRAR PAUSA
              </div>
              <div className="text-[11px] font-extrabold text-slate-900/80 mt-0.5">
                🟡 Falta Material / Setup (Voz IA)
              </div>
            </div>
          </div>
          <ChevronRight className="w-7 h-7 text-slate-950 stroke-[3]" />
        </button>

        {/* BUTTON 3: INCIDENCIA / FIN (ALERT RED BUTTON) */}
        <button
          onClick={onOpenIncidenciaView}
          className="tactile-btn flex-1 min-h-[85px] w-full p-4 rounded-3xl bg-rose-500 hover:bg-rose-400 text-slate-950 border-3 border-rose-300 shadow-md flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 text-rose-400 flex items-center justify-center font-black shadow-md flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div className="text-left">
              <div className="text-base font-black uppercase tracking-tight leading-none text-slate-950">
                INCIDENCIA / FIN
              </div>
              <div className="text-[11px] font-extrabold text-slate-900/80 mt-0.5">
                🔴 Mantenimiento / Parada Crítica
              </div>
            </div>
          </div>
          <ChevronRight className="w-7 h-7 text-slate-950 stroke-[3]" />
        </button>
      </div>

      {/* Operator Footer Label - Clean & Minimalist */}
      <div className="text-center text-[10px] font-bold text-slate-600 font-mono py-1 tracking-wider border-t border-slate-300">
        OPERARIO: {currentSession.operario}
      </div>
    </div>
  );
}


