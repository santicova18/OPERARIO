import React from 'react';
import { X, AlertTriangle, ArrowRight } from 'lucide-react';

const CATEGORY_NOVELTY_PRESETS = {
  'Mantenimiento No Programado': [
    'Falla Mecánica en Plegadora',
    'Falla Eléctrica / Control CNC',
    'Desgaste / Rotura Herramienta',
    'Sobrecalentamiento Motor',
    'Falta de Presión Hidráulica'
  ],
  'Falta de Material': [
    'Falta Lámina Acero 3mm',
    'Falta Tornillería Grado 8',
    'Gruero Ocupado / Montacargas',
    'Material Incompleto en Almacén',
    'Sin Corte Previo'
  ],
  'Ajuste / Setup': [
    'Montaje de Troquel / Matriz',
    'Limpieza y Limado de Mesa',
    'Calibración de Parámetros',
    'Inspección Inicial de Seguridad',
    'Cambio de Boquilla Laser'
  ],
  'Parada Operativa': [
    'Revisión Medidas con Calibrador',
    'Defecto de Doblez / Ángulo',
    'Lámina Rayada o Deformada',
    'Esperando Visto Bueno Inspector',
    'Retrabajo de Soldadura'
  ],
  'Pausa Activa': [
    'Reunión de Cambio de Turno',
    'Capacitación de Seguridad',
    'Instrucción de Ingeniero de Planta',
    'Pausa Activa / Salud',
    'Ajuste de Programación OP'
  ]
};

export default function NoveltyModal({ category, onClose, onConfirmDetail }) {
  if (!category) return null;

  const presets = CATEGORY_NOVELTY_PRESETS[category.title] || [
    'Parada Menor sin Especificar',
    'Novedad General de Planta',
    'Ajuste Técnico Operativo'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm p-2 animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-2xl flex flex-col gap-3">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl text-slate-950 font-bold ${category.bgColor}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-200">Detalle de Novedad</h3>
              <p className="text-[11px] font-bold text-slate-400">{category.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 font-medium">
          Seleccione la razón específica para registrar en la Base de Datos:
        </p>

        {/* Preset Tags Grid */}
        <div className="grid grid-cols-1 gap-2 my-1 max-h-60 overflow-y-auto pr-1">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => onConfirmDetail(preset)}
              className="tactile-btn w-full p-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-left text-xs font-semibold text-slate-100 flex items-center justify-between transition-colors shadow-sm"
            >
              <span>{preset}</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          ))}
        </div>

        {/* Quick General Option */}
        <button
          onClick={() => onConfirmDetail(`Novedad en ${category.title}`)}
          className="tactile-btn w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs text-center border border-slate-700"
        >
          Confirmar Sin Especificar Detalle
        </button>
      </div>
    </div>
  );
}
