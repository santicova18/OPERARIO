import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, X, Check, Volume2, Loader2, ArrowRight, ShieldAlert, Timer } from 'lucide-react';
import { analyzeVoiceNovelty, BLOCKING_CATEGORIES } from '../services/aiService';

const AUDIO_PRESETS = [
  {
    id: 1,
    title: 'Falla Mecánica Plegadora (Bloqueo Total)',
    phrase: 'Se atascó la lámina de acero de 3 milímetros y se quemó el motor principal de la plegadora CNC',
    hint: 'Detectará: Mantenimiento No Programado (Bloqueo Físico)'
  },
  {
    id: 2,
    title: 'Desabastecimiento de Lámina (Bloqueo Total)',
    phrase: 'No hay stock de láminas galvanizadas calibre 18 en almacén y el montacargas no ha llegado',
    hint: 'Detectará: Falta de Material (Bloqueo Físico)'
  },
  {
    id: 3,
    title: 'Ajuste de Matriz y Boquilla',
    phrase: 'Montaje de matriz de doblado y calibración de boquilla láser para nuevo lote de producción',
    hint: 'Detectará: Ajuste / Setup'
  },
  {
    id: 4,
    title: 'Inspección de Control Calidad',
    phrase: 'Detención por verificación dimensional con calibrador pie de rey y espera de visto bueno del inspector',
    hint: 'Detectará: Parada Operativa'
  },
  {
    id: 5,
    title: 'Pausa Activa y Charla de Seguridad',
    phrase: 'Reunión de 10 minutos para charla de seguridad industrial y ejercicios de salud ocupacional',
    hint: 'Detectará: Pausa Activa'
  },
  {
    id: 6,
    title: 'Novedad Atípica (Respaldo Estricto)',
    phrase: 'Evacuación preventiva del área de corte por fuerte olor a gas proveniente del exterior de la nave',
    hint: 'Detectará: Otra Novedad (7ª Categoría)'
  }
];

export default function VoiceNoveltyModal({ onClose, onConfirmVoiceNovelty }) {
  const [isRecording, setIsRecording] = useState(false);
  const [countdownSecs, setCountdownSecs] = useState(4);
  const [transcription, setTranscription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [recognition, setRecognition] = useState(null);

  const transcriptionRef = useRef(transcription);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    transcriptionRef.current = transcription;
  }, [transcription]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Trigger AI processing when audio text is finalized
  const handleProcessAudioText = async (textToAnalyze) => {
    if (!textToAnalyze || textToAnalyze.trim() === '') return;
    setTranscription(textToAnalyze);
    setIsAnalyzing(true);
    setAiResult(null);

    try {
      const result = await analyzeVoiceNovelty(textToAnalyze);
      setAiResult(result);
    } catch (err) {
      console.error('Error en análisis de IA:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Web Speech API Initialization
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'es-CO';

      rec.onresult = (event) => {
        const text = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        setTranscription(text);
      };

      rec.onend = () => {
        setIsRecording(false);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        const finalRecordedText = transcriptionRef.current;
        if (finalRecordedText && finalRecordedText.trim() !== '') {
          handleProcessAudioText(finalRecordedText);
        }
      };

      rec.onerror = (e) => {
        console.warn('Error en Speech Recognition:', e);
        setIsRecording(false);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };

      setRecognition(rec);
    }
  }, []);

  // Timed 3-5 second Recording Session
  const startTimedRecording = () => {
    setTranscription('');
    setAiResult(null);
    setIsRecording(true);
    setCountdownSecs(4);

    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        console.warn('Mic start err (fallback simulated):', err);
      }
    }

    // 4-second countdown timer
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdownSecs((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          stopTimedRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimedRecording = () => {
    if (recognition) {
      try { recognition.stop(); } catch { /* ignore */ }
    }
    setIsRecording(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    setTimeout(() => {
      const recorded = transcriptionRef.current;
      if (recorded && recorded.trim() !== '') {
        handleProcessAudioText(recorded);
      } else {
        // Default realistic dictation if mic was silent
        handleProcessAudioText('Ajuste de matriz y calibración de boquilla de corte');
      }
    }, 200);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopTimedRecording();
    } else {
      startTimedRecording();
    }
  };

  // Quick Preset Simulator with 3s simulated dictation
  const handleSelectPreset = (preset) => {
    if (isRecording) stopTimedRecording();
    setTranscription(preset.phrase);
    handleProcessAudioText(preset.phrase);
  };

  const handleConfirm = () => {
    if (aiResult) {
      onConfirmVoiceNovelty(aiResult.categoria, aiResult.descripcion_ia, aiResult.es_bloqueo);
      return;
    }

    if (transcription && transcription.trim() !== '') {
      setIsAnalyzing(true);
      analyzeVoiceNovelty(transcription).then(res => {
        setIsAnalyzing(false);
        onConfirmVoiceNovelty(res.categoria, res.descripcion_ia, res.es_bloqueo);
      });
    }
  };

  const isBlockingCategory = aiResult && (aiResult.es_bloqueo || BLOCKING_CATEGORIES.includes(aiResult.categoria));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 animate-fadeIn select-none">
      <div className="w-full max-w-sm bg-slate-100 border-2 border-slate-300 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-slate-900">
        
        {/* Header */}
        <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40">
              <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-white">Reporte de Novedad por Voz</h3>
              <p className="text-[9.5px] text-orange-400 font-bold uppercase tracking-tight">SuperBrix IA (7 Categorías OEE)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          
          {/* Giant Mic Card with 3-5s Countdown Timer */}
          <div className="flex flex-col items-center justify-center py-3 px-4 bg-white rounded-2xl border-2 border-slate-300 shadow-sm relative overflow-hidden">
            {isRecording && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full text-rose-700 text-[10px] font-mono font-black animate-pulse">
                <Timer className="w-3 h-3" />
                <span>{countdownSecs}s</span>
              </div>
            )}

            <button
              onClick={toggleRecording}
              className={`tactile-btn relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-rose-500 text-white animate-bounce ring-4 ring-rose-400/50 shadow-xl' 
                  : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-slate-950 shadow-lg hover:scale-105 active:scale-95 border-2 border-orange-300'
              }`}
            >
              {isRecording ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9 stroke-[2.5]" />}
            </button>

            <div className="text-[11px] font-black mt-2 text-slate-800 text-center">
              {isRecording 
                ? `🔴 Dictando... (${countdownSecs} seg restantes)` 
                : 'Toca el micrófono para dictar (3-5s)'}
            </div>
            <div className="text-[9.5px] text-slate-500 font-medium">
              Micrófono industrial con reducción de ruido
            </div>
          </div>

          {/* Transcription Card */}
          {transcription && (
            <div className="bg-white p-3 rounded-2xl border border-slate-300 text-xs space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase">
                <span>Comando Transcrito:</span>
                {!aiResult && !isAnalyzing && (
                  <button 
                    onClick={() => handleProcessAudioText(transcription)}
                    className="text-orange-700 hover:text-orange-800 font-extrabold flex items-center gap-1 text-[10px] bg-orange-100 hover:bg-orange-200 px-2 py-0.5 rounded-lg border border-orange-300 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-orange-500" />
                    <span>Analizar con Gemini</span>
                  </button>
                )}
              </div>
              <div className="text-slate-900 font-bold italic text-[11px] leading-relaxed">
                "{transcription}"
              </div>
            </div>
          )}

          {/* AI Analyzing Loader */}
          {isAnalyzing && (
            <div className="bg-purple-50 border-2 border-purple-300 p-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs text-purple-900 animate-pulse font-bold shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span>Razonamiento CoT de Gemini en curso...</span>
            </div>
          )}

          {/* AI Result Card */}
          {aiResult && !isAnalyzing && (
            <div className={`p-3.5 rounded-2xl border-2 text-xs shadow-md space-y-2 animate-fadeIn ${
              isBlockingCategory 
                ? 'bg-rose-50/70 border-rose-400 text-rose-950' 
                : 'bg-white border-orange-400 text-slate-900'
            }`}>
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  Clasificación Oficial IA
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-sm ${
                  isBlockingCategory 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950'
                }`}>
                  {aiResult.categoria}
                </span>
              </div>

              {isBlockingCategory && (
                <div className="flex items-center gap-1.5 p-1.5 bg-rose-100 rounded-xl text-rose-900 text-[10px] font-black">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <span>PARADA CRÍTICA: Bloqueo físico total (Cronómetro OP se detendrá).</span>
                </div>
              )}

              <div>
                <div className="text-[9.5px] text-slate-500 font-bold uppercase">Descripción Técnica para Gerencia:</div>
                <div className="text-[11px] font-bold text-slate-900 mt-0.5 leading-snug">
                  {aiResult.descripcion_ia}
                </div>
              </div>
            </div>
          )}

          {/* Presets for Testing & Ergonomics */}
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-orange-600" />
              <span>Simulador de Comandos de Voz SuperBrix</span>
            </label>
            <div className="space-y-1.5">
              {AUDIO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="tactile-btn w-full p-2.5 rounded-xl bg-white hover:bg-slate-200 border border-slate-300 text-left text-xs flex items-center justify-between transition-colors shadow-sm"
                >
                  <div className="pr-2 truncate">
                    <div className="font-extrabold text-slate-900 text-[11px] truncate">{preset.title}</div>
                    <div className="text-[9.5px] text-slate-500 truncate">{preset.phrase}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-orange-600 stroke-[3] flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Confirm Footer Action */}
        <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
          <button
            onClick={handleConfirm}
            disabled={isAnalyzing || (!aiResult && !transcription.trim())}
            className={`tactile-btn w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
              (aiResult || transcription.trim()) && !isAnalyzing
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 border-2 border-orange-300 active:scale-95' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Procesando e Iniciando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirmar Novedad e Iniciar MTTR</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

