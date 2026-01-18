import React, { useState } from 'react';
import styles from './CreateStore.module.css';
import { createStore } from '../../api/createStore';

const CreateStore = () => {
  const [formData, setFormData] = useState({
    storeName: '',
    address: '',
    contactNo: '',
    storeType: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const storeTypes = ['MAIN_STORE', 'SUB_STORE'];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    if (!formData.contactNo.trim()) {
      newErrors.contactNo = 'Contact number is required';
    } else if (!phoneRegex.test(formData.contactNo)) {
      newErrors.contactNo = 'Please enter a valid contact number';
    }
    
    if (!formData.storeType) {
      newErrors.storeType = 'Please select a store type';
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
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await createStore(formData);
      
      if (response.status === 200 || response.status === 201) {
        setSubmitStatus('success');
        setFormData({
          storeName: '',
          address: '',
          contactNo: '',
          storeType: ''
        });
        setErrors({});
      } else {
        setSubmitStatus('error');
        setErrors({ general: response.data?.message || 'Failed to create store' });
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrors({ general: error.message || 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      storeName: '',
      address: '',
      contactNo: '',
      storeType: ''
    });
    setErrors({});
    setSubmitStatus(null);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Create New Store</h1>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
          
            <h2 className={styles.title}>Store Information</h2>
          </div>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {submitStatus === 'success' && (
              <div className={styles.successMessage}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Store created successfully!
              </div>
            )}
            
            {errors.general && (
              <div className={styles.errorMessage}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {errors.general}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                Store Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                className={`${styles.input} ${errors.storeName ? styles.inputError : ''}`}
                placeholder="Enter store name"
              />
              {errors.storeName && (
                <span className={styles.errorText}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errors.storeName}
                </span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Address <span className={styles.required}>*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`${styles.textarea} ${errors.address ? styles.inputError : ''}`}
                placeholder="Enter complete address"
                rows="2"
              />
              {errors.address && (
                <span className={styles.errorText}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errors.address}
                </span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Contact Number <span className={styles.required}>*</span>
              </label>
              <input
                type="tel"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleChange}
                className={`${styles.input} ${errors.contactNo ? styles.inputError : ''}`}
                placeholder="e.g., +1-234-567-8900"
              />
              {errors.contactNo && (
                <span className={styles.errorText}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errors.contactNo}
                </span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M7 12h10M10 18h4"/>
                </svg>
                Store Type <span className={styles.required}>*</span>
              </label>
              <div className={styles.selectWrapper}>
                <select
                  name="storeType"
                  value={formData.storeType}
                  onChange={handleChange}
                  className={`${styles.select} ${errors.storeType ? styles.inputError : ''}`}
                >
                  <option value="">Select store type</option>
                  {storeTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <svg className={styles.selectIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              {errors.storeType && (
                <span className={styles.errorText}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errors.storeType}
                </span>
              )}
            </div>

            <div className={styles.buttonGroup}>
              <button 
                type="button"
                onClick={handleReset}
                className={styles.resetButton}
                disabled={isSubmitting}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                </svg>
                Reset
              </button>
              <button 
                type="submit" 
                className={`${styles.submitButton} ${isSubmitting ? styles.loading : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className={styles.buttonSpinner}></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Create Store
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateStore;