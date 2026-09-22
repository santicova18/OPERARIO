import React, { useState, useEffect } from 'react';
import { Play, PauseCircle, AlertTriangle, Clock, Radio, ChevronRight } from 'lucide-react';

export default function JuegoEncaje({
  currentSession,
  activeState,
  onStartProduction,
  onOpenPauseView,
  onOpenIncidenciaView,
  onOpenNfcSimulator
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live Stopwatch Counter
  useEffect(() => {
    if (!activeState || !activeState.startTime) {
      setElapsedSeconds(0);
      return;
    }

    const startMs = new Date(activeState.startTime).getTime();
    
    const interval = setInterval(() => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsedSeconds(diffSecs);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeState]);

  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? String(hrs).padStart(2, '0') + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isProductionActive = activeState && activeState.category === 'Operación Normal';

  return (
    <div className="flex-1 flex flex-col p-3 bg-slate-100 text-slate-900 justify-between select-none">
      {/* 1. Context & Active Status Header - Light Industrial Card */}
      <div>
        {/* Machine & OP Header pill */}
        <div 
          onClick={onOpenNfcSimulator}
          className="flex items-center justify-between bg-white border border-slate-300 px-3 py-1.5 rounded-xl text-xs mb-2 cursor-pointer hover:border-slate-400 transition-colors shadow-sm"
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

        {/* Live Stopwatch Banner */}
        <div className={`px-3 py-2 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
          isProductionActive 
            ? 'bg-emerald-50 border-emerald-400 text-emerald-950' 
            : activeState 
            ? 'bg-amber-50 border-amber-400 text-amber-950' 
            : 'bg-white border-slate-300 text-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              isProductionActive ? 'bg-emerald-500 animate-ping' : activeState ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
            }`}></div>
            <div>
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600">
                {activeState ? activeState.category : 'ESTADO EN ESPERA'}
              </div>
              {activeState && activeState.detail && (
                <div className="text-[10px] font-bold truncate max-w-[150px] text-slate-900">
                  {activeState.detail}
                </div>
              )}
            </div>
          </div>

          <div className="font-mono text-base font-black tracking-tight text-slate-900 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
        </div>
      </div>

      {/* 2. THREE FUNCTIONAL ACTION BUTTONS (VIBRANT FUNCTIONAL COLORS PRESERVED) */}
      <div className="flex-1 my-3 flex flex-col gap-2.5 justify-center">
        {/* BUTTON 1: OPERACIÓN NORMAL (VIBRANT GREEN CTA) */}
        <button
          onClick={onStartProduction}
          className={`tactile-btn flex-1 min-h-[95px] w-full p-4 rounded-3xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-4 border-emerald-300 shadow-lg flex items-center justify-between transition-all ${
            isProductionActive ? 'animate-glow-green ring-4 ring-emerald-400/50' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center font-black shadow-md flex-shrink-0">
              <Play className="w-7 h-7 fill-emerald-400 ml-0.5" />
            </div>
            <div className="text-left">
              <div className="text-base font-black uppercase tracking-tight leading-none text-slate-950">
                {isProductionActive ? 'OPERACIÓN NORMAL' : 'INICIAR / RETOMAR'}
              </div>
              <div className="text-[11px] font-extrabold text-slate-900/80 mt-1">
                🟢 Operación Normal
              </div>
            </div>
          </div>
          <ChevronRight className="w-7 h-7 text-slate-950 stroke-[3]" />
        </button>

        {/* BUTTON 2: REGISTRAR PAUSA (INTENSE AMBER / ORANGE BUTTON) */}
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
              <div className="text-[11px] font-extrabold text-slate-900/80 mt-1">
                🟡 Falta Material / Setup
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
              <div className="text-[11px] font-extrabold text-slate-900/80 mt-1">
                🔴 Mantenimiento / Parada
              </div>
            </div>
          </div>
          <ChevronRight className="w-7 h-7 text-slate-950 stroke-[3]" />
        </button>
      </div>

      {/* Operator Footer Label */}
      <div className="text-center text-[10px] font-bold text-slate-600 font-mono py-0.5 tracking-wider">
        OPERARIO: {currentSession.operario}
      </div>
    </div>
  );
}
