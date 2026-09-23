import React, { useState } from 'react';
import { X, Database, CheckCircle, Clock, UploadCloud, Trash2, Timer, Sparkles } from 'lucide-react';

export default function RecordHistoryModal({ records = [], novedades = [], onClose, onSyncNow, onClearHistory, isSyncing }) {
  const [activeTab, setActiveTab] = useState('oee'); // 'oee' | 'novedades'

  const pendingRecords = records.filter(r => r.Sincronizado === 0);
  const syncedRecords = records.filter(r => r.Sincronizado === 1);
  const pendingNovedades = novedades.filter(n => n.sincronizado === 0);
  const syncedNovedades = novedades.filter(n => n.sincronizado === 1);

  const totalPending = pendingRecords.length + pendingNovedades.length;

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'En curso';
    try {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      const diffMs = endTime - startTime;
      if (diffMs < 0) return '0s';
      const seconds = Math.floor(diffMs / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (mins > 0) return `${mins}m ${secs}s`;
      return `${secs}s`;
    } catch {
      return '--';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 animate-fadeIn select-none">
      <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-white">SQLite Relacional Local</h3>
              <p className="text-[10px] text-cyan-400 font-bold">Base de Datos de Manilla Inteligente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 flex-1 flex flex-col overflow-hidden space-y-3">
          {/* Table Switch Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('oee')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'oee'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Ciclos OEE ({records.length})
            </button>
            <button
              onClick={() => setActiveTab('novedades')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${activeTab === 'novedades'
                  ? 'bg-slate-800 text-orange-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Timer className="w-3.5 h-3.5 text-orange-400" />
              <span>Novedades MTTR ({novedades.length})</span>
            </button>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-center shadow-md">
              <div className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">Pendientes por Subir</div>
              <div className="text-xl font-mono font-black text-amber-400">{totalPending}</div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-center shadow-md">
              <div className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">Sincronizados HTTP</div>
              <div className="text-xl font-mono font-black text-emerald-400">{syncedRecords.length + syncedNovedades.length}</div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center gap-2">
            {totalPending > 0 && (
              <button
                onClick={onSyncNow}
                disabled={isSyncing}
                className="tactile-btn flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider transition-all"
              >
                <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : `Sincronizar Cloud (${totalPending})`}</span>
              </button>
            )}

            {(records.length > 0 || novedades.length > 0) && (
              <button
                onClick={onClearHistory}
                className="tactile-btn py-2.5 px-3.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                title="Vaciar ambas tablas de SQLite"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Vaciar</span>
              </button>
            )}
          </div>

          {/* Tab 1: Registros de Tiempo OEE */}
          {activeTab === 'oee' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {records.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-mono font-semibold bg-slate-950/50 rounded-2xl border border-slate-800">
                  ✅ Tabla 'registros_tiempo' vacía.
                </div>
              ) : (
                records.map((rec) => {
                  const isSynced = rec.Sincronizado === 1;
                  return (
                    <div
                      key={rec.ID_Registro}
                      className={`p-3 rounded-2xl border text-xs shadow-md transition-all ${isSynced
                          ? 'bg-slate-950 border-slate-800 text-slate-200'
                          : 'bg-slate-950 border-amber-500/60 text-slate-100'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-white text-[11px]">{rec.Estado_Categoria}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 ${isSynced
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-amber-950 text-amber-300 border border-amber-700'
                          }`}>
                          {isSynced ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-amber-400" />}
                          {isSynced ? 'Cloud OK' : 'Pendiente'}
                        </span>
                      </div>

                      {rec.Detalle_Novedad && (
                        <div className="text-[10.5px] text-slate-300 font-medium italic mb-1.5">
                          "{rec.Detalle_Novedad}"
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-1 text-[9.5px] text-slate-400 font-mono pt-1.5 border-t border-slate-800/80">
                        <div>Inicio: <span className="text-slate-200 font-bold">{formatTime(rec.Timestamp_Inicio)}</span></div>
                        <div>Fin: <span className="text-slate-200 font-bold">{formatTime(rec.Timestamp_Fin)}</span></div>
                        <div>Duración: <span className="text-cyan-400 font-extrabold">{calculateDuration(rec.Timestamp_Inicio, rec.Timestamp_Fin)}</span></div>
                        <div>OP: <span className="text-amber-400 font-extrabold">{rec.Orden_Produccion_OP}</span></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Novedades Detalladas MTTR */}
          {activeTab === 'novedades' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {novedades.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-mono font-semibold bg-slate-950/50 rounded-2xl border border-slate-800">
                  ℹ️ No hay novedades MTTR registradas en SQLite aún.
                </div>
              ) : (
                novedades.map((nov) => {
                  const isSynced = nov.sincronizado === 1;
                  return (
                    <div
                      key={nov.id_novedad}
                      className={`p-3 rounded-2xl border text-xs shadow-md transition-all ${isSynced
                          ? 'bg-slate-950 border-slate-800 text-slate-200'
                          : 'bg-slate-950 border-orange-500/60 text-slate-100'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-orange-400 text-[11px] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                          <span>{nov.categoria}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 ${isSynced
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-orange-950 text-orange-300 border border-orange-700'
                          }`}>
                          {isSynced ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-orange-400" />}
                          {isSynced ? 'HTTP POST OK' : 'Tipo_Envio: NOVEDAD'}
                        </span>
                      </div>

                      <div className="text-[10.5px] text-slate-200 font-medium mb-1.5 leading-snug">
                        {nov.descripcion_ia}
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[9.5px] text-slate-400 font-mono pt-1.5 border-t border-slate-800/80">
                        <div>MTTR: <span className="text-orange-400 font-extrabold">{nov.duracion_segundos} seg</span></div>
                        <div>OP: <span className="text-amber-400 font-extrabold">{nov.orden_produccion_op}</span></div>
                        <div>Inicio: <span className="text-slate-300 font-bold">{formatTime(nov.timestamp_inicio)}</span></div>
                        <div>Fin: <span className="text-slate-300 font-bold">{formatTime(nov.timestamp_fin)}</span></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

