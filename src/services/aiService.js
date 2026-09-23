/**
 * SuperBrix Industrial AI Voice Classification Service
 * Processes operator voice transcriptions using LLM AI (Google Gemini / Groq Llama 3.3 70B)
 * Forces strict JSON output with 7 official categories including "Otra Novedad" fallback.
 */

export const OFFICIAL_CATEGORIES = [
  'Operación Normal',
  'Ajuste / Setup',
  'Mantenimiento No Programado',
  'Falta de Material',
  'Parada Operativa',
  'Pausa Activa',
  'Otra Novedad' // 7th official fallback category
];

// Categories that physically halt the machine / cause total operational block
export const BLOCKING_CATEGORIES = [
  'Mantenimiento No Programado',
  'Falta de Material'
];

/**
 * Robust rule-based classification fallback for plant environments (SuperBrix OEE System)
 * @param {string} text 
 */
export function fallbackAIClassification(text) {
  const lower = text.toLowerCase();
  
  let category = 'Otra Novedad'; // Default 7th fallback category ONLY if no match found

  if (lower.includes('normal') || lower.includes('reanud') || lower.includes('trabajando') || lower.includes('retom') || lower.includes('inici') || lower.includes('produciendo') || lower.includes('marcha')) {
    category = 'Operación Normal';
  } else if (lower.includes('eléctrica') || lower.includes('motor') || lower.includes('atascó') || lower.includes('avería') || lower.includes('mecánica') || lower.includes('rotura') || lower.includes('falla') || lower.includes('dañó') || lower.includes('dañado') || lower.includes('fuga') || lower.includes('quemó') || lower.includes('broca') || lower.includes('brocas') || lower.includes('hidráulica') || lower.includes('tarjeta') || lower.includes('correctiva')) {
    category = 'Mantenimiento No Programado';
  } else if (lower.includes('material') || lower.includes('lámina') || lower.includes('materia prima') || lower.includes('insumo') || lower.includes('falta') || lower.includes('acabó') || lower.includes('acabaron') || lower.includes('sin tornillo') || lower.includes('tornillo') || lower.includes('tornillos') || lower.includes('perno') || lower.includes('pernos') || lower.includes('piezas') || lower.includes('almacén') || lower.includes('montacargas') || lower.includes('stock') || lower.includes('escasez') || lower.includes('consumible')) {
    category = 'Falta de Material';
  } else if (lower.includes('setup') || lower.includes('matriz') || lower.includes('troquel') || lower.includes('boquilla') || lower.includes('boquillas') || lower.includes('calibración') || lower.includes('ajuste') || lower.includes('limpieza') || lower.includes('preparación') || lower.includes('lote') || lower.includes('parámetro')) {
    category = 'Ajuste / Setup';
  } else if (lower.includes('pausa') || lower.includes('salud') || lower.includes('reunión') || lower.includes('turno') || lower.includes('seguridad') || lower.includes('descanso') || lower.includes('almuerzo') || lower.includes('charla') || lower.includes('capacitación') || lower.includes('bienestar')) {
    category = 'Pausa Activa';
  } else if (lower.includes('calidad') || lower.includes('medida') || lower.includes('medición') || lower.includes('calibrador') || lower.includes('rayada') || lower.includes('deformada') || lower.includes('doblez') || lower.includes('ángulo') || lower.includes('inspector') || lower.includes('parada') || lower.includes('bloqueo') || lower.includes('visto bueno') || lower.includes('100%')) {
    category = 'Parada Operativa';
  }

  // Capitalize technical description
  const cleanDescription = text.trim();
  const enrichedDescription = cleanDescription.charAt(0).toUpperCase() + cleanDescription.slice(1);

  return {
    categoria: category,
    descripcion_ia: `[IA Planta SuperBrix] ${enrichedDescription}`,
    es_bloqueo: BLOCKING_CATEGORIES.includes(category)
  };
}

/**
 * Analyzes operator voice transcriptions using AI inference (Gemini / Groq / Local Heuristics)
 * Employs Chain-of-Thought structured prompt based on SuperBrix manufacturing processes.
 * @param {string} voiceTranscription 
 * @param {string} customApiKey Optional custom API Key
 */
export async function analyzeVoiceNovelty(voiceTranscription, customApiKey = '') {
  if (!voiceTranscription || voiceTranscription.trim() === '') {
    return {
      categoria: 'Otra Novedad',
      descripcion_ia: 'Novedad registrada por voz sin transcripción',
      es_bloqueo: false
    };
  }

  const prompt = `Actúa como un Ingeniero Industrial Senior experto en análisis OEE y sistemas de IA para manufactura metalmecánica avanzada en SuperBrix.

Tu objetivo es analizar la transcripción del dictado por voz de un operario de piso de planta, aplicar razonamiento estructurado paso a paso (Chain of Thought) y clasificar la novedad rigurosamente en una de las 7 categorías oficiales del sistema SuperBrix.

### Marco Contextual y Categorías Oficiales de SuperBrix:
1. "Operación Normal":
   - Línea, celda o máquina ejecutando su orden de producción (OP) dentro de los parámetros esperados, sin interrupciones. Reanudación de labores tras una pausa o inicio de lote.
2. "Ajuste / Setup":
   - Tiempos muertos planeados o técnicos para preparar la máquina: montaje de troqueles, matrices, calibración de parámetros CNC, limpieza de mesas o cambio de boquillas láser.
3. "Mantenimiento No Programado":
   - Detención imprevista originada por fallas físicas, mecánicas, eléctricas o desgaste de herramientas: rotura de brocas/herramientas, fallas hidráulicas, motores atascados, problemas en tarjetas o control CNC, y reparaciones correctivas de emergencia. (BLOQUEO CRÍTICO).
4. "Falta de Material":
   - Escasez, desabastecimiento o retraso logístico de insumos, materias primas o elementos de fijación: falta de láminas de acero, pernos, tornillos, consumibles, demora del montacargas o stock agotado en almacén. (BLOQUEO CRÍTICO).
5. "Parada Operativa":
   - Detenciones por control de calidad, inspecciones, paradas de proceso o cierres de ciclo: medición de piezas con calibrador, defectos de doblez/ángulo, piezas rayadas, espera de visto bueno del inspector, cumplimiento de la OP al 100%, cierre de turno o paradas programadas de planta.
6. "Pausa Activa":
   - Espacios de bienestar, coordinación o alineación del personal operativo: reuniones de cambio de turno, charlas de seguridad/capacitación, instrucciones de ingeniería o pausas activas de salud ocupacional.
7. "Otra Novedad" (Categoría de Respaldo Estricto):
   - Eventos completamente atípicos o emergencias ajenas al proceso metalmecánico (ej. evacuación por sismos, fugas de gas externas o alertas sanitarias). Agota primero las 6 categorías anteriores.

### Formato de Salida Requerido (JSON Estricto):
Responde ÚNICAMENTE con un JSON válido sin bloques markdown adicionales:
{
  "categoria": "EXACTAMENTE una de las 7 categorías oficiales",
  "descripcion_ia": "Redacción técnica breve, clara, profesional y enriquecida en español para gerencia de planta explicando el evento reportado"
}

Comando de voz del operario:
"${voiceTranscription}"`;

  // 1. Try Google Gemini API Call if Key is available
  const geminiKey = customApiKey || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY);
  if (geminiKey) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawContent) {
          const parsed = JSON.parse(rawContent.trim());
          if (parsed.categoria && OFFICIAL_CATEGORIES.includes(parsed.categoria)) {
            console.log('🤖 [Gemini API] Clasificación Exitosa:', parsed);
            return {
              categoria: parsed.categoria,
              descripcion_ia: parsed.descripcion_ia || voiceTranscription,
              es_bloqueo: BLOCKING_CATEGORIES.includes(parsed.categoria)
            };
          }
        }
      }
    } catch (geminiErr) {
      console.warn('⚠️ Fallo en llamada a Gemini API, evaluando fallbacks:', geminiErr);
    }
  }

  // 2. Try Groq API Call if Key is available
  const groqKey = customApiKey || (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_GROQ_API_KEY || import.meta.env?.VITE_GEMINI_API_KEY));
  if (groqKey && !geminiKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.categoria && OFFICIAL_CATEGORIES.includes(parsed.categoria)) {
            console.log('🤖 [Groq AI] Clasificación Exitosa:', parsed);
            return {
              categoria: parsed.categoria,
              descripcion_ia: parsed.descripcion_ia || voiceTranscription,
              es_bloqueo: BLOCKING_CATEGORIES.includes(parsed.categoria)
            };
          }
        }
      }
    } catch (groqErr) {
      console.warn('⚠️ Groq API no disponible, ejecutando motor local:', groqErr);
    }
  }

  // 3. Fallback inteligente determinista de alta precisión basado en léxico SuperBrix
  const localResult = fallbackAIClassification(voiceTranscription);
  console.log('⚡ [Motor IA Local SuperBrix] Clasificación Determinista:', localResult);
  return localResult;
}

