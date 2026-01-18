import React, { useState, useEffect, useRef } from 'react';
import styles from './AddProduct.module.css';
import { addProduct } from '../../api/addProduct';
import { checkProductAvaliablity } from '../../api/checkProductAvaliablity';
import { findProducts } from '../../api/findProducts';
import { addPacking } from '../../api/addPacking';
import { findProductPackingWithoutInventory } from '../../api/findProductPackingWithoutInventory';

const AddProduct = () => {
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [productNameError, setProductNameError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  const [searchKey, setSearchKey] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [existingPackings, setExistingPackings] = useState([]);
  const [loadingPackings, setLoadingPackings] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const [packingList, setPackingList] = useState([{ packingSize: '', packingUnit: '' }]);
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Auto-search when user types more than 2 characters
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchKey.trim().length > 1 && !selectedProduct) {
        handleSearchProduct();
      } else if (searchKey.trim().length <= 1) {
        setSearchResults([]);
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchKey, selectedProduct]);

  // Reset highlighted index when search results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchResults]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  const getValidUnits = (selectedCategory) => {
    if (selectedCategory === 'SOLID') {
      return ['KILOGRAM', 'GRAM'];
    } else if (selectedCategory === 'LIQUID') {
      return ['LITER', 'MILLILITER'];
    }
    return [];
  };

  const isSmallUnit = (unit) => {
    return unit === 'GRAM' || unit === 'MILLILITER';
  };

  const normalizePacking = (size, unit) => {
    const normalizedSize = size.toString().trim().replace(/\s+/g, '');
    const normalizedUnit = unit.toUpperCase().trim();
    return `${normalizedSize}${normalizedUnit}`;
  };

  const checkProductAvailability = async (name) => {
    if (!name.trim()) {
      setProductNameError('Product name is required');
      return false;
    }

    setCheckingAvailability(true);
    try {
      const response = await checkProductAvaliablity(name);
      const data = response.data.payload
      
      if (data.status) {
        setProductNameError('');
        return true;
      } else {
        setProductNameError(data.message || 'Product name not available');
        return false;
      }
    } catch (error) {
      setProductNameError('Error checking product availability');
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleCreateProduct = async () => {
    let hasError = false;

    if (!productName.trim()) {
      setProductNameError('Product name is required');
      hasError = true;
    }

    if (!category) {
      setCategoryError('Category is required');
      hasError = true;
    }

    if (hasError) return;

    const isAvailable = await checkProductAvailability(productName);
    if (!isAvailable) return;

    const productData = {
      productName: productName.trim(),
      category: category
    };

    try {
      const response = await addProduct(productData);
      if (response.data.status === 'SUCCESS') {
        setSubmitStatus({
          type: 'success',
          message: 'Product created successfully!'
        });
        setShowCreateProductModal(false);
        setProductName('');
        setCategory('');
        setProductNameError('');
        setCategoryError('');
        setTimeout(() => setSubmitStatus(null), 3000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: response.data.message || 'Failed to create product'
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'An error occurred while creating the product'
      });
    }
  };

  const handleSearchProduct = async () => {
    if (!searchKey.trim() || searchKey.trim().length <= 1) {
      return;
    }

    try {
      const response = await findProducts(searchKey);
      
      if (response.data.status === 'SUCCESS' ) {
        setSearchResults(response.data.payload);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    } catch (error) {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const fetchProductPackings = async (productId) => {
    setLoadingPackings(true);
    try {
      const response = await findProductPackingWithoutInventory(productId);
      
      if (response.data.status === 'SUCCESS' && response.data.payload) {
        setExistingPackings(response.data.payload);
      } else {
        setExistingPackings([]);
      }
    } catch (error) {
      console.error('Error fetching packings:', error);
      setExistingPackings([]);
      setSubmitStatus({
        type: 'error',
        message: 'Error loading existing packings'
      });
    } finally {
      setLoadingPackings(false);
    }
  };

  const handleSelectProduct = async (product) => {
    setSelectedProduct(product);
    setSearchResults([]);
    setSearchKey(product.productName);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    
    // Call the packing API when product is selected
    await fetchProductPackings(product.productId);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          handleSelectProduct(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const validatePacking = (packing, selectedCategory, currentIndex) => {
    if (!selectedProduct) {
      return 'Please select a product first';
    }

    const validUnits = getValidUnits(selectedCategory);

    if (!packing.packingUnit) {
      return 'Please select a packing unit';
    }

    if (!validUnits.includes(packing.packingUnit)) {
      return `Invalid unit for ${selectedCategory} products. Please use ${validUnits.join(' or ')}`;
    }

    if (!packing.packingSize || packing.packingSize.trim() === '') {
      return 'Packing size is required';
    }

    const sizeValue = parseFloat(packing.packingSize);
    if (isNaN(sizeValue) || sizeValue <= 0) {
      return 'Packing size must be a valid number greater than 0';
    }

    if (packing.packingUnit && isSmallUnit(packing.packingUnit)) {
      if (packing.packingSize.includes('.')) {
        return 'Decimal values are not allowed for GRAM and MILLILITER';
      }
    }

    const currentNormalized = normalizePacking(packing.packingSize, packing.packingUnit);
    
    // Check against existing packings
    for (const existing of existingPackings) {
      const existingNormalized = normalizePacking(existing.packingSize, existing.packingUnit);
      if (currentNormalized === existingNormalized) {
        return 'This packing already exists for this product';
      }
    }

    // Check against current packing list
    for (let i = 0; i < packingList.length; i++) {
      if (i !== currentIndex && packingList[i].packingSize && packingList[i].packingUnit) {
        const otherNormalized = normalizePacking(packingList[i].packingSize, packingList[i].packingUnit);
        if (currentNormalized === otherNormalized) {
          return 'This packing size and unit combination already exists';
        }
      }
    }

    return null;
  };

  const handleAddPacking = () => {
    setPackingList([...packingList, { packingSize: '', packingUnit: '' }]);
  };

  const handleRemovePacking = (index) => {
    const newPackingList = packingList.filter((_, i) => i !== index);
    setPackingList(newPackingList.length > 0 ? newPackingList : [{ packingSize: '', packingUnit: '' }]);

    const newErrors = { ...errors };
    delete newErrors[`packing_${index}`];
    setErrors(newErrors);
  };

  const handlePackingChange = (index, field, value) => {
    const newPackingList = [...packingList];

    if (field === 'packingSize') {
      if (value.includes('.') && newPackingList[index].packingUnit && isSmallUnit(newPackingList[index].packingUnit)) {
        const newErrors = { ...errors };
        newErrors[`packing_${index}`] = 'Decimal values are not allowed for GRAM and MILLILITER';
        setErrors(newErrors);

        newPackingList[index][field] = '';
        setPackingList(newPackingList);

        setTimeout(() => {
          const currentErrors = { ...errors };
          delete currentErrors[`packing_${index}`];
          setErrors(currentErrors);
        }, 3000);
        return;
      }

      const sanitizedValue = value.replace(/[^\d.]/g, '');
      newPackingList[index][field] = sanitizedValue;
    } else {
      newPackingList[index][field] = value;

      if (field === 'packingUnit' && isSmallUnit(value) && newPackingList[index].packingSize.includes('.')) {
        newPackingList[index].packingSize = '';
        const newErrors = { ...errors };
        newErrors[`packing_${index}`] = 'Decimal values are not allowed for GRAM and MILLILITER. Size field has been cleared.';
        setErrors(newErrors);

        setTimeout(() => {
          const currentErrors = { ...errors };
          delete currentErrors[`packing_${index}`];
          setErrors(currentErrors);
        }, 3000);
      }
    }

    setPackingList(newPackingList);

    if (field === 'packingUnit' || (field === 'packingSize' && !value.includes('.'))) {
      const newErrors = { ...errors };
      delete newErrors[`packing_${index}`];
      setErrors(newErrors);
    }
  };

  const handleSubmitPacking = async (e) => {
    e.preventDefault();

    if (!selectedProduct) {
      setSubmitStatus({
        type: 'error',
        message: 'Please select a product first'
      });
      return;
    }

    const newErrors = {};

    packingList.forEach((packing, index) => {
      const error = validatePacking(packing, selectedProduct.category, index);
      if (error) {
        newErrors[`packing_${index}`] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitStatus({
        type: 'error',
        message: 'Please fix the errors before submitting'
      });
      return;
    }

    setErrors({});

    const packingData = {
      productId: selectedProduct.productId,
      packingList: packingList.map(p => ({
        packingSize: parseInt(p.packingSize),
        packingUnit: p.packingUnit
      }))
    };

    try {
      const response = await addPacking(packingData);
    
      if (response.data.status === 'SUCCESS') {
        setSubmitStatus({
          type: 'success',
          message: 'Packing added successfully!'
        });
        setPackingList([{ packingSize: '', packingUnit: '' }]);
        
        // Refresh existing packings using the API function
        await fetchProductPackings(selectedProduct.productId);
        
        setTimeout(() => setSubmitStatus(null), 3000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: response.data.message || 'Failed to add packing'
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'An error occurred while adding packing'
      });
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Add Product & Packing</h1>
      </header>

      <main className={styles.pageContent}>
        <div className={styles.contentWrapper}>
          {submitStatus && (
            <div className={`${styles.alert} ${submitStatus.type === 'success' ? styles.alertSuccess : styles.alertDanger}`}>
              {submitStatus.message}
              <button onClick={() => setSubmitStatus(null)} className={styles.alertClose}>×</button>
            </div>
          )}

          {/* Search Product Section with Create Button */}
          <div className={styles.formSection}>
            <label className={styles.formLabel}>Search Product</label>
            <div className={styles.searchWrapper}>
              <div className={styles.searchInputWrapper}>
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.formControl}
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type at least 2 characters to search..."
                  onFocus={() => {
                    if (searchResults.length > 0 && searchKey.trim().length > 2) {
                      setShowDropdown(true);
                    }
                  }}
                />
                {showDropdown && searchResults.length > 0 && (
                  <div className={styles.searchResults} ref={dropdownRef}>
                    {searchResults.map((product, index) => (
                      <div
                        key={product.productId}
                        className={styles.searchResultItem}
                        style={index === highlightedIndex ? {
                          backgroundColor: '#dbeafe',
                          borderLeft: '3px solid #2a5298'
                        } : {}}
                        onClick={() => handleSelectProduct(product)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <div className={styles.productName}>{product.productName}</div>
                      <div className={styles.productCategory}>{product.category === 'SOLID' ? 'Powder' : product.category}</div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className={styles.btnCreateProduct}
                onClick={() => setShowCreateProductModal(true)}
              >
                + Create New Product
              </button>
            </div>

            {selectedProduct && (
              <div className={styles.selectedProductBadge}>
                <span>Selected: <strong>{selectedProduct.productName}</strong> ({selectedProduct.category})</span>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setSearchKey('');
                    setExistingPackings([]);
                    setPackingList([{ packingSize: '', packingUnit: '' }]);
                    setErrors({});
                  }}
                  className={styles.clearSelection}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Loading Packings */}
          {loadingPackings && (
            <div className={styles.loadingSection}>
              <p>Loading existing packings...</p>
            </div>
          )}

          {/* Existing Packings */}
          {selectedProduct && !loadingPackings && existingPackings.length > 0 && (
            <div className={styles.existingPackingsSection}>
              <h3 className={styles.sectionTitle}>Existing Packings</h3>
              <div className={styles.existingPackingsList}>
                {existingPackings.map((packing, index) => (
                  <div key={index} className={styles.existingPackingItem}>
                    {packing.packingSize} {packing.packingUnit}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Packing Section */}
          {selectedProduct && !loadingPackings && (
            <div className={styles.packingSection}>
              <div className={styles.packingHeader}>
                <h3 className={styles.sectionTitle}>Add New Packing</h3>
                <button
                  type="button"
                  className={styles.btnAddPacking}
                  onClick={handleAddPacking}
                >
                  + Add Packing
                </button>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.packingTable}>
                  <thead>
                    <tr>
                      <th>Packing Unit *</th>
                      <th>Packing Size *</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                </table>

                <div className={styles.tableBodyWrapper}>
                  <table className={styles.packingTable}>
                    <tbody>
                      {packingList.map((packing, index) => (
                        <tr key={index}>
                          <td>
                            <select
                              className={`${styles.tableSelect} ${errors[`packing_${index}`] ? styles.isInvalid : ''}`}
                              value={packing.packingUnit}
                              onChange={(e) => handlePackingChange(index, 'packingUnit', e.target.value)}
                            >
                              <option value="">Select unit</option>
                              {selectedProduct && getValidUnits(selectedProduct.category).map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className={`${styles.tableInput} ${errors[`packing_${index}`] ? styles.isInvalid : ''}`}
                              value={packing.packingSize}
                              onChange={(e) => handlePackingChange(index, 'packingSize', e.target.value)}
                              placeholder="Enter size"
                              disabled={!packing.packingUnit}
                            />
                            {errors[`packing_${index}`] && (
                              <div className={styles.errorText}>
                                {errors[`packing_${index}`]}
                              </div>
                            )}
                          </td>
                          <td>
                            {packingList.length > 1 && (
                              <button
                                type="button"
                                className={`btn btn-danger ${styles.btnRemove}`}
                                onClick={() => handleRemovePacking(index)}
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedProduct && !loadingPackings && (
        <footer className={styles.pageFooter}>
          <div className={styles.footerContent}>
            <button
              type="submit"
              className={`btn btn-primary ${styles.btnSubmit}`}
              onClick={handleSubmitPacking}
            >
              Add Packing
            </button>
            <button
              type="button"
              className={`btn btn-secondary ${styles.btnReset}`}
              onClick={() => {
                setPackingList([{ packingSize: '', packingUnit: '' }]);
                setErrors({});
              }}
            >
              Reset
            </button>
          </div>
        </footer>
      )}

      {/* Create Product Modal */}
      {showCreateProductModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateProductModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create New Product</h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowCreateProductModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Product Name *</label>
                <input
                  type="text"
                  className={`${styles.formControl} ${productNameError ? styles.isInvalid : ''}`}
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    setProductNameError('');
                  }}
                  placeholder="Enter product name"
                />
                {productNameError && (
                  <div className={styles.invalidFeedback}>{productNameError}</div>
                )}
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category *</label>
                <select
                  className={`${styles.formSelect} ${categoryError ? styles.isInvalid : ''}`}
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setCategoryError('');
                  }}
                >
                  <option value="">Select category</option>
                  <option value="SOLID">Powder</option>
                  <option value="LIQUID">Liquid</option>
                </select>
                {categoryError && (
                  <div className={styles.invalidFeedback}>{categoryError}</div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnModalCancel}
                onClick={() => {
                  setShowCreateProductModal(false);
                  setProductName('');
                  setCategory('');
                  setProductNameError('');
                  setCategoryError('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnModalSubmit}
                onClick={handleCreateProduct}
                disabled={checkingAvailability}
              >
                {checkingAvailability ? 'Checking...' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default AddProduct;