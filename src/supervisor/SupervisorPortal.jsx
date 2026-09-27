import { useState, useEffect } from 'react';
import { Package, Eye, ClipboardList, X } from 'lucide-react';
import styles from './SupervisorPortal.module.css';
import {
  fetchMyProfile,
  fetchMyInventory,
  logMyUsage,
  fetchMyUsage,
  fetchMyTransferHistory,
} from './supervisorPortalApi';
import { UNIT_LABEL, unitsFor, formatQuantity, convertUnit, round3 } from '../component/utils/units';
import { formatDate } from '../component/utils/date';
import { notify } from '../component/utils/feedback';

const TABS = [
  { key: 'stock', label: 'My Stock' },
  { key: 'log', label: 'Log Usage' },
  { key: 'usage', label: 'Usage History' },
  { key: 'received', label: 'Received Stock' },
];

const loadMyActivity = () => Promise.all([fetchMyInventory(), fetchMyUsage(), fetchMyTransferHistory()]);

// Screens for a logged-in supervisor: own stock, log usage, usage history, received stock
const SupervisorPortal = ({ initialTab = 'stock' }) => {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [inventory, setInventory] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [receivedHistory, setReceivedHistory] = useState([]);
  const [packingFilter, setPackingFilter] = useState(null); // "View usage" of one stock row

  const [usageInputs, setUsageInputs] = useState({}); // supervisorInventoryId -> { value, unit }
  const [remark, setRemark] = useState('');

  const applyActivity = ([inventoryRes, usageRes, receivedRes]) => {
    setInventory(inventoryRes.data.payload || []);
    setUsageHistory(usageRes.data.payload || []);
    setReceivedHistory(receivedRes.data.payload || []);
  };

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

  /* ================= LOG USAGE ================= */

  const updateUsageInput = (item, field, value) => {
    setUsageInputs(prev => {
      const current = prev[item.supervisorInventoryId] || { value: '', unit: item.packingUnit };
      return { ...prev, [item.supervisorInventoryId]: { ...current, [field]: value } };
    });
  };

  const handleLogUsage = async () => {
    const usageList = [];
    const errors = [];

    inventory.forEach(item => {
      const input = usageInputs[item.supervisorInventoryId];
      if (!input || !parseFloat(input.value)) return;

      const quantity = round3(convertUnit(input.value, input.unit, item.packingUnit));
      if (quantity > (item.availableQuantity || 0)) {
        errors.push(`${item.productName} (${item.packingSize} ${UNIT_LABEL[item.packingUnit]}): max ${formatQuantity(item.availableQuantity, item.packingUnit)}`);
        return;
      }

      usageList.push({
        supervisorInventoryId: item.supervisorInventoryId,
        quantity,
        usageMetadata: {
          transferType: 'weight',
          transferUnit: input.unit,
          weight: `${Number(input.value).toFixed(2)} ${input.unit}`,
          unit: String((quantity / item.packingSize).toFixed(2)),
        },
      });
    });

    if (errors.length) return notify.warning(errors.join('\n'), 'Usage exceeds available stock');
    if (!usageList.length) return notify.warning('Enter usage quantity for at least one product');

    try {
      const response = await logMyUsage({ remark: remark.trim() || null, usageList });
      notify.success(response.data.message || 'Usage logged');
      setUsageInputs({});
      setRemark('');
      applyActivity(await loadMyActivity());
      setActiveTab('usage');
    } catch (error) {
      notify.error(error.message);
    }
  };

  /* ================= VIEW ================= */

  const viewUsage = (item) => {
    setPackingFilter({ packingId: item.packingId, label: `${item.productName} - ${item.packingSize} ${UNIT_LABEL[item.packingUnit]}` });
    setActiveTab('usage');
  };

  const visibleUsage = packingFilter
    ? usageHistory.filter(usage => usage.packingId === packingFilter.packingId)
    : usageHistory;

  const usableStock = inventory.filter(item => item.availableQuantity > 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>{profile ? `Welcome, ${profile.name}` : 'Supervisor'}</h1>
          {profile && <span className={styles.headerMeta}>{profile.storeName} • {profile.phoneNumber}</span>}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.tableCard}>
          <div className={styles.tabs}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.tableContainer}>
            {/* ---------- MY STOCK ---------- */}
            {activeTab === 'stock' && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Item Name</th>
                    <th>Packing</th>
                    <th>Available</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length ? inventory.map(item => (
                    <tr key={item.supervisorInventoryId}>
                      <td>{item.productId}</td>
                      <td>{item.productName}</td>
                      <td>{item.packingSize} {UNIT_LABEL[item.packingUnit]}</td>
                      <td className={item.availableQuantity > 0 ? styles.positive : styles.muted}>
                        {formatQuantity(item.availableQuantity, item.packingUnit)}
                      </td>
                      <td>
                        <button className={styles.iconBtn} onClick={() => viewUsage(item)} title="View usage">
                          <Eye size={16} /> Usage
                        </button>
                        {item.availableQuantity > 0 && (
                          <button className={styles.iconBtn} onClick={() => setActiveTab('log')} title="Log usage">
                            <ClipboardList size={16} /> Use
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <EmptyRow colSpan={5} text="No stock received yet." />
                  )}
                </tbody>
              </table>
            )}

            {/* ---------- LOG USAGE ---------- */}
            {activeTab === 'log' && (
              <>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Packing</th>
                      <th>Available</th>
                      <th>Used Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usableStock.length ? usableStock.map(item => {
                      const input = usageInputs[item.supervisorInventoryId] || { value: '', unit: item.packingUnit };
                      return (
                        <tr key={item.supervisorInventoryId}>
                          <td>{item.productName}</td>
                          <td>{item.packingSize} {UNIT_LABEL[item.packingUnit]}</td>
                          <td>{formatQuantity(item.availableQuantity, item.packingUnit)}</td>
                          <td>
                            <div className={styles.qtyInput}>
                              <input
                                className={styles.input}
                                placeholder="0"
                                value={input.value}
                                onChange={(e) => {
                                  if (e.target.value === '' || /^\d*\.?\d{0,3}$/.test(e.target.value)) {
                                    updateUsageInput(item, 'value', e.target.value);
                                  }
                                }}
                              />
                              <select
                                className={styles.input}
                                value={input.unit}
                                onChange={(e) => updateUsageInput(item, 'unit', e.target.value)}
                              >
                                {unitsFor(null, item.packingUnit).map(unit => (
                                  <option key={unit} value={unit}>{UNIT_LABEL[unit]}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <EmptyRow colSpan={4} text="No stock available to use." />
                    )}
                  </tbody>
                </table>
                <div className={styles.logFooter}>
                  <input className={styles.input} placeholder="Remark (optional) e.g. site / work name" value={remark}
                    onChange={(e) => setRemark(e.target.value)} />
                  <button className={styles.primaryBtn} onClick={handleLogUsage}>Submit Usage</button>
                </div>
              </>
            )}

            {/* ---------- USAGE HISTORY ---------- */}
            {activeTab === 'usage' && (
              <>
                {packingFilter && (
                  <div className={styles.filterChip}>
                    Showing usage of <strong>{packingFilter.label}</strong>
                    <button onClick={() => setPackingFilter(null)} title="Show all"><X size={14} /></button>
                  </div>
                )}
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
              </>
            )}

            {/* ---------- RECEIVED STOCK ---------- */}
            {activeTab === 'received' && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transfer ID</th>
                    <th>Sent By</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {receivedHistory.length ? receivedHistory.map(transfer => (
                    <tr key={transfer.transferId}>
                      <td>{formatDate(transfer.transferDate)} {transfer.transferTime}</td>
                      <td>{transfer.transferId}</td>
                      <td>{transfer.senderDetails?.name || transfer.createdBy || '-'}</td>
                      <td className={styles.itemsCell}>
                        {(transfer.stockDetails || []).map((stock, index) => (
                          <div key={index}>
                            {stock.productName} ({stock.packingSize} {UNIT_LABEL[stock.packingUnit]}) -{' '}
                            <strong>{formatQuantity(stock.outgoingQuantity, stock.packingUnit)}</strong>
                          </div>
                        ))}
                      </td>
                    </tr>
                  )) : (
                    <EmptyRow colSpan={4} text="No stock received yet." />
                  )}
                </tbody>
              </table>
            )}
          </div>
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
