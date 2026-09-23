import React, { useState } from 'react';
import { Radio, Check, ArrowLeft, User, Cpu, FileSpreadsheet, Play } from 'lucide-react';

const PRESET_OPERATORS = [
  { id: 'OP-7712', name: 'Juan Pérez' },
  { id: 'OP-4309', name: 'Carlos Ruiz' }
];

const PRESET_MACHINES = [
  { id: 'M-04', name: 'Máquina 04 (Plegadora CNC)' },
  { id: 'M-01', name: 'Máquina 01 (Corte Laser)' }
];

const PRESET_OPS = [
  { id: 'OP-8092', desc: 'Chasis Plegado 500' },
  { id: 'OP-5510', desc: 'Tolva Recepción' }
];

export default function NfcSimulator({ currentSession, onUpdateSession, onConfirmMachineAndStart, showBackButton = false }) {
  const [tapMsg, setTapMsg] = useState('');

  const triggerFeedback = (msg) => {
    setTapMsg(msg);
    setTimeout(() => setTapMsg(''), 1500);
  };

  const handleSelectMachine = (m) => {
    onUpdateSession({ maquinaZona: m.name });
    triggerFeedback(`Máquina seleccionada: ${m.id}`);
  };

  const handleSelectOP = (op) => {
    onUpdateSession({ ordenProduccion: op.id });
    triggerFeedback(`Orden (OP): ${op.id}`);
  };

  const handleSelectOperator = (op) => {
    onUpdateSession({ operario: `${op.name} (${op.id})` });
    triggerFeedback(`Operario: ${op.name}`);
  };

  const isMachineSelected = Boolean(currentSession.maquinaZona);
  const isOpSelected = Boolean(currentSession.ordenProduccion);
  const isOperatorSelected = Boolean(currentSession.operario);
  const canProceed = isMachineSelected && isOpSelected && isOperatorSelected;

  const handleConfirm = () => {
    if (!canProceed) {
      triggerFeedback('⚠️ Seleccione Máquina y OP para continuar');
      return;
    }
    onConfirmMachineAndStart();
  };

  return (
    <div className="flex-1 flex flex-col p-3 bg-slate-100 text-slate-900 overflow-y-auto justify-between select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-300">
        {showBackButton ? (
          <button
            onClick={handleConfirm}
            className="tactile-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-cyan-700 border border-slate-300 text-xs font-bold shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>VOLVER</span>
          </button>
        ) : (
          <div className="text-[10px] text-slate-500 font-mono font-bold">PANTALLA 2: IDENTIFICACIÓN</div>
        )}

        <div className="flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-cyan-600 animate-pulse" />
          <span className="text-xs font-black uppercase text-cyan-700">CHIP NFC / ESTACIÓN</span>
        </div>
      </div>

      {/* Cyclic return status banner */}
      {!currentSession.maquinaZona && !currentSession.ordenProduccion && (
        <div className="bg-cyan-50 border border-cyan-300 text-cyan-900 px-3 py-1.5 rounded-xl text-center text-[10.5px] font-bold shadow-sm my-1 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
          <span>Aproxime el chip a la nueva máquina y seleccione la OP</span>
        </div>
      )}

      {tapMsg && (
        <div className="bg-amber-100 border border-amber-400 text-amber-950 px-3 py-1.5 rounded-xl text-center text-xs font-mono font-bold animate-bounce my-1 shadow-sm">
          {tapMsg}
        </div>
      )}

      {/* Preset Selections */}
      <div className="flex-1 my-2 space-y-3 overflow-y-auto pr-1">
        {/* 1. Machines */}
        <div>
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-600" />
              <span>1. Seleccionar Máquina / Celda</span>
            </span>
            {!isMachineSelected && <span className="text-[9px] text-rose-500 font-bold">* Requerido</span>}
          </label>
          <div className="space-y-1">
            {PRESET_MACHINES.map((m) => {
              const isSelected = currentSession.maquinaZona === m.name;
              return (
                <button
                  key={m.id}
                  onClick={() => handleSelectMachine(m)}
                  className={`tactile-btn w-full p-2.5 rounded-xl text-left border flex items-center justify-between transition-all shadow-sm ${
                    isSelected
                      ? 'bg-cyan-50 border-cyan-500 text-cyan-950 font-bold ring-2 ring-cyan-400/40'
                      : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold truncate">{m.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-cyan-600 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Production Orders */}
        <div>
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3 text-amber-600" />
              <span>2. Vincular Orden de Producción (OP)</span>
            </span>
            {!isOpSelected && <span className="text-[9px] text-rose-500 font-bold">* Requerido</span>}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_OPS.map((op) => {
              const isSelected = currentSession.ordenProduccion === op.id;
              return (
                <button
                  key={op.id}
                  onClick={() => handleSelectOP(op)}
                  className={`tactile-btn p-2 rounded-xl text-center border font-mono text-xs transition-all shadow-sm ${
                    isSelected
                      ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-400/40'
                      : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
                  }`}
                >
                  <div className="font-black">{op.id}</div>
                  <div className="text-[9px] text-slate-500 font-sans truncate">{op.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Operators */}
        <div>
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <User className="w-3 h-3 text-emerald-600" />
            <span>3. Confirmar Operario</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_OPERATORS.map((op) => {
              const isSelected = currentSession.operario.includes(op.name);
              return (
                <button
                  key={op.id}
                  onClick={() => handleSelectOperator(op)}
                  className={`tactile-btn p-2 rounded-xl text-center border text-xs font-bold transition-all shadow-sm ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/40'
                      : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
                  }`}
                >
                  <div>{op.name}</div>
                  <div className="text-[9px] font-mono text-slate-500">{op.id}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2 border-t border-slate-200">
        <button
          onClick={handleConfirm}
          disabled={!canProceed}
          className={`tactile-btn w-full py-3 font-black rounded-xl text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 shadow-md transition-all ${
            canProceed 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-900/20 active:scale-95' 
              : 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{canProceed ? 'CONFIRMAR E INICIAR OPERACIÓN' : 'SELECCIONE MÁQUINA Y OP'}</span>
        </button>
      </div>
    </div>
  );
}
