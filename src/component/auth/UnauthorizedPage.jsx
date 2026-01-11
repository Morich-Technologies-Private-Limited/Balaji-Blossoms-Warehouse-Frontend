import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UnauthorizedPage.module.css';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  const getSessionData = () => {
    const user = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("token");
    const storeId = sessionStorage.getItem("storeId");
    const role = sessionStorage.getItem("role");

    return {
      user: user ? JSON.parse(user) : null,
      token: token || null,
      storeId: storeId || null,
      role: role || null,
      isAuthenticated: !!token,
    };
  };

  const handleGoBack = () => {
    const sessionData = getSessionData();
    
    // Redirect based on role
    if (sessionData.role) {
      switch (sessionData.role) {
        case 'MAIN_STORE_MANAGER':
          navigate('/mainstore');
          break;
        case 'SUB_STORE_MANAGER':
          navigate('/substore');
          break;
        case 'SUB_STORE_SUPERVISOR':
          navigate('/substore/sales');
          break;
        case 'SHOP_MANAGER':
          navigate('/shop');
          break;
        case 'ADMIN':
          navigate('/admin');
          break;
        default:
          navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={styles.container}>
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-12 col-md-8 col-lg-6">
            <div className={`card shadow-lg ${styles.card}`}>
              <div className="card-body text-center p-4 p-md-5">
                <div className={styles.iconWrapper}>
                  <svg 
                    className={styles.icon} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                    />
                  </svg>
                </div>
                
                <h1 className={`display-4 fw-bold mb-3 ${styles.title}`}>
                  403
                </h1>
                
                <h2 className={`h4 mb-3 ${styles.subtitle}`}>
                  Unauthorized Access
                </h2>
                
                <p className={`text-muted mb-4 ${styles.description}`}>
                  You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>
                
                <button 
                  onClick={handleGoBack}
                  className={`btn btn-primary btn-lg px-4 px-md-5 ${styles.backButton}`}
                >
                  <svg 
                    className={styles.buttonIcon}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                    />
                  </svg>
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;