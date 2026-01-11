import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Trash2, Send, Building2, User } from 'lucide-react';
import styles from './ShopTransfer.module.css';
import { fetchStoresWithUserApi } from '../../api/findStoreAndEmployee';
import { findProducts } from '../../api/findProducts';
import { findProductsPacking } from '../../api/findProductsPacking';
import { sendProductToStore } from '../../api/sendProductToStore';

const ShopTransfer = () => {
  const [searchKey, setSearchKey] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [transferItems, setTransferItems] = useState([]);
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(0);
  
  // Store and User selection
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const loadStores = async () => {
    try {
      const response = await fetchStoresWithUserApi();

      if(response.data.status === "SUCCESS") {
        setStores(response.data.payload);
      } else {
        console.log(response.data);
        setStores([]);
      }
    } catch (err) {
      console.error("Failed to load stores", err);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

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

  // Get store type display
  const getStoreTypeDisplay = (storeType) => {
    const typeMap = {
      'MAIN_STORE': 'Main Store',
      'SUB_STORE': 'Sub Store',
      'SHOP': 'Shop'
    };
    return typeMap[storeType] || storeType;
  };

  // Convert quantity to default unit (KG or L)
  const convertToDefaultUnit = (quantity, fromUnit, defaultUnit) => {
    if (!quantity) return 0;
    
    const value = parseFloat(quantity);
    
    // Weight conversions
    if (defaultUnit === 'KILOGRAM') {
      if (fromUnit === 'GRAM') {
        return value / 1000; // Convert grams to kg
      }
      return value; // Already in kg
    }
    
    // Volume conversions
    if (defaultUnit === 'LITER') {
      if (fromUnit === 'MILLILITER') {
        return value / 1000; // Convert ml to liters
      }
      return value; // Already in liters
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
      // Calculate from bags
      if (!item.noOfBags || !item.packingSize) return 0;
      return parseFloat(item.noOfBags) * parseFloat(item.packingSize);
    } else {
      // Direct quantity input - convert to default unit
      if (!item.directQuantity) return 0;
      return convertToDefaultUnit(item.directQuantity, item.inputUnit, item.defaultUnit);
    }
  };

  // Validate numeric input - only allow numbers and decimal point
  const handleNumericInput = (e) => {
    const value = e.target.value;
    // Allow only numbers, one decimal point, and empty string
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

        if (response.data.status === "SUCCESS" ) {
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

  // Handle keyboard navigation in dropdown
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

  // Fetch packing options for a product
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
    // Fetch packing options for the selected product
    const packingOptions = await fetchPackingForProduct(product.productId);
    
    if (packingOptions.length === 0) {
      alert('No packing options available for this product');
      setShowDropdown(false);
      setSearchKey('');
      return;
    }

    const newItem = {
      id: Date.now(),
      inventoryId: null,
      packingId: '',
      productId: product.productId,
      productName: product.productName,
      category: product.category,
      inputType: 'bags', // 'bags' or 'quantity'
      noOfBags: '',
      directQuantity: '',
      inputUnit: '', // Unit for direct quantity input
      defaultUnit: '', // Default unit from packing (KG or L)
      packingSize: '',
      packingUnit: '',
      quantity: 0,
      availableQuantity: 0,
      maxBags: 0,
      packingOptions: packingOptions
    };

    setTransferItems([...transferItems, newItem]);
    setShowDropdown(false);
    setSearchKey('');
  };

  // Handle store selection
  const handleStoreSelect = (storeId) => {
    const store = stores.find(s => s.storeId === parseInt(storeId));
    if (store) {
      setSelectedStore(storeId);
      setAvailableUsers(store.userList || []);
      setSelectedUser('');
    } else {
      setSelectedStore('');
      setAvailableUsers([]);
      setSelectedUser('');
    }
  };

  // Update item field
  const updateItem = (id, field, value) => {
    setTransferItems(items => items.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      if (field === 'packingId') {
        // Check for duplicates
        const duplicateExists = transferItems.some(
          existingItem => 
            existingItem.id !== id && 
            existingItem.productId === item.productId && 
            existingItem.packingId === parseInt(value)
        );

        if (duplicateExists) {
          alert('This product with the same packing size is already added to the transfer list');
          return item;
        }

        const packing = item.packingOptions.find(p => p.packingId === parseInt(value));
        if (packing) {
          const inventory = packing.inventoryList && packing.inventoryList.length > 0 
            ? packing.inventoryList[0] 
            : null;
          
          if (!inventory) {
            alert('No inventory available for this packing');
            return item;
          }

          const maxBags = Math.floor(inventory.availableQuantity / parseFloat(packing.packingSize));
          
          updated.packingId = packing.packingId;
          updated.inventoryId = inventory.inventoryId;
          updated.packingSize = packing.packingSize;
          updated.packingUnit = packing.packingUnit;
          updated.defaultUnit = packing.packingUnit;
          updated.inputUnit = packing.packingUnit; // Default input unit same as packing unit
          updated.availableQuantity = inventory.availableQuantity;
          updated.maxBags = maxBags;
          updated.noOfBags = '';
          updated.directQuantity = '';
          updated.quantity = 0;
        }
      }

      if (field === 'inputType') {
        // Reset input values when switching type
        updated.noOfBags = '';
        updated.directQuantity = '';
        updated.quantity = 0;
      }

      if (field === 'noOfBags') {
        // Only allow integer values for bags
        const intValue = value === '' ? '' : Math.floor(parseFloat(value) || 0);
        
        if (intValue > updated.maxBags) {
          alert(`Maximum ${updated.maxBags} bags available`);
          return item;
        }
        
        updated.noOfBags = intValue === 0 ? '' : intValue.toString();
        updated.quantity = calculateQuantity(updated);
      }

      if (field === 'directQuantity') {
        const numValue = parseFloat(value) || 0;
        updated.directQuantity = value;
        
        // Calculate quantity in default unit
        const quantityInDefaultUnit = convertToDefaultUnit(numValue, updated.inputUnit, updated.defaultUnit);
        
        // Check if exceeds available
        if (quantityInDefaultUnit > updated.availableQuantity) {
          alert(`Maximum available: ${updated.availableQuantity} ${getUnitDisplay(updated.defaultUnit)}`);
          return item;
        }
        
        updated.quantity = quantityInDefaultUnit;
      }

      if (field === 'inputUnit') {
        updated.inputUnit = value;
        // Recalculate quantity with new unit
        if (updated.directQuantity) {
          const quantityInDefaultUnit = convertToDefaultUnit(
            parseFloat(updated.directQuantity), 
            value, 
            updated.defaultUnit
          );
          
          if (quantityInDefaultUnit > updated.availableQuantity) {
            alert(`Maximum available: ${updated.availableQuantity} ${getUnitDisplay(updated.defaultUnit)}`);
            updated.directQuantity = '';
            updated.quantity = 0;
          } else {
            updated.quantity = quantityInDefaultUnit;
          }
        }
      }

      return updated;
    }));
  };

  // Delete item
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setTransferItems(transferItems.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!selectedStore) {
        alert("Please select a store to transfer to");
        return;
      }

      if (!selectedUser) {
        alert("Please select a user");
        return;
      }

      if (transferItems.length === 0) {
        alert("Please add at least one item to transfer");
        return;
      }

      // Validate items
      const invalidItems = transferItems.filter(item =>
        !item.packingId ||
        !item.quantity ||
        Number(item.quantity) <= 0
      );

      if (invalidItems.length > 0) {
        alert("Please fill all required fields for all items");
        return;
      }

      // Quantity exceeded check
      const exceededItems = transferItems.filter(
        item => Number(item.quantity) > Number(item.availableQuantity)
      );

      if (exceededItems.length > 0) {
        alert("Some items exceed available quantity");
        return;
      }

      // Get selected user details
      const selectedUserObj = availableUsers.find(
        user => user.userId === selectedUser
      );

      // Build DTO - quantity is already in default unit
      const transferDto = {
        receiverStoreId: Number(selectedStore),
        userId: selectedUser,
        userName: selectedUserObj?.name || "",
        stockList: transferItems.map(item => ({
          inventoryId: Number(item.inventoryId),
          packingId: Number(item.packingId),
          productId: Number(item.productId),
          quantityToTransfer: Number(item.quantity), // Already in default unit
        })),
      };

      console.log("Transfer DTO:", transferDto);

      const response = await sendProductToStore(transferDto);

      if(response.data.status === "SUCCESS") {
        alert(response.data.message || "Stock transferred successfully!");
        setTransferItems([]);
        setSelectedStore("");
        setSelectedUser("");
      } else {
        alert(response.data.message || "Unable to transfer stock");
      }

    } catch (error) {
      console.error("Transfer failed:", error);
      alert(error.message || "Stock transfer failed");
    }
  };

  // Calculate totals
  const totalBags = transferItems.reduce((sum, item) => {
    if (item.inputType === 'bags') {
      return sum + (parseFloat(item.noOfBags) || 0);
    }
    return sum;
  }, 0);

  const totalQuantity = transferItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Shop Stock Transfer</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
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

        {/* Store and User Selection */}
        <div className={styles.selectionRow}>
          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <Building2 size={16} />
              Store Name:
            </label>
            <select
              className={styles.selectInput}
              value={selectedStore}
              onChange={(e) => handleStoreSelect(e.target.value)}
            >
              <option value="">Select a store</option>
              {stores.map(store => (
                <option key={store.storeId} value={store.storeId}>
                  {store.storeName} - {getStoreTypeDisplay(store.storeType)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <User size={16} />
              Receiver Name:
            </label>
            <select
              className={styles.selectInput}
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              disabled={!selectedStore || availableUsers.length === 0}
            >
              <option value="">Select a user</option>
              {availableUsers.map(user => (
                <option key={user.userId} value={user.userId}>
                  {user.name} - {user.userRole}
                </option>
              ))}
            </select>
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
                <th>Available</th>
                <th>Input Type</th>
                <th>Input</th>
                <th>Transfer Qty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transferItems.length > 0 ? (
                transferItems.map((item) => (
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
                      {item.packingId && (
                        <div className={styles.availableText}>
                          {item.availableQuantity} {getUnitDisplay(item.defaultUnit)}
                        </div>
                      )}
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
                          {item.packingId && (
                            <small style={{display: 'block', fontSize: '0.75rem', color: '#666', marginTop: '2px'}}>
                              Max: {item.maxBags}
                            </small>
                          )}
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
                  <td colSpan="8" className={styles.emptyRow}>
                    <Package size={48} />
                    <p>No items added yet. Search and add products to create a transfer.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <div className={styles.totalInfo}>
            <span className={styles.totalLabel}>Item Count:</span>
            <span className={styles.totalValue}>{transferItems.length}</span>
          </div>
          {totalBags > 0 && (
            <div className={styles.totalInfo}>
              <span className={styles.totalLabel}>Total Bags:</span>
              <span className={styles.totalValue}>{totalBags}</span>
            </div>
          )}
          <button 
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={transferItems.length === 0}
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopTransfer;