import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Search, Package, Calendar, User, Settings, X, Store } from 'lucide-react';
import styles from './StockTransferHistory.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { findTranfserHistoryStore } from '../../api/findTranfserHistoryStore';
import { getSessionData } from '../utils/getSessionData';
import { useStores } from '../../context/StoreContext';

const StockTransferHistory = () => {
  const [transferHistory, setTransferHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransfers, setSelectedTransfers] = useState(new Set());
  const [showFilterModal, setShowFilterModal] = useState(false);

  const[allStores,setAllStores]=useState([]);
  const[selectedStore,setSelectedStore]=useState(null);
  const { stores: contextStores } = useStores();

  
  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [senderStore, setSenderStore] = useState('all');
  const [receiverStore, setReceiverStore] = useState('all');
  const [transferType, setTransferType] = useState('all');
  const{role} =getSessionData();
  


  useEffect(() => {
    if (contextStores?.length) {
      setAllStores(contextStores);
      const selectedOne = contextStores.find(
        (store) => store.tag === "DEFAULT"
      );
      setSelectedStore(selectedOne || null);
    }
  }, [contextStores]);


  useEffect(() => {
    if (!selectedStore) return;

    const fetchTransferHistory = async () => {
      try {
        setLoading(true);
        setTransferHistory([]);
        setFilteredHistory([]);
        setStores([]);

        
        const response = await findTranfserHistoryStore(selectedStore.storeId);

        if (response.data.status != "SUCCESS") {
          alert(response.data.message || "Unable to find tranfer");
          return;
        }

        const data = response.data.payload || [];

        // Extract unique stores
        const storeMap = new Map();

        data.forEach(({ senderDetails, receiverDetails }) => {
          if (senderDetails && !storeMap.has(senderDetails.storeId)) {
            storeMap.set(senderDetails.storeId, {
              id: senderDetails.storeId,
              name: senderDetails.storeName,
            });
          }

          if (receiverDetails && !storeMap.has(receiverDetails.storeId)) {
            storeMap.set(receiverDetails.storeId, {
              id: receiverDetails.storeId,
              name: receiverDetails.storeName,
            });
          }
        });

        const uniqueStores = Array.from(storeMap.values()).sort(
          (a, b) => a.id - b.id
        );

        setTransferHistory(data);
        setFilteredHistory(data);
        setStores(uniqueStores);

      } catch (error) {
        console.error("Failed to fetch transfer history:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransferHistory();
  }, [selectedStore]);

  // Filter logic
  useEffect(() => {
    let filtered = transferHistory;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.transferId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.senderDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.senderDetails.contactNumber?.includes(searchTerm) ||
        item.receiverDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.receiverDetails.contactNumber?.includes(searchTerm) ||
        item.senderDetails.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.receiverDetails.storeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(item => {
        const transferDate = new Date(item.transferDate);
        const fromDate = new Date(dateFrom);
        return transferDate >= fromDate;
      });
    }

    if (dateTo) {
      filtered = filtered.filter(item => {
        const transferDate = new Date(item.transferDate);
        const toDate = new Date(dateTo);
        return transferDate <= toDate;
      });
    }

    // Filter by sender store
    if (senderStore !== 'all') {
      const storeIdNum = parseInt(senderStore);
      filtered = filtered.filter(item =>
        item.senderDetails.storeId === storeIdNum
      );
    }

    // Filter by receiver store
    if (receiverStore !== 'all') {
      const storeIdNum = parseInt(receiverStore);
      filtered = filtered.filter(item =>
        item.receiverDetails.storeId === storeIdNum
      );
    }

    // Filter by transfer type
    if (transferType !== 'all') {
      filtered = filtered.filter(item =>
        item.transferType === transferType
      );
    }

    setFilteredHistory(filtered);
  }, [searchTerm, dateFrom, dateTo, senderStore, receiverStore, transferType, transferHistory]);

  const toggleRow = (transferId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(transferId)) {
      newExpanded.delete(transferId);
    } else {
      newExpanded.add(transferId);
    }
    setExpandedRows(newExpanded);
  };

  const handleCheckboxChange = (transferId) => {
    const newSelected = new Set(selectedTransfers);
    if (newSelected.has(transferId)) {
      newSelected.delete(transferId);
    } else {
      newSelected.add(transferId);
    }
    setSelectedTransfers(newSelected);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(filteredHistory.map(t => t.transferId));
      setSelectedTransfers(allIds);
    } else {
      setSelectedTransfers(new Set());
    }
  };

  const handleStoreChange = (e) => {
    const storeId = parseInt(e.target.value);
    const store = allStores.find(s => s.storeId === storeId);
    setSelectedStore(store);
    // Reset selections when changing stores
    setSelectedTransfers(new Set());
    setExpandedRows(new Set());
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleExport = () => {
    const selectedIds = Array.from(selectedTransfers);
    console.log('Selected Transfer IDs for export:', selectedIds);
    alert(`Selected ${selectedIds.length} transfers for export: ${selectedIds.join(', ')}`);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSenderStore('all');
    setReceiverStore('all');
    setTransferType('all');
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const hasActiveFilters = dateFrom || dateTo || senderStore !== 'all' || receiverStore !== 'all' || transferType !== 'all';

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading transfer history...</div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <Package className={styles.titleIcon} />
            Stock Transfer History
          </h1>
        </div>

        {role === "ADMIN" && (
          <div className={styles.storeSelectSection}>
            <div className={styles.storeSelectWrapper}>
              <Store className={styles.storeIcon} size={18} />
              <select
                value={selectedStore?.storeId || ''}
                onChange={handleStoreChange}
                className={styles.storeSelect}
              >
                {allStores.map(store => (
                  <option key={store.storeId} value={store.storeId}>
                    {store.storeName} {store.tag === 'DEFAULT' ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className={styles.filterSection}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by transfer ID, name or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <button
            className={`${styles.filterButton} ${hasActiveFilters ? styles.filterActive : ''}`}
            onClick={() => setShowFilterModal(true)}
          >
            <Settings size={18} />
            Filters
            {hasActiveFilters && <span className={styles.filterBadge}></span>}
          </button>

          {selectedTransfers.size > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleExport}
            >
              Export Selected ({selectedTransfers.size})
            </button>
          )}
        </div>

        {filteredHistory.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={48} />
            <p>No transfer history found</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.checkboxCol}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedTransfers.size === filteredHistory.length && filteredHistory.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className={styles.expandCol}></th>
                    <th>Transfer ID</th>
                    <th>Type</th>
                    <th className={styles.hideOnMobile}>Date & Time</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th className={styles.hideOnMobile}>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((transfer) => (
                    <React.Fragment key={transfer.transferId}>
                      <tr className={styles.parentRow}>
                        <td className={styles.checkboxCol}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedTransfers.has(transfer.transferId)}
                            onChange={() => handleCheckboxChange(transfer.transferId)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className={styles.expandCol}>
                          <button
                            className={styles.expandBtn}
                            onClick={() => toggleRow(transfer.transferId)}
                          >
                            {expandedRows.has(transfer.transferId) ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </button>
                        </td>
                        <td>
                          <span className={styles.transferId}>{transfer.transferId}</span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${styles[transfer.transferType.toLowerCase()]}`}>
                            {transfer.transferType}
                          </span>
                        </td>
                        <td className={styles.hideOnMobile}>
                          <div className={styles.dateTime}>
                            <Calendar size={14} />
                            <span>{formatDate(transfer.transferDate)}</span>
                            <span className={styles.time}>{transfer.transferTime}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.userInfo}>
                            <User size={14} />
                            <div>
                              <div className={styles.userName}>{transfer.senderDetails.name}</div>
                              <div className={styles.userContact}>{transfer.senderDetails.contactNumber || 'N/A'}</div>
                              <div className={styles.showOnMobile}>
                                {transfer.senderDetails.storeName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.userInfo}>
                            <User size={14} />
                            <div>
                              <div className={styles.userName}>{transfer.receiverDetails.name}</div>
                              <div className={styles.userContact}>{transfer.receiverDetails.contactNumber || 'N/A'}</div>
                              <div className={styles.showOnMobile}>
                                {transfer.receiverDetails.storeName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={styles.hideOnMobile}>
                          <span className={styles.itemCount}>
                            {transfer.stockDetails.length} item(s)
                          </span>
                        </td>
                      </tr>

                      {expandedRows.has(transfer.transferId) && (
                        <tr className={styles.childRow}>
                          <td colSpan="8">
                            <div className={styles.expandedContent}>
                              <div className={styles.showOnMobile}>
                                <div className={styles.mobileDateTime}>
                                  <Calendar size={14} />
                                  {formatDate(transfer.transferDate)} • {transfer.transferTime}
                                </div>
                              </div>

                              <div className={styles.detailsGrid}>
                                <div className={styles.detailCard}>
                                  <h4>Sender Details</h4>
                                  <p><strong>Name:</strong> {transfer.senderDetails.name}</p>
                                  <p><strong>Contact:</strong> {transfer.senderDetails.contactNumber || 'N/A'}</p>
                                  <p><strong>Email:</strong> {transfer.senderDetails.emailId}</p>
                                  <p><strong>Role:</strong> {transfer.senderDetails.role}</p>
                                  <p><strong>Store:</strong> {transfer.senderDetails.storeName}</p>
                                </div>

                                <div className={styles.detailCard}>
                                  <h4>Receiver Details</h4>
                                  <p><strong>Name:</strong> {transfer.receiverDetails.name}</p>
                                  <p><strong>Contact:</strong> {transfer.receiverDetails.contactNumber || 'N/A'}</p>
                                  <p><strong>Email:</strong> {transfer.receiverDetails.emailId}</p>
                                  <p><strong>Role:</strong> {transfer.receiverDetails.role}</p>
                                  <p><strong>Store:</strong> {transfer.receiverDetails.storeName}</p>
                                </div>
                              </div>

                              <div className={styles.stockDetailsSection}>
                                <h4>Stock Details</h4>
                                <div className={styles.stockTable}>
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>Product</th>
                                        <th>Packing</th>
                                        <th className={styles.hideOnMobile}>Current Qty</th>
                                        <th>{transfer.transferType === 'OUT' ? 'Outgoing' : 'Incoming'}</th>
                                        <th>Final Qty</th>
                                        <th className={styles.hideOnMobile}>Bags</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {transfer.stockDetails.map((stock, idx) => (
                                        <React.Fragment key={idx}>
                                          <tr>
                                            <td>{stock.productName}</td>
                                            <td>{stock.packingSize} {stock.packingUnit}</td>
                                            <td className={styles.hideOnMobile}>{stock.currentQuantity}</td>
                                            <td className={styles.highlight}>
                                              {transfer.transferType === 'OUT'
                                                ? stock.outgoingQuantity
                                                : stock.incomingQuantity}
                                            </td>
                                            <td><strong>{stock.finalRemainingQuantity}</strong></td>
                                            <td className={styles.hideOnMobile}>
                                              {transfer.transferType === 'OUT'
                                                ? stock.outgoingBags
                                                : stock.incomingBags}
                                            </td>
                                          </tr>
                                          {stock.transferMetadata && 
                                           stock.transferMetadata.transferType === 'weight' && 
                                           stock.transferMetadata.unit !== stock.packingUnit && (
                                            <tr className={styles.metadataRow}>
                                              <td colSpan="6">
                                                <div className={styles.metadataContent}>
                                                  <span className={styles.metadataLabel}>Transfer Details : </span>
                                                  <span className={styles.metadataValue}>
                                                     {stock.transferMetadata.weight}
                                                  </span>
                                                  <span className={styles.metadataSeparator}>  •  </span>
                                                  <span className={styles.metadataValue}>
                                                    Unit Transferred: {stock.transferMetadata.unit}
                                                  </span>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className={styles.modalOverlay} onClick={() => setShowFilterModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Filter Transfers</h3>
              <button className={styles.closeBtn} onClick={() => setShowFilterModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.filterGroup}>
                <label>Date Range</label>
                <div className={styles.dateRangeInputs}>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={styles.dateInput}
                    placeholder="From"
                  />
                  <span className={styles.dateSeparator}>to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={styles.dateInput}
                    placeholder="To"
                  />
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label>Sender Store</label>
                <select
                  value={senderStore}
                  onChange={(e) => setSenderStore(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Stores</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.id}-{store.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Receiver Store</label>
                <select
                  value={receiverStore}
                  onChange={(e) => setReceiverStore(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Stores</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.id}-{store.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Transfer Type</label>
                <select
                  value={transferType}
                  onChange={(e) => setTransferType(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Types</option>
                  <option value="IN">IN Entries</option>
                  <option value="OUT">OUT Entries</option>
                </select>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.clearBtn} onClick={clearFilters}>
                Clear All
              </button>
              <button className={styles.applyBtn} onClick={applyFilters}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransferHistory;