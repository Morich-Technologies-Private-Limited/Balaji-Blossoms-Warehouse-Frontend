import React, { useState } from 'react';
import styles from './LoginForm.module.css';
import logo from "../../assets/logo.png";
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      console.log('Login submitted:', { email, password, remember });
      alert(`Login successful for: ${email}`);
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
                    ><i id='eye-icon' className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
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