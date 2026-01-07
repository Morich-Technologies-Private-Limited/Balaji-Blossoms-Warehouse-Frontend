import React, { useState } from 'react';
import styles from './LoginForm.module.css';
import { loginApi } from '../api/loginApi';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

 const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (email && password) {
      setIsLoading(true);
      
      try {
        const result = await loginApi(email, password);
        
        if (result.success) {
          alert(`Login successful for: ${email}`);
          navigate(result.navLink);
        } else {
          alert(result.message || 'Login failed');
        }
      } catch (error) {
        alert('An error occurred during login');
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('Please fill in all fields');
    }
  };

  return (
    <div className="container-fluid min-vh-100 p-0">
      <div className="row g-0 min-vh-100">
        {/* Left Side - Branding (Desktop Only) */}
        <div className={`col-lg-6 ${styles.brandingSide} d-none d-lg-flex align-items-center justify-content-center p-5 text-white position-relative overflow-hidden`}>
          <div className={`${styles.brandingContent} text-center position-relative z-1`}>
            <div className={`${styles.logoWrapper} mb-4`}>
              <svg width="100" height="100" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="50" fill="white" opacity="0.15"/>
                <rect x="35" y="30" width="50" height="45" rx="4" fill="white" stroke="white" strokeWidth="2"/>
                <rect x="35" y="75" width="50" height="15" rx="2" fill="white"/>
                <circle cx="60" cy="52" r="8" fill="#2196F3"/>
                <rect x="42" y="42" width="36" height="3" rx="1.5" fill="#2196F3" opacity="0.6"/>
                <rect x="42" y="50" width="28" height="3" rx="1.5" fill="#2196F3" opacity="0.6"/>
                <rect x="42" y="58" width="32" height="3" rx="1.5" fill="#2196F3" opacity="0.6"/>
              </svg>
            </div>
            <h1 className="display-4 fw-bold mb-3">Balaji Blossoms</h1>
            <p className="lead mb-4" style={{ opacity: 0.9 }}>Streamline Your Operations</p>
            <div className={`${styles.featureList} mt-5`}>
              <div className={styles.featureItem}>
                <i className="bi bi-shield-check"></i>
                <span>Secure & Reliable</span>
              </div>
              <div className={styles.featureItem}>
                <i className="bi bi-lightning-charge"></i>
                <span>Fast Performance</span>
              </div>
              <div className={styles.featureItem}>
                <i className="bi bi-graph-up"></i>
                <span>Real-time Analytics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-light p-4 p-md-5">
          <div className={`${styles.formContainer} w-100`} style={{ maxWidth: '440px' }}>
            {/* Mobile Logo Header */}
            <div className={`${styles.mobileHeader} d-lg-none text-center mb-4`}>
              <div className={styles.mobileLogo}>
                <svg width="50" height="50" viewBox="0 0 120 120" fill="none">
                  <rect x="35" y="30" width="50" height="45" rx="4" fill="#2196F3" stroke="#2196F3" strokeWidth="2"/>
                  <rect x="35" y="75" width="50" height="15" rx="2" fill="#2196F3"/>
                  <circle cx="60" cy="52" r="8" fill="white"/>
                  <rect x="42" y="42" width="36" height="3" rx="1.5" fill="white" opacity="0.8"/>
                  <rect x="42" y="50" width="28" height="3" rx="1.5" fill="white" opacity="0.8"/>
                  <rect x="42" y="58" width="32" height="3" rx="1.5" fill="white" opacity="0.8"/>
                </svg>
              </div>
              <h1 className={`${styles.mobileCompanyName} mt-3 mb-1`}>Balaji Blossoms</h1>
              <p className="text-muted small mb-0">Streamline Your Operations</p>
            </div>

            <div className={`${styles.formCard} bg-white p-4 p-md-5 rounded-4 shadow-sm`}>
              <div className="mb-4">
                <h2 className="h3 fw-bold text-dark mb-2">Welcome Back</h2>
                <p className="text-muted mb-0">Sign in to your account</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold mb-2">Email Address</label>
                  <div className={styles.inputWrapper}>
                    <i className="bi bi-envelope"></i>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;