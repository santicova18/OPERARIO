import React from 'react';
import { ArrowLeft, Wrench, Package, Users, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';

const PAUSE_PRESETS = [
  {
    id: 'ajuste_setup',
    title: 'Ajuste / Setup',
    code: '02',
    color: 'bg-sky-500 hover:bg-sky-400 text-slate-950 border-sky-300',
    icon: Wrench,
    options: [
      'Montaje de Troquel / Matriz',
      'Limpieza y Preparación Mesa',
      'Calibración de Parámetros CNC',
      'Cambio de Boquilla Laser'
    ]
  },
  {
    id: 'falta_material',
    title: 'Falta de Material',
    code: '03',
    color: 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-200',
    icon: Package,
    options: [
      'Falta Lámina Acero 3mm',
      'Falta Tornillería Grado 8',
      'Montacargas / Gruero Ocupado',
      'Material Incompleto en Almacén'
    ]
  },
  {
    id: 'pausa_activa',
    title: 'Pausa Activa',
    code: '06',
    color: 'bg-orange-500 hover:bg-orange-400 text-slate-950 border-orange-300',
    icon: Users,
    options: [
      'Reunión Cambio de Turno',
      'Capacitación / Seguridad',
      'Instrucción de Ingeniería',
      'Pausa Activa / Salud'
    ]
  }
];

const INCIDENCIA_PRESETS = [
  {
    id: 'mantenimiento_no_prog',
    title: 'Mantenimiento No Programado',
    code: '04',
    color: 'bg-rose-500 hover:bg-rose-400 text-slate-950 border-rose-300',
    icon: AlertTriangle,
    options: [
      'Falla Mecánica en Plegadora',
      'Falla Eléctrica / Control CNC',
      'Rotura de Herramienta',
      'Falta Presión Hidráulica'
    ]
  },
  {
    id: 'parada_operativa',
    title: 'Parada Operativa',
    code: '05',
    color: 'bg-purple-500 hover:bg-purple-400 text-slate-950 border-purple-300',
    icon: ShieldCheck,
    options: [
      'Revisión Medidas Calibrador',
      'Defecto de Doblez / Ángulo',
      'Lámina Rayada o Deformada',
      'Esperando Visto Bueno Inspector'
    ]
  },
  {
    id: 'finalizar_op',
    title: 'Parada Operativa',
    code: '00',
    color: 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 border-emerald-200',
    icon: CheckCircle2,
    options: [
      'Orden (OP) Completada 100%',
      'Cierre de Turno de Trabajo',
      'Pausa Programada de Planta'
    ]
  }
];

export default function SecondaryViews({ type, onBack, onSelectReason }) {
  const presets = type === 'pause' ? PAUSE_PRESETS : INCIDENCIA_PRESETS;
  const pageTitle = type === 'pause' ? 'REGISTRAR PAUSA' : 'INCIDENCIA O FINALIZAR';
  const subtitle = type === 'pause' ? 'Seleccione categoría de pausa' : 'Seleccione falla o cierre';

  return (
    <div className="flex-1 flex flex-col p-3 bg-slate-100 text-slate-900 overflow-y-auto justify-between select-none">
      {/* Header with Volver Button - Light Styling */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-300">
        <button
          onClick={onBack}
          className="tactile-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-cyan-700 border border-slate-300 text-xs font-bold shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>VOLVER</span>
        </button>

        <div className="text-right">
          <div className="text-[11px] font-black uppercase text-slate-900 tracking-wider">
            {pageTitle}
          </div>
          <div className="text-[9px] text-slate-500 font-semibold">{subtitle}</div>
        </div>
      </div>

      {/* Preset Category Tiles Grid */}
      <div className="flex-1 my-3 flex flex-col gap-2.5 justify-center">
        {presets.map((preset) => {
          const Icon = preset.icon;
          return (
            <div key={preset.id} className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span>{preset.title}</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {preset.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectReason(preset.title, opt)}
                    className={`tactile-btn w-full p-3 rounded-2xl ${preset.color} border-2 text-left font-extrabold text-xs flex items-center justify-between shadow-md transition-all`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 text-slate-950 flex-shrink-0" />
                      <span className="truncate text-slate-950">{opt}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-950 stroke-[3] flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Footer */}
      <button
        onClick={onBack}
        className="tactile-btn w-full py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs text-center border border-slate-300 shadow-sm"
      >
        Cancelar y Volver al Panel
      </button>
    </div>
  );
}
