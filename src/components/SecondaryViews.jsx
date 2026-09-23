import React from 'react';
import { ArrowLeft, Mic, Sparkles, ChevronRight, AlertTriangle, PauseCircle, Play, LogOut } from 'lucide-react';

export default function SecondaryViews({ type, onBack, onSelectReason, onOpenVoiceModal, onFinalizeOpOrShift }) {
  const isNormal = type === 'normal';
  const isPause = type === 'pause';
  const isIncidencia = type === 'incidencia';

  let pageTitle = 'OPERACIÓN NORMAL';
  let IconComponent = Play;
  let iconColor = 'text-emerald-500';
  let questionText = '¿Confirmar reanudación o reportar estado por voz?';

  if (isPause) {
    pageTitle = 'REGISTRAR PAUSA';
    IconComponent = PauseCircle;
    iconColor = 'text-amber-500';
    questionText = '¿Qué detiene o pausa tu labor operativa?';
  } else if (isIncidencia) {
    pageTitle = 'INCIDENCIA / FIN';
    IconComponent = AlertTriangle;
    iconColor = 'text-rose-500';
    questionText = '¿Qué avería o finalización ocurrió en la línea?';
  }

  return (
    <div className="flex-1 flex flex-col p-3 bg-slate-100 text-slate-900 justify-between select-none overflow-hidden animate-fadeIn">
      {/* 1. Header with Back Button */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-300">
        <button
          onClick={onBack}
          className="tactile-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-black shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>VOLVER</span>
        </button>

        <div className="flex items-center gap-1.5">
          <IconComponent className={`w-4 h-4 ${iconColor}`} />
          <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* 2. ULTRA-MINIMALIST CENTERED GIANT VOICE REPORTING CTA */}
      <div className="flex-1 my-auto flex flex-col items-center justify-center space-y-4 px-1">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-[10.5px] font-extrabold uppercase">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" />
            <span>Diagnóstico Autónomo por Voz</span>
          </div>
          <h2 className="text-sm font-black text-slate-900 tracking-tight">
            {questionText}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium max-w-[260px] mx-auto">
            Presiona el botón para dictar durante 3 a 5 segundos. La IA clasificará el evento automáticamente.
          </p>
        </div>

        {/* GIANT AUTONOMOUS VOICE BUTTON */}
        <button
          onClick={onOpenVoiceModal}
          className="tactile-btn w-full p-5 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-between shadow-xl shadow-purple-900/30 border-2 border-purple-300/40 active:scale-95 transition-all group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-slate-950/40 flex items-center justify-center shadow-inner flex-shrink-0 border border-purple-300/30 group-hover:scale-105 transition-transform">
              <Mic className="w-8 h-8 text-purple-100 animate-pulse" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black uppercase tracking-tight flex items-center gap-1.5 leading-snug">
                <span>🎙️ REPORTAR NÚCLEO / NOVEDAD POR VOZ (IA)</span>
              </div>
              <div className="text-[10px] text-purple-200 font-bold mt-1">
                Motor Gemini CoT • 7 Categorías Oficiales
              </div>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-white stroke-[3] flex-shrink-0" />
        </button>

        {/* Quick Direct Actions based on view type */}
        {isNormal && (
          <div className="w-full">
            <button
              onClick={() => onSelectReason('Operación Normal', 'Operación Normal en Planta')}
              className="tactile-btn w-full py-2.5 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 border-2 border-emerald-300 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Confirmar Operación Normal Directa</span>
            </button>
          </div>
        )}

        {isPause && (
          <div className="w-full flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => onSelectReason('Pausa Activa', 'Pausa de bienestar / charla operativa')}
              className="tactile-btn flex-1 py-2 px-2 rounded-xl bg-white hover:bg-slate-200 border border-slate-300 text-[10.5px] font-extrabold text-slate-700 text-center shadow-sm truncate"
            >
              ☕ Pausa Activa
            </button>
            <button
              onClick={() => onSelectReason('Ajuste / Setup', 'Calibración y cambio de herramienta')}
              className="tactile-btn flex-1 py-2 px-2 rounded-xl bg-white hover:bg-slate-200 border border-slate-300 text-[10.5px] font-extrabold text-slate-700 text-center shadow-sm truncate"
            >
              ⚙️ Ajuste / Setup
            </button>
          </div>
        )}

        {isIncidencia && (
          <div className="w-full flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => onSelectReason('Mantenimiento No Programado', 'Falla mecánica imprevista reportada')}
              className="tactile-btn flex-1 py-2 px-2 rounded-xl bg-white hover:bg-slate-200 border border-slate-300 text-[10.5px] font-extrabold text-rose-700 text-center shadow-sm truncate"
            >
              🔧 Falla Mecánica
            </button>
            <button
              onClick={() => {
                if (onFinalizeOpOrShift) onFinalizeOpOrShift();
              }}
              className="tactile-btn flex-1 py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10.5px] font-extrabold text-cyan-300 text-center shadow-sm truncate flex items-center justify-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">🏁 Finalizar OP / Cierre</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Bottom Cancel and Return to Main Panel */}
      <div className="pt-2 border-t border-slate-200">
        <button
          onClick={onBack}
          className="tactile-btn w-full py-2.5 bg-white hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs text-center border border-slate-300 shadow-sm uppercase tracking-wider"
        >
          Cancelar y Volver al Panel
        </button>
      </div>
    </div>
  );
}


