import React, { useState } from 'react';
import styles from './LoginForm.module.css';

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
        {/* Left Side - Branding */}
        <div className={`col-lg-6 ${styles.brandingSide} d-none d-lg-flex align-items-center justify-content-center p-5 text-white position-relative overflow-hidden`}>
          <div className={`${styles.brandingContent} text-center position-relative z-1`}>
            <div className={`${styles.logoWrapper} mb-4 ${styles.animateFloat}`}>
              <svg width="120" height="120" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="38" fill="white" opacity="0.15"/>
                <path d="M40 15C33 15 26 22 26 35C26 42 33 48 40 55C47 48 54 42 54 35C54 22 47 15 40 15Z" fill="white"/>
                <circle cx="40" cy="35" r="5" fill="#10b981"/>
                <path d="M37 55L43 55L47 68L33 68Z" fill="white"/>
              </svg>
            </div>
            <h1 className="display-4 fw-bold mb-3">Balaji Blossoms</h1>
            <p className="lead opacity-75 mb-4">Crafting Natural Beauty</p>
            <div className={`${styles.brandDescription} px-4 mb-5`}>
              <p>Your trusted partner in natural and organic beauty products. Experience the essence of nature in every product.</p>
            </div>
            <div className="d-flex flex-column gap-3 align-items-center">
              <div className="d-flex align-items-center gap-3">
                <i className={`bi bi-check-circle-fill ${styles.textEmerald}`}></i>
                <span>100% Natural Products</span>
              </div>
              <div className="d-flex align-items-center gap-3">
                <i className={`bi bi-check-circle-fill ${styles.textEmerald}`}></i>
                <span>Eco-Friendly Packaging</span>
              </div>
              <div className="d-flex align-items-center gap-3">
                <i className={`bi bi-check-circle-fill ${styles.textEmerald}`}></i>
                <span>Certified Organic</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white p-4 p-md-5">
          <div className={`${styles.formContainer} w-100`} style={{ maxWidth: '440px' }}>
            <div className="text-center text-lg-start mb-5">
              <h2 className="display-6 fw-bold text-dark mb-2">Welcome Back</h2>
              <p className="text-muted">Sign in to continue to your account</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label fw-bold text-secondary small mb-2">Email Address</label>
                <div className={`input-group ${styles.customInputGroup}`}>
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-envelope text-muted"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control bg-light border-start-0 ps-0 py-3 ps-2"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-secondary small mb-2">Password</label>
                <div className={`input-group ${styles.customInputGroup}`}>
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-lock text-muted"></i>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control bg-light border-start-0 ps-0 py-3 ps-2"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    className="btn bg-light border-start-0 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
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
                  <label className={`form-check-label small text-muted ${styles.cursorPointer}`} htmlFor="rememberMe">
                    Remember me
                  </label>
                </div>
                <a href="#" className={`small fw-bold ${styles.textEmerald} text-decoration-none`}>Forgot password?</a>
              </div>

              <button type="submit" className={`btn ${styles.btnEmerald} w-100 py-3 fw-bold mb-4 shadow-sm`}>
                Sign In
                <i className="bi bi-arrow-right ms-2"></i>
              </button>

              <div className="position-relative text-center mb-4">
                <hr className="text-muted opacity-25" />
                <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 small text-muted">
                  or continue with
                </span>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-6">
                  <button type="button" className={`btn btn-outline-light ${styles.socialBtn} text-dark w-100 py-2 border-2 d-flex align-items-center justify-content-center gap-2`}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="Google" />
                    <span className="small fw-bold">Google</span>
                  </button>
                </div>
                <div className="col-6">
                  <button type="button" className={`btn btn-outline-light ${styles.socialBtn} text-dark w-100 py-2 border-2 d-flex align-items-center justify-content-center gap-2`}>
                    <i className="bi bi-facebook text-primary fs-5"></i>
                    <span className="small fw-bold">Facebook</span>
                  </button>
                </div>
              </div>

              <div className="text-center">
                <p className="small text-muted mb-0">
                  Don't have an account? <a href="#" className={`fw-bold ${styles.textEmerald} text-decoration-none`}>Sign up</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
