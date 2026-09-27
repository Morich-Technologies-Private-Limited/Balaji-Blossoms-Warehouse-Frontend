import { useState, useEffect } from 'react';
import { UserPlus, KeyRound, Ban, CheckCircle2, Users } from 'lucide-react';
import styles from './SupervisorActivity.module.css';
import {
  fetchSupervisors,
  addSupervisor,
  saveSupervisorLogin,
  updateSupervisorLoginStatus,
} from '../../api/supervisorApi';
import { getSessionData } from '../utils/getSessionData';
import { useStores } from '../../context/StoreContext';
import { notify, confirmAction } from '../utils/feedback';

const EMPTY_SUPERVISOR = { name: '', phoneNumber: '', password: '' };

// Supervisors tab: add supervisors and manage their login (supervisor logs in with phone number + password)
const SupervisorManagement = () => {
  const { role, storeId: sessionStoreId } = getSessionData();
  const isAdmin = role === 'ADMIN';
  const { stores } = useStores();

  const [selectedStoreId, setSelectedStoreId] = useState(sessionStoreId || '');
  const storeId = isAdmin ? selectedStoreId : undefined;

  const [supervisors, setSupervisors] = useState([]);
  const [newSupervisor, setNewSupervisor] = useState(EMPTY_SUPERVISOR);
  const [passwordFor, setPasswordFor] = useState(null); // supervisorId whose password form is open
  const [password, setPassword] = useState('');

  // reload after add / password / block actions
  const loadSupervisors = async () => {
    try {
      const response = await fetchSupervisors(storeId);
      setSupervisors(response.data.payload || []);
    } catch (error) {
      notify.error(error.message || 'Failed to load supervisors');
    }
  };

  useEffect(() => {
    let active = true;
    fetchSupervisors(storeId)
      .then(response => active && setSupervisors(response.data.payload || []))
      .catch(error => notify.error(error.message || 'Failed to load supervisors'));
    return () => { active = false; };
  }, [storeId]);

  const handleAddSupervisor = async () => {
    if (!newSupervisor.name.trim()) return notify.warning('Please enter supervisor name');
    if (!/^\d{10}$/.test(newSupervisor.phoneNumber)) return notify.warning('Please enter a valid 10 digit mobile number');
    if (newSupervisor.password.length < 6) return notify.warning('Password is required (min 6 characters)');

    try {
      const response = await addSupervisor({
        name: newSupervisor.name.trim(),
        phoneNumber: newSupervisor.phoneNumber,
        password: newSupervisor.password,
      }, storeId);
      notify.success(response.data.message || 'Supervisor added');
      setNewSupervisor(EMPTY_SUPERVISOR);
      loadSupervisors();
    } catch (error) {
      notify.error(error.message);
    }
  };

  const handleSavePassword = async (supervisor) => {
    if (password.length < 6) return notify.warning('Password must be at least 6 characters');
    try {
      const response = await saveSupervisorLogin(supervisor.supervisorId, password, storeId);
      notify.success(response.data.message || 'Password saved');
      setPasswordFor(null);
      setPassword('');
      loadSupervisors();
    } catch (error) {
      notify.error(error.message);
    }
  };

  const handleToggleLoginStatus = async (supervisor) => {
    const nextStatus = supervisor.loginStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const action = nextStatus === 'BLOCKED' ? 'Block' : 'Unblock';
    const confirmed = await confirmAction(`${action} login for ${supervisor.name}?`, {
      title: `${action} supervisor`,
      confirmText: action,
      danger: nextStatus === 'BLOCKED',
    });
    if (!confirmed) return;
    try {
      await updateSupervisorLoginStatus(supervisor.supervisorId, nextStatus, storeId);
      notify.success(`Login ${nextStatus === 'BLOCKED' ? 'blocked' : 'unblocked'} for ${supervisor.name}`);
      loadSupervisors();
    } catch (error) {
      notify.error(error.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Supervisors</h1>
          {isAdmin && (
            <select className={styles.storeSelect} value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}>
              {stores.map(store => (
                <option key={store.storeId} value={store.storeId}>{store.storeName}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Add supervisor */}
        <div className={styles.card}>
          <strong className={styles.cardTitle}><UserPlus size={18} /> Add Supervisor</strong>
          <div className={styles.formGrid}>
            <input className={styles.input} placeholder="Supervisor name" value={newSupervisor.name}
              onChange={(e) => setNewSupervisor(prev => ({ ...prev, name: e.target.value }))} />
            <input className={styles.input} placeholder="10 digit mobile (login id)" maxLength={10} value={newSupervisor.phoneNumber}
              onChange={(e) => setNewSupervisor(prev => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '') }))} />
            <input className={styles.input} type="password" placeholder="Password (min 6)" required value={newSupervisor.password}
              onChange={(e) => setNewSupervisor(prev => ({ ...prev, password: e.target.value }))} />
            <button className={styles.primaryBtn} onClick={handleAddSupervisor}>Save</button>
          </div>
          <small className={styles.muted}>Supervisor logs in with the mobile number and this password.</small>
        </div>

        {/* List */}
        <div className={styles.tableCard}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile (Login)</th>
                  <th>Store</th>
                  <th>Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {supervisors.length ? supervisors.map(supervisor => (
                  <tr key={supervisor.supervisorId}>
                    <td>{supervisor.name}</td>
                    <td>{supervisor.phoneNumber}</td>
                    <td>{supervisor.storeName}</td>
                    <td>
                      {supervisor.hasLogin ? (
                        <span className={`${styles.badge} ${supervisor.loginStatus === 'ACTIVE' ? styles.ok : styles.expired}`}>
                          {supervisor.loginStatus}
                        </span>
                      ) : (
                        <em className={styles.muted}>Not enabled</em>
                      )}
                    </td>
                    <td>
                      {passwordFor === supervisor.supervisorId ? (
                        <div className={styles.inlineForm}>
                          <input className={styles.input} type="password" placeholder="New password (min 6)" value={password}
                            onChange={(e) => setPassword(e.target.value)} />
                          <button className={styles.primaryBtn} onClick={() => handleSavePassword(supervisor)}>Save</button>
                          <button className={styles.secondaryBtn} onClick={() => { setPasswordFor(null); setPassword(''); }}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <button className={styles.iconBtn} onClick={() => { setPasswordFor(supervisor.supervisorId); setPassword(''); }}>
                            <KeyRound size={15} /> {supervisor.hasLogin ? 'Reset Password' : 'Enable Login'}
                          </button>
                          {supervisor.hasLogin && (
                            <button className={styles.iconBtn} onClick={() => handleToggleLoginStatus(supervisor)}>
                              {supervisor.loginStatus === 'ACTIVE'
                                ? <><Ban size={15} /> Block</>
                                : <><CheckCircle2 size={15} /> Unblock</>}
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className={styles.emptyRow}>
                      <Users size={40} />
                      <p>No supervisors added yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorManagement;
