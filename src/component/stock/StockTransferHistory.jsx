import React, { useState, useEffect,useRef } from 'react';
import { ChevronDown, ChevronUp, Search, Package, Calendar, User, Store } from 'lucide-react';
import styles from './StockTransferHistory.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { findTranfserHistoryStore } from '../../api/findTranfserHistoryStore';
import { getSessionData } from '../utils/getSessionData';


const StockTransferHistory = () => {
  const [transferHistory, setTransferHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransfers, setSelectedTransfers] = useState(new Set());
  const hasFetched = useRef(false);

 useEffect(() => {
  if (hasFetched.current) return;
  hasFetched.current = true;

  const fetchTransferHistory = async () => {
    try {
      setLoading(true);

      const {storeId} = getSessionData();
      const response = await findTranfserHistoryStore(storeId);
    

      if(response.data.status!="SUCCESS")
      {
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
}, []);


  // Filter logic
  useEffect(() => {
    let filtered = transferHistory;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.transferId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.senderDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.senderDetails.contactNumber.includes(searchTerm) ||
        item.receiverDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.receiverDetails.contactNumber.includes(searchTerm) ||
        item.senderDetails.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.receiverDetails.storeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by store - check both sender and receiver stores
    if (selectedStore !== 'all') {
      const storeIdNum = parseInt(selectedStore);
      filtered = filtered.filter(item => 
        item.senderDetails.storeId === storeIdNum || 
        item.receiverDetails.storeId === storeIdNum
      );
    }

    setFilteredHistory(filtered);
  }, [searchTerm, selectedStore, transferHistory]);

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleExport = () => {
    // This is where you'll integrate your export API
    const selectedIds = Array.from(selectedTransfers);
    console.log('Selected Transfer IDs for export:', selectedIds);
    
    // TODO: Call your export API with selectedIds
    // Example:
    // exportTransfers(selectedIds).then(response => {
    //   // Handle success
    // }).catch(error => {
    //   // Handle error
    // });
    
    alert(`Selected ${selectedIds.length} transfers for export: ${selectedIds.join(', ')}`);
  };

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

          <div className={styles.storeFilter}>
            <Store className={styles.filterIcon} />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className={styles.storeSelect}
            >
              <option value="all">All Stores</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.id}-{store.name}</option>
              ))}
            </select>
          </div>

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
                              <div className={styles.userContact}>{transfer.senderDetails.contactNumber}</div>
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
                              <div className={styles.userContact}>{transfer.receiverDetails.contactNumber}</div>
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
                                  <p><strong>Contact:</strong> {transfer.senderDetails.contactNumber}</p>
                                  <p><strong>Email:</strong> {transfer.senderDetails.emailId}</p>
                                  <p><strong>Role:</strong> {transfer.senderDetails.role}</p>
                                  <p><strong>Store:</strong> {transfer.senderDetails.storeName}</p>
                                </div>

                                <div className={styles.detailCard}>
                                  <h4>Receiver Details</h4>
                                  <p><strong>Name:</strong> {transfer.receiverDetails.name}</p>
                                  <p><strong>Contact:</strong> {transfer.receiverDetails.contactNumber}</p>
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
                                        <tr key={idx}>
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
    </div>
  );
};

export default StockTransferHistory;