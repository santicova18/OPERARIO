import React from 'react';
import { Wifi, WifiOff, RefreshCw, Database, CheckCircle2 } from 'lucide-react';

export default function SyncStatusBanner({ 
  isOnline, 
  isSimulatedOffline, 
  onToggleSimulatedOffline, 
  pendingCount, 
  isSyncing, 
  onSyncNow,
  totalRecordsCount,
  onOpenHistory 
}) {
  const effectiveOnline = isOnline && !isSimulatedOffline;

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-2 text-xs flex items-center justify-between text-slate-300">
      {/* Network Indicator */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSimulatedOffline}
          title="Toca para cambiar entre Modo En Línea y Modo Desconectado (Simulación Offline)"
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full font-semibold transition-all ${
            effectiveOnline 
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50' 
              : 'bg-amber-950/80 text-amber-400 border border-amber-700/50'
          }`}
        >
          {effectiveOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>OFFLINE (SQLite)</span>
            </>
          )}
        </button>

        {/* SQLite Database Records Pill */}
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          title="Ver registros guardados en la Base de Datos SQLite Local"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono">{totalRecordsCount}</span>
          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
              {pendingCount} pend.
            </span>
          )}
        </button>
      </div>

      {/* Sync Action Button */}
      <button
        onClick={onSyncNow}
        disabled={isSyncing || pendingCount === 0}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-xs transition-all ${
          pendingCount > 0 
            ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm shadow-cyan-950' 
            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
        }`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-200' : ''}`} />
        <span>{isSyncing ? 'Subiendo...' : 'Sincronizar'}</span>
      </button>
    </div>
  );
}
