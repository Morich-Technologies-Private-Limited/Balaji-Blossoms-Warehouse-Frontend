import React, { useState } from 'react';
import { Eye, EyeOff, Store, MapPin, Phone, Building2, CheckCircle, XCircle } from 'lucide-react';
import styles from './Register.module.css';

// Dummy store data
const dummyStores = [
  {
    storeId: 1,
    storeName: "Central Main Store",
    address: "123 Main Street, Downtown, New York, NY 10001",
    contactNo: "+1 (555) 123-4567",
    storeType: "MAIN_STORE"
  },
  {
    storeId: 2,
    storeName: "East Side Branch",
    address: "456 East Avenue, Manhattan, New York, NY 10002",
    contactNo: "+1 (555) 234-5678",
    storeType: "SUB_STORE"
  },
  {
    storeId: 3,
    storeName: "Downtown Shop",
    address: "789 Market Street, Brooklyn, New York, NY 10003",
    contactNo: "+1 (555) 345-6789",
    storeType: "SHOP"
  },
  {
    storeId: 4,
    storeName: "West End Store",
    address: "321 West Boulevard, Queens, New York, NY 10004",
    contactNo: "+1 (555) 456-7890",
    storeType: "SUB_STORE"
  }
];

const Register = () => {
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    emailId: '',
    password: '',
    confirmPassword: '',
    storeId: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.userId.trim()) {
      newErrors.userId = 'User ID is required';
    } else if (formData.userId.length < 3) {
      newErrors.userId = 'User ID must be at least 3 characters';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.emailId.trim()) {
      newErrors.emailId = 'Email is required';
    } else if (!emailRegex.test(formData.emailId)) {
      newErrors.emailId = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.storeId) {
      newErrors.storeId = 'Please select a store';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (name === 'storeId') {
      const store = dummyStores.find(s => s.storeId === parseInt(value));
      setSelectedStore(store);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const userDto = {
        userId: formData.userId,
        name: formData.name,
        emailId: formData.emailId,
        password: formData.password,
        storeId: parseInt(formData.storeId)
      };

      console.log('Submitting user data:', userDto);
      
      setSubmitStatus('success');
      
      setTimeout(() => {
        setFormData({
          userId: '',
          name: '',
          emailId: '',
          password: '',
          confirmPassword: '',
          storeId: ''
        });
        setSelectedStore(null);
        setSubmitStatus(null);
      }, 3000);
      
    } catch (error) {
      setSubmitStatus('error');
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className={`card ${styles.registerCard}`}>
              <div className="row g-0">
                
                {/* Form Section */}
                <div className="col-lg-7">
                  <div className={`card-body ${styles.formSection}`}>
                    <div className={styles.formHeader}>
                      <h2 className={styles.formTitle}>Manager Onboarding</h2>
                      <p className={styles.formSubtitle}>Join us and start your journey</p>
                    </div>

                    {submitStatus === 'success' && (
                      <div className={`alert ${styles.alertSuccess}`} role="alert">
                        <CheckCircle size={20} className="me-2" />
                        <span>Registration successful! Welcome aboard.</span>
                      </div>
                    )}

                    {submitStatus === 'error' && (
                      <div className={`alert ${styles.alertError}`} role="alert">
                        <XCircle size={20} className="me-2" />
                        <span>Registration failed. Please try again.</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className={`form-label ${styles.inputLabel}`}>User ID</label>
                          <input
                            type="text"
                            className={`form-control ${styles.inputField} ${errors.userId ? styles.inputFieldError : ''}`}
                            name="userId"
                            value={formData.userId}
                            onChange={handleChange}
                            placeholder="Enter user ID"
                            data-testid="input-userid"
                          />
                          {errors.userId && <div className={styles.errorMessage}>{errors.userId}</div>}
                        </div>

                        <div className="col-md-6">
                          <label className={`form-label ${styles.inputLabel}`}>Full Name</label>
                          <input
                            type="text"
                            className={`form-control ${styles.inputField} ${errors.name ? styles.inputFieldError : ''}`}
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            data-testid="input-name"
                          />
                          {errors.name && <div className={styles.errorMessage}>{errors.name}</div>}
                        </div>

                        <div className="col-12">
                          <label className={`form-label ${styles.inputLabel}`}>Email Address</label>
                          <input
                            type="email"
                            className={`form-control ${styles.inputField} ${errors.emailId ? styles.inputFieldError : ''}`}
                            name="emailId"
                            value={formData.emailId}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            data-testid="input-email"
                          />
                          {errors.emailId && <div className={styles.errorMessage}>{errors.emailId}</div>}
                        </div>

                        <div className="col-md-6">
                          <label className={`form-label ${styles.inputLabel}`}>Password</label>
                          <div className={styles.passwordWrapper}>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className={`form-control ${styles.inputField} ${styles.passwordInput} ${errors.password ? styles.inputFieldError : ''}`}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              placeholder="Enter password"
                              data-testid="input-password"
                            />
                            <button
                              type="button"
                              className={styles.passwordToggle}
                              onClick={() => setShowPassword(!showPassword)}
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
                        </div>

                        <div className="col-md-6">
                          <label className={`form-label ${styles.inputLabel}`}>Confirm Password</label>
                          <div className={styles.passwordWrapper}>
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              className={`form-control ${styles.inputField} ${styles.passwordInput} ${errors.confirmPassword ? styles.inputFieldError : ''}`}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              placeholder="Confirm password"
                              data-testid="input-confirm-password"
                            />
                            <button
                              type="button"
                              className={styles.passwordToggle}
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              tabIndex={-1}
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {errors.confirmPassword && <div className={styles.errorMessage}>{errors.confirmPassword}</div>}
                        </div>

                        <div className="col-12">
                          <label className={`form-label ${styles.inputLabel}`}>Select Store</label>
                          <div className={styles.selectWrapper}>
                            <select
                              className={`form-select ${styles.storeSelect} ${errors.storeId ? styles.inputFieldError : ''}`}
                              name="storeId"
                              value={formData.storeId}
                              onChange={handleChange}
                              data-testid="select-store"
                            >
                              <option value="">Choose a store...</option>
                              {dummyStores.map(store => (
                                <option key={store.storeId} value={store.storeId}>
                                  {store.storeName}
                                </option>
                              ))}
                            </select>
                          </div>
                          {errors.storeId && <div className={styles.errorMessage}>{errors.storeId}</div>}
                        </div>

                        <div className="col-12 mt-4">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`btn w-100 ${styles.submitButton}`}
                            data-testid="button-submit"
                          >
                            {isSubmitting ? (
                              <>
                                <span className={`spinner-border spinner-border-sm me-2 ${styles.spinner}`}></span>
                                Creating Account...
                              </>
                            ) : (
                              'Create Account'
                            )}
                          </button>
                        </div>

                    
                      </div>
                    </form>
                  </div>
                </div>

                {/* Store Details Section */}
                <div className={`col-lg-5 d-none d-lg-block ${styles.storeDetailsSection}`}>
                  <div className={styles.storeDetailsContent}>
                    <div className={styles.storeDetailsHeader}>
                      <div className={styles.storeIconWrapper}>
                        <Store size={40} className={styles.storeIcon} />
                      </div>
                      <h3 className={styles.storeDetailsTitle}>Store Information</h3>
                      <p className={styles.storeDetailsSubtitle}>Select your preferred store to get started with localized services and support.</p>
                    </div>

                    {selectedStore ? (
                      <div className={`card ${styles.storeCard}`}>
                        <div className="card-body">
                          <div className={styles.storeCardHeader}>
                            <h5 className={styles.storeName}>{selectedStore.storeName}</h5>
                            <span className={`badge ${styles.storeTypeBadge}`}>
                              {selectedStore.storeType.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className={styles.storeDetails}>
                            <div className={styles.storeDetailRow}>
                              <MapPin size={18} className={styles.storeDetailIcon} />
                              <span className={styles.storeDetailText}>{selectedStore.address}</span>
                            </div>
                            <div className={styles.storeDetailRow}>
                              <Phone size={18} className={styles.storeDetailIcon} />
                              <span className={styles.storeDetailText}>{selectedStore.contactNo}</span>
                            </div>
                            <div className={styles.storeDetailRow}>
                              <Building2 size={18} className={styles.storeDetailIcon} />
                              <span className={styles.storeDetailText}>Store ID: {selectedStore.storeId}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`card ${styles.storePlaceholder}`}>
                        <div className="card-body text-center">
                          <Store size={48} className={styles.storePlaceholderIcon} />
                          <p className={styles.storePlaceholderText}>Please select a store from the dropdown to view details</p>
                        </div>
                      </div>
                    )}

                    <div className={styles.availableStores}>
                      <h6 className={styles.availableStoresTitle}>Available Locations</h6>
                      <div className={styles.storeBadgeContainer}>
                        {dummyStores.map(store => (
                          <span 
                            key={store.storeId} 
                            className={`badge ${styles.storeBadge} ${selectedStore?.storeId === store.storeId ? styles.storeBadgeSelected : styles.storeBadgeDefault}`}
                          >
                            {store.storeName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;