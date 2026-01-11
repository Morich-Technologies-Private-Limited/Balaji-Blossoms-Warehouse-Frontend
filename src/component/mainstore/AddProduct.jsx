import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './AddProduct.module.css';
import { addProduct } from '../../api/addProduct';

const AddProduct = () => {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [packingList, setPackingList] = useState([{ packingSize: '', packingUnit: '' }]);
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);

  const getValidUnits = (selectedCategory) => {
    if (selectedCategory === 'SOLID') {
      return ['KILOGRAM', 'GRAM'];
    } else if (selectedCategory === 'LIQUID') {
      return ['LITER', 'MILLILITER'];
    }
    return [];
  };

  const validatePacking = (packing, selectedCategory) => {
    const validUnits = getValidUnits(selectedCategory);
    if (!packing.packingSize || packing.packingSize <= 0) {
      return 'Packing size must be greater than 0';
    }
    if (!packing.packingUnit) {
      return 'Please select a packing unit';
    }
    if (!validUnits.includes(packing.packingUnit)) {
      return `Invalid unit for ${selectedCategory} products. Please use ${validUnits.join(' or ')}`;
    }
    return null;
  };

  const handleAddPacking = () => {
    setPackingList([...packingList, { packingSize: '', packingUnit: '' }]);
  };

  const handleRemovePacking = (index) => {
    const newPackingList = packingList.filter((_, i) => i !== index);
    setPackingList(newPackingList.length > 0 ? newPackingList : [{ packingSize: '', packingUnit: '' }]);
  };

  const handlePackingChange = (index, field, value) => {
    const newPackingList = [...packingList];
    newPackingList[index][field] = value;
    
    // Clear the unit if category changes and it's now invalid
    if (field === 'packingUnit' && category) {
      const validUnits = getValidUnits(category);
      if (!validUnits.includes(value)) {
        newPackingList[index][field] = '';
      }
    }
    
    setPackingList(newPackingList);
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    // Reset all packing units when category changes
    const resetPackingList = packingList.map(packing => ({
      ...packing,
      packingUnit: ''
    }));
    setPackingList(resetPackingList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!productName.trim()) {
      newErrors.productName = 'Product name is required';
    }
    
    if (!category) {
      newErrors.category = 'Category is required';
    }
    
    packingList.forEach((packing, index) => {
      const error = validatePacking(packing, category);
      if (error) {
        newErrors[`packing_${index}`] = error;
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    
    const productData = {
      productName: productName.trim(),
      category: category,
      packingList: packingList.map(p => ({
        packingSize: parseFloat(p.packingSize),
        packingUnit: p.packingUnit
      }))
    };
    
    try {
      const response = await addProduct(productData);
  
      if (response.data.status === 'SUCCESS') {
        setSubmitStatus({ type: 'success', message: 'Product added successfully!' });
        // Reset form
        setProductName('');
        setCategory('');
        setPackingList([{ packingSize: '', packingUnit: '' }]);
      } else {
        setSubmitStatus({ type: 'error', message: result.message || 'Failed to add product' });
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'An error occurred while adding the product' });
    }
  };

  return (
    <div className={styles['add-product-container']}>
      <div className={styles['add-product-wrapper']}>
        <div className={styles['add-product-header']}>
          <h2 className={styles['add-product-title']}>Add New Product</h2>
        </div>
        
        <form onSubmit={handleSubmit} className={styles['add-product-form']}>
          {submitStatus && (
            <div className={`alert ${submitStatus.type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
              {submitStatus.message}
              <button type="button" className="btn-close" onClick={() => setSubmitStatus(null)}></button>
            </div>
          )}
          
          <div className="row mb-4">
            <div className="col-md-6">
              <label htmlFor="productName" className="form-label">Product Name <span className={styles['text-danger']}>*</span></label>
              <input
                type="text"
                className={`form-control ${errors.productName ? 'is-invalid' : ''}`}
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
              />
              {errors.productName && <div className={styles['invalid-feedback']}>{errors.productName}</div>}
            </div>
            
            <div className="col-md-6">
              <label htmlFor="category" className="form-label">Category <span className={styles['text-danger']}>*</span></label>
              <select
                className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                id="category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">Select category</option>
                <option value="SOLID">Solid</option>
                <option value="LIQUID">Liquid</option>
              </select>
              {errors.category && <div className={styles['invalid-feedback']}>{errors.category}</div>}
            </div>
          </div>
          
          <div className={styles['packing-section']}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Packing Details</h5>
              <button
                type="button"
                className={`btn btn-sm ${styles['btn-outline-primary']}`}
                onClick={handleAddPacking}
              >
                <i className="bi bi-plus-circle"></i> Add Packing
              </button>
            </div>
            
            {packingList.map((packing, index) => (
              <div key={index} className={`${styles['packing-item']} mb-3`}>
                <div className="row align-items-start">
                  <div className="col-md-5">
                    <label className="form-label">Packing Size <span className={styles['text-danger']}>*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      className={`form-control ${errors[`packing_${index}`] ? 'is-invalid' : ''}`}
                      value={packing.packingSize}
                      onChange={(e) => handlePackingChange(index, 'packingSize', e.target.value)}
                      placeholder="Enter size"
                    />
                  </div>
                  
                  <div className="col-md-5">
                    <label className="form-label">Packing Unit <span className={styles['text-danger']}>*</span></label>
                    <select
                      className={`form-select ${errors[`packing_${index}`] ? 'is-invalid' : ''}`}
                      value={packing.packingUnit}
                      onChange={(e) => handlePackingChange(index, 'packingUnit', e.target.value)}
                      disabled={!category}
                    >
                      <option value="">Select unit</option>
                      {category && getValidUnits(category).map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-2 d-flex align-items-end">
                    {packingList.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm w-100"
                        onClick={() => handleRemovePacking(index)}
                        style={{ marginTop: '32px' }}
                      >
                        <i className="bi bi-trash"></i> Remove
                      </button>
                    )}
                  </div>
                  
                  {errors[`packing_${index}`] && (
                    <div className="col-12">
                      <div className={`${styles['text-danger']} small mt-1`}>{errors[`packing_${index}`]}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles['form-actions']}>
            <button type="submit" className={`btn ${styles['btn-primary']} btn-lg`}>
              Add Product
            </button>
            <button 
              type="button" 
              className={`btn ${styles['btn-secondary']} btn-lg ms-3`} 
              onClick={() => {
                setProductName('');
                setCategory('');
                setPackingList([{ packingSize: '', packingUnit: '' }]);
                setErrors({});
                setSubmitStatus(null);
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddProduct;