import { useState, useEffect, useCallback } from 'react';
import { AlarmClock, CalendarX2, ClipboardX, CheckCircle2, Search, X, Hourglass, RefreshCw } from 'lucide-react';
import styles from './Reminders.module.css';
import {
  fetchProductExpiry,
  fetchExpiryReminders,
  fetchExpiryPackingAvailability,
  resolveExpiryReminder,
  dismissExpiryReminder,
} from '../../api/productExpiryApi';
import { UNIT_LABEL, unitsFor, formatQuantity, convertUnit, round3 } from '../utils/units';
import { formatDate } from '../utils/date';
import { daysLeft, isExpiringSoon, expiryLabel, EXPIRING_SOON_DAYS } from '../utils/expiry';
import { getSessionData } from '../utils/getSessionData';
import { useStores } from '../../context/StoreContext';
import { notify, confirmAction } from '../utils/feedback';

const REMINDER_LABEL = {
  MISSING_EXPIRY: 'Expiry not added',
  MISSING_RACK: 'Rack not added',
};

const unitLabel = (unit) => UNIT_LABEL[unit] || unit || '';
const packingText = (size, unit) => (size ? `${size} ${unitLabel(unit)}` : '-');

// whole days until the reminder is dismissed automatically
const daysUntil = (date) => Math.max(0, Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)));

// Expiry Alerts: stock expiring soon (use it first) and in entries saved without expiry / rack
const Reminders = () => {
  const { role, storeId: sessionStoreId } = getSessionData();
  const isAdmin = role === 'ADMIN';
  const { stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState(sessionStoreId || '');
  const storeId = isAdmin ? selectedStoreId : undefined;

  const [expiryNotes, setExpiryNotes] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('soon');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // reminder opened in the add-details modal

  const load = useCallback(() => Promise.all([fetchProductExpiry(undefined, storeId), fetchExpiryReminders(storeId)]), [storeId]);

  const apply = ([expiryRes, reminderRes]) => {
    setExpiryNotes(expiryRes.data.payload || []);
    setReminders(reminderRes.data.payload || []);
  };

  const reload = async () => {
    try {
      apply(await load());
    } catch (error) {
      notify.error(error.message || 'Failed to load alerts');
    }
  };

  useEffect(() => {
    let active = true;
    load()
      .then(results => active && apply(results))
      .catch(error => notify.error(error.message || 'Failed to load alerts'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [load]);

  const key = search.trim().toLowerCase();
  const matches = (row) => !key || String(row.productId).includes(key) || row.productName?.toLowerCase().includes(key)
    || row.rackId?.toLowerCase().includes(key) || row.transferId?.toLowerCase().includes(key);

  const useSoon = expiryNotes
    .filter(note => isExpiringSoon(note.expiryDate))
    .sort((a, b) => String(a.expiryDate).localeCompare(String(b.expiryDate)));
  const expiredCount = useSoon.filter(note => daysLeft(note.expiryDate) < 0).length;

  const visibleSoon = useSoon.filter(matches);
  const visibleReminders = reminders.filter(matches);

  const showTab = (tab) => {
    setActiveTab(tab);
    setSearch('');
  };

  const handleDismiss = async (reminder) => {
    const confirmed = await confirmAction(
      `Dismiss the reminder for ${reminder.productName}? ${reminder.reminderType === 'MISSING_RACK' ? 'Rack number' : 'Expiry'} will stay empty.`,
      { title: 'Dismiss reminder', confirmText: 'Dismiss', danger: true }
    );
    if (!confirmed) return;
    try {
      await dismissExpiryReminder(reminder.reminderId, storeId);
      notify.success('Reminder dismissed');
      reload();
    } catch (error) {
      notify.error(error.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Expiry Alerts</h1>
            <p className={styles.subtitle}>Stock to use first and in entries waiting for expiry / rack details</p>
          </div>
          <div className={styles.headerActions}>
            {isAdmin && (
              <select className={styles.storeSelect} value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}>
                {stores.map(store => (
                  <option key={store.storeId} value={store.storeId}>{store.storeName}</option>
                ))}
              </select>
            )}
            <button className={styles.refreshBtn} onClick={reload} title="Refresh"><RefreshCw size={16} /></button>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* ---------- summary (click to open the list) ---------- */}
        <div className={styles.tiles}>
          <Tile icon={<CalendarX2 size={22} />} tone="danger" value={expiredCount} label="Expired - remove / use now"
            active={activeTab === 'soon'} onClick={() => showTab('soon')} />
          <Tile icon={<AlarmClock size={22} />} tone="warning" value={useSoon.length - expiredCount} label={`Expiring in ${EXPIRING_SOON_DAYS} days`}
            active={activeTab === 'soon'} onClick={() => showTab('soon')} />
          <Tile icon={<ClipboardX size={22} />} tone="info" value={reminders.length} label="In entries missing expiry / rack"
            active={activeTab === 'missing'} onClick={() => showTab('missing')} />
        </div>

        <section className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${activeTab === 'soon' ? styles.activeTab : ''}`} onClick={() => showTab('soon')}>
                Use Soon <span className={styles.count}>{useSoon.length}</span>
              </button>
              <button className={`${styles.tab} ${activeTab === 'missing' ? styles.activeTab : ''}`} onClick={() => showTab('missing')}>
                Missing Expiry / Rack <span className={styles.count}>{reminders.length}</span>
              </button>
            </div>
            <div className={styles.searchBox}>
              <Search size={15} />
              <input placeholder="Search item, rack, transfer ID" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className={styles.tableContainer}>
            {activeTab === 'soon' ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Expiry Date</th>
                    <th>Item</th>
                    <th>Packing</th>
                    <th>Quantity</th>
                    <th>Rack</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSoon.length ? visibleSoon.map(note => {
                    const expired = daysLeft(note.expiryDate) < 0;
                    return (
                      <tr key={note.expiryId} className={expired ? styles.rowDanger : styles.rowWarning}>
                        <td>
                          <span className={`${styles.badge} ${expired ? styles.badgeDanger : styles.badgeWarning}`}>
                            {expiryLabel(note.expiryDate)}
                          </span>
                        </td>
                        <td className={styles.strong}>{formatDate(note.expiryDate)}</td>
                        <td className={styles.itemCell}>
                          <span className={styles.itemName}>{note.productName}</span>
                          <span className={styles.itemCode}>#{note.productId}</span>
                        </td>
                        <td>{packingText(note.packingSize, note.packingUnit)}</td>
                        <td className={styles.strong}>{formatQuantity(note.quantity, note.quantityUnit)}</td>
                        <td>{note.rackId ? <span className={styles.rack}>{note.rackId}</span> : '-'}</td>
                      </tr>
                    );
                  }) : (
                    <EmptyRow colSpan={6} loading={loading} done={!key}
                      text={key ? 'No matching items.' : `Nothing expiring in the next ${EXPIRING_SOON_DAYS} days.`} />
                  )}
                </tbody>
              </table>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Entry</th>
                    <th>Item</th>
                    <th>Packing</th>
                    <th>Received</th>
                    <th>Missing</th>
                    <th>Auto-dismiss</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleReminders.length ? visibleReminders.map(reminder => (
                    <tr key={reminder.reminderId}>
                      <td className={styles.itemCell}>
                        <span className={styles.itemName}>{formatDate(reminder.createdDate)}</span>
                        <span className={styles.itemCode}>{reminder.transferId || '-'}</span>
                      </td>
                      <td className={styles.itemCell}>
                        <span className={styles.itemName}>{reminder.productName}</span>
                        <span className={styles.itemCode}>#{reminder.productId}</span>
                      </td>
                      <td>{packingText(reminder.packingSize, reminder.packingUnit)}</td>
                      <td className={styles.strong}>{formatQuantity(reminder.quantity, reminder.packingUnit)}</td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeInfo}`}>{REMINDER_LABEL[reminder.reminderType]}</span>
                      </td>
                      <td>
                        {reminder.autoDismissDate ? (
                          <span className={styles.autoDismiss} title={`Dismissed automatically on ${formatDate(reminder.autoDismissDate)} if no action is taken`}>
                            <Hourglass size={13} /> {daysUntil(reminder.autoDismissDate)}d
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button className={styles.primaryBtnSm} onClick={() => setEditing(reminder)}>
                            {reminder.reminderType === 'MISSING_RACK' ? 'Add Rack' : 'Add Expiry'}
                          </button>
                          <button className={styles.dismissBtn} onClick={() => handleDismiss(reminder)}>Dismiss</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <EmptyRow colSpan={7} loading={loading} done={!key}
                      text={key ? 'No matching entries.' : 'All in entries have expiry and rack details.'} />
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {editing && (
        <ResolveModal
          reminder={editing}
          storeId={storeId}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
};

/* ================= ADD EXPIRY / RACK MODAL ================= */

const ResolveModal = ({ reminder, storeId, onClose, onDone }) => {
  const isRackOnly = reminder.reminderType === 'MISSING_RACK';
  const [expiryDate, setExpiryDate] = useState('');
  const [rackId, setRackId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState(reminder.packingUnit);
  const [saving, setSaving] = useState(false);

  // live max for this packing (stock now minus other expiry notes), read fresh from the server
  const [availability, setAvailability] = useState(null);
  const [loadingMax, setLoadingMax] = useState(!isRackOnly);

  useEffect(() => {
    if (isRackOnly) return undefined;
    let active = true;
    fetchExpiryPackingAvailability(reminder.productId, storeId)
      .then(response => {
        if (!active) return;
        const packing = (response.data.payload || []).find(p => p.packingId === reminder.packingId);
        const info = { max: packing?.maxQuantity ?? 0, stock: packing?.availableQuantity ?? 0 };
        setAvailability(info);
        // received quantity, capped at what can still be noted now
        setQuantity(String(round3(Math.min(reminder.quantity ?? info.max, info.max))));
      })
      .catch(error => active && notify.error(error.message || 'Unable to check available stock'))
      .finally(() => active && setLoadingMax(false));
    return () => { active = false; };
  }, [isRackOnly, reminder, storeId]);

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, saving]);

  const maxInUnit = availability ? round3(convertUnit(availability.max, reminder.packingUnit, quantityUnit)) : null;
  const overMax = maxInUnit !== null && Number(quantity) > maxInUnit + 0.0005;
  const noStock = availability !== null && availability.max <= 0;

  const handleSave = async () => {
    if (isRackOnly && !rackId.trim()) return notify.warning('Enter rack number');
    if (!isRackOnly) {
      if (noStock) return notify.warning('No stock of this packing is left without an expiry note. Dismiss this reminder instead.');
      if (!expiryDate) return notify.warning('Select expiry date');
      if (!(Number(quantity) > 0)) return notify.warning('Enter a valid quantity');
      if (overMax) return notify.warning(`Only ${formatQuantity(maxInUnit, quantityUnit)} can be added for this packing`);
    }

    const details = isRackOnly
      ? { rackId: rackId.trim() }
      : { expiryDate, rackId: rackId.trim() || null, quantity: Number(quantity), quantityUnit };

    try {
      setSaving(true);
      const response = await resolveExpiryReminder(reminder.reminderId, details, storeId);
      notify.success(response.data.message || 'Details saved');
      onDone();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="resolve-title">
        <div className={styles.modalHeader}>
          <div>
            <h3 id="resolve-title" className={styles.modalTitle}>{isRackOnly ? 'Add Rack' : 'Add Expiry'} - {reminder.productName}</h3>
            <small className={styles.muted}>
              {packingText(reminder.packingSize, reminder.packingUnit)} • Received {formatQuantity(reminder.quantity, reminder.packingUnit)}
              {reminder.transferId ? ` • ${reminder.transferId}` : ''}
              {isRackOnly && reminder.expiryDate ? ` • Expiry ${formatDate(reminder.expiryDate)}` : ''}
            </small>
          </div>
          <button className={styles.closeBtn} onClick={onClose} disabled={saving} aria-label="Close"><X size={18} /></button>
        </div>

        <div className={styles.modalBody}>
          {!isRackOnly && (
            <>
              <div className={`${styles.maxInfo} ${noStock ? styles.maxInfoEmpty : ''}`}>
                {loadingMax ? 'Checking current stock...' : availability ? (
                  noStock
                    ? 'No stock of this packing is left without an expiry note - dismiss this reminder.'
                    : <>Can add up to <strong>{formatQuantity(availability.max, reminder.packingUnit)}</strong> (in stock now {formatQuantity(availability.stock, reminder.packingUnit)})</>
                ) : 'Could not check current stock.'}
              </div>

              <label className={styles.label}>Expiry Date *</label>
              <input type="date" className={styles.input} value={expiryDate} autoFocus disabled={noStock}
                onChange={(e) => setExpiryDate(e.target.value)} />

              <label className={styles.label}>Quantity *</label>
              <div className={styles.qtyRow}>
                <input className={`${styles.input} ${overMax ? styles.inputError : ''}`} value={quantity} disabled={noStock || loadingMax}
                  onChange={(e) => {
                    if (e.target.value === '' || /^\d*\.?\d{0,3}$/.test(e.target.value)) setQuantity(e.target.value);
                  }} />
                <select className={styles.input} value={quantityUnit} disabled={noStock}
                  onChange={(e) => {
                    // keep the same amount when switching KG <-> G / L <-> ML
                    if (quantity !== '') setQuantity(String(round3(convertUnit(quantity, quantityUnit, e.target.value))));
                    setQuantityUnit(e.target.value);
                  }}>
                  {unitsFor(null, reminder.packingUnit).map(unit => (
                    <option key={unit} value={unit}>{unitLabel(unit)}</option>
                  ))}
                </select>
              </div>
              {overMax && <small className={styles.errorText}>More than the {formatQuantity(maxInUnit, quantityUnit)} that can be added</small>}
            </>
          )}

          <label className={styles.label}>Rack No {isRackOnly ? '*' : '(optional)'}</label>
          <input className={styles.input} placeholder="e.g. A-12" value={rackId} autoFocus={isRackOnly} disabled={noStock}
            onChange={(e) => setRackId(e.target.value)} />
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={styles.primaryBtn} onClick={handleSave} disabled={saving || loadingMax || noStock}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Tile = ({ icon, tone, value, label, active, onClick }) => (
  <button type="button" className={`${styles.tile} ${styles[tone]} ${active ? styles.tileActive : ''}`} onClick={onClick}>
    <span className={styles.tileIcon}>{icon}</span>
    <span className={styles.tileText}>
      <span className={styles.tileValue}>{value}</span>
      <span className={styles.tileLabel}>{label}</span>
    </span>
  </button>
);

const EmptyRow = ({ colSpan, text, loading, done }) => (
  <tr>
    <td colSpan={colSpan} className={styles.emptyRow}>
      {loading ? 'Loading...' : (
        <>
          {done && <CheckCircle2 size={30} className={styles.doneIcon} />}
          <p>{text}</p>
        </>
      )}
    </td>
  </tr>
);

export default Reminders;
