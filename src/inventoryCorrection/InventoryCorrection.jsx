import { useState, useEffect } from 'react';
import { Lock, Unlock, Search } from 'lucide-react';
import styles from './InventoryCorrection.module.css';
import { fetchCorrectionStatus, applyInventoryCorrections, fetchCorrectionLogs } from './inventoryCorrectionApi';
import { fetchInventoryItems } from '../api/storeInventoryApi';
import { getSessionData } from '../component/utils/getSessionData';
import { UNIT_LABEL, formatQuantity, unitsFor, convertUnit, round3, containerLabel, isCountUnit, hasLoosePieces, packsToStock, stockToPacks, piecesToStock, packName, PIECES_LABEL } from '../component/utils/units';
import { formatDateTime } from '../component/utils/date';
import { notify, confirmAction } from '../component/utils/feedback';
import CorrectionHistoryTable from './CorrectionHistoryTable';

// Flat inventory rows of the store (single fast query), packings without inventory are skipped
const toRows = (items) => items
  .filter(item => item.inventoryId != null)
  .map(item => ({ ...item, availableQuantity: item.availableQuantity ?? 0 }));

const SMALL_UNITS = ['GRAM', 'MILLILITER'];

// Correct qty can be entered as bags/bottles (x packing size) or as a direct quantity in any compatible unit.
// Count units: packets directly, or loose pieces (/ packing size). A count unit of size 1 (NOS) has one way only.
const singleInputType = (row) => isCountUnit(row.packingUnit) && !hasLoosePieces(row.packingUnit, row.packingSize);
const emptyInput = (row) => ({ type: singleInputType(row) ? 'quantity' : 'bags', value: '', unit: row.packingUnit });

// New stock in the packing unit, or null when nothing is entered
const toPackingQuantity = (row, input) => {
  if (!input || input.value === '') return null;
  let quantity;
  if (input.type === 'bags') {
    quantity = packsToStock(input.value, row.packingUnit, row.packingSize);
  } else if (isCountUnit(row.packingUnit)) {
    quantity = piecesToStock(input.value, row.packingSize); // 20 pens of a 25 packet = 0.8 PACKET
  } else {
    quantity = convertUnit(input.value, input.unit, row.packingUnit);
  }
  return round3(quantity);
};

// storeId is kept for the effect dependency; the backend uses the logged-in store for managers
const loadAll = (storeId) => Promise.all([
  fetchCorrectionStatus(),
  fetchInventoryItems(storeId),
  fetchCorrectionLogs(),
]);

// Store manager (main / sub store): correct own inventory directly while admin's correction window is open for this store
const InventoryCorrection = () => {
  const { storeId } = getSessionData();

  const [status, setStatus] = useState(null);
  const [rows, setRows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [inputs, setInputs] = useState({}); // inventoryId -> { type: 'bags' | 'quantity', value, unit }
  const [remark, setRemark] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('correct');
  const [saving, setSaving] = useState(false);

  const applyLoaded = ([statusRes, inventoryRes, logsRes]) => {
    setStatus(statusRes.data.payload);
    setRows(toRows(inventoryRes.data.payload || []));
    setLogs(logsRes.data.payload || []);
  };

  useEffect(() => {
    let active = true;
    loadAll(storeId)
      .then(results => active && applyLoaded(results))
      .catch(error => notify.error(error.message || 'Failed to load inventory'));
    return () => { active = false; };
  }, [storeId]);

  // open only while admin's window is active and this store is in its list
  const enabled = !!status?.canCorrect;

  const lockedReason = (() => {
    if (!status || enabled) return null;
    if (status.state === 'NOT_SET' || status.state === 'EXPIRED') return 'No correction window is open. Ask admin to open one for your store.';
    if (!status.storeAllowed) return 'Your store is not included in the current correction window. Ask admin to add it.';
    if (status.state === 'SCHEDULED') return `Correction window opens on ${formatDateTime(status.startAt)} and closes on ${formatDateTime(status.endAt)}.`;
    return 'Inventory correction is not available now.';
  })();

  const newQuantityOf = (row) => toPackingQuantity(row, inputs[row.inventoryId]);

  const changedRows = rows.filter(row => {
    const newQuantity = newQuantityOf(row);
    return newQuantity !== null && newQuantity !== Number(row.availableQuantity);
  });

  const updateInput = (row, field, value) => {
    setInputs(prev => {
      const current = prev[row.inventoryId] || emptyInput(row);
      const next = { ...current, [field]: value };
      // switching bags <-> quantity starts the value fresh
      if (field === 'type') {
        next.value = '';
        next.unit = row.packingUnit;
      }
      // G / ML only take whole numbers
      if (field === 'unit' && SMALL_UNITS.includes(value) && next.value.includes('.')) next.value = '';
      return { ...prev, [row.inventoryId]: next };
    });
  };

  const handleValueChange = (row, input, value) => {
    const wholeOnly = input.type === 'quantity' && SMALL_UNITS.includes(input.unit);
    const pattern = wholeOnly ? /^\d*$/ : /^\d*\.?\d{0,3}$/;
    if (value === '' || pattern.test(value)) updateInput(row, 'value', value);
  };

  const visibleRows = rows.filter(row => {
    const key = search.trim().toLowerCase();
    return !key || String(row.productId).includes(key) || row.productName?.toLowerCase().includes(key);
  });

  const handleSave = async () => {
    if (!changedRows.length) return notify.warning('Change at least one quantity');
    if (!remark.trim()) return notify.warning('Please enter a remark (reason for correction)');
    const confirmed = await confirmAction(`Correct ${changedRows.length} item(s)? No in/out entry will be created.`, {
      title: 'Save corrections',
      confirmText: 'Save',
    });
    if (!confirmed) return;

    try {
      setSaving(true);
      const response = await applyInventoryCorrections({
        remark: remark.trim(),
        corrections: changedRows.map(row => ({ inventoryId: row.inventoryId, newQuantity: newQuantityOf(row) })),
      });
      notify.success(response.data.message || 'Inventory corrected');
      setInputs({});
      setRemark('');
      applyLoaded(await loadAll(storeId));
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
          {status && (
            <span className={`${styles.statusPill} ${enabled ? styles.on : styles.off}`}>
              {enabled ? <Unlock size={15} /> : <Lock size={15} />} {enabled ? 'Window open' : 'Locked'}
            </span>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        {lockedReason && (
          <div className={styles.banner}>{lockedReason}</div>
        )}
        {enabled && (
          <div className={`${styles.banner} ${styles.bannerOn}`}>
            Correction window is open until <strong>{formatDateTime(status.endAt)}</strong>.
            Quantities you save here replace the current stock directly - no in/out entry is created, but every change is recorded.
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${activeTab === 'correct' ? styles.activeTab : ''}`} onClick={() => setActiveTab('correct')}>
              Correct Stock
            </button>
            <button className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`} onClick={() => setActiveTab('history')}>
              Correction History
            </button>
          </div>

          {activeTab === 'correct' && (
            <>
              <div className={styles.toolbar}>
                <Search size={16} />
                <input className={styles.input} placeholder="Search by item code or name" value={search}
                  onChange={(e) => setSearch(e.target.value)} />
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Packing</th>
                      <th>Current Qty</th>
                      <th>Enter As</th>
                      <th>Correct Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map(row => {
                      const input = inputs[row.inventoryId] || emptyInput(row);
                      const newQuantity = newQuantityOf(row);
                      const changed = newQuantity !== null && newQuantity !== Number(row.availableQuantity);
                      const container = containerLabel(row.packingUnit);
                      const currentCount = Number(stockToPacks(row.availableQuantity, row.packingUnit, row.packingSize).toFixed(2));
                      const loosePieces = hasLoosePieces(row.packingUnit, row.packingSize);
                      return (
                        <tr key={row.inventoryId} className={changed ? styles.changedRow : ''}>
                          <td>{row.productId}</td>
                          <td>{row.productName}</td>
                          <td>{row.packingSize} {UNIT_LABEL[row.packingUnit]}</td>
                          <td>
                            {formatQuantity(row.availableQuantity, row.packingUnit)}
                            {!isCountUnit(row.packingUnit) && <small className={styles.subText}>{currentCount} {container}</small>}
                          </td>
                          <td>
                            <select
                              className={styles.input}
                              value={input.type}
                              disabled={!enabled}
                              onChange={(e) => updateInput(row, 'type', e.target.value)}
                            >
                              {!singleInputType(row) && (
                                <option value="bags">{isCountUnit(row.packingUnit) ? packName(row.packingUnit) : 'Bags/Bottles'}</option>
                              )}
                              <option value="quantity">{loosePieces ? `Direct Quantity (${PIECES_LABEL.toLowerCase()})` : 'Direct Quantity'}</option>
                            </select>
                          </td>
                          <td>
                            <div className={styles.qtyCell}>
                              <input
                                className={styles.input}
                                placeholder={input.type === 'bags'
                                  ? String(currentCount)
                                  : String(loosePieces ? round3(row.availableQuantity * row.packingSize) : convertUnit(row.availableQuantity, row.packingUnit, input.unit))}
                                value={input.value}
                                disabled={!enabled}
                                onChange={(e) => handleValueChange(row, input, e.target.value)}
                              />
                              {input.type === 'bags' ? (
                                <span>{container}</span>
                              ) : (
                                <select
                                  className={`${styles.input} ${styles.unitSelect}`}
                                  value={input.unit}
                                  disabled={!enabled}
                                  onChange={(e) => updateInput(row, 'unit', e.target.value)}
                                >
                                  {unitsFor(null, row.packingUnit).map(unit => (
                                    <option key={unit} value={unit}>{loosePieces ? PIECES_LABEL : UNIT_LABEL[unit]}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            {newQuantity !== null && (Number(input.value) !== newQuantity || input.unit !== row.packingUnit) && (
                              <small className={styles.subText}>= {formatQuantity(newQuantity, row.packingUnit)}</small>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className={styles.tableContainer}>
              <CorrectionHistoryTable logs={logs} />
            </div>
          )}
        </div>
      </div>

      {/* fixed at the bottom of the page, outside the scrolling content */}
      {enabled && activeTab === 'correct' && (
        <div className={styles.footerBar}>
          <div className={styles.footer}>
            <span className={styles.changedCount}>{changedRows.length} item(s) changed</span>
            <input className={styles.input} placeholder="Remark / reason for correction (required)" value={remark}
              onChange={(e) => setRemark(e.target.value)} />
            <button className={styles.primaryBtn} onClick={handleSave} disabled={saving || !changedRows.length}>
              {saving ? 'Saving...' : 'Save Corrections'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryCorrection;
