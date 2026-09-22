/**
 * SuperBrix Industrial Mobile SQLite Local Persistence Service (Offline-First)
 * Provides relational storage for time tracking & detailed novelty/incident records.
 * Uses IndexedDB local store structured with SQLite schema compatibility.
 */

const DB_NAME = 'SuperBrixSQLiteDB';
const DB_VERSION = 2; // Incremented for new 'novedades_detalladas' table
const STORE_REGISTROS = 'registros_tiempo';
const STORE_NOVEDADES = 'novedades_detalladas';

class SQLiteLocalService {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  /**
   * Initializes the local SQLite/IndexedDB store
   */
  async init() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB not supported, fallback to in-memory store');
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Error opening SQLite Local Store:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('✅ Base de Datos Local SQLite/IndexedDB inicializada correctamente (v2)');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Main Time Tracking Table
        if (!db.objectStoreNames.contains(STORE_REGISTROS)) {
          const store = db.createObjectStore(STORE_REGISTROS, { keyPath: 'ID_Registro' });
          store.createIndex('Sincronizado', 'Sincronizado', { unique: false });
          store.createIndex('Timestamp_Inicio', 'Timestamp_Inicio', { unique: false });
          console.log('Tabla "registros_tiempo" creada en SQLite Local');
        }

        // 2. New Detailed Novelty / Incident Tracking Table
        if (!db.objectStoreNames.contains(STORE_NOVEDADES)) {
          const novStore = db.createObjectStore(STORE_NOVEDADES, { keyPath: 'id_novedad' });
          novStore.createIndex('sincronizado', 'sincronizado', { unique: false });
          novStore.createIndex('id_registro', 'id_registro', { unique: false });
          novStore.createIndex('timestamp_inicio', 'timestamp_inicio', { unique: false });
          console.log('Tabla "novedades_detalladas" creada en SQLite Local');
        }
      };
    });
  }

  /* ========================================================================
   * 1. REGISTROS DE TIEMPO (TABLA PRINCIPAL)
   * ======================================================================== */

  async insertRecord(record) {
    await this.initPromise;
    const formattedRecord = {
      ID_Registro: record.ID_Registro || `REG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      Timestamp_Inicio: record.Timestamp_Inicio || new Date().toISOString(),
      Timestamp_Fin: record.Timestamp_Fin || new Date().toISOString(),
      Operario: record.Operario || 'OPERARIO_SINO',
      Maquina_Zona: record.Maquina_Zona || 'SIN_ESTACION',
      Orden_Produccion_OP: record.Orden_Produccion_OP || 'OP-GENERAL',
      Estado_Categoria: record.Estado_Categoria || 'Operación Normal',
      Detalle_Novedad: record.Detalle_Novedad || 'Sin novedad',
      Sincronizado: record.Sincronizado ? 1 : 0,
      Fecha_Creacion: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      if (!this.db) return resolve(formattedRecord);

      const tx = this.db.transaction([STORE_REGISTROS], 'readwrite');
      const store = tx.objectStore(STORE_REGISTROS);
      const req = store.put(formattedRecord);

      req.onsuccess = () => {
        console.log(`[SQLite Local] Registro guardado: ${formattedRecord.ID_Registro} (${formattedRecord.Estado_Categoria})`);
        resolve(formattedRecord);
      };

      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllRecords() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      const tx = this.db.transaction([STORE_REGISTROS], 'readonly');
      const store = tx.objectStore(STORE_REGISTROS);
      const req = store.getAll();

      req.onsuccess = () => {
        const sorted = (req.result || []).sort((a, b) => 
          new Date(b.Timestamp_Inicio) - new Date(a.Timestamp_Inicio)
        );
        resolve(sorted);
      };

      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getPendingRecords() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      const tx = this.db.transaction([STORE_REGISTROS], 'readonly');
      const store = tx.objectStore(STORE_REGISTROS);
      const index = store.index('Sincronizado');
      const req = index.getAll(0);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async markAsSynced(recordIds) {
    await this.initPromise;
    if (!this.db || !recordIds || recordIds.length === 0) return;

    const tx = this.db.transaction([STORE_REGISTROS], 'readwrite');
    const store = tx.objectStore(STORE_REGISTROS);

    for (const id of recordIds) {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result;
        if (record) {
          record.Sincronizado = 1;
          store.put(record);
        }
      };
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        console.log(`[SQLite Local] ${recordIds.length} registros marcados como SINCRONIZADOS`);
        resolve();
      };
    });
  }

  /* ========================================================================
   * 2. NOVEDADES DETALLADAS E INCIDENCIAS (NUEVA TABLA INDEPENDIENTE)
   * ======================================================================== */

  /**
   * Inserta un registro detallado de novedad o incidencia en SQLite
   * @param {Object} novedad 
   */
  async insertNovedadDetallada(novedad) {
    await this.initPromise;

    const startIso = novedad.timestamp_inicio || new Date().toISOString();
    const endIso = novedad.timestamp_fin || new Date().toISOString();
    
    // Cálculo automático del tiempo exacto de resolución / MTTR en segundos
    let duracionSegundos = novedad.duracion_segundos;
    if (duracionSegundos === undefined || duracionSegundos === null) {
      try {
        const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
        duracionSegundos = Math.max(0, Math.floor(diffMs / 1000));
      } catch {
        duracionSegundos = 0;
      }
    }

    const formattedNovedad = {
      id_novedad: novedad.id_novedad || `NOV-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      id_registro: novedad.id_registro || `REG-REF-${Date.now()}`,
      timestamp_inicio: startIso,
      timestamp_fin: endIso,
      duracion_segundos: Number(duracionSegundos || 0),
      operario: novedad.operario || 'OPERARIO_PLANTA',
      maquina_zona: novedad.maquina_zona || 'ESTACION_GENERAL',
      orden_produccion_op: novedad.orden_produccion_op || 'OP-GENERAL',
      categoria: novedad.categoria || 'Parada Operativa',
      descripcion_ia: novedad.descripcion_ia || novedad.detalle || 'Reporte de novedad detallado',
      sincronizado: novedad.sincronizado ? 1 : 0,
      fecha_creacion: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      if (!this.db) return resolve(formattedNovedad);

      const tx = this.db.transaction([STORE_NOVEDADES], 'readwrite');
      const store = tx.objectStore(STORE_NOVEDADES);
      const req = store.put(formattedNovedad);

      req.onsuccess = () => {
        console.log(`[SQLite Local] Novedad Detallada guardada: ${formattedNovedad.id_novedad} (${formattedNovedad.categoria} - ${formattedNovedad.duracion_segundos}s MTTR)`);
        resolve(formattedNovedad);
      };

      req.onerror = (e) => {
        console.error('[SQLite Local] Error guardando novedad detallada:', e.target.error);
        reject(e.target.error);
      };
    });
  }

  /**
   * Obtiene todas las novedades detalladas almacenadas en SQLite
   */
  async getAllNovedadesDetalladas() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      const tx = this.db.transaction([STORE_NOVEDADES], 'readonly');
      const store = tx.objectStore(STORE_NOVEDADES);
      const req = store.getAll();

      req.onsuccess = () => {
        const sorted = (req.result || []).sort((a, b) => 
          new Date(b.timestamp_inicio) - new Date(a.timestamp_inicio)
        );
        resolve(sorted);
      };

      req.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Obtiene las novedades detalladas pendientes por sincronizar (sincronizado = 0)
   */
  async getPendingNovedadesDetalladas() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      const tx = this.db.transaction([STORE_NOVEDADES], 'readonly');
      const store = tx.objectStore(STORE_NOVEDADES);
      const index = store.index('sincronizado');
      const req = index.getAll(0);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * Marca IDs de novedades detalladas como sincronizadas (sincronizado = 1)
   * @param {Array<string>} novedadIds 
   */
  async markNovedadesAsSynced(novedadIds) {
    await this.initPromise;
    if (!this.db || !novedadIds || novedadIds.length === 0) return;

    const tx = this.db.transaction([STORE_NOVEDADES], 'readwrite');
    const store = tx.objectStore(STORE_NOVEDADES);

    for (const id of novedadIds) {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result;
        if (record) {
          record.sincronizado = 1;
          store.put(record);
        }
      };
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        console.log(`[SQLite Local] ${novedadIds.length} Novedades Detalladas marcadas como SINCRONIZADAS`);
        resolve();
      };
    });
  }

  /* ========================================================================
   * 3. MANTENIMIENTO Y VACIEDAD DE BASE DE DATOS
   * ======================================================================== */

  /**
   * Vacía por completo las dos tablas locales en SQLite (registros_tiempo y novedades_detalladas)
   */
  async clearAllRecords() {
    await this.initPromise;
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_REGISTROS, STORE_NOVEDADES], 'readwrite');
      tx.objectStore(STORE_REGISTROS).clear();
      tx.objectStore(STORE_NOVEDADES).clear();

      tx.oncomplete = () => {
        console.log('[SQLite Local] Ambas tablas (registros_tiempo y novedades_detalladas) vaciadas por completo');
        resolve();
      };

      tx.onerror = (e) => reject(e.target.error);
    });
  }
}

export const sqliteService = new SQLiteLocalService();
