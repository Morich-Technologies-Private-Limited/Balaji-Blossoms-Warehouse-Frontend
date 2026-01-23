import React, { useState } from 'react';
import styles from './ForgotPassword.module.css';
import logo from "../../assets/logo.png";
import { useNavigate } from 'react-router-dom';
import { showMessagePopUp } from '../modal/MessagePopUp';
import { forgotPassowordOtpGenerationApi } from '../../api/forgotPassowordOtpGenerationApi';
import { forgotPassowordOtpValidationApi } from '../../api/forgotPassowordOtpValidationApi';


const ForgotPassword = () => {  
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const navigate = useNavigate();

  const handleGenerateOtp = async (e) => {
    e.preventDefault();
    
    if (!email) {
      showMessagePopUp("FAILED", "Please enter your email or user ID");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await forgotPassowordOtpGenerationApi(email);
      if (response.data.status === 'SUCCESS') {
        setRequestId(response.data.payload);
        setMaskedEmail(response.data.message);
        setStep(2);
      } else {
        showMessagePopUp(response.data.status ||"FAILED", response.data.message || "Failed to generate OTP",response.data.errorList || []);
      }
    } catch (error) {
      showMessagePopUp("FAILED", "An error occurred while generating OTP");

    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!otp || !newPassword || !confirmPassword) {
      showMessagePopUp("FAILED", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessagePopUp("FAILED", "Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      showMessagePopUp("FAILED", "Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    
    try {

      const passwordData = {
        requestId: requestId,
        otp: otp,
        newPassword: newPassword,
      };

      const response = await forgotPassowordOtpValidationApi(passwordData);
            
      if (response.data.status === 'SUCCESS') {
        showMessagePopUp("SUCCESS", response.data.message || "Password reset successfully");
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        showMessagePopUp(response.data.status || "FAILED", response.data.message || "Failed to reset password", response.data.errorList || []);
      }
    } catch (error) {
      console.log("Error:", error);
      showMessagePopUp("FAILED", "An error occurred while resetting password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep(1);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setRequestId(null);
  };

  return (
    <div className="container-fluid min-vh-100 p-0">
      <div className="row g-0 min-vh-100">
        {/* Left Side - Branding (Desktop Only) */}
        <div className={`col-lg-6 ${styles.brandingSide} d-none d-lg-flex align-items-center justify-content-center p-5 text-white position-relative overflow-hidden`}>
          <div className={`${styles.brandingContent} text-center position-relative z-1`}>
            <img src={logo} className="img-fluid d-block mx-auto mb-4" alt="Logo" style={{ maxWidth: '200px' }} />
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

        {/* Right Side - Password Reset Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-light p-4 p-md-5">
          <div className={`${styles.formContainer} w-100`} style={{ maxWidth: '440px' }}>
            {/* Mobile Logo Header */}
            <div className={`${styles.mobileHeader} d-lg-none text-center mb-4`}>
              <img src={logo} className="img-fluid d-block mx-auto" alt="Logo" style={{ maxWidth: '150px' }} />
            </div>

            <div className={`${styles.formCard} bg-white p-4 p-md-5 rounded-4 shadow-sm`}>
              {/* Progress Indicator */}
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div 
                    className={`${styles.progressStep} ${step >= 1 ? styles.progressStepActive : ''}`}
                  >
                    <div className={styles.progressCircle}>
                      {step > 1 ? <i className="bi bi-check"></i> : '1'}
                    </div>
                    <span className={styles.progressLabel}>Email</span>
                  </div>
                  <div className={`${styles.progressLine} ${step >= 2 ? styles.progressLineActive : ''}`}></div>
                  <div 
                    className={`${styles.progressStep} ${step >= 2 ? styles.progressStepActive : ''}`}
                  >
                    <div className={styles.progressCircle}>2</div>
                    <span className={styles.progressLabel}>Reset</span>
                  </div>
                </div>
              </div>

              {/* Step 1: Email Entry */}
              {step === 1 && (
                <>
                  <div className="mb-4">
                    <h2 className="h3 fw-bold text-dark mb-2">Forgot Password?</h2>
                    <p className="text-muted mb-0">
                      Enter your email or user ID to receive an OTP
                    </p>
                  </div>

                  <form onSubmit={handleGenerateOtp}>
                    <div className="mb-4">
                      <label className="form-label text-secondary small fw-semibold mb-2">Email or User ID</label>
                      <div className={styles.inputWrapper}>
                        <i className={`bi bi-envelope ${styles.inputIcon}`}></i>
                        <input
                          type="text"
                          className={`form-control ${styles.inputField}`}
                          placeholder="Enter email or userId"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className={`btn ${styles.btnPrimary} w-100 py-3 fw-semibold mb-3`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send OTP
                          <i className="bi bi-arrow-right ms-2"></i>
                        </>
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        className={`btn btn-link ${styles.linkPrimary} text-decoration-none`}
                        onClick={() => navigate('/login')}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Login
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Step 2: OTP & Password Reset */}
              {step === 2 && (
                <>
                  <div className="mb-4">
                    <h2 className="h3 fw-bold text-dark mb-2">Reset Password</h2>
                    <p className="text-muted mb-0">
                      {maskedEmail ? `OTP sent to ${maskedEmail}` : 'Enter the OTP and your new password'}
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword}>
                    <div className="mb-3">
                      <label className="form-label text-secondary small fw-semibold mb-2">
                        OTP Code
                        <span className={styles.otpInfo}>
                          <i className="bi bi-info-circle ms-2"></i>
                          Valid for 15 minutes
                        </span>
                      </label>
                      <div className={styles.inputWrapper}>
                        <i className={`bi bi-shield-lock ${styles.inputIcon}`}></i>
                        <input
                          type="text"
                          className={`form-control ${styles.inputField}`}
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength="6"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-secondary small fw-semibold mb-2">New Password</label>
                      <div className={styles.inputWrapper}>
                        <i className={`bi bi-lock ${styles.inputIcon}`}></i>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          className={`form-control ${styles.inputField}`}
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        <button 
                          type="button"
                          className={styles.togglePassword}
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          aria-label="Toggle password visibility"
                          disabled={isLoading}
                        >
                          <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </button>
                      </div>
                      <small className="text-muted d-block mt-1">
                        Minimum 6 characters
                      </small>
                    </div>

                    <div className="mb-4">
                      <label className="form-label text-secondary small fw-semibold mb-2">Confirm Password</label>
                      <div className={styles.inputWrapper}>
                        <i className={`bi bi-lock-fill ${styles.inputIcon}`}></i>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className={`form-control ${styles.inputField}`}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        <button 
                          type="button"
                          className={styles.togglePassword}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label="Toggle password visibility"
                          disabled={isLoading}
                        >
                          <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className={`btn ${styles.btnPrimary} w-100 py-3 fw-semibold mb-3`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Resetting Password...
                        </>
                      ) : (
                        <>
                          Reset Password
                          <i className="bi bi-check-circle ms-2"></i>
                        </>
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        className={`btn btn-link ${styles.linkPrimary} text-decoration-none`}
                        onClick={handleBackToEmail}
                        disabled={isLoading}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Use Different Email
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;