import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Trash2, Send, Building2, User } from 'lucide-react';
import styles from './MainStoreTransfer.module.css';
import { fetchStoresWithUserApi } from '../api/findStoreAndEmployee';

// Dummy data
const dummyProducts = [
  { productId: 1, productName: "Premium Rice", category: "SOLID" },
  { productId: 2, productName: "Cooking Oil", category: "LIQUID" },
  { productId: 3, productName: "Wheat Flour", category: "SOLID" },
  { productId: 4, productName: "Milk", category: "LIQUID" },
  { productId: 5, productName: "Sugar", category: "SOLID" },
  { productId: 6, productName: "Tea Powder", category: "SOLID" },
];

const dummyPackings = [
  {
    packingId: 1,
    packingSize: "10",
    packingUnit: "KILOGRAM",
    inventoryList: [
      { inventoryId: 101, availableQuantity: 500, storeId: 1, storeName: "Main Store" }
    ]
  },
  {
    packingId: 2,
    packingSize: "25",
    packingUnit: "KILOGRAM",
    inventoryList: [
      { inventoryId: 102, availableQuantity: 300, storeId: 1, storeName: "Main Store" }
    ]
  },
  {
    packingId: 3,
    packingSize: "50",
    packingUnit: "KILOGRAM",
    inventoryList: [
      { inventoryId: 103, availableQuantity: 150, storeId: 1, storeName: "Main Store" }
    ]
  }
];

const MainStoreTransfer = () => {
  const [searchKey, setSearchKey] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [packingOptions, setPackingOptions] = useState([]);
  const [stores, setStores] = useState([]);
  const [transferItems, setTransferItems] = useState([]);
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(0);
  
  // Store and User selection (separate from items)
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

 const loadStores = async () => {
    try {
      const response = await fetchStoresWithUserApi();

      if(response.data.status==="SUCCESS")
      {
       setStores(response.data.payload);
      }else{
       console.log(response.data);
        setStores([]);
      }
    } catch (err) {
      console.error("Failed to load stores", err);
    }
  };



  useEffect(() => {
    setPackingOptions(dummyPackings);
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

  // Calculate quantity from bags
  const calculateQuantity = (bags, packingSize) => {
    if (!bags || !packingSize) return 0;
    return parseFloat(bags) * parseFloat(packingSize);
  };

  // Search products
  useEffect(() => {
    if (searchKey.trim()) {
      const filtered = dummyProducts.filter(p => 
        p.productName.toLowerCase().includes(searchKey.toLowerCase()) ||
        p.productId.toString().includes(searchKey)
      );
      setFilteredProducts(filtered);
      setShowDropdown(true);
      setSelectedDropdownIndex(0);
    } else {
      setFilteredProducts([]);
      setShowDropdown(false);
    }
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

  // Handle product selection
  const handleProductSelect = (product) => {
    const exists = transferItems.some(item => item.productId === product.productId);
    
    if (exists) {
      alert('This product is already added to the transfer list');
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
      quantity: 0,
      noOfBags: '',
      packingSize: '',
      packingUnit: '',
      availableQuantity: 0
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
      setSelectedUser(''); // Reset user selection when store changes
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
        const packing = packingOptions.find(p => p.packingId === parseInt(value));
        if (packing) {
          const inventory = packing.inventoryList[0];
          updated.packingId = packing.packingId;
          updated.inventoryId = inventory.inventoryId;
          updated.packingSize = packing.packingSize;
          updated.packingUnit = packing.packingUnit;
          updated.availableQuantity = inventory.availableQuantity;
          updated.quantity = calculateQuantity(updated.noOfBags, packing.packingSize);
        }
      }

      if (field === 'noOfBags') {
        updated.noOfBags = value;
        updated.quantity = calculateQuantity(value, updated.packingSize);
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

  // Validate and submit
  const handleSubmit = () => {
    if (!selectedStore) {
      alert('Please select a store to transfer to');
      return;
    }

    if (!selectedUser) {
      alert('Please select a user');
      return;
    }

    if (transferItems.length === 0) {
      alert('Please add at least one item to transfer');
      return;
    }

    const invalidItems = transferItems.filter(item => 
      !item.packingId || !item.noOfBags || parseFloat(item.noOfBags) <= 0
    );

    if (invalidItems.length > 0) {
      alert('Please fill all required fields for all items');
      return;
    }

    const exceededItems = transferItems.filter(item => item.quantity > item.availableQuantity);
    if (exceededItems.length > 0) {
      alert('Some items exceed available quantity');
      return;
    }

    // Get selected user details
    const selectedUserObj = availableUsers.find(user => user.userId === selectedUser);

    // Format data according to DTO structure
    const transferDto = {
      receiverStoreId: parseInt(selectedStore),
      userId: selectedUser,
      userName: selectedUserObj ? selectedUserObj.name : '',
      stockList: transferItems.map(item => ({
        inventoryId: item.inventoryId,
        packingId: item.packingId,
        productId: item.productId,
        quantityToTransfer: item.quantity
      }))
    };

    console.log('Transfer DTO:', transferDto);
    alert('Transfer submitted successfully!');
  };

  // Calculate totals
  const totalBags = transferItems.reduce((sum, item) => sum + (parseFloat(item.noOfBags) || 0), 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Main Store Transfer</h1>
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
          <div className={styles.selectGroup} id='select-store-name'>
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
                <th className={styles.tableitemcode}>Item Code</th>
                <th className={styles.tableitemname}>Item Name</th>
                <th className={styles.tablesize}>Packing Size</th>
                <th className={styles.tablebags}>No. of Bags</th>
                <th className={styles.tablequantity}>Quantity</th>
                <th className={styles.tableaction}>Actions</th>
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
                        <option value="" className={styles.optionSelect} >Select packing</option>
                        {packingOptions.map(packing => (
                          <option key={packing.packingId} value={packing.packingId} >
                            {packing.packingSize} {getUnitDisplay(packing.packingUnit)}
                          </option>
                        ))}
                      </select>
                      {item.packingId && (
                        <div className={styles.availableText}>
                          Available: {item.availableQuantity} {getUnitDisplay(item.packingUnit)}
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        className={styles.tableInput}
                        placeholder="0"
                        value={item.noOfBags}
                        onChange={(e) => updateItem(item.id, 'noOfBags', e.target.value)}
                        min="0"
                      />
                    </td>
                    <td>
                      {item.quantity > 0 ? (
                        <span className={styles.quantityBadge}>
                          {item.quantity} {getUnitDisplay(item.packingUnit)}
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
                  <td colSpan="6" className={styles.emptyRow}>
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
          <div className={styles.totalInfo}>
            <span className={styles.totalLabel}>Total Bags:</span>
            <span className={styles.totalValue}>{totalBags}</span>
          </div>
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

export default MainStoreTransfer;