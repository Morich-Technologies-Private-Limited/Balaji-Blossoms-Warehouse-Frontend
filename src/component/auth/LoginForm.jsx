import React, { useState } from 'react';
import styles from './LoginForm.module.css';
import logo from "../../assets/logo.png";
import { loginApi, devModeLogin } from '../../api/loginApi';
import { supervisorLoginApi } from '../../supervisor/supervisorPortalApi';
import { useNavigate } from 'react-router-dom';
import { useStores } from '../../context/StoreContext';
import { notify } from '../utils/feedback';

const LoginForm = () => {
  const [userId, setUserId] = useState('');
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

    if (!userId || !password) {
      notify.warning('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const result = isSupervisorLogin
        ? await supervisorLoginApi(userId, password)
        : await loginApi(userId, password);

      if (result.success) {
        notify.success(
          `Logged in as ${userId}`,
          'Login successful'
        );

        // Store list is not available / needed for supervisors
        if (!isSupervisorLogin) {
          loadStores();
        }

        navigate(result.navLink);
      } else {
        notify.error(
          result.message || 'Login failed',
          'Login failed'
        );
      }
    } catch (error) {
      console.error('Login error:', error);

      notify.error(
        'An error occurred during login',
        'Login failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevModeLogin = (role) => {
    setIsLoading(true);
    setSelectedRole(role);

    try {
      const result = devModeLogin(role);

      notify.success(
        `Dev Mode: Logged in as ${role}`,
        'Login successful'
      );

      navigate(result.navLink);
    } catch (error) {
      console.error('Dev mode login error:', error);

      notify.error(
        'Dev mode login failed',
        'Login failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 p-0">
      <div className="row g-0 min-vh-100">

        {/* Left Side - Branding (Desktop Only) */}
        <div
          className={`col-lg-6 ${styles.brandingSide} d-none d-lg-flex align-items-center justify-content-center p-5 text-white position-relative overflow-hidden`}
        >
          <div
            className={`${styles.brandingContent} text-center position-relative z-1`}
          >
            <img
              src={logo}
              className="img-fluid d-block mx-auto"
              alt="Responsive"
            />

            <p
              className="lead mb-4"
              style={{ opacity: 0.9 }}
            >
              The Home of Interior Plants
            </p>

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
          <div
            className={`${styles.formContainer} w-100`}
            style={{ maxWidth: '440px' }}
          >

            {/* Mobile Logo Header */}
            <div
              className={`${styles.mobileHeader} d-lg-none text-center mb-4`}
            >
              <img
                src={logo}
                className="img-fluid d-block mx-auto"
                alt="Responsive"
              />
            </div>


            <div
              className={`${styles.formCard} bg-white p-4 p-md-5 rounded-4 shadow-sm`}
            >

              {/* Dev Mode Badge */}
              {isDevMode && (
                <div className="alert alert-warning py-2 px-3 mb-3 small d-flex align-items-center">
                  <i className="bi bi-code-slash me-2"></i>
                  <strong>Dev Mode Active</strong>
                </div>
              )}


              <div className="mb-4">
                <h2 className="h3 fw-bold text-dark mb-2">
                  Welcome Back
                </h2>

                <p className="text-muted mb-0">
                  {isDevMode
                    ? 'Select a role to login'
                    : 'Sign in to your account'}
                </p>
              </div>


              {isDevMode ? (

                // ================= DEV MODE =================
                <div>
                  <label className="form-label text-secondary small fw-semibold mb-3">
                    Select Role
                  </label>

                  <div className="d-grid gap-2">

                    {/* ADMIN */}
                    <button
                      type="button"
                      className={`btn ${
                        selectedRole === 'ADMIN'
                          ? styles.btnPrimary
                          : 'btn-outline-secondary'
                      } py-3 text-start`}
                      onClick={() => handleDevModeLogin('ADMIN')}
                      disabled={isLoading}
                    >
                      <i className="bi bi-shield-check me-2"></i>

                      <strong>Admin</strong>

                      <small className="d-block text-muted mt-1">
                        Full system access
                      </small>
                    </button>


                    {/* MAIN STORE MANAGER */}
                    <button
                      type="button"
                      className={`btn ${
                        selectedRole === 'MAIN_STORE_MANAGER'
                          ? styles.btnPrimary
                          : 'btn-outline-secondary'
                      } py-3 text-start`}
                      onClick={() =>
                        handleDevModeLogin('MAIN_STORE_MANAGER')
                      }
                      disabled={isLoading}
                    >
                      <i className="bi bi-shop me-2"></i>

                      <strong>Main Store Manager</strong>

                      <small className="d-block text-muted mt-1">
                        Manage main store operations
                      </small>
                    </button>


                    {/* SUB STORE MANAGER */}
                    <button
                      type="button"
                      className={`btn ${
                        selectedRole === 'SUB_STORE_MANAGER'
                          ? styles.btnPrimary
                          : 'btn-outline-secondary'
                      } py-3 text-start`}
                      onClick={() =>
                        handleDevModeLogin('SUB_STORE_MANAGER')
                      }
                      disabled={isLoading}
                    >
                      <i className="bi bi-building me-2"></i>

                      <strong>Sub Store Manager</strong>

                      <small className="d-block text-muted mt-1">
                        Manage sub store
                      </small>
                    </button>


                    {/* SUB STORE SUPERVISOR */}
                    <button
                      type="button"
                      className={`btn ${
                        selectedRole === 'SUB_STORE_SUPERVISOR'
                          ? styles.btnPrimary
                          : 'btn-outline-secondary'
                      } py-3 text-start`}
                      onClick={() =>
                        handleDevModeLogin('SUB_STORE_SUPERVISOR')
                      }
                      disabled={isLoading}
                    >
                      <i className="bi bi-person-badge me-2"></i>

                      <strong>Sub Store Supervisor</strong>

                      <small className="d-block text-muted mt-1">
                        Supervise sales operations
                      </small>
                    </button>


                    {/* SHOP MANAGER */}
                    <button
                      type="button"
                      className={`btn ${
                        selectedRole === 'SHOP_MANAGER'
                          ? styles.btnPrimary
                          : 'btn-outline-secondary'
                      } py-3 text-start`}
                      onClick={() =>
                        handleDevModeLogin('SHOP_MANAGER')
                      }
                      disabled={isLoading}
                    >
                      <i className="bi bi-basket me-2"></i>

                      <strong>Shop Manager</strong>

                      <small className="d-block text-muted mt-1">
                        Manage shop operations
                      </small>
                    </button>

                  </div>
                </div>

              ) : (

                // ================= PRODUCTION LOGIN =================
                <form onSubmit={handleSubmit}>

                  {/* Staff and Supervisor have separate login flows */}
                  <div
                    className="btn-group w-100 mb-4"
                    role="group"
                  >

                    <button
                      type="button"
                      className={`btn ${
                        !isSupervisorLogin
                          ? styles.btnPrimary
                          : 'btn-outline-secondary'
                      }`}
                      onClick={() => {
                        setIsSupervisorLogin(false);
                        setUserId('');
                      }}
                      disabled={isLoading}
                    >
                      <i className="bi bi-person-workspace me-2"></i>
                      Staff
                    </button>


                    <button
                      type="button"
                      className={`btn ${
                        isSupervisorLogin
                          ? styles.btnPrimary
                          : 'btn-outline-secondary'
                      }`}
                      onClick={() => {
                        setIsSupervisorLogin(true);
                        setUserId('');
                      }}
                      disabled={isLoading}
                    >
                      <i className="bi bi-person-badge me-2"></i>
                      Supervisor
                    </button>

                  </div>


                  {/* ================= USER ID / MOBILE ================= */}
                  <div className="mb-3">

                    <label className="form-label text-secondary small fw-semibold mb-2">
                      {isSupervisorLogin
                        ? 'Mobile Number'
                        : 'User ID'}
                    </label>

                    <div className={styles.inputWrapper}>

                      <i
                        className={`bi ${
                          isSupervisorLogin
                            ? 'bi-phone'
                            : 'bi-person'
                        }`}
                      ></i>

                      <input
                        type={
                          isSupervisorLogin
                            ? 'tel'
                            : 'text'
                        }
                        className="form-control"
                        placeholder={
                          isSupervisorLogin
                            ? '10 digit mobile number'
                            : 'Username, ID or email'
                        }
                        maxLength={
                          isSupervisorLogin
                            ? 10
                            : undefined
                        }
                        value={userId}
                        onChange={(e) => {
                          const value = e.target.value;

                          setUserId(
                            isSupervisorLogin
                              ? value.replace(/\D/g, '')
                              : value
                          );
                        }}
                        required
                        autoComplete={
                          isSupervisorLogin
                            ? 'tel'
                            : 'username'
                        }
                      />

                    </div>
                  </div>


                  {/* ================= PASSWORD ================= */}
                  <div className="mb-3">

                    <label className="form-label text-secondary small fw-semibold mb-2">
                      Password
                    </label>

                    <div className={styles.inputWrapper}>

                      <i className="bi bi-lock"></i>

                      <input
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        className="form-control"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        required
                        autoComplete="current-password"
                      />

                      <button
                        type="button"
                        className={styles.togglePassword}
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        aria-label={
                          showPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                      >
                        <i
                          id="eye-icon"
                          className={`bi ${
                            showPassword
                              ? 'bi-eye-slash'
                              : 'bi-eye'
                          }`}
                        ></i>
                      </button>

                    </div>
                  </div>


                  {/* ================= REMEMBER / FORGOT ================= */}
                  <div className="d-flex justify-content-between align-items-center mb-4">

                    <div className="form-check">

                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={remember}
                        onChange={(e) =>
                          setRemember(e.target.checked)
                        }
                        id="rememberMe"
                      />

                      <label
                        className="form-check-label small text-muted"
                        htmlFor="rememberMe"
                      >
                        Remember me
                      </label>

                    </div>


                    <a
                      href="#"
                      className={`small ${styles.linkPrimary}`}
                      onClick={(e) => e.preventDefault()}
                    >
                      Forgot password?
                    </a>

                  </div>


                  {/* ================= LOGIN BUTTON ================= */}
                  <button
                    type="submit"
                    className={`btn ${styles.btnPrimary} w-100 py-3 fw-semibold mb-4`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>

                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <i className="bi bi-arrow-right ms-2"></i>
                      </>
                    )}
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