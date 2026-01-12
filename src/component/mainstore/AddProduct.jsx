import React, { useState } from 'react';
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

  const isSmallUnit = (unit) => {
    return unit === 'GRAM' || unit === 'MILLILITER';
  };

  const normalizePacking = (size, unit) => {
    const normalizedSize = size.toString().trim().replace(/\s+/g, '');
    const normalizedUnit = unit.toUpperCase().trim();
    return `${normalizedSize}${normalizedUnit}`;
  };

  const validatePacking = (packing, selectedCategory, currentIndex) => {
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

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    const resetPackingList = packingList.map(packing => ({
      packingSize: '',
      packingUnit: ''
    }));
    setPackingList(resetPackingList);
    setErrors({});
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
      const error = validatePacking(packing, category, index);
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
        setSubmitStatus({
          type: 'success',
          message: 'Product added successfully!'
        });
        setProductName('');
        setCategory('');
        setPackingList([{ packingSize: '', packingUnit: '' }]);
        setTimeout(() => setSubmitStatus(null), 3000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: response.data.message || 'Failed to add product'
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'An error occurred while adding the product'
      });
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Add New Product</h1>
      </header>

      <main className={styles.pageContent}>
        <div className={styles.contentWrapper}>
          {submitStatus && (
            <div className={`${styles.alert} ${submitStatus.type === 'success' ? styles.alertSuccess : styles.alertDanger}`}>
              {submitStatus.message}
              <button onClick={() => setSubmitStatus(null)}>×</button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Product Name *
              </label>
              <input
                type="text"
                className={`${styles.formControl} ${errors.productName ? styles.isInvalid : ''}`}
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  const newErrors = { ...errors };
                  delete newErrors.productName;
                  setErrors(newErrors);
                }}
                placeholder="Enter product name"
              />
              {errors.productName && (
                <div className={styles.invalidFeedback}>{errors.productName}</div>
              )}
              <label className={styles.formLabel}>
                Category *
              </label>
              <select
                className={`${styles.formSelect} ${errors.category ? styles.isInvalid : ''}`}
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">Select category</option>
                <option value="SOLID">Solid</option>
                <option value="LIQUID">Liquid</option>
              </select>
              {errors.category && (
                <div className={styles.invalidFeedback}>{errors.category}</div>
              )}
            </div>

            <div className={styles.packingSection}>
              <div className={styles.packingHeader}>
                <h3 className={styles.sectionTitle}>Packing Details</h3>
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
                              disabled={!category}
                            >
                              <option value="">Select unit</option>
                              {category && getValidUnits(category).map(unit => (
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
          </form>
        </div>
      </main>

      <footer className={styles.pageFooter}>
        <div className={styles.footerContent}>
          <button
            type="submit"
            className={`btn btn-primary ${styles.btnSubmit}`}
            onClick={handleSubmit}
          >
            Add Product
          </button>
          <button
            type="button"
            className={`btn btn-secondary ${styles.btnReset}`}
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
      </footer>
    </div>
  );
};

export default AddProduct;