import { useState, useEffect } from 'react';
import { Lock, Unlock, Clock, CalendarClock } from 'lucide-react';
import styles from './InventoryCorrection.module.css';
import {
  fetchCorrectionWindow,
  saveCorrectionWindow,
  closeCorrectionWindow,
  fetchCorrectionLogs,
} from './inventoryCorrectionApi';
import { getSessionData } from '../component/utils/getSessionData';
import { useStores } from '../context/StoreContext';
import { formatDateTime, toDateTimeLocal } from '../component/utils/date';
import { notify, confirmAction } from '../component/utils/feedback';
import CorrectionHistoryTable from './CorrectionHistoryTable';

const STATE_LABEL = {
  NOT_SET: 'Not set',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Open',
  EXPIRED: 'Closed',
};

const END_PRESETS = [
  { label: '+1 hour', hours: 1 },
  { label: '+4 hours', hours: 4 },
  { label: '+1 day', hours: 24 },
];

const EMPTY_FORM = { startAt: '', endAt: '', storeIds: [] };

const formFromWindow = (correctionWindow) => ({
  startAt: toDateTimeLocal(correctionWindow?.startAt),
  endAt: toDateTimeLocal(correctionWindow?.endAt),
  storeIds: correctionWindow?.allowedStoreIds || [],
});

// Admin: define the correction window (start / end) and the stores allowed to correct inventory in it
const InventoryCorrectionAdmin = () => {
  const { storeId: sessionStoreId } = getSessionData();
  const { stores } = useStores();

  const [correctionWindow, setCorrectionWindow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [historyStoreId, setHistoryStoreId] = useState(sessionStoreId || '');
  const [logs, setLogs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchCorrectionWindow()
      .then(response => {
        if (!active) return;
        setCorrectionWindow(response.data.payload);
        setForm(formFromWindow(response.data.payload));
      })
      .catch(error => notify.error(error.message));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!historyStoreId) return undefined;
    let active = true;
    fetchCorrectionLogs(historyStoreId)
      .then(response => active && setLogs(response.data.payload || []))
      .catch(error => notify.error(error.message));
    return () => { active = false; };
  }, [historyStoreId]);

  const isOpen = correctionWindow?.state === 'ACTIVE';
  const canClose = correctionWindow?.state === 'ACTIVE' || correctionWindow?.state === 'SCHEDULED';

  const toggleStore = (storeId) => {
    setForm(prev => ({
      ...prev,
      storeIds: prev.storeIds.includes(storeId)
        ? prev.storeIds.filter(id => id !== storeId)
        : [...prev.storeIds, storeId],
    }));
  };

  const allSelected = stores.length > 0 && stores.every(store => form.storeIds.includes(store.storeId));

  const setEndPreset = (hours) => {
    const start = form.startAt ? new Date(form.startAt) : new Date();
    setForm(prev => ({ ...prev, endAt: toDateTimeLocal(new Date(start.getTime() + hours * 60 * 60 * 1000)) }));
  };

  const handleSave = async () => {
    if (!form.startAt || !form.endAt) return notify.warning('Select start and end time');
    const startAt = new Date(form.startAt);
    const endAt = new Date(form.endAt);
    if (endAt <= startAt) return notify.warning('End time must be after start time');
    if (endAt <= new Date()) return notify.warning('End time must be in the future');
    if (!form.storeIds.length) return notify.warning('Select at least one store');

    const storeNames = stores.filter(store => form.storeIds.includes(store.storeId)).map(store => store.storeName).join(', ');
    const confirmed = await confirmAction(
      `${storeNames} will be able to change stock directly (no in/out entries) from ${formatDateTime(startAt)} to ${formatDateTime(endAt)}.`,
      { title: 'Save correction window', confirmText: 'Save', danger: true },
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      const response = await saveCorrectionWindow({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        allowedStoreIds: form.storeIds,
      });
      setCorrectionWindow(response.data.payload);
      setForm(formFromWindow(response.data.payload));
      notify.success(response.data.message || 'Correction window saved');
    } catch (error) {
      notify.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    const confirmed = await confirmAction('Close the correction window now? Stores will not be able to correct inventory anymore.', {
      title: 'Close correction window',
      confirmText: 'Close now',
    });
    if (!confirmed) return;

    try {
      setSaving(true);
      const response = await closeCorrectionWindow();
      setCorrectionWindow(response.data.payload);
      setForm(formFromWindow(response.data.payload));
      notify.success(response.data.message || 'Correction window closed');
    } catch (error) {
      notify.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Inventory Correction</h1>
          {correctionWindow && (
            <span className={`${styles.statusPill} ${isOpen ? styles.on : styles.off}`}>
              {isOpen ? <Unlock size={15} /> : <Lock size={15} />} Window: {STATE_LABEL[correctionWindow.state] || correctionWindow.state}
            </span>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Current correctionWindow */}
        {correctionWindow && correctionWindow.state !== 'NOT_SET' && (
          <div className={`${styles.banner} ${isOpen ? styles.bannerOn : ''}`}>
            <div className={styles.windowSummary}>
              <span><CalendarClock size={16} /> <strong>{formatDateTime(correctionWindow.startAt)}</strong> to <strong>{formatDateTime(correctionWindow.endAt)}</strong></span>
              <span>Stores: {correctionWindow.allowedStoreNames?.length ? correctionWindow.allowedStoreNames.join(', ') : '-'}</span>
              {correctionWindow.updatedBy && <span className={styles.muted}>Last updated by {correctionWindow.updatedBy} on {formatDateTime(correctionWindow.updatedAt)}</span>}
            </div>
            {canClose && (
              <button className={styles.dangerBtn} onClick={handleClose} disabled={saving}>Close now</button>
            )}
          </div>
        )}

        {/* Define correctionWindow */}
        <div className={`${styles.card} ${styles.formCard}`}>
          <strong className={styles.sectionTitle}><Clock size={16} /> Correction Window</strong>
          <small className={styles.muted}>
            Selected stores can set their inventory quantities directly (no in/out entries) only between start and end time. Every change is logged.
          </small>

          <div className={styles.windowGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Start</label>
              <div className={styles.inline}>
                <input type="datetime-local" className={styles.input} value={form.startAt}
                  onChange={(e) => setForm(prev => ({ ...prev, startAt: e.target.value }))} />
                <button className={styles.linkBtn} onClick={() => setForm(prev => ({ ...prev, startAt: toDateTimeLocal(new Date()) }))}>Now</button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>End</label>
              <div className={styles.inline}>
                <input type="datetime-local" className={styles.input} value={form.endAt}
                  onChange={(e) => setForm(prev => ({ ...prev, endAt: e.target.value }))} />
                {END_PRESETS.map(preset => (
                  <button key={preset.hours} className={styles.linkBtn} onClick={() => setEndPreset(preset.hours)}>{preset.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.inline}>
              <label className={styles.label}>Allowed stores</label>
              <button
                className={styles.linkBtn}
                onClick={() => setForm(prev => ({ ...prev, storeIds: allSelected ? [] : stores.map(store => store.storeId) }))}
              >
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className={styles.storeGrid}>
              {stores.map(store => (
                <label key={store.storeId} className={`${styles.storeOption} ${form.storeIds.includes(store.storeId) ? styles.storeSelected : ''}`}>
                  <input type="checkbox" checked={form.storeIds.includes(store.storeId)} onChange={() => toggleStore(store.storeId)} />
                  <span>{store.storeName}</span>
                  <small className={styles.muted}>{store.storeType === 'MAIN_STORE' ? 'Main Store' : 'Sub Store'}</small>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formActions}>
            <button className={styles.primaryBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Window'}
            </button>
          </div>
        </div>

        {/* History */}
        <div className={styles.card}>
          <div className={styles.toolbar}>
            <strong className={styles.sectionTitle}>Correction History</strong>
            <select className={styles.input} value={historyStoreId} onChange={(e) => setHistoryStoreId(e.target.value)}>
              {stores.map(store => (
                <option key={store.storeId} value={store.storeId}>{store.storeName}</option>
              ))}
            </select>
          </div>
          <div className={styles.tableContainer}>
            <CorrectionHistoryTable logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryCorrectionAdmin;
