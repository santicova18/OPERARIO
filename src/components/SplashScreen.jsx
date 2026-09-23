import React, { useEffect, useState } from 'react';
import superbrixLogo from '../../superbrix.png';
import { Cpu, ShieldCheck, ChevronRight } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth progress bar over 2.5 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onFinish]);

  return (
    <div 
      onClick={onFinish}
      className="flex-1 flex flex-col items-center justify-between p-4 bg-slate-100 text-slate-900 select-none cursor-pointer relative overflow-hidden animate-fadeIn"
      title="Toca para continuar inmediatamente"
    >
      {/* Top System Tag - Industrial Default Style */}
      <div className="w-full flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-300 text-[10px] font-mono text-slate-700 shadow-sm">
          <Cpu className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
          <span className="font-extrabold uppercase">SUPERBRIX OS</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>v2.4 READY</span>
        </div>
      </div>

      {/* Central Identity & Logo Card */}
      <div className="flex flex-col items-center justify-center my-auto text-center space-y-3">
        {/* Crisp Card around Logo matching default industrial theme */}
        <div className="p-4 bg-white border-2 border-slate-300 rounded-3xl shadow-lg transform hover:scale-105 transition-transform duration-300 flex items-center justify-center">
          <img 
            src={superbrixLogo} 
            alt="SuperBrix Logo" 
            className="w-44 h-auto max-h-24 object-contain filter drop-shadow-sm"
          />
        </div>

        <div className="space-y-1">
          <h1 className="text-base font-black tracking-widest uppercase text-slate-950 font-sans">
            SUPERBRIX
          </h1>
          <p className="text-[11px] font-black text-cyan-700 uppercase tracking-wider">
            Manilla Inteligente de Operario
          </p>
          <p className="text-[10px] text-slate-600 font-bold">
            Control de Tiempos OEE y Reportes IA
          </p>
        </div>
      </div>

      {/* Bottom Loading Progress & Tap to Skip */}
      <div className="w-full space-y-2 pb-2">
        {/* Animated Progress Bar matching default vibrant emerald palette */}
        <div className="w-full bg-slate-200 border border-slate-300 h-2 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Iniciando estación NFC...</span>
          </span>
          <span className="text-slate-500 flex items-center gap-0.5 font-bold hover:text-slate-800">
            <span>Toca para omitir</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
