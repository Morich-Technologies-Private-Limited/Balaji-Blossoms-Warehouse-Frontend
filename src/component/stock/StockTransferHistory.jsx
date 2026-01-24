import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Search, Package, Calendar, User, Settings, X, Store, Trash2, Download } from 'lucide-react';
import styles from './StockTransferHistory.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { findTranfserHistoryStore } from '../../api/findTranfserHistoryStore';
import { getSessionData } from '../utils/getSessionData';
import { useStores } from '../../context/StoreContext';
import { deleteStockTransfer } from '../../api/deleteStockTransfer';
import { downloadTransferPdf } from '../../api/downloadTransferPdf';
import { showMessagePopUp } from '../modal/MessagePopUp';
import { exportTransferHistory } from '../../api/exportTransferHistory';

const StockTransferHistory = () => {
  const [transferHistory, setTransferHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransfers, setSelectedTransfers] = useState(new Set());
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [isAdminDelete, setIsAdminDelete] = useState(false);
  const [downloadingTransfer, setDownloadingTransfer] = useState(null);

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



    const fetchTransferHistory = async () => {
      try {
         if (!selectedStore) return;
        setLoading(true);
        setTransferHistory([]);
        setFilteredHistory([]);
        setStores([]);
        
        const response = await findTranfserHistoryStore(selectedStore.storeId);

        if (response.data.status != "SUCCESS") {
          showMessagePopUp(response.data.status ||"FAILED", response.data.message || "Unable to import stock", response.data.errorList || []);
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


  
  useEffect(() => {
    fetchTransferHistory();
  }, [selectedStore]);

  // Filter logic
  useEffect(() => {
  let filtered = transferHistory;

  // Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.transferId.toLowerCase().includes(term) ||
      item.senderDetails.name.toLowerCase().includes(term) ||
      item.senderDetails.contactNumber?.includes(searchTerm) ||
      item.receiverDetails.name.toLowerCase().includes(term) ||
      item.receiverDetails.contactNumber?.includes(searchTerm) ||
      item.senderDetails.storeName.toLowerCase().includes(term) ||
      item.receiverDetails.storeName.toLowerCase().includes(term)
    );
  }

  // ✅ Inclusive date range filter
  if (dateFrom && dateTo) {
    const fromDate = new Date(dateFrom);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);

    filtered = filtered.filter(item => {
      const transferDate = new Date(item.transferDate);
      return transferDate >= fromDate && transferDate <= toDate;
    });
  }

  // Sender store filter
  if (senderStore !== 'all') {
    const storeIdNum = parseInt(senderStore);
    filtered = filtered.filter(
      item => item.senderDetails.storeId === storeIdNum
    );
  }

  // Receiver store filter
  if (receiverStore !== 'all') {
    const storeIdNum = parseInt(receiverStore);
    filtered = filtered.filter(
      item => item.receiverDetails.storeId === storeIdNum
    );
  }

  // Transfer type filter
  if (transferType !== 'all') {
    filtered = filtered.filter(
      item => item.transferType === transferType
    );
  }

  setFilteredHistory(filtered);
}, [
  searchTerm,
  dateFrom,
  dateTo,
  senderStore,
  receiverStore,
  transferType,
  transferHistory
]);


  const formatPackingUnit = (unit) => {
  switch (unit) {
    case 'KILOGRAM':
      return 'KG';
    case 'GRAM':
      return 'G';
    case 'MILLILITER':
      return 'ML';
    case 'LITER':
      return 'L';
    default:
      return unit;
  }
};

const isWithinOneHour = (transferDate) => {
  try {
    const transferDateTime = new Date(transferDate); // ISO → correct UTC handling
    const now = new Date();

    const diffInMs = now.getTime() - transferDateTime.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    return diffInHours >= 0 && diffInHours <= 1;
  } catch (error) {
    console.error("Error calculating time difference:", error);
    return false;
  }
};

  const handleDownloadPdf = async (transferId) => {
    try {
      setDownloadingTransfer(transferId);
      
      const response = await downloadTransferPdf(transferId);
      
      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `Transfer_${transferId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showMessagePopUp("ERROR", error.message || 'Failed to download PDF', []);
    } finally {
      setDownloadingTransfer(null);
    }
  };


  const handleDeleteAdmin = (transferId) => {
    setSelectedTransferId(transferId);
    setIsAdminDelete(true);
    setShowDeleteModal(true);
  };

  const handleDelete = (transferId) => {
    setSelectedTransferId(transferId);
    setIsAdminDelete(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteReason || deleteReason.trim() === '') {
      alert('Please enter a reason for deletion');
      return;
    }

    try {
      setLoading(true);
      
      const response = await deleteStockTransfer(selectedTransferId, deleteReason.trim());
      
      if (response.data.status === 'SUCCESS') {
       
        showMessagePopUp('SUCCESS', isAdminDelete ? 'Transfer deleted successfully' : 'Delete request submitted successfully', []);  
        setShowDeleteModal(false);
        setDeleteReason('');
        setSelectedTransferId(null);
        fetchTransferHistory();
      } else {
        showMessagePopUp(response.data.status || "FAILED", response.data.message || (isAdminDelete ? 'Failed to delete transfer' : 'Failed to submit delete request'), response.data.errorList || []);
      }
    } catch (error) {
      console.error('Error:', error);
      showMessagePopUp("ERROR", error.message || (isAdminDelete ? 'Failed to delete transfer' : 'Failed to submit delete request'), []);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteReason('');
    setSelectedTransferId(null);
  };


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


    const handleExport = async () => {
  
       const selectedIds = Array.from(selectedTransfers);
  
      if (!selectedStore) {
        showMessagePopUp("ERROR", "Please select a store", []);
        return;
      }
  
      try {
        const response = await exportTransferHistory(selectedStore,selectedIds);
  
        if (response.status === 200) {
          // Create a blob from the response data
          const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
  
          // Create a download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Get filename from Content-Disposition header or use default
          const contentDisposition = response.headers['content-disposition'];
          let filename = 'inventory.xlsx';
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1];
            }
          }
          
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          link.remove();
          window.URL.revokeObjectURL(url);
        } else if (response.status === 204) {
          showMessagePopUp("INFO", "No inventory data available to export", []);
        } else {
          showMessagePopUp("ERROR", response.data?.message || "Failed to export inventory", []);
        }
      } catch (err) {
        console.error("Export error:", err);
        showMessagePopUp("ERROR", err.message || "Error exporting inventory", []);
      } finally {
  
      }
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
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading transfer history...</div>
        </div>
      </div>
    );
  }

 return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Stock Transfer History
          </h1>
        </div>

        <div className={styles.controlsSection}>
          
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

            {role === "ADMIN" && (
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
          )}


      {selectedTransfers.size > 0 && (
    <button className={styles.exportBtn} onClick={handleExport}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-6h8v2H8v-2zm0-3h8v2H8v-2zm0-3h5v2H8V8z"/>
    </svg>
    Export 
  </button>
)}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={48} />
            <p>No transfer history found</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
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
            

                  <th>
                    <span className={styles.showOnMobileTable}>TID</span>
                    <span className={styles.hideOnMobile}>Transfer ID</span>
                  </th>

                  <th>Type</th>
                  <th className={styles.hideOnMobile}>Date & Time</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th className={styles.hideOnMobile}>Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((transfer) => {
                  const canDelete = isWithinOneHour(transfer.transferDate);
                  
                  return (
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
                        <button
                          className={`${styles.expandBtn} ${styles.mobileExpandBtn}`}
                          onClick={() => toggleRow(transfer.transferId)}
                        >
                          {expandedRows.has(transfer.transferId) ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
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
                            <div className={styles.userContact}>{transfer.senderDetails.storeName}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.userInfo}>
                          <User size={14} />
                          <div>
                            <div className={styles.userName}>{transfer.receiverDetails.name}</div>
                            <div className={styles.userContact}>{transfer.receiverDetails.storeName}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.hideOnMobile}>
                        <span className={styles.itemCount}>
                          {transfer.stockDetails.length} item(s)
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.downloadBtn}
                            onClick={() => handleDownloadPdf(transfer.transferId)}
                            disabled={downloadingTransfer === transfer.transferId}
                            title="Download Invoice PDF"
                          >
                            <Download size={16} />
                            
                            <div className={styles.hideOnMobile}>
                              <span className={styles.actionBtnText}>
                                {downloadingTransfer === transfer.transferId ? 'Downloading...' : 'PDF'}
                              </span>
                            </div>

                           
                          </button>
                          
                          {role === "ADMIN" ? (
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteAdmin(transfer.transferId)}
                              disabled={!canDelete}
                              title={!canDelete ? "Delete only available within 1 hour of transfer" : "Delete Bill"}
                            >
                              <Trash2 size={16} />
                            <div className={styles.hideOnMobile}>
                              <span className={styles.deleteBtnText}>Delete</span>
                            </div>
                            </button>
                          ) : (
                            <button
                              className={styles.requestDeleteBtn}
                              onClick={() => handleDelete(transfer.transferId)}
                              disabled={!canDelete}
                              title={!canDelete ? "Delete request only available within 1 hour of transfer" : "Request Delete"}
                            >
                               <div className={styles.hideOnMobile}>
                              <Trash2 size={16} />
                              <span className={styles.deleteBtnText}>Request</span>
                              </div>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandedRows.has(transfer.transferId) && (
                      <tr className={styles.childRow}>
                        <td colSpan="9">
                          <div className={styles.expandedContent}>
                            <div className={styles.showOnMobile}>
                              <div className={styles.mobileDateTime}>
                                <Calendar size={14} />
                                {formatDate(transfer.transferDate)} • {transfer.transferTime}
                              </div>
                            </div>

                            <div className={styles.detailsGrid}>
                              {/* Sender Details */}
                              <div className={styles.detailCard}>
                                <h4>Sender Details</h4>

                                {transfer.senderDetails?.name && (
                                  <p>
                                    <strong>Name:</strong> {transfer.senderDetails.name}
                                  </p>
                                )}

                                {transfer.senderDetails?.contactNumber && (
                                  <p>
                                    <strong>Contact:</strong> {transfer.senderDetails.contactNumber}
                                  </p>
                                )}

                                {transfer.senderDetails?.emailId && (
                                  <p>
                                    <strong>Email:</strong> {transfer.senderDetails.emailId}
                                  </p>
                                )}

                                {transfer.senderDetails?.role && (
                                  <p>
                                    <strong>Role:</strong> {transfer.senderDetails.role}
                                  </p>
                                )}

                                {transfer.senderDetails?.storeName && (
                                  <p>
                                    <strong>Store/Nursery/Company:</strong>{" "}
                                    {transfer.senderDetails.storeName}
                                  </p>
                                )}

                                {transfer.senderDetails?.storeType && (
                                  <p>
                                    <strong>Store Type:</strong>{" "}
                                    {transfer.senderDetails.storeType}
                                  </p>
                                )}

                              </div>
                              {/* Receiver Details */}
                              <div className={styles.detailCard}>
                                <h4>Receiver Details</h4>

                                {transfer.receiverDetails?.name && (
                                  <p>
                                    <strong>Name:</strong> {transfer.receiverDetails.name}
                                  </p>
                                )}

                                {transfer.receiverDetails?.contactNumber && (
                                  <p>
                                    <strong>Contact:</strong> {transfer.receiverDetails.contactNumber}
                                  </p>
                                )}

                                {transfer.receiverDetails?.emailId && (
                                  <p>
                                    <strong>Email:</strong> {transfer.receiverDetails.emailId}
                                  </p>
                                )}

                                {transfer.receiverDetails?.role && (
                                  <p>
                                    <strong>Role:</strong> {transfer.receiverDetails.role}
                                  </p>
                                )}
                                
                                {transfer.receiverDetails?.storeName && (
                                  <p>
                                    <strong>Store/Nursery/Company:</strong>{" "}
                                    {transfer.receiverDetails.storeName}
                                  </p>
                                )}


                                {transfer.receiverDetails?.storeType && (
                                  <p>
                                     <strong>Store Type:</strong>{" "}
                                    {transfer.receiverDetails.storeType}
                                  </p>
                                )}

                              </div>
                          </div>


                          <div className={styles.stockDetailsSection}>
                            <h4>Stock Details</h4>
                            <div className={`${styles.stockTableWrapper} ${transfer.stockDetails.length > 5 ? styles.scrollable : ''}`}>
                              <table className={styles.stockTable}>
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th>Packing</th>
                                    <th className={styles.hideOnMobile}>Current Qty</th>
                                    <th>{transfer.transferType === 'OUT' ? 'Outgoing' : 'Incoming'}</th>
                                    <th>Final Qty</th>
                                    <th className={styles.hideOnMobile}>Bags/Bottles</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {transfer.stockDetails.map((stock, idx) => (
                                    <React.Fragment key={idx}>
                                      <tr>
                                        <td>{stock.productName}</td>
                                        <td>{stock.packingSize} {formatPackingUnit(stock.packingUnit)}</td>
                                        <td className={styles.hideOnMobile}>{stock.currentQuantity}</td>
                                        <td className={styles.highlight}>
                                          {transfer.transferType === 'OUT'
                                            ? stock.outgoingQuantity
                                            : stock.incomingQuantity}{' '}
                                          {formatPackingUnit(stock.packingUnit)}
                                        </td>
                                        <td><strong>{stock.finalRemainingQuantity} {formatPackingUnit(stock.packingUnit)}</strong></td>
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
                                              <span className={styles.metadataLabel}>Transfer Details: </span>
                                              <span className={styles.metadataValue}>
                                                {stock.transferMetadata.weight}
                                              </span>
                                              <span className={styles.metadataSeparator}> • </span>
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
                )})}
              </tbody>
            </table>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={handleCancelDelete}>
          <div className={styles.deleteModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteModalHeader}>
              <div className={styles.deleteIconWrapper}>
                <Trash2 size={24} />
              </div>
              <h3>{isAdminDelete ? 'Delete Transfer' : 'Request Delete Transfer'}</h3>
              <p className={styles.deleteModalSubtitle}>
                {isAdminDelete 
                  ? 'This action cannot be undone. Please provide a reason for deleting this transfer.'
                  : 'Please provide a reason for requesting deletion of this transfer.'}
              </p>
            </div>

            <div className={styles.deleteModalBody}>
              <div className={styles.transferIdDisplay}>
                <span className={styles.transferIdLabel}>Transfer ID:</span>
                <span className={styles.transferIdValue}>{selectedTransferId}</span>
              </div>

              <div className={styles.deleteFormGroup}>
                <label htmlFor="deleteReason">
                  Reason for {isAdminDelete ? 'Deletion' : 'Delete Request'} <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="deleteReason"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Enter the reason here..."
                  className={styles.deleteReasonTextarea}
                  rows="4"
                  maxLength="500"
                  autoFocus
                />
                <div className={styles.charCount}>
                  {deleteReason.length}/500 characters
                </div>
              </div>
            </div>

            <div className={styles.deleteModalFooter}>
              <button 
                className={styles.deleteCancelBtn} 
                onClick={handleCancelDelete}
                type="button"
              >
                Cancel
              </button>
              <button 
                className={isAdminDelete ? styles.deleteConfirmBtn : styles.requestConfirmBtn}
                onClick={handleConfirmDelete}
                disabled={!deleteReason.trim()}
                type="button"
              >
                <Trash2 size={18} />
                {isAdminDelete ? 'Delete Transfer' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default StockTransferHistory;