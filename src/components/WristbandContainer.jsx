import React, { useState, useEffect } from 'react';
import { Watch, Smartphone, Battery, Radio, Database } from 'lucide-react';

export default function WristbandContainer({ 
  children, 
  onOpenNfcSimulator,
  onOpenHistory,
  pendingCount,
  totalRecordsCount
}) {
  const [viewMode, setViewMode] = useState('watch');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCurrentTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center justify-center p-2 sm:p-4 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Viewport Header Bar - Ruggedized Titanium Header */}
      <header className="w-full max-w-sm flex items-center justify-between bg-slate-900 border border-slate-700 px-3 py-2 rounded-2xl mb-2 text-xs text-slate-100 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-extrabold text-white uppercase tracking-wider text-[11px]">SuperBrix OS</span>
        </div>

        {/* SQLite Database Quick Pill */}
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-[10px] font-mono transition-colors shadow-sm"
          title="Ver registros SQLite guardados localmente"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-white font-bold">{totalRecordsCount}</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-slate-950 font-black">
              {pendingCount}
            </span>
          )}
        </button>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setViewMode('watch')}
            className={`p-1 rounded-lg text-[10px] font-bold transition-all ${
              viewMode === 'watch' ? 'bg-slate-200 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vista Manilla Inteligente"
          >
            <Watch className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-1 rounded-lg text-[10px] font-bold transition-all ${
              viewMode === 'mobile' ? 'bg-slate-200 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vista Móvil Expandida"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Wearable Viewport */}
      <main className="w-full flex items-center justify-center">
        {viewMode === 'watch' ? (
          /* Smartband Watch Bezel Container - Matte Titanium Casing with Corner Screws */
          <div className="relative flex flex-col items-center">
            {/* Top Watch Strap Visual */}
            <div className="w-36 h-7 bg-gradient-to-b from-slate-600 to-slate-700 rounded-t-2xl border-t border-x border-slate-500 shadow-md flex items-center justify-center">
              <div className="w-14 h-1 bg-slate-800 rounded-full"></div>
            </div>

            {/* Smartband Watch Bezel */}
            <div className="smartband-frame shadow-2xl flex flex-col">
              {/* Watch Status Bar (Dark Header Rim as in Reference Device) */}
              <div className="bg-slate-950 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-200 border-b border-slate-800">
                <span className="font-black text-cyan-400">{currentTime || '14:50'}</span>
                
                <button
                  onClick={onOpenNfcSimulator}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-100 border border-slate-600 shadow-sm font-bold"
                >
                  <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span>NFC</span>
                </button>

                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-emerald-400 font-bold">98%</span>
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Watch Display Screen Content (Light Grayish-White Background) */}
              <div className="smartband-screen flex-1 flex flex-col overflow-hidden">
                {children}
              </div>
            </div>

            {/* Bottom Watch Strap Visual */}
            <div className="w-36 h-7 bg-gradient-to-t from-slate-600 to-slate-700 rounded-b-2xl border-b border-x border-slate-500 shadow-md flex items-center justify-center">
              <div className="w-14 h-1 bg-slate-800 rounded-full"></div>
            </div>
          </div>
        ) : (
          /* Expanded Full Mobile Frame */
          <div className="w-full max-w-sm h-[88vh] bg-slate-100 border border-slate-300 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}
