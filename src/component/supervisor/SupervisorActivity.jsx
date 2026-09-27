import { useState, useEffect, useCallback } from 'react';
import { Package, Eye, X } from 'lucide-react';
import styles from './SupervisorActivity.module.css';
import {
  fetchSupervisors,
  fetchSupervisorInventory,
  fetchSupervisorUsage,
  fetchSupervisorTransferHistory,
} from '../../api/supervisorApi';
import { getSessionData } from '../utils/getSessionData';
import { useStores } from '../../context/StoreContext';
import { UNIT_LABEL, formatQuantity } from '../utils/units';
import { formatDate } from '../utils/date';
import { notify } from '../utils/feedback';

/**
 * Supervisor Inventory tab: sub store manager / admin views a supervisor's stock, usage and received stock
 * (admin can switch store). Adding supervisors is done in the Supervisors tab (SupervisorManagement).
 * Screens for a logged-in supervisor live in src/supervisor.
 */
const SupervisorActivity = () => {
  const { role, storeId: sessionStoreId } = getSessionData();
  const isAdmin = role === 'ADMIN';
  const { stores } = useStores();

  const [selectedStoreId, setSelectedStoreId] = useState(sessionStoreId || '');
  const storeId = isAdmin ? selectedStoreId : undefined;

  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');

  const [activeTab, setActiveTab] = useState('stock');
  const [inventory, setInventory] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [receivedHistory, setReceivedHistory] = useState([]);
  const [packingFilter, setPackingFilter] = useState(null); // "View usage" of one stock row

  const selectedSupervisor = supervisors.find(s => s.supervisorId === Number(selectedSupervisorId));

  /* ================= LOADERS ================= */

  // stock, usage and received stock of the selected supervisor
  const fetchActivity = useCallback(() => Promise.all([
    fetchSupervisorInventory(selectedSupervisorId, storeId),
    fetchSupervisorUsage(selectedSupervisorId, storeId),
    fetchSupervisorTransferHistory(selectedSupervisorId, storeId),
  ]), [selectedSupervisorId, storeId]);

  const applyActivity = ([inventoryRes, usageRes, receivedRes]) => {
    setInventory(inventoryRes.data.payload || []);
    setUsageHistory(usageRes.data.payload || []);
    setReceivedHistory(receivedRes.data.payload || []);
  };

  useEffect(() => {
    let active = true;
    fetchSupervisors(storeId)
      .then(response => active && setSupervisors(response.data.payload || []))
      .catch(error => console.error('Failed to load supervisors', error));
    return () => { active = false; };
  }, [storeId]);

  useEffect(() => {
    if (!selectedSupervisorId) return undefined;
    let active = true;
    fetchActivity()
      .then(results => active && applyActivity(results))
      .catch(error => notify.error(error.message || 'Failed to load supervisor data'));
    return () => { active = false; };
  }, [fetchActivity, selectedSupervisorId]);

  const handleStoreChange = (value) => {
    setSelectedStoreId(value);
    setSupervisors([]);
    handleSupervisorChange('');
  };

  const handleSupervisorChange = (value) => {
    setSelectedSupervisorId(value);
    setPackingFilter(null);
    setInventory([]);
    setUsageHistory([]);
    setReceivedHistory([]);
  };

  /* ================= VIEW ================= */

  const viewUsage = (item) => {
    setPackingFilter({ packingId: item.packingId, label: `${item.productName} - ${item.packingSize} ${UNIT_LABEL[item.packingUnit]}` });
    setActiveTab('usage');
  };

  const visibleUsage = packingFilter
    ? usageHistory.filter(usage => usage.packingId === packingFilter.packingId)
    : usageHistory;

  const tabs = [
    { key: 'stock', label: 'Stock' },
    { key: 'usage', label: 'Usage History' },
    { key: 'received', label: 'Received Stock' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Supervisor Inventory</h1>
          {isAdmin && (
            <select className={styles.storeSelect} value={selectedStoreId} onChange={(e) => handleStoreChange(e.target.value)}>
              {stores.map(store => (
                <option key={store.storeId} value={store.storeId}>{store.storeName}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* ============ Supervisor selection ============ */}
        <div className={styles.card}>
          <div className={styles.selectorRow}>
            <select
              className={styles.input}
              value={selectedSupervisorId}
              onChange={(e) => handleSupervisorChange(e.target.value)}
            >
              <option value="">{supervisors.length ? 'Select a supervisor' : 'No supervisor found - add from Supervisors tab'}</option>
              {supervisors.map(s => (
                <option key={s.supervisorId} value={s.supervisorId}>{s.name} - {s.phoneNumber}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ============ Tabs ============ */}
        {selectedSupervisor ? (
          <div className={styles.tableCard}>
            <div className={styles.tabs}>
              {tabs.map(tab => (
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
              {/* ---------- STOCK ---------- */}
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
                        </td>
                      </tr>
                    )) : (
                      <EmptyRow colSpan={5} text="No stock found." />
                    )}
                  </tbody>
                </table>
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
        ) : (
          <div className={styles.placeholder}>
            <Package size={48} />
            <p>Select a supervisor to see stock, usage and received stock.</p>
          </div>
        )}
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

export default SupervisorActivity;
