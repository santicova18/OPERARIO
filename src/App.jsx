import React, { useState, useEffect, useRef } from 'react';
import { sqliteService } from './services/db';
import { syncPendingRecords } from './services/sync';
import { BLOCKING_CATEGORIES } from './services/aiService';
import WristbandContainer from './components/WristbandContainer';
import JuegoEncaje from './components/JuegoEncaje';
import SecondaryViews from './components/SecondaryViews';
import NfcSimulator from './components/NfcSimulator';
import RecordHistoryModal from './components/RecordHistoryModal';
import VoiceNoveltyModal from './components/VoiceNoveltyModal';
import ConfirmGreenModal from './components/ConfirmGreenModal';
import SplashScreen from './components/SplashScreen';

export default function App() {
  // 1. Sequential Navigation: Screen 1 (Splash) -> Screen 2 (NFC) -> Screen 3 (Main Dashboard)
  const [activeView, setActiveView] = useState('splash');

  // 2. Session Context (Operario, Máquina y OP requeridos)
  const [session, setSession] = useState({
    operario: 'Operario 1',
    maquinaZona: '',
    ordenProduccion: ''
  });

  // 3. Active State & Dual Chronometer Engine
  // Active State: { category, detail, startTime, recordId }
  const [activeState, setActiveState] = useState(null);

  // Sub-Cronómetro Paralelo (MTTR): { id_novedad, id_registro, startTime, category, detail, isBlocking }
  const [activeNovelty, setActiveNovelty] = useState(null);

  // Cronómetro Principal de OP (Producción en Segundo Plano vs Bloqueo Crítico)
  const [opAccumulatedSeconds, setOpAccumulatedSeconds] = useState(0);
  const [isOpRunning, setIsOpRunning] = useState(false);
  const [isOpBlocked, setIsOpBlocked] = useState(false);

  // Modals & SQLite Persistence
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showConfirmGreenModal, setShowConfirmGreenModal] = useState(false);
  const [cierreInfo, setCierreInfo] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [sqliteRecords, setSqliteRecords] = useState([]);
  const [sqliteNovedades, setSqliteNovedades] = useState([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Ref to hold current state inside unmount / async closures
  const activeStateRef = useRef(activeState);
  const activeNoveltyRef = useRef(activeNovelty);
  const sessionRef = useRef(session);

  useEffect(() => { activeStateRef.current = activeState; }, [activeState]);
  useEffect(() => { activeNoveltyRef.current = activeNovelty; }, [activeNovelty]);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Initial Load & Network Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshSqliteData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Live Timer for Main OP Production Chronometer
  useEffect(() => {
    if (!isOpRunning || !session.ordenProduccion) return;

    const opInterval = setInterval(() => {
      setOpAccumulatedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(opInterval);
  }, [isOpRunning, session.ordenProduccion]);

  const refreshSqliteData = async () => {
    try {
      const allRecs = await sqliteService.getAllRecords();
      const allNovs = await sqliteService.getAllNovedadesDetalladas();
      setSqliteRecords(allRecs);
      setSqliteNovedades(allNovs);

      const pendingRecs = await sqliteService.getPendingRecords();
      const pendingNovs = await sqliteService.getPendingNovedadesDetalladas();
      setPendingSyncCount((pendingRecs?.length || 0) + (pendingNovs?.length || 0));
    } catch (err) {
      console.error('Error refreshing SQLite data:', err);
    }
  };

  // State Transition & Dual Chronometer Engine
  const executeStateChange = async (newCategoryTitle, detailText, isBlockingExplicit) => {
    const nowIso = new Date().toISOString();
    const currentSession = sessionRef.current;
    const currentActiveState = activeStateRef.current;
    const currentNovelty = activeNoveltyRef.current;

    // 1. Finalize previous novelty sub-chronometer (MTTR) if one was active
    if (currentNovelty) {
      const startMs = new Date(currentNovelty.startTime).getTime();
      const duracionSegundos = Math.max(0, Math.floor((new Date(nowIso).getTime() - startMs) / 1000));

      const novedadToSave = {
        id_novedad: currentNovelty.id_novedad,
        id_registro: currentNovelty.id_registro,
        timestamp_inicio: currentNovelty.startTime,
        timestamp_fin: nowIso,
        duracion_segundos: duracionSegundos,
        operario: currentSession.operario,
        maquina_zona: currentSession.maquinaZona,
        orden_produccion_op: currentSession.ordenProduccion,
        categoria: currentNovelty.category,
        descripcion_ia: currentNovelty.detail || `Novedad de ${currentNovelty.category}`,
        sincronizado: 0
      };

      console.log('💾 [SQLite Local] Guardando MTTR en novedades_detalladas:', novedadToSave);
      await sqliteService.insertNovedadDetallada(novedadToSave);
    }

    // 2. Finalize previous base state in registros_tiempo
    if (currentActiveState) {
      const completedRecord = {
        ID_Registro: currentActiveState.recordId,
        Timestamp_Inicio: currentActiveState.startTime,
        Timestamp_Fin: nowIso,
        Operario: currentSession.operario,
        Maquina_Zona: currentSession.maquinaZona,
        Orden_Produccion_OP: currentSession.ordenProduccion,
        Estado_Categoria: currentActiveState.category,
        Detalle_Novedad: currentActiveState.detail || 'Sin novedad',
        Sincronizado: 0
      };

      console.log('💾 [SQLite Local] Guardando ciclo OEE en registros_tiempo:', completedRecord);
      await sqliteService.insertRecord(completedRecord);
    }

    await refreshSqliteData();

    // Trigger background HTTP POST sync if online
    if (isOnline) {
      handleSyncNow();
    }

    // 3. Start New Active State & Evaluate Dual Chronometer Behavior
    const newRecordId = `REG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const isNormal = newCategoryTitle === 'Operación Normal';

    if (isNormal) {
      // Normal Operation: OP chronometer runs, MTTR sub-chronometer is cleared
      setIsOpRunning(true);
      setIsOpBlocked(false);
      setActiveNovelty(null);
      setActiveState({
        category: 'Operación Normal',
        detail: detailText || 'Operación Normal en Planta',
        startTime: nowIso,
        recordId: newRecordId
      });
    } else {
      // Novelty / Pause / Incident:
      // Check if it's a critical blocking category (e.g. Mantenimiento No Programado or Falta de Material)
      const isBlocking = isBlockingExplicit !== undefined
        ? isBlockingExplicit
        : BLOCKING_CATEGORIES.includes(newCategoryTitle);

      if (isBlocking) {
        // Excepción Crítica: Bloqueo total detiene el cronómetro principal de producción
        setIsOpRunning(false);
        setIsOpBlocked(true);
        console.warn(`🚨 [Bloqueo Crítico] ${newCategoryTitle} detiene cronómetro de OP.`);
      } else {
        // Pausa operativa / seguimiento: OP continúa en segundo plano
        setIsOpRunning(true);
        setIsOpBlocked(false);
        console.log(`⏱️ [Segundo Plano] ${newCategoryTitle} - Cronómetro de OP continúa.`);
      }

      // Iniciar Sub-Cronómetro Paralelo (MTTR)
      const newNoveltyId = `NOV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const noveltyObj = {
        id_novedad: newNoveltyId,
        id_registro: newRecordId,
        startTime: nowIso,
        category: newCategoryTitle,
        detail: detailText,
        isBlocking
      };

      setActiveNovelty(noveltyObj);
      setActiveState({
        category: newCategoryTitle,
        detail: detailText,
        startTime: nowIso,
        recordId: newRecordId
      });
    }
  };

  // Handler: Confirm Machine & OP on Screen 2 (NFC) -> Advance to Screen 3 (Main Dashboard)
  const handleConfirmMachineAndStart = () => {
    if (!session.maquinaZona || !session.ordenProduccion) {
      console.warn('⚠️ Acceso denegado: Seleccione Máquina y OP para continuar.');
      return;
    }
    setOpAccumulatedSeconds(0);
    setIsOpRunning(true);
    setIsOpBlocked(false);
    setActiveView('main');
    executeStateChange('Operación Normal', 'Operación Normal en Planta');
  };

  const handleStartProduction = () => {
    executeStateChange('Operación Normal', 'Operación Normal en Planta');
  };

  const handleSelectReason = (categoryTitle, detailText) => {
    executeStateChange(categoryTitle, detailText);
    setActiveView('main');
  };

  // Handler for AI Voice Novelty Confirmation
  const handleConfirmVoiceNovelty = (aiCategory, aiDescription, isBlocking) => {
    setShowVoiceModal(false);
    const textLower = ((aiDescription || '') + ' ' + (aiCategory || '')).toLowerCase();
    const isCierre = textLower.includes('cierre') || textLower.includes('finaliz') || textLower.includes('fin de turno') || textLower.includes('fin de op') || textLower.includes('100%');

    if (isCierre) {
      console.log('🏁 [Cierre Detectado por Voz] Finalizando OP y redirigiendo a Pantalla 2 (NFC)...');
      const isConflict = aiCategory === 'Parada Operativa' || aiCategory === 'Mantenimiento No Programado' || textLower.includes('conflicto') || textLower.includes('avería') || textLower.includes('falla');
      handleFinalizeOpOrShift(isConflict ? 'conflicto' : 'normal', aiDescription);
    } else {
      executeStateChange(aiCategory, aiDescription, isBlocking);
      setActiveView('main');
    }
  };

  // Ciclo de Retorno: Finalizar OP (Normal o Conflicto) -> Limpiar sesión y volver a Pantalla 2 (NFC)
  const handleFinalizeOpOrShift = async (motivoTipo = 'normal', customDetail = '') => {
    const nowIso = new Date().toISOString();
    const currentSession = sessionRef.current;
    const currentActiveState = activeStateRef.current;
    const currentNovelty = activeNoveltyRef.current;

    const isConflict = motivoTipo === 'conflicto';
    const categoriaFinal = isConflict ? 'Parada Operativa' : 'Operación Normal';
    const defaultDetail = isConflict
      ? `Cierre por Parada Operativa (Motivo Conflictivo) - OP ${currentSession.ordenProduccion || 'SIN_OP'}`
      : `Cierre Automático Exitoso de Operación Normal - OP ${currentSession.ordenProduccion || 'SIN_OP'}`;
    const detalleFinal = customDetail || defaultDetail;

    // 1. Finalize MTTR if open
    if (currentNovelty) {
      const startMs = new Date(currentNovelty.startTime).getTime();
      const duracionSegundos = Math.max(0, Math.floor((new Date(nowIso).getTime() - startMs) / 1000));
      await sqliteService.insertNovedadDetallada({
        id_novedad: currentNovelty.id_novedad,
        id_registro: currentNovelty.id_registro,
        timestamp_inicio: currentNovelty.startTime,
        timestamp_fin: nowIso,
        duracion_segundos: duracionSegundos,
        operario: currentSession.operario,
        maquina_zona: currentSession.maquinaZona,
        orden_produccion_op: currentSession.ordenProduccion,
        categoria: categoriaFinal,
        descripcion_ia: `[${isConflict ? 'Parada Operativa / Conflicto' : 'Cierre Exitoso'}] ${currentNovelty.detail || currentNovelty.category}`,
        sincronizado: 0
      });
    }

    // 2. Finalize active state in registros_tiempo
    if (currentActiveState) {
      await sqliteService.insertRecord({
        ID_Registro: currentActiveState.recordId,
        Timestamp_Inicio: currentActiveState.startTime,
        Timestamp_Fin: nowIso,
        Operario: currentSession.operario,
        Maquina_Zona: currentSession.maquinaZona,
        Orden_Produccion_OP: currentSession.ordenProduccion,
        Estado_Categoria: categoriaFinal,
        Detalle_Novedad: detalleFinal,
        Sincronizado: 0
      });
    } else {
      // In case no state was previously saved, create a definitive closing record
      await sqliteService.insertRecord({
        ID_Registro: `REG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        Timestamp_Inicio: nowIso,
        Timestamp_Fin: nowIso,
        Operario: currentSession.operario,
        Maquina_Zona: currentSession.maquinaZona,
        Orden_Produccion_OP: currentSession.ordenProduccion,
        Estado_Categoria: categoriaFinal,
        Detalle_Novedad: detalleFinal,
        Sincronizado: 0
      });
    }

    await refreshSqliteData();

    // 3. Trigger immediate HTTP POST cloud synchronization
    if (isOnline) {
      handleSyncNow();
    }

    // 4. Reset temporary session variables & dual chronometers
    setSession(prev => ({
      operario: prev.operario,
      maquinaZona: '',
      ordenProduccion: ''
    }));
    setActiveState(null);
    setActiveNovelty(null);
    setOpAccumulatedSeconds(0);
    setIsOpRunning(false);
    setIsOpBlocked(false);

    // 5. Automatic redirect back to Screen 2 (NFC Identification) with corresponding status banner
    setCierreInfo({
      tipo: isConflict ? 'conflicto' : 'normal',
      categoria: categoriaFinal,
      titulo: isConflict ? '⚠️ PARADA OPERATIVA (MOTIVO CONFLICTIVO)' : '¡CIERRE DE OPERACIÓN EXITOSO!',
      subtitulo: isConflict
        ? 'Orden cerrada por parada operativa / conflicto en planta. Seleccione la nueva máquina y la OP.'
        : 'Orden completada con éxito. Seleccione la nueva máquina y la OP para la siguiente labor.'
    });

    console.log(`🔄 [Ciclo de Retorno] Cierre ${isConflict ? 'por Parada Operativa (Conflicto)' : 'Automático Exitoso'} confirmado. Redirigiendo a Pantalla 2 (NFC)...`);
    setActiveView('nfc');
  };

  const handleClearHistory = async () => {
    await sqliteService.clearAllRecords();
    await refreshSqliteData();
  };

  // HTTP POST Sync Engine Trigger
  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      console.log('🚀 Sincronizando con Google Apps Script...');
      await syncPendingRecords();
      await refreshSqliteData();
    } catch (error) {
      console.error('Error en sincronización:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <WristbandContainer
      onOpenNfcSimulator={() => {
        if (activeView !== 'splash') setActiveView('nfc');
      }}
      onOpenHistory={() => setShowHistoryModal(true)}
      pendingCount={pendingSyncCount}
      totalRecordsCount={sqliteRecords.length + sqliteNovedades.length}
    >
      {/* 1. Splash Screen (Logo 2.5s) */}
      {activeView === 'splash' && (
        <SplashScreen onFinish={() => setActiveView('nfc')} />
      )}

      {/* 2. Identification Screen (NFC Station Vinculation) */}
      {activeView === 'nfc' && (
        <NfcSimulator
          currentSession={session}
          onUpdateSession={(fields) => setSession(prev => ({ ...prev, ...fields }))}
          onConfirmMachineAndStart={handleConfirmMachineAndStart}
          showBackButton={activeState !== null}
          cierreInfo={cierreInfo}
          cierreExitoso={Boolean(cierreInfo)}
          onClearCierreExitoso={() => setCierreInfo(null)}
        />
      )}

      {/* 3. Main Dashboard: 3 Giant Buttons & Dual Chronometer */}
      {activeView === 'main' && (
        <JuegoEncaje
          currentSession={session}
          activeState={activeState}
          activeNovelty={activeNovelty}
          opAccumulatedSeconds={opAccumulatedSeconds}
          isOpRunning={isOpRunning}
          isOpBlocked={isOpBlocked}
          onStartProduction={() => handleFinalizeOpOrShift('normal', 'Cierre Automático Exitoso de Operación Normal')}
          onOpenPauseView={() => setActiveView('pause')}
          onOpenIncidenciaView={() => setActiveView('incidencia')}
          onOpenNfcSimulator={() => setActiveView('nfc')}
          onOpenVoiceModal={() => setShowVoiceModal(true)}
        />
      )}

      {/* Secondary Views: Autonomous Voice Focus for each of the 3 states */}
      {activeView === 'normal' && (
        <SecondaryViews
          type="normal"
          onBack={() => setActiveView('main')}
          onSelectReason={handleSelectReason}
          onOpenVoiceModal={() => setShowVoiceModal(true)}
        />
      )}

      {activeView === 'pause' && (
        <SecondaryViews
          type="pause"
          onBack={() => setActiveView('main')}
          onSelectReason={handleSelectReason}
          onOpenVoiceModal={() => setShowVoiceModal(true)}
        />
      )}

      {activeView === 'incidencia' && (
        <SecondaryViews
          type="incidencia"
          onBack={() => setActiveView('main')}
          onSelectReason={handleSelectReason}
          onOpenVoiceModal={() => setShowVoiceModal(true)}
          onFinalizeOpOrShift={(motivo, detalle) => handleFinalizeOpOrShift(motivo || 'conflicto', detalle)}
        />
      )}

      {/* AI Voice Novelty Reporting Modal (Gemini CoT & Timed Recording) */}
      {showVoiceModal && (
        <VoiceNoveltyModal
          onClose={() => setShowVoiceModal(false)}
          onConfirmVoiceNovelty={handleConfirmVoiceNovelty}
        />
      )}

      {/* SQLite Database History Overlay (Dual Tables: OEE Cycles & MTTR Novedades) */}
      {showHistoryModal && (
        <RecordHistoryModal
          records={sqliteRecords}
          novedades={sqliteNovedades}
          onClose={() => setShowHistoryModal(false)}
          onSyncNow={handleSyncNow}
          onClearHistory={handleClearHistory}
          isSyncing={isSyncing}
        />
      )}
    </WristbandContainer>
  );
}

