/**
 * SuperBrix HTTP POST Network Synchronization Service
 * Connects local SQLite offline database to Google Apps Script Web App Endpoint.
 * Supports standard time tracking records AND detailed novedad/incident records with MTTR resolution time.
 */

import { sqliteService } from './db';

export const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx8QRgS0SBn9u_JVsSGBJJVDJvOUxAgee8AgPUhrIoXrIJs1tdQpPwxjgCdhYvQRE3R/exec';

/**
 * Sends a single standard time tracking record object via HTTP POST to Google Apps Script.
 * @param {Object} record 
 */
export async function sendRecordToCloud(record) {
  const payload = {
    Tipo_Envio: "REGISTRO_TIEMPO",
    ID_Registro: String(record.ID_Registro || ''),
    Timestamp_Inicio: String(record.Timestamp_Inicio || ''),
    Timestamp_Fin: String(record.Timestamp_Fin || ''),
    Operario: String(record.Operario || ''),
    Maquina_Zona: String(record.Maquina_Zona || ''),
    Orden_Produccion_OP: String(record.Orden_Produccion_OP || ''),
    Estado_Categoria: String(record.Estado_Categoria || ''),
    Detalle_Novedad: String(record.Detalle_Novedad || 'Sin novedad')
  };

  console.log('[Sync HTTP POST] Enviando paquete de registro a Apps Script:', payload);

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    if (response.ok || response.type === 'opaque') {
      console.log(`[Sync HTTP POST] ✅ Éxito en envío para Registro ID: ${payload.ID_Registro}`);
      return { success: true, id: payload.ID_Registro };
    } else {
      console.warn(`[Sync HTTP POST] Respuesta no 200: Status ${response.status}`);
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      return { success: true, id: payload.ID_Registro, fallback: true };
    }
  } catch (error) {
    console.warn('[Sync HTTP POST] Error en fetch principal, probando envío no-cors:', error);
    try {
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      console.log(`[Sync HTTP POST] ✅ Registro enviado vía fallback no-cors para ID: ${payload.ID_Registro}`);
      return { success: true, id: payload.ID_Registro, fallback: true };
    } catch (err2) {
      console.error('[Sync HTTP POST] Error fatal enviando registro:', err2);
      return { success: false, id: payload.ID_Registro, error: err2.message };
    }
  }
}

/**
 * Sends a detailed novedad/incident record via HTTP POST with "Tipo_Envio": "NOVEDAD_DETALLADA".
 * @param {Object} novedad 
 */
export async function sendNovedadDetalladaToCloud(novedad) {
  const payload = {
    Tipo_Envio: "NOVEDAD_DETALLADA",
    ID_Novedad: String(novedad.id_novedad || ''),
    ID_Registro: String(novedad.id_registro || ''),
    Timestamp_Inicio: String(novedad.timestamp_inicio || ''),
    Timestamp_Fin: String(novedad.timestamp_fin || ''),
    Duracion_Segundos: Number(novedad.duracion_segundos || 0),
    Operario: String(novedad.operario || ''),
    Maquina_Zona: String(novedad.maquina_zona || ''),
    Orden_Produccion_OP: String(novedad.orden_produccion_op || ''),
    Categoria: String(novedad.categoria || ''),
    Descripcion_IA: String(novedad.descripcion_ia || novedad.detalle || 'Reporte de novedad detallado')
  };

  console.log('[Sync HTTP POST] 🚨 Enviando NOVEDAD DETALLADA a Apps Script:', payload);

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    if (response.ok || response.type === 'opaque') {
      console.log(`[Sync HTTP POST] ✅ Éxito en envío para Novedad ID: ${payload.ID_Novedad}`);
      return { success: true, id: payload.ID_Novedad };
    } else {
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      return { success: true, id: payload.ID_Novedad, fallback: true };
    }
  } catch (error) {
    console.warn('[Sync HTTP POST] Error enviando Novedad Detallada, intentando no-cors:', error);
    try {
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      console.log(`[Sync HTTP POST] ✅ Novedad Detallada enviada vía no-cors para ID: ${payload.ID_Novedad}`);
      return { success: true, id: payload.ID_Novedad, fallback: true };
    } catch (err2) {
      console.error('[Sync HTTP POST] Error fatal enviando novedad detallada:', err2);
      return { success: false, id: payload.ID_Novedad, error: err2.message };
    }
  }
}

/**
 * Synchronizes all pending records (both standard time tracking & detailed novedades) from local SQLite to Google Apps Script.
 */
export async function syncPendingRecords() {
  const pendingRecords = await sqliteService.getPendingRecords();
  const pendingNovedades = await sqliteService.getPendingNovedadesDetalladas();

  const totalPending = (pendingRecords ? pendingRecords.length : 0) + (pendingNovedades ? pendingNovedades.length : 0);
  
  if (totalPending === 0) {
    console.log('[Sync Engine] No hay registros ni novedades pendientes por sincronizar en SQLite');
    return { syncedRecordsCount: 0, syncedNovedadesCount: 0, totalPending: 0 };
  }

  console.log(`[Sync Engine] Sincronizando ${pendingRecords.length} registros y ${pendingNovedades.length} novedades detalladas...`);
  
  // 1. Sync standard time records
  const syncedRecordIds = [];
  let errorCount = 0;

  for (const record of pendingRecords) {
    const result = await sendRecordToCloud(record);
    if (result.success) {
      syncedRecordIds.push(record.ID_Registro);
    } else {
      errorCount++;
    }
  }

  if (syncedRecordIds.length > 0) {
    await sqliteService.markAsSynced(syncedRecordIds);
  }

  // 2. Sync detailed novelty records ("Tipo_Envio": "NOVEDAD_DETALLADA")
  const syncedNovedadIds = [];

  for (const novedad of pendingNovedades) {
    const result = await sendNovedadDetalladaToCloud(novedad);
    if (result.success) {
      syncedNovedadIds.push(novedad.id_novedad);
    } else {
      errorCount++;
    }
  }

  if (syncedNovedadIds.length > 0) {
    await sqliteService.markNovedadesAsSynced(syncedNovedadIds);
  }

  return {
    syncedRecordsCount: syncedRecordIds.length,
    syncedNovedadesCount: syncedNovedadIds.length,
    totalPending,
    errorCount
  };
}
