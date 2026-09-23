import React from 'react';
import { CheckCircle2, X, Play, ShieldAlert } from 'lucide-react';

export default function ConfirmGreenModal({ isOpen, onClose, onConfirm, session, activeState }) {
  if (!isOpen) return null;

  const currentCategory = activeState ? activeState.category : 'Esperando Inicio';
  const isAlreadyNormal = activeState && activeState.category === 'Operación Normal';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-xs bg-slate-100 border-2 border-slate-300 rounded-3xl overflow-hidden shadow-2xl text-slate-900 flex flex-col">
        {/* Header - SuperBrix Industrial Dark Header with Corporate Orange Accent */}
        <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40">
              <ShieldAlert className="w-4 h-4 text-orange-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Confirmar Acción</h3>
              <p className="text-[9.5px] font-bold text-orange-400 uppercase tracking-tight">SuperBrix Control OEE</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Light Industrial Surface */}
        <div className="p-4 space-y-3 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center text-emerald-600 shadow-sm">
            <Play className="w-7 h-7 fill-emerald-500 ml-0.5" />
          </div>

          <h4 className="text-sm font-black text-slate-950 leading-tight">
            {isAlreadyNormal 
              ? '¿Confirmar continuidad de Operación Normal?' 
              : '¿Finalizar labor y reanudar Operación Normal?'}
          </h4>

          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
            {isAlreadyNormal ? (
              <span>El cronómetro de planta continuará sumando tiempo en <strong className="font-extrabold text-emerald-700">Operación Normal</strong>.</span>
            ) : (
              <span>Se cerrará la novedad actual <strong className="font-extrabold text-orange-600">"{currentCategory}"</strong> y el contador cambiará a <strong className="font-extrabold text-emerald-700">Operación Normal</strong>.</span>
            )}
          </p>

          {/* Session Summary Card - Crisp White with Corporate Orange OP Badge */}
          <div className="bg-white border border-slate-300 rounded-2xl p-2.5 text-[10.5px] font-mono text-left space-y-1 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold">Orden Producción:</span>
              <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 font-extrabold border border-orange-300 text-[10px]">
                {session?.ordenProduccion || 'OP-N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-1">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold">Estación / Máquina:</span>
              <span className="text-slate-900 font-extrabold text-[10px] truncate max-w-[140px]">
                {session?.maquinaZona || 'Sin asignar'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="tactile-btn w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 border-2 border-emerald-300 transition-transform active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>CONFIRMAR OPERACIÓN</span>
            </button>

            <button
              onClick={onClose}
              className="tactile-btn w-full py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider border border-slate-300 transition-colors shadow-sm"
            >
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
