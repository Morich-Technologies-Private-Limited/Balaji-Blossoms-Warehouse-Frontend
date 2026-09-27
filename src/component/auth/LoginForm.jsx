import React, { useState } from 'react';
import styles from './LoginForm.module.css';
import logo from "../../assets/logo.png";
import { loginApi, devModeLogin } from '../../api/loginApi';
import { supervisorLoginApi } from '../../supervisor/supervisorPortalApi';
import { useNavigate } from 'react-router-dom';
import { useStores } from '../../context/StoreContext';
import { notify } from '../utils/feedback';

const LoginForm = () => {  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [isSupervisorLogin, setIsSupervisorLogin] = useState(false);
  const { loadStores } = useStores(); 
  const navigate = useNavigate();

  // Check if dev mode is enabled
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (email && password) {
      setIsLoading(true);
      
      try {
        const result = isSupervisorLogin
          ? await supervisorLoginApi(email, password)
          : await loginApi(email, password);

        if (result.success) {
          notify.success(`Logged in as ${email}`, 'Login successful');
          if (!isSupervisorLogin) loadStores(); // store list is not available to supervisors
          navigate(result.navLink);
        } else {
          notify.error(result.message || 'Login failed', 'Login failed');
        }
      } catch (error) {
        notify.error('An error occurred during login', 'Login failed');
      } finally {
        setIsLoading(false);
      }
    } else {
      notify.warning('Please fill in all fields');
    }
  };

  const handleDevModeLogin = (role) => {
    setIsLoading(true);

    try {
      const result = devModeLogin(role);
      notify.success(`Dev Mode: Logged in as ${role}`, 'Login successful');
      navigate(result.navLink);
    } catch (error) {
      notify.error('Dev mode login failed', 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 p-0">
      <div className="row g-0 min-vh-100">
        {/* Left Side - Branding (Desktop Only) */}
        <div className={`col-lg-6 ${styles.brandingSide} d-none d-lg-flex align-items-center justify-content-center p-5 text-white position-relative overflow-hidden`}>
          <div className={`${styles.brandingContent} text-center position-relative z-1`}>
            <img src={logo} className="img-fluid d-block mx-auto" alt="Responsive"/>
            <p className="lead mb-4" style={{ opacity: 0.9 }}>The Home of Interior Plants</p>
            <div className={`${styles.featureList} mt-5`}>
              <div className={styles.featureItem}>
                <i className="bi bi-flower1"></i>
                <span>House Plants</span>
              </div>
              <div className={styles.featureItem}>
                <i className="bi bi-flower3"></i>
                <span>Pots</span>
              </div>
              <div className={styles.featureItem}>
                <i className="bi bi-flower1"></i>
                <span>Containers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-light p-4 p-md-5">
          <div className={`${styles.formContainer} w-100`} style={{ maxWidth: '440px' }}>
            {/* Mobile Logo Header */}
            <div className={`${styles.mobileHeader} d-lg-none text-center mb-4`}>
              <img src={logo} className="img-fluid d-block mx-auto" alt="Responsive"/>
            </div>

            <div className={`${styles.formCard} bg-white p-4 p-md-5 rounded-4 shadow-sm`}>
              {/* Dev Mode Badge */}
              {isDevMode && (
                <div className="alert alert-warning py-2 px-3 mb-3 small d-flex align-items-center">
                  <i className="bi bi-code-slash me-2"></i>
                  <strong>Dev Mode Active</strong>
                </div>
              )}

              <div className="mb-4">
                <h2 className="h3 fw-bold text-dark mb-2">Welcome Back</h2>
                <p className="text-muted mb-0">
                  {isDevMode ? 'Select a role to login' : 'Sign in to your account'}
                </p>
              </div>

              {isDevMode ? (
                // Dev Mode: Role Selection
                <div>
                  <label className="form-label text-secondary small fw-semibold mb-3">Select Role</label>
                  <div className="d-grid gap-2">
                    <button 
                      type="button"
                      className={`btn ${selectedRole === 'ADMIN' ? styles.btnPrimary : 'btn-outline-secondary'} py-3 text-start`}
                      onClick={() => handleDevModeLogin('ADMIN')}
                      disabled={isLoading}
                    >
                      <i className="bi bi-shield-check me-2"></i>
                      <strong>Admin</strong>
                      <small className="d-block text-muted mt-1">Full system access</small>
                    </button>

                    <button 
                      type="button"
                      className={`btn ${selectedRole === 'MAIN_STORE_MANAGER' ? styles.btnPrimary : 'btn-outline-secondary'} py-3 text-start`}
                      onClick={() => handleDevModeLogin('MAIN_STORE_MANAGER')}
                      disabled={isLoading}
                    >
                      <i className="bi bi-shop me-2"></i>
                      <strong>Main Store Manager</strong>
                      <small className="d-block text-muted mt-1">Manage main store operations</small>
                    </button>

                    <button 
                      type="button"
                      className={`btn ${selectedRole === 'SUB_STORE_MANAGER' ? styles.btnPrimary : 'btn-outline-secondary'} py-3 text-start`}
                      onClick={() => handleDevModeLogin('SUB_STORE_MANAGER')}
                      disabled={isLoading}
                    >
                      <i className="bi bi-building me-2"></i>
                      <strong>Sub Store Manager</strong>
                      <small className="d-block text-muted mt-1">Manage sub store</small>
                    </button>

                    <button 
                      type="button"
                      className={`btn ${selectedRole === 'SUB_STORE_SUPERVISOR' ? styles.btnPrimary : 'btn-outline-secondary'} py-3 text-start`}
                      onClick={() => handleDevModeLogin('SUB_STORE_SUPERVISOR')}
                      disabled={isLoading}
                    >
                      <i className="bi bi-person-badge me-2"></i>
                      <strong>Sub Store Supervisor</strong>
                      <small className="d-block text-muted mt-1">Supervise sales operations</small>
                    </button>

                    <button 
                      type="button"
                      className={`btn ${selectedRole === 'SHOP_MANAGER' ? styles.btnPrimary : 'btn-outline-secondary'} py-3 text-start`}
                      onClick={() => handleDevModeLogin('SHOP_MANAGER')}
                      disabled={isLoading}
                    >
                      <i className="bi bi-basket me-2"></i>
                      <strong>Shop Manager</strong>
                      <small className="d-block text-muted mt-1">Manage shop operations</small>
                    </button>
                  </div>
                </div>
              ) : (
                // Production Mode: Normal Login Form
                <form onSubmit={handleSubmit}>
                  {/* Staff (users) and supervisors have separate logins */}
                  <div className="btn-group w-100 mb-4" role="group">
                    <button
                      type="button"
                      className={`btn ${!isSupervisorLogin ? styles.btnPrimary : 'btn-outline-secondary'}`}
                      onClick={() => setIsSupervisorLogin(false)}
                    >
                      <i className="bi bi-person-workspace me-2"></i>Staff
                    </button>
                    <button
                      type="button"
                      className={`btn ${isSupervisorLogin ? styles.btnPrimary : 'btn-outline-secondary'}`}
                      onClick={() => setIsSupervisorLogin(true)}
                    >
                      <i className="bi bi-person-badge me-2"></i>Supervisor
                    </button>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-semibold mb-2">
                      {isSupervisorLogin ? 'Mobile Number' : 'Email Address'}
                    </label>
                    <div className={styles.inputWrapper}>
                      <i className={`bi ${isSupervisorLogin ? 'bi-phone' : 'bi-envelope'}`}></i>
                      <input
                        type={isSupervisorLogin ? 'tel' : 'email'}
                        className="form-control"
                        placeholder={isSupervisorLogin ? '10 digit mobile number' : 'your.email@example.com'}
                        maxLength={isSupervisorLogin ? 10 : undefined}
                        value={email}
                        onChange={(e) => setEmail(isSupervisorLogin ? e.target.value.replace(/\D/g, '') : e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-semibold mb-2">Password</label>
                    <div className={styles.inputWrapper}>
                      <i className="bi bi-lock"></i>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button 
                        type="button"
                        className={styles.togglePassword}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        <i id='eye-icon' className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        id="rememberMe"
                      />
                      <label className="form-check-label small text-muted" htmlFor="rememberMe">
                        Remember me
                      </label>
                    </div>
                    <a href="#" className={`small ${styles.linkPrimary}`}>Forgot password?</a>
                  </div>

                  <button type="submit" className={`btn ${styles.btnPrimary} w-100 py-3 fw-semibold mb-4`}>
                    Sign In
                    <i className="bi bi-arrow-right ms-2"></i>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;