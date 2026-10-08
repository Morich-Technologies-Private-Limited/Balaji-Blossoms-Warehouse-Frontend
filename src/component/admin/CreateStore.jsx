import React, { useState } from 'react';
import styles from './CreateStore.module.css';
import { createStore } from '../../api/createStore';

const CreateStore = () => {
  const [formData, setFormData] = useState({
    storeName: '',
    addressLine1: '',
    addressLine2: '',
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
    
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address Line 1 is required';
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
      
      if (response.data.status === "SUCCESS") {
        setSubmitStatus('success');
        setFormData({
          storeName: '',
          addressLine1: '',
          addressLine2: '',
          contactNo: '',
          storeType: ''
        });
        setErrors({});
      } else {
        showMessagePopUp(response.data.status, response.data.message, response.data.errorList || []);
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
      addressLine1: '',
      addressLine2: '',
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
      <div className={styles.contentWrapper}>
        {/* Left Column - Form */}
        <div className={styles.formSection}>
          <div className={styles.formHeader}>
            <h2 className={styles.title}>Store Registration</h2>
            <p className={styles.subtitle}>Add a new store to your network</p>
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

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
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
                    {errors.storeName}
                  </span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>
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
                    {errors.contactNo}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Address Line 1 <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                className={`${styles.input} ${errors.addressLine1 ? styles.inputError : ''}`}
                placeholder="Street address, P.O. box"
              />
              {errors.addressLine1 && (
                <span className={styles.errorText}>
                  {errors.addressLine1}
                </span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Address Line 2
              </label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                className={styles.input}
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
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

        {/* Right Column - Info Panel */}
        <div className={styles.infoPanel}>
          <div className={styles.infoPanelContent}>
            <div className={styles.iconWrapper}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            
            <h3 className={styles.infoPanelTitle}>Store Information</h3>
            <p className={styles.infoPanelText}>
              Register your store to expand your network and manage operations efficiently.
            </p>

            <div className={styles.infoPanelBox}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              <p className={styles.infoPanelBoxText}>
                Fill in the store details to get started with centralized management and support.
              </p>
            </div>

            <div className={styles.infoPanelFeatures}>
              <h4 className={styles.featuresTitle}>What you'll get:</h4>
              <ul className={styles.featuresList}>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Centralized inventory management
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Real-time sales tracking
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Multi-location support
                </li>
           
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default CreateStore;