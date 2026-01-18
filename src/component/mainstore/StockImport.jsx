import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Trash2, Upload, Building2, User, Mail, Phone } from 'lucide-react';
import styles from './StockImport.module.css';
import { findProducts } from '../../api/findProducts';
import { findProductsPacking } from '../../api/findProductsPacking';
import { importProduct } from '../../api/importProduct';

const StockImport = () => {
  const [searchKey, setSearchKey] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [importItems, setImportItems] = useState([]);
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(0);
  
  // Form fields
  const [senderCompanyName, setSenderCompanyName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [receiverName, setReceiverName] = useState('');
  
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get unit display
  const getUnitDisplay = (unit) => {
    const unitMap = {
      'KILOGRAM': 'KG',
      'GRAM': 'G',
      'LITER': 'L',
      'MILLILITER': 'ML'
    };
    return unitMap[unit] || unit;
  };

  // Convert quantity to default unit (KG or L)
  const convertToDefaultUnit = (quantity, fromUnit, defaultUnit) => {
    if (!quantity) return 0;
    
    const value = parseFloat(quantity);
    
    // Weight conversions
    if (defaultUnit === 'KILOGRAM') {
      if (fromUnit === 'GRAM') {
        return value / 1000;
      }
      return value;
    }
    
    // Volume conversions
    if (defaultUnit === 'LITER') {
      if (fromUnit === 'MILLILITER') {
        return value / 1000;
      }
      return value;
    }
    
    return value;
  };

  // Get available input units based on default unit
  const getAvailableUnits = (defaultUnit) => {
    if (defaultUnit === 'KILOGRAM') {
      return ['KILOGRAM', 'GRAM'];
    }
    if (defaultUnit === 'LITER') {
      return ['LITER', 'MILLILITER'];
    }
    return [defaultUnit];
  };

  // Calculate quantity based on input type (bags or direct quantity)
  const calculateQuantity = (item) => {
    if (item.inputType === 'bags') {
      if (!item.noOfBags || !item.packingSize) return 0;
      return parseFloat(item.noOfBags) * parseFloat(item.packingSize);
    } else {
      if (!item.directQuantity) return 0;
      return convertToDefaultUnit(item.directQuantity, item.inputUnit, item.defaultUnit);
    }
  };

  // Validate numeric input
  const handleNumericInput = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      return value;
    }
    return e.target.value.slice(0, -1);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!searchKey.trim()) {
          setFilteredProducts([]);
          setShowDropdown(false);
          return;
        }

        const response = await findProducts(searchKey);

        if (response.data.status === "SUCCESS") {
          setFilteredProducts(response.data.payload);
          setShowDropdown(true);
          setSelectedDropdownIndex(0);
        } else {
          setFilteredProducts([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error("Product search failed:", error);
        setFilteredProducts([]);
        setShowDropdown(false);
      }
    };

    fetchProducts();
  }, [searchKey]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || filteredProducts.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedDropdownIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedDropdownIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredProducts[selectedDropdownIndex]) {
          handleProductSelect(filteredProducts[selectedDropdownIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
      default:
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (dropdownRef.current && showDropdown) {
      const selectedRow = dropdownRef.current.querySelector(`tr:nth-child(${selectedDropdownIndex + 2})`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedDropdownIndex, showDropdown]);

  // Fetch packing options
  const fetchPackingForProduct = async (productId) => {
    try {
      const response = await findProductsPacking(productId);
      
      if (response.data.status === "SUCCESS") {
        return response.data.payload;
      } else {
        console.error("Failed to fetch packing options:", response);
        return [];
      }
    } catch (error) {
      console.error("Error fetching packing options:", error);
      return [];
    }
  };

  // Handle product selection
  const handleProductSelect = async (product) => {
    const packingOptions = await fetchPackingForProduct(product.productId);
    
    if (packingOptions.length === 0) {
      alert('No packing options available for this product');
      setShowDropdown(false);
      setSearchKey('');
      return;
    }

    const newItem = {
      id: Date.now(),
      packingId: '',
      productId: product.productId,
      productName: product.productName,
      category: product.category,
      inputType: 'bags',
      noOfBags: '',
      directQuantity: '',
      inputUnit: '',
      defaultUnit: '',
      packingSize: '',
      packingUnit: '',
      quantity: 0,
      packingOptions: packingOptions
    };

    setImportItems([...importItems, newItem]);
    setShowDropdown(false);
    setSearchKey('');
  };

  // Update item field
  const updateItem = (id, field, value) => {
    setImportItems(items => items.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      if (field === 'packingId') {
        const duplicateExists = importItems.some(
          existingItem => 
            existingItem.id !== id && 
            existingItem.productId === item.productId && 
            existingItem.packingId === parseInt(value)
        );

        if (duplicateExists) {
          alert('This product with the same packing size is already added to the import list');
          return item;
        }

        const packing = item.packingOptions.find(p => p.packingId === parseInt(value));
        if (packing) {
          updated.packingId = packing.packingId;
          updated.packingSize = packing.packingSize;
          updated.packingUnit = packing.packingUnit;
          updated.defaultUnit = packing.packingUnit;
          updated.inputUnit = packing.packingUnit;
          updated.noOfBags = '';
          updated.directQuantity = '';
          updated.quantity = 0;
        }
      }

      if (field === 'inputType') {
        updated.noOfBags = '';
        updated.directQuantity = '';
        updated.quantity = 0;
      }

      if (field === 'noOfBags') {
        const intValue = value === '' ? '' : Math.floor(parseFloat(value) || 0);
        updated.noOfBags = intValue === 0 ? '' : intValue.toString();
        updated.quantity = calculateQuantity(updated);
      }

      if (field === 'directQuantity') {
        const numValue = parseFloat(value) || 0;
        updated.directQuantity = value;
        
        const quantityInDefaultUnit = convertToDefaultUnit(numValue, updated.inputUnit, updated.defaultUnit);
        updated.quantity = quantityInDefaultUnit;
      }

      if (field === 'inputUnit') {
        updated.inputUnit = value;
        if (updated.directQuantity) {
          const quantityInDefaultUnit = convertToDefaultUnit(
            parseFloat(updated.directQuantity), 
            value, 
            updated.defaultUnit
          );
          updated.quantity = quantityInDefaultUnit;
        }
      }

      return updated;
    }));
  };

  // Delete item
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setImportItems(importItems.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!senderCompanyName.trim()) {
        alert("Please enter sender company name");
        return;
      }

      if (!senderName.trim()) {
        alert("Please enter sender name");
        return;
      }

      if (!email.trim()) {
        alert("Please enter email");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Please enter a valid email address");
        return;
      }

      if (!contact.trim()) {
        alert("Please enter contact number");
        return;
      }

      if (!receiverName.trim()) {
        alert("Please enter receiver name");
        return;
      }

      if (importItems.length === 0) {
        alert("Please add at least one item to import");
        return;
      }

      const invalidItems = importItems.filter(item =>
        !item.packingId ||
        !item.quantity ||
        Number(item.quantity) <= 0
      );

      if (invalidItems.length > 0) {
        alert("Please fill all required fields for all items");
        return;
      }

      // Build DTO with transfer metadata
      const importDto = {
        senderCompanyName: senderCompanyName.trim(),
        senderName: senderName.trim(),
        email: email.trim(),
        contact: contact.trim(),
        receiverName: receiverName.trim(),
        stockList: importItems.map(item => {
          // Build transfer metadata
          let transferMetadata;
          
          if (item.inputType === 'bags') {
            // For bags import
            // unitTransferred = total weight / packing size = number of bags
            const numberOfBags = item.quantity / parseFloat(item.packingSize);
            
            transferMetadata = {
              transferType: 'bags',
              transferUnit: item.packingUnit, // User's packing unit selection (KILOGRAM, GRAM, LITER, MILLILITER)
              weight: `${Number(item.quantity).toFixed(2)} ${item.packingUnit}`,
              unit: String(numberOfBags.toFixed(2)) // Actual number of bags rounded to 2 decimals
            };
          } else {
            // For weight/quantity import
            // unitTransferred = total weight / packing size = equivalent bags
            const equivalentBags = item.quantity / parseFloat(item.packingSize);
            
            transferMetadata = {
              transferType: 'weight',
              transferUnit: item.inputUnit, // User selected unit (KILOGRAM, GRAM, LITER, MILLILITER)
              weight: `${Number(item.directQuantity).toFixed(2)} ${item.inputUnit}`,
              unit: String(equivalentBags.toFixed(2)) // Equivalent bags rounded to 2 decimals
            };
          }

          return {
            packingId: Number(item.packingId),
            productId: Number(item.productId),
            quantityToTransfer: Number(item.quantity),
            transferMetadata: transferMetadata
          };
        }),
      };

      console.log("Import DTO:", importDto);

      const response = await importProduct(importDto);

      if (response.data.status === "SUCCESS") {
        alert(response.data.message || "Stock imported successfully!");
        // Reset form
        setImportItems([]);
        setSenderCompanyName('');
        setSenderName('');
        setEmail('');
        setContact('');
        setReceiverName('');
      } else {
        alert(response.data.message || "Unable to import stock");
      }

    } catch (error) {
      console.error("Import failed:", error);
      alert(error.message || "Stock import failed");
    }
  };

  // Calculate totals
  const totalBags = importItems.reduce((sum, item) => {
    if (item.inputType === 'bags') {
      return sum + (parseFloat(item.noOfBags) || 0);
    }
    return sum;
  }, 0);

  const totalQuantity = importItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Stock Import</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Sender Information Form */}
        <div className={styles.selectionRow}>
          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <Building2 size={16} />
              Sender Company Name *
            </label>
            <input
              type="text"
              className={styles.textInput}
              placeholder="Enter company name"
              value={senderCompanyName}
              onChange={(e) => setSenderCompanyName(e.target.value)}
            />
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <User size={16} />
              Sender Name *
            </label>
            <input
              type="text"
              className={styles.textInput}
              placeholder="Enter sender name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <Mail size={16} />
              Email *
            </label>
            <input
              type="email"
              className={styles.textInput}
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <Phone size={16} />
              Contact *
            </label>
            <input
              type="tel"
              className={styles.textInput}
              placeholder="Enter contact number"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <User size={16} />
              Receiver Name *
            </label>
            <input
              type="text"
              className={styles.textInput}
              placeholder="Enter receiver name"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
            />
          </div>
        </div>

        {/* Search Section */}
        <div className={styles.searchSection}>
          <div className={styles.searchWrapper}>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search by item code"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              onFocus={() => searchKey && setShowDropdown(true)}
              onKeyDown={handleKeyDown}
            />
            
            {showDropdown && filteredProducts.length > 0 && (
              <div className={styles.dropdown} ref={dropdownRef}>
                <table className={styles.dropdownTable}>
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, index) => (
                      <tr 
                        key={product.productId}
                        onClick={() => handleProductSelect(product)}
                        className={selectedDropdownIndex === index ? styles.dropdownActive : ''}
                      >
                        <td>{product.productId}</td>
                        <td>{product.productName}</td>
                        <td>{product.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Packing Size</th>
                <th>Input Type</th>
                <th>Input</th>
                <th>Import Qty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {importItems.length > 0 ? (
                importItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.productId}</td>
                    <td>{item.productName}</td>
                    <td>
                      <select
                        className={`${styles.tableSelect} ${styles.packingSizeinput}`}
                        value={item.packingId}
                        onChange={(e) => updateItem(item.id, 'packingId', e.target.value)}
                      >
                        <option value="">Select packing</option>
                        {item.packingOptions && item.packingOptions.map(packing => (
                          <option key={packing.packingId} value={packing.packingId}>
                            {packing.packingSize} {getUnitDisplay(packing.packingUnit)}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <select
                        className={styles.tableSelect}
                        value={item.inputType}
                        onChange={(e) => updateItem(item.id, 'inputType', e.target.value)}
                        disabled={!item.packingId}
                      >
                        <option value="bags">Bags/Bottles</option>
                        <option value="quantity">Direct Quantity</option>
                      </select>
                    </td>

                    <td>
                      {item.inputType === 'bags' ? (
                        <div>
                          <input
                            type="text"
                            className={styles.tableInput}
                            placeholder="0"
                            value={item.noOfBags}
                            onChange={(e) => {
                              const validated = handleNumericInput(e);
                              updateItem(item.id, 'noOfBags', validated);
                            }}
                            disabled={!item.packingId}
                          />
                        </div>
                      ) : (
                        <div style={{display: 'flex', gap: '4px'}}>
                          <input
                            type="text"
                            className={styles.tableInput}
                            placeholder="0"
                            value={item.directQuantity}
                            onChange={(e) => {
                              const validated = handleNumericInput(e);
                              updateItem(item.id, 'directQuantity', validated);
                            }}
                            disabled={!item.packingId}
                            style={{flex: 1}}
                          />
                          <select
                            className={styles.tableSelect}
                            value={item.inputUnit}
                            onChange={(e) => updateItem(item.id, 'inputUnit', e.target.value)}
                            disabled={!item.packingId}
                            style={{flex: '0 0 60px', fontSize: '0.85rem'}}
                          >
                            {item.defaultUnit && getAvailableUnits(item.defaultUnit).map(unit => (
                              <option key={unit} value={unit}>
                                {getUnitDisplay(unit)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </td>

                    <td>
                      {item.quantity > 0 ? (
                        <span className={styles.quantityBadge}>
                          {item.quantity.toFixed(3)} {getUnitDisplay(item.defaultUnit)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    
                    <td>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(item.id)}
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={styles.emptyRow}>
                    <Package size={48} />
                    <p>No items added yet. Search and add products to create an import.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div>
          <div className={styles.footerLeft}>
            <div className={styles.totalInfo}>
              <span className={styles.totalLabel}>Item Count:</span>
              <span className={styles.totalValue}>{importItems.length}</span>
            </div>
            {totalBags > 0 && (
              <div className={styles.totalInfo}>
                <span className={styles.totalLabel}>Total Bags:</span>
                <span className={styles.totalValue}>{totalBags}</span>
              </div>
            )}
          </div>
          <button 
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={importItems.length === 0}
          >
            <Upload size={18} />
            Import Stock
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockImport;