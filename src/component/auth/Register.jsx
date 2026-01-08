import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Store, MapPin, Phone, Building2, CheckCircle, XCircle } from 'lucide-react';
import styles from './Register.module.css';
import { registerApi } from '../api/registerApi';
import { fetchAllStores } from '../api/fetchAllStores';

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
  const [stores, setStores] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  // Fetch stores on component mount
  useEffect(() => {
    const loadStores = async () => {
      try {
        setIsLoadingStores(true);
        const response = await fetchAllStores();
        if (response.data.status==='SUCCESS' && response.data) {
          setStores(response.data.payload);
        } else {
          console.error('Failed to fetch stores:', response.data.message);
          setStores([]);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
        setStores([]);
      } finally {
        setIsLoadingStores(false);
      }
    };

    loadStores();
  }, []);

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
      const store = stores.find(s => s.storeId === parseInt(value));
      setSelectedStore(store);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const userDto = {
        userId: formData.userId,
        name: formData.name,
        emailId: formData.emailId,
        password: formData.password,
        storeId: parseInt(formData.storeId),
      };

      console.log("Submitting user data:", userDto);

      const response = await registerApi(userDto);

      if (response.data.status==='SUCCESS') {
        setSubmitStatus("success");

        // Reset form after success
        setTimeout(() => {
          setFormData({
            userId: "",
            name: "",
            emailId: "",
            password: "",
            confirmPassword: "",
            storeId: "",
          });
          setSelectedStore(null);
          setSubmitStatus(null);
        }, 2000);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setSubmitStatus("error");
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
                              disabled={isLoadingStores}
                              data-testid="select-store"
                            >
                              <option value="">
                                {isLoadingStores ? 'Loading stores...' : 'Choose a store...'}
                              </option>
                              {stores.map(store => (
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
                            disabled={isSubmitting || isLoadingStores}
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

                    {isLoadingStores ? (
                      <div className={`card ${styles.storePlaceholder}`}>
                        <div className="card-body text-center">
                          <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className={styles.storePlaceholderText}>Loading store information...</p>
                        </div>
                      </div>
                    ) : selectedStore ? (
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
                      {isLoadingStores ? (
                        <p className="text-muted small">Loading stores...</p>
                      ) : stores.length > 0 ? (
                        <div className={styles.storeBadgeContainer}>
                          {stores.map(store => (
                            <span 
                              key={store.storeId} 
                              className={`badge ${styles.storeBadge} ${selectedStore?.storeId === store.storeId ? styles.storeBadgeSelected : styles.storeBadgeDefault}`}
                            >
                              {store.storeName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted small">No stores available</p>
                      )}
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