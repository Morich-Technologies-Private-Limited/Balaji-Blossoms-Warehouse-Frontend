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
    // Use formData - NO JSON.stringify needed (axios handles it automatically)
    const response = await createStore(formData);
    
    // Axios response handling - response is already parsed JSON
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
      // Handle API error response from your backend
      setSubmitStatus('error');
      setErrors({ general: response.data?.message || 'Failed to create store' });
    }
  } catch (error) {
    // createStore already throws detailed errors
    setSubmitStatus('error');
    setErrors({ general: error.message || 'Network error. Please try again.' });
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h2 className={styles.title}>Create New Store</h2>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {submitStatus === 'success' && (
            <div className={styles.successMessage}>
              Store created successfully!
            </div>
          )}
          
          {errors.general && (
            <div className={styles.errorMessage}>
              {errors.general}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Store Name *</label>
            <input
              type="text"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange}
              className={`${styles.input} ${errors.storeName ? styles.error : ''}`}
              placeholder="Enter store name"
            />
            {errors.storeName && <span className={styles.errorText}>{errors.storeName}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`${styles.textarea} ${errors.address ? styles.error : ''}`}
              placeholder="Enter complete address"
              rows="3"
            />
            {errors.address && <span className={styles.errorText}>{errors.address}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Contact Number *</label>
            <input
              type="tel"
              name="contactNo"
              value={formData.contactNo}
              onChange={handleChange}
              className={`${styles.input} ${errors.contactNo ? styles.error : ''}`}
              placeholder="e.g., +1-234-567-8900"
            />
            {errors.contactNo && <span className={styles.errorText}>{errors.contactNo}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Store Type *</label>
            <select
              name="storeType"
              value={formData.storeType}
              onChange={handleChange}
              className={`${styles.select} ${errors.storeType ? styles.error : ''}`}
            >
              <option value="">Select store type</option>
              {storeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.storeType && <span className={styles.errorText}>{errors.storeType}</span>}
          </div>

          <button 
            type="submit" 
            className={`${styles.submitButton} ${isSubmitting ? styles.loading : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Store'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateStore;
