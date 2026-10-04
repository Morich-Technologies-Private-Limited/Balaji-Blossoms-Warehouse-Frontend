import { useState, useEffect } from 'react';
import { Package, ClipboardList, Undo2, X } from 'lucide-react';
import styles from './SupervisorPortal.module.css';
import {
  fetchMyProfile,
  fetchMyInventory,
  logMyUsage,
  fetchMyUsage,
  fetchMyTransferHistory,
  returnToStore,
} from './supervisorPortalApi';
import { UNIT_LABEL, unitsFor, formatQuantity, convertUnit, round3 } from '../component/utils/units';
import { formatDate } from '../component/utils/date';
import { notify, confirmAction } from '../component/utils/feedback';

const HISTORY_TABS = [
  { key: 'usage', label: 'Usage' },
  { key: 'returns', label: 'Returned to Store' },
];

// Extra "unit" in the quantity dropdown: count of bags / bottles (x packing size)
const PACK = 'PACK';
const SMALL_UNITS = ['GRAM', 'MILLILITER'];
const packLabel = (packingUnit) => (['LITER', 'MILLILITER'].includes(packingUnit) ? 'Bottles' : 'Bags');

const loadMyActivity = () => Promise.all([fetchMyInventory(), fetchMyUsage(), fetchMyTransferHistory()]);

// Transfer history holds both directions: OUT = received from store, IN = returned to store
const isReturnEntry = (transfer) => transfer.transferType === 'IN';

// Screens for a logged-in supervisor: My Stock (use / return via modal) and History (usage, returns)
const SupervisorPortal = ({ view = 'stock' }) => {
  const [profile, setProfile] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [transferHistory, setTransferHistory] = useState([]);
  const [historyTab, setHistoryTab] = useState('usage');
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState(null); // { item, mode: 'use' | 'return' } - stock row opened in the modal

  const applyActivity = ([inventoryRes, usageRes, transferRes]) => {
    setInventory(inventoryRes.data.payload || []);
    setUsageHistory(usageRes.data.payload || []);
    setTransferHistory(transferRes.data.payload || []);
  };

  const reload = async () => applyActivity(await loadMyActivity());

  useEffect(() => {
    let active = true;
    fetchMyProfile()
      .then(response => active && setProfile(response.data.payload))
      .catch(error => notify.error(error.message || 'Failed to load profile'));
    loadMyActivity()
      .then(results => active && applyActivity(results))
      .catch(error => notify.error(error.message || 'Failed to load stock'));
    return () => { active = false; };
  }, []);

  const key = search.trim().toLowerCase();
  const matches = (productId, productName) =>
    !key || String(productId).includes(key) || productName?.toLowerCase().includes(key);

  const visibleStock = inventory.filter(item => matches(item.productId, item.productName));
  const visibleUsage = usageHistory.filter(usage => matches(usage.productId, usage.productName));
  const returnEntries = transferHistory.filter(isReturnEntry);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>{view === 'history' ? 'History' : profile ? `Welcome, ${profile.name}` : 'My Stock'}</h1>
          {profile && <span className={styles.headerMeta}>{profile.storeName} • {profile.phoneNumber}</span>}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.tableCard}>
          {view === 'stock' ? (
            <>
              <div className={styles.toolbar}>
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
                      <th>Available</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleStock.length ? visibleStock.map(item => (
                      <tr key={item.supervisorInventoryId}>
                        <td>{item.productId}</td>
                        <td>{item.productName}</td>
                        <td>{item.packingSize} {UNIT_LABEL[item.packingUnit]}</td>
                        <td className={item.availableQuantity > 0 ? styles.positive : styles.muted}>
                          {formatQuantity(item.availableQuantity, item.packingUnit)}
                        </td>
                        <td>
                          <div className={styles.rowActions}>
                            <button
                              className={styles.useBtn}
                              onClick={() => setModal({ item, mode: 'use' })}
                              disabled={!(item.availableQuantity > 0)}
                            >
                              <ClipboardList size={15} /> Use
                            </button>
                            <button
                              className={styles.returnRowBtn}
                              onClick={() => setModal({ item, mode: 'return' })}
                              disabled={!(item.availableQuantity > 0)}
                            >
                              <Undo2 size={15} /> Return
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <EmptyRow colSpan={5} text={inventory.length ? 'No matching stock.' : 'No stock received yet.'} />
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className={styles.tabs}>
                {HISTORY_TABS.map(tab => (
                  <button
                    key={tab.key}
                    className={`${styles.tab} ${historyTab === tab.key ? styles.activeTab : ''}`}
                    onClick={() => setHistoryTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className={styles.tableContainer}>
                {historyTab === 'usage' && (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Usage ID</th>
                        <th>Item Name</th>
                        <th>Packing</th>
                        <th>Used</th>
                        <th>Before</th>
                        <th>After</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleUsage.length ? visibleUsage.map(usage => (
                        <tr key={usage.id}>
                          <td>{formatDate(usage.date)}</td>
                          <td>{usage.usageReferenceId}</td>
                          <td>{usage.productName}</td>
                          <td>{usage.packingSize} {UNIT_LABEL[usage.packingUnit]}</td>
                          <td className={styles.negative}>{formatQuantity(usage.usageQuantity, usage.packingUnit)}</td>
                          <td>{formatQuantity(usage.balanceAtTimeOfUsage, usage.packingUnit)}</td>
                          <td>{formatQuantity(usage.balanceAfterUse, usage.packingUnit)}</td>
                          <td>{usage.remark || '-'}</td>
                        </tr>
                      )) : (
                        <EmptyRow colSpan={8} text="No usage logged yet." />
                      )}
                    </tbody>
                  </table>
                )}

                {historyTab === 'returns' && (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Transfer ID</th>
                        <th>Returned To</th>
                        <th>Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnEntries.length ? returnEntries.map(transfer => (
                        <tr key={transfer.transferId}>
                          <td>{formatDate(transfer.transferDate)} {transfer.transferTime}</td>
                          <td>{transfer.transferId}</td>
                          <td>{transfer.receiverDetails?.storeName || '-'}</td>
                          <td className={styles.itemsCell}>
                            {(transfer.stockDetails || []).map((stock, index) => (
                              <div key={index}>
                                {stock.productName} ({stock.packingSize} {UNIT_LABEL[stock.packingUnit]}) -{' '}
                                <strong>{formatQuantity(stock.incomingQuantity, stock.packingUnit)}</strong>
                              </div>
                            ))}
                          </td>
                        </tr>
                      )) : (
                        <EmptyRow colSpan={4} text="No stock returned yet." />
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {modal && (
        <UseStockModal
          item={modal.item}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onDone={async () => {
            setModal(null);
            await reload();
          }}
        />
      )}
    </div>
  );
};

/* ================= USE / RETURN MODAL ================= */

const UseStockModal = ({ item, mode, onClose, onDone }) => {
  const isReturn = mode === 'return';
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState(item.packingUnit);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const units = [...unitsFor(null, item.packingUnit), PACK];
  const unitLabel = (u) => (u === PACK ? packLabel(item.packingUnit) : UNIT_LABEL[u]);
  const wholeOnly = SMALL_UNITS.includes(unit);

  // entered value in the packing unit
  const quantity = value === '' ? 0 : round3(
    unit === PACK ? parseFloat(value) * parseFloat(item.packingSize) : convertUnit(value, unit, item.packingUnit)
  );
  const overStock = quantity > (item.availableQuantity || 0);

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape' && !submitting) onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, submitting]);

  const buildEntry = () => {
    const metadata = unit === PACK
      ? { transferType: 'bags', transferUnit: item.packingUnit, weight: `${quantity.toFixed(2)} ${item.packingUnit}`, unit: String(Number(value).toFixed(2)) }
      : { transferType: 'weight', transferUnit: unit, weight: `${Number(value).toFixed(2)} ${unit}`, unit: String((quantity / item.packingSize).toFixed(2)) };
    return { supervisorInventoryId: item.supervisorInventoryId, quantity, metadata };
  };

  const validate = () => {
    if (!quantity || quantity <= 0) {
      notify.warning('Enter a quantity');
      return false;
    }
    if (overStock) {
      notify.warning(`Only ${formatQuantity(item.availableQuantity, item.packingUnit)} available`);
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    const entry = buildEntry();

    if (isReturn) {
      const confirmed = await confirmAction(
        `Return ${formatQuantity(quantity, item.packingUnit)} of ${item.productName} to the store?`,
        { title: 'Return to store', confirmText: 'Return', danger: true }
      );
      if (!confirmed) return;
    }

    try {
      setSubmitting(true);
      const response = isReturn
        ? await returnToStore({
            remark: remark.trim() || null,
            returnList: [{ supervisorInventoryId: entry.supervisorInventoryId, quantity: entry.quantity, transferMetadata: entry.metadata }],
          })
        : await logMyUsage({
            remark: remark.trim() || null,
            usageList: [{ supervisorInventoryId: entry.supervisorInventoryId, quantity: entry.quantity, usageMetadata: entry.metadata }],
          });
      notify.success(response.data.message || (isReturn ? 'Stock returned to store' : 'Usage logged'));
      await onDone();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="use-stock-title">
        <div className={styles.modalHeader}>
          <div>
            <h3 id="use-stock-title" className={styles.modalTitle}>
              {isReturn ? 'Return to Store' : 'Log Usage'} - {item.productName}
            </h3>
            <small className={styles.muted}>
              {item.productId} • {item.packingSize} {UNIT_LABEL[item.packingUnit]} • Available{' '}
              <strong className={styles.positive}>{formatQuantity(item.availableQuantity, item.packingUnit)}</strong>
            </small>
          </div>
          <button className={styles.closeBtn} onClick={onClose} disabled={submitting} aria-label="Close"><X size={18} /></button>
        </div>

        <div className={styles.modalBody}>
          <label className={styles.label}>Quantity</label>
          <div className={styles.qtyInput}>
            <input
              className={styles.input}
              placeholder="0"
              autoFocus
              value={value}
              onChange={(e) => {
                const pattern = wholeOnly ? /^\d*$/ : /^\d*\.?\d{0,3}$/;
                if (e.target.value === '' || pattern.test(e.target.value)) setValue(e.target.value);
              }}
            />
            <select
              className={styles.input}
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value);
                if (SMALL_UNITS.includes(e.target.value) && value.includes('.')) setValue('');
              }}
            >
              {units.map(u => <option key={u} value={u}>{unitLabel(u)}</option>)}
            </select>
          </div>
          {value !== '' && (
            <small className={overStock ? styles.errorText : styles.muted}>
              {unit !== item.packingUnit && `= ${formatQuantity(quantity, item.packingUnit)} `}
              {overStock && `(only ${formatQuantity(item.availableQuantity, item.packingUnit)} available)`}
            </small>
          )}

          <label className={styles.label}>Remark (optional)</label>
          <input className={styles.input} placeholder={isReturn ? 'e.g. reason for return' : 'e.g. site / work name'} value={remark}
            onChange={(e) => setRemark(e.target.value)} />
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.secondaryBtn} onClick={onClose} disabled={submitting}>Cancel</button>
          {isReturn ? (
            <button className={styles.returnBtn} onClick={submit} disabled={submitting}>
              <Undo2 size={16} /> Return to Store
            </button>
          ) : (
            <button className={styles.primaryBtn} onClick={submit} disabled={submitting}>
              <ClipboardList size={16} /> Log Usage
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyRow = ({ colSpan, text }) => (
  <tr>
    <td colSpan={colSpan} className={styles.emptyRow}>
      <Package size={40} />
      <p>{text}</p>
    </td>
  </tr>
);

export default SupervisorPortal;
