import React, { useState, useEffect } from 'react';
import styles from './RequestView.module.css';
import { findRequestByStatus } from '../../api/findRequestByStatus';
import { deleteRequestApi } from '../../api/deleteRequestApi';

export const RequestView = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('PENDING');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [actionForm, setActionForm] = useState({
    requestId: null,
    remark: '',
    actionStatus: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

  useEffect(() => {
    fetchRequests(selectedStatus);
  }, [selectedStatus]);

  const fetchRequests = async (status) => {
    setLoading(true);
    setError(null);
    try {
      const response = await findRequestByStatus(status);

      if (response.data.status === 'SUCCESS') {
        setRequests(response.data.payload || []);
      } else {
        setError(response.data.message || 'Failed to fetch requests');
      }
    } catch (err) {
      setError('No request found');
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    
    if (!actionForm.actionStatus || !actionForm.remark.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const response = await deleteRequestApi(
        actionForm.requestId,
        actionForm.remark.trim(),
        actionForm.actionStatus
      );

      if (response.data.status === 'SUCCESS') {
        alert(`Request ${actionForm.actionStatus.toLowerCase()} successfully`);
        closeActionModal();
        fetchRequests(selectedStatus);
      } else {
        alert(response.data.message || 'Action failed');
      }
    } catch (err) {
      alert(err.message || 'Network error occurred');
      console.error('Error submitting action:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const openActionModal = (request) => {
    setSelectedRequest(request);
    setActionForm({
      requestId: request.requestId,
      remark: '',
      actionStatus: ''
    });
    setActionModal(true);
  };

  const closeActionModal = () => {
    setActionModal(false);
    setSelectedRequest(null);
    setActionForm({
      requestId: null,
      remark: '',
      actionStatus: ''
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'PENDING': styles.statusPending,
      'APPROVED': styles.statusApproved,
      'REJECTED': styles.statusRejected
    };
    return `${styles.statusBadge} ${statusMap[status] || ''}`;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}> Request Center</h1>
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button 
            className={styles.refreshButton}
            onClick={() => fetchRequests(selectedStatus)}
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
            <span>Loading requests...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className={styles.errorState}>
            <p>{error}</p>
         
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className={styles.tableContainer}>
            <table className={`table table-bordered table-hover ${styles.table}`}>
              <thead className={styles.thead}>
                <tr className={styles.mainHeader}>
                  <th className={styles.headerCell}>Transfer ID</th>
                  <th className={styles.headerCell}>Status</th>
                  <th className={styles.headerCell}>Requested By</th>
                  <th className={styles.headerCell}>User ID</th>
                  <th className={styles.headerCell}>Role</th>
                  <th className={styles.headerCell}>Date & Time</th>
                  <th className={styles.headerCell}>Reason</th>
                  <th className={styles.headerCell}>Description</th>
                  <th className={styles.headerCell}>Actioned By</th>
                  <th className={styles.headerCell}>Remark</th>
                  <th className={styles.headerCell}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="11" className={styles.noResults}>
                      No requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.requestId} className={styles.dataRow}>
                      <td className={styles.regularCell}>#{request.transferId}</td>
                      <td className={styles.regularCell}>
                        <span className={getStatusBadgeClass(request.actionStatus)}>
                          {request.actionStatus}
                        </span>
                      </td>
                      <td className={styles.regularCell}>{request.requestedBy}</td>
                      <td className={styles.regularCell}>{request.userId}</td>
                      <td className={styles.regularCell}>{request.userRole}</td>
                      <td className={styles.regularCell}>
                        {new Date(request.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })} {request.time}
                      </td>
                      <td className={styles.regularCell}>{request.reason}</td>
                      <td className={styles.regularCell}>{request.description || '-'}</td>
                      <td className={styles.regularCell}>{request.actionedBy || '-'}</td>
                      <td className={styles.regularCell}>{request.remark || '-'}</td>
                      <td className={styles.regularCell}>
                        {request.actionStatus === 'PENDING' && (
                          <button 
                            className={styles.actionBtn}
                            onClick={() => openActionModal(request)}
                          >
                            Take Action
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal && selectedRequest && (
        <div className={styles.modalOverlay} onClick={closeActionModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Take Action on Request</h2>
              <button 
                className={styles.closeBtn}
                onClick={closeActionModal}
                aria-label="Close modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.requestInfo}>
                <div className={styles.requestInfoGrid}>
                  <div className={styles.requestInfoItem}>
                    <span className={styles.requestInfoLabel}>Transfer ID:</span>
                    <span className={styles.requestInfoValue}>#{selectedRequest.transferId}</span>
                  </div>

                <div className={styles.requestInfoFull}>
                  <span className={styles.requestInfoLabel}>Reason:</span>
                  <p className={styles.requestInfoText}>{selectedRequest.reason}</p>
                </div>
                </div>
             
              </div>

              <form onSubmit={handleActionSubmit} className={styles.actionForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Select Action <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="actionStatus"
                        value="APPROVED"
                        checked={actionForm.actionStatus === 'APPROVED'}
                        onChange={(e) => setActionForm({...actionForm, actionStatus: e.target.value})}
                        required
                      />
                      <span className={styles.radioCustom}></span>
                      <span className={styles.radioContent}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>Approve</span>
                      </span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="actionStatus"
                        value="REJECTED"
                        checked={actionForm.actionStatus === 'REJECTED'}
                        onChange={(e) => setActionForm({...actionForm, actionStatus: e.target.value})}
                        required
                      />
                      <span className={styles.radioCustom}></span>
                      <span className={styles.radioContent}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        <span>Reject</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="remark">
                    Remark <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="remark"
                    className={styles.textarea}
                    rows="4"
                    placeholder="Enter your remark or reason for this action..."
                    value={actionForm.remark}
                    onChange={(e) => setActionForm({...actionForm, remark: e.target.value})}
                    required
                  />
                  <span className={styles.charCount}>
                    {actionForm.remark.length} characters
                  </span>
                </div>

                <div className={styles.modalActions}>
                  <button 
                    type="button" 
                    className={styles.cancelBtn}
                    onClick={closeActionModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitBtn}
                    disabled={!actionForm.actionStatus || !actionForm.remark.trim() || submitting}
                  >
                    {submitting ? (
                      <>
                        <div className={styles.buttonSpinner}></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Submit Action
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

export default RequestView;