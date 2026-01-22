import React, { useState, useEffect, useRef } from 'react';
import styles from './UserManagement.module.css';
import { fetchAllUser } from '../../api/fetchAllUser';
import { updateUserStatus } from '../../api/updateUserStatus';
import { updateUserStore } from '../../api/updateUserStore';
import { fetchAllStores } from '../../api/fetchAllStores';
import { showMessagePopUp } from '../modal/MessagePopUp';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [storeModal, setStoreModal] = useState(false);
  const [storeForm, setStoreForm] = useState({
    userId: null,
    storeId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = ['ALL', 'ACTIVE', 'BLOCKED'];
  const hasFetched = useRef(false);

useEffect(() => {
  if (hasFetched.current) return;
  hasFetched.current = true;

  const loadData = async () => {
    await fetchStores();   
    await fetchUsers();
  };

  loadData();
}, []);


  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAllUser();

      if (response.data.status === 'SUCCESS') {
        setUsers(response.data.payload || []);
      } else {
        setError(response.data.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await fetchAllStores();

      if (response.data.status === 'SUCCESS') {
        setStores(response.data.payload || []);
      } else {
        console.error('Failed to fetch stores:', response.data.message);
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

  const handleStatusToggle = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    
    setSubmitting(true);

    try {
      const response = await updateUserStatus(user.userId, newStatus);

      if (response.data.status === 'SUCCESS') {
        fetchUsers();
      }

      showMessagePopUp(response.data.status, response.data.message,response.data.errorList || []);

    } catch (err) {
      showMessagePopUp('ERROR', err.message || 'Network error occurred', []);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    
    if (!storeForm.storeId) {
      alert('Please select a store');
      return;
    }

    setSubmitting(true);

    try {
      const response = await updateUserStore(storeForm.userId, storeForm.storeId);

       if (response.data.status === 'SUCCESS') {
        fetchUsers();
        closeStoreModal();
      }

      showMessagePopUp(response.data.status, response.data.message,response.data.errorList || []);
    
    } catch (err) {
      alert(err.message || 'Network error occurred');
      console.error('Error updating store:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const openStoreModal = (user) => {
    setSelectedUser(user);
    setStoreForm({
      userId: user.userId,
      storeId: user.storeId || ''
    });
    setStoreModal(true);
  };

  const closeStoreModal = () => {
    setStoreModal(false);
    setSelectedUser(null);
    setStoreForm({
      userId: null,
      storeId: ''
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'ACTIVE': styles.statusActive,
      'BLOCKED': styles.statusBlocked
    };
    return `${styles.statusBadge} ${statusMap[status] || ''}`;
  };

  const filteredUsers = statusFilter === 'ALL' 
    ? users 
    : users.filter(user => user.status === statusFilter);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>User Management</h1>
        </div>
      </div>

      <div className={styles.maincontent}>
        {/* Controls */}
        <div className={styles.controls}>
          {/* Status Filter */}
          <div className={styles.storeFilter}>
            <svg className={styles.storeIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M7 12h10M10 18h4"/>
            </svg>
            <select 
              className={styles.storeSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button 
            className={styles.refreshButton}
            onClick={fetchUsers}
            disabled={loading}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className={loading ? styles.spinning : ''}
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <span>Loading users...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button 
              className={styles.refreshButton}
              onClick={fetchUsers}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className={styles.tableContainer}>
            <table className={`table table-bordered table-hover ${styles.table}`}>
              <thead className={styles.thead}>
                <tr className={styles.mainHeader}>
                  <th className={styles.headerCell}>User ID</th>
                  <th className={styles.headerCell}>Name</th>
                  <th className={styles.headerCell}>Email</th>
                  <th className={styles.headerCell}>Contact Number</th>
                  <th className={styles.headerCell}>Role</th>
                  <th className={styles.headerCell}>Status</th>
                  <th className={styles.headerCell}>Store ID</th>
                  <th className={styles.headerCell}>Store Name</th>
                  <th className={styles.headerCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="9" className={styles.noResults}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.userId} className={styles.dataRow}>
                      <td className={styles.regularCell}>{user.userId}</td>
                      <td className={styles.regularCell}>{user.name}</td>
                      <td className={styles.regularCell}>{user.emailId}</td>
                      <td className={styles.regularCell}>{user.contactNumber}</td>
                      <td className={styles.regularCell}>{user.role}</td>
                      <td className={styles.regularCell}>
                        <span className={getStatusBadgeClass(user.status)}>
                          {user.status}
                        </span>
                      </td>
                      <td className={styles.regularCell}>{user.storeId || '-'}</td>
                      <td className={styles.regularCell}>{user.storeName || '-'}</td>
                      <td className={styles.regularCell}>
                        <div className={styles.actionButtons}>
                          {user.status === 'ACTIVE' ? (
                            <button 
                              className={`${styles.actionBtn} ${styles.blockBtn}`}
                              onClick={() => handleStatusToggle(user)}
                              disabled={submitting}
                              title="Block User"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                              </svg>
                              Block
                            </button>
                          ) : (
                            <button 
                              className={`${styles.actionBtn} ${styles.unblockBtn}`}
                              onClick={() => handleStatusToggle(user)}
                              disabled={submitting}
                              title="Unblock User"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Unblock
                            </button>
                          )}
                          <button 
                            className={`${styles.actionBtn} ${styles.storeBtn}`}
                            onClick={() => openStoreModal(user)}
                            title="Update Store"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                              <polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                            Store
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Store Update Modal */}
      {storeModal && selectedUser && (
        <div className={styles.modalOverlay} onClick={closeStoreModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Update User Store</h2>
              <button 
                className={styles.closeBtn}
                onClick={closeStoreModal}
                aria-label="Close modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.userInfo}>
                <h3 className={styles.userInfoTitle}>User Details</h3>
                <div className={styles.userInfoGrid}>
                  <div className={styles.userInfoItem}>
                    <span className={styles.userInfoLabel}>User ID:</span>
                    <span className={styles.userInfoValue}>{selectedUser.userId}</span>
                  </div>
                  <div className={styles.userInfoItem}>
                    <span className={styles.userInfoLabel}>Name:</span>
                    <span className={styles.userInfoValue}>{selectedUser.name}</span>
                  </div>
                  <div className={styles.userInfoItem}>
                    <span className={styles.userInfoLabel}>Current Store ID:</span>
                    <span className={styles.userInfoValue}>{selectedUser.storeId || 'Not Assigned'}</span>
                  </div>
                  <div className={styles.userInfoItem}>
                    <span className={styles.userInfoLabel}>Current Store Name:</span>
                    <span className={styles.userInfoValue}>{selectedUser.storeName || 'Not Assigned'}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleStoreSubmit} className={styles.actionForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="storeId">
                    Select Store <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="storeId"
                    className={styles.storeDropdown}
                    value={storeForm.storeId}
                    onChange={(e) => setStoreForm({...storeForm, storeId: e.target.value})}
                    required
                  >
                    <option value="">Select Store</option>
                    {stores.map((store) => (
                      <option key={store.storeId} value={store.storeId}>
                        {store.storeName} ({store.storeType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.modalActions}>
                  <button 
                    type="button" 
                    className={styles.cancelBtn}
                    onClick={closeStoreModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitBtn}
                    disabled={!storeForm.storeId || submitting}
                  >
                    {submitting ? (
                      <>
                        <div className={styles.buttonSpinner}></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Update Store
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;