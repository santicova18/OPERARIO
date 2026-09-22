import React from 'react';
import { X, Database, CheckCircle, Clock, UploadCloud, Trash2 } from 'lucide-react';

export default function RecordHistoryModal({ records, onClose, onSyncNow, onClearHistory, isSyncing }) {
  const pendingRecords = records.filter(r => r.Sincronizado === 0);
  const syncedRecords = records.filter(r => r.Sincronizado === 1);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-100 border border-slate-300 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header - Industrial Dark Charcoal Header */}
        <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-white">Base de Datos SQLite Local</h3>
              <p className="text-[11px] text-slate-400 font-medium">Registros Relacionales del Dispositivo</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col overflow-hidden">
          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white p-2.5 rounded-2xl border border-slate-300 text-center shadow-sm">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Pendientes por Subir</div>
              <div className="text-xl font-mono font-black text-amber-600">{pendingRecords.length}</div>
            </div>
            <div className="bg-white p-2.5 rounded-2xl border border-slate-300 text-center shadow-sm">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Sincronizados HTTP POST</div>
              <div className="text-xl font-mono font-black text-emerald-600">{syncedRecords.length}</div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center gap-2 mb-3">
            {pendingRecords.length > 0 && (
              <button
                onClick={onSyncNow}
                disabled={isSyncing}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider transition-all"
              >
                <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span>{isSyncing ? 'Enviando...' : `Subir (${pendingRecords.length})`}</span>
              </button>
            )}

            {records.length > 0 && (
              <button
                onClick={onClearHistory}
                className="py-2.5 px-3.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                title="Vaciar historial de SQLite"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Vaciar</span>
              </button>
            )}
          </div>

          {/* Records List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {records.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-mono font-semibold">
                ✅ Base de datos SQLite vacía y limpia.
              </div>
            ) : (
              records.map((rec) => {
                const isSynced = rec.Sincronizado === 1;
                return (
                  <div 
                    key={rec.ID_Registro} 
                    className={`p-3 rounded-2xl border text-xs shadow-sm transition-all ${
                      isSynced 
                        ? 'bg-white border-slate-300 text-slate-800' 
                        : 'bg-amber-50 border-amber-300 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-slate-900 text-[11px]">{rec.Estado_Categoria}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 ${
                        isSynced 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-200 text-amber-900 border border-amber-400'
                      }`}>
                        {isSynced ? <CheckCircle className="w-3 h-3 text-emerald-700" /> : <Clock className="w-3 h-3 text-amber-700" />}
                        {isSynced ? 'Sincronizado' : 'SQLite Local'}
                      </span>
                    </div>

                    {rec.Detalle_Novedad && (
                      <div className="text-[11px] text-slate-600 font-semibold italic mb-1.5">
                        "{rec.Detalle_Novedad}"
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 font-mono pt-1.5 border-t border-slate-200">
                      <div>Inicio: <span className="text-slate-900 font-bold">{formatTime(rec.Timestamp_Inicio)}</span></div>
                      <div>Fin: <span className="text-slate-900 font-bold">{formatTime(rec.Timestamp_Fin)}</span></div>
                      <div>Duración: <span className="text-cyan-700 font-extrabold">{calculateDuration(rec.Timestamp_Inicio, rec.Timestamp_Fin)}</span></div>
                      <div>OP: <span className="text-amber-700 font-extrabold">{rec.Orden_Produccion_OP}</span></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
