import React, { useState, useEffect } from 'react';
import { sqliteService } from './services/db';
import { syncPendingRecords } from './services/sync';
import WristbandContainer from './components/WristbandContainer';
import JuegoEncaje from './components/JuegoEncaje';
import SecondaryViews from './components/SecondaryViews';
import NfcSimulator from './components/NfcSimulator';
import RecordHistoryModal from './components/RecordHistoryModal';

export default function App() {
  // Navigation View State: Starts on 'nfc' (Machine selection screen first!)
  const [activeView, setActiveView] = useState('nfc');

  // Session Context (Operario, Maquina/Zona, OP)
  const [session, setSession] = useState({
    operario: 'Juan Pérez (OP-7712)',
    maquinaZona: 'Máquina 04 (Plegadora CNC)',
    ordenProduccion: 'OP-8092'
  });

  // Active State Stopwatch Logic: { category, detail, startTime, recordId }
  const [activeState, setActiveState] = useState(null);

  // Modals & SQLite Persistence
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [sqliteRecords, setSqliteRecords] = useState([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Initial Load, Database Clear & Network Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clear history on startup as requested
    sqliteService.clearAllRecords().then(() => {
      refreshSqliteData();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshSqliteData = async () => {
    try {
      const allRecs = await sqliteService.getAllRecords();
      setSqliteRecords(allRecs);
      const pending = await sqliteService.getPendingRecords();
      setPendingSyncCount(pending.length);
    } catch (err) {
      console.error('Error refreshing SQLite data:', err);
    }
  };

  // 2. State Transition & Automatic Chronometer Engine
  const executeStateChange = async (newCategoryTitle, detailText) => {
    const nowIso = new Date().toISOString();

    // Finalize previous state & write to local SQLite
    if (activeState) {
      const completedRecord = {
        ID_Registro: activeState.recordId,
        Timestamp_Inicio: activeState.startTime,
        Timestamp_Fin: nowIso,
        Operario: session.operario,
        Maquina_Zona: session.maquinaZona,
        Orden_Produccion_OP: session.ordenProduccion,
        Estado_Categoria: activeState.category,
        Detalle_Novedad: activeState.detail || 'Sin novedad',
        Sincronizado: 0
      };

      console.log('💾 Guardando tiempo en SQLite Local:', completedRecord);
      await sqliteService.insertRecord(completedRecord);

      // Save into 'novedades_detalladas' independent table for MTTR duration tracking
      if (activeState.category !== 'Operación Normal' || activeState.detail !== 'Operación Normal en Planta') {
        const novedadRecord = {
          id_novedad: `NOV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          id_registro: activeState.recordId,
          timestamp_inicio: activeState.startTime,
          timestamp_fin: nowIso,
          operario: session.operario,
          maquina_zona: session.maquinaZona,
          orden_produccion_op: session.ordenProduccion,
          categoria: activeState.category,
          descripcion_ia: activeState.detail || `Reporte de ${activeState.category}`,
          sincronizado: 0
        };
        await sqliteService.insertNovedadDetallada(novedadRecord);
      }

      await refreshSqliteData();

      // Trigger background HTTP POST sync if online
      if (isOnline && !isSimulatedOffline) {
        handleSyncNow();
      }
    }

    // Start new active state
    const newRecordId = `REG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setActiveState({
      category: newCategoryTitle,
      detail: detailText,
      startTime: nowIso,
      recordId: newRecordId
    });
  };

  // Handler: Confirm Machine Selection and IMMEDIATELY Start "Operación Normal"
  const handleConfirmMachineAndStart = () => {
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

  const handleClearHistory = async () => {
    await sqliteService.clearAllRecords();
    await refreshSqliteData();
  };

  // 3. HTTP POST Sync Engine Trigger
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
      onOpenNfcSimulator={() => setActiveView('nfc')}
      onOpenHistory={() => setShowHistoryModal(true)}
      pendingCount={pendingSyncCount}
      totalRecordsCount={sqliteRecords.length}
    >
      {/* Dynamic View Navigation */}
      {activeView === 'nfc' && (
        <NfcSimulator
          currentSession={session}
          onUpdateSession={(fields) => setSession(prev => ({ ...prev, ...fields }))}
          onConfirmMachineAndStart={handleConfirmMachineAndStart}
          showBackButton={activeState !== null}
        />
      )}

      {activeView === 'main' && (
        <JuegoEncaje
          currentSession={session}
          activeState={activeState}
          onStartProduction={handleStartProduction}
          onOpenPauseView={() => setActiveView('pause')}
          onOpenIncidenciaView={() => setActiveView('incidencia')}
          onOpenNfcSimulator={() => setActiveView('nfc')}
        />
      )}

      {activeView === 'pause' && (
        <SecondaryViews
          type="pause"
          onBack={() => setActiveView('main')}
          onSelectReason={handleSelectReason}
        />
      )}

      {activeView === 'incidencia' && (
        <SecondaryViews
          type="incidencia"
          onBack={() => setActiveView('main')}
          onSelectReason={handleSelectReason}
        />
      )}

      {/* SQLite Database History Overlay */}
      {showHistoryModal && (
        <RecordHistoryModal
          records={sqliteRecords}
          onClose={() => setShowHistoryModal(false)}
          onSyncNow={handleSyncNow}
          onClearHistory={handleClearHistory}
          isSyncing={isSyncing}
        />
      )}
    </WristbandContainer>
  );
}
