import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Package, X, Check } from 'lucide-react';
import styles from './MainStoreTransfer.module.css';

// Dummy data
const dummyProducts = [
  { productId: 1, productName: "Premium Rice", category: "SOLID" },
  { productId: 2, productName: "Cooking Oil", category: "LIQUID" },
  { productId: 3, productName: "Wheat Flour", category: "SOLID" },
  { productId: 4, productName: "Milk", category: "LIQUID" },
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
  }
];

const dummyStores = [
  {
    storeId: 2,
    storeName: "Branch Store A",
    address: "123 Main St",
    contactNo: "9876543210",
    managerInfo: { managerId: "M001", name: "John Doe" }
  },
  {
    storeId: 3,
    storeName: "Branch Store B",
    address: "456 Oak Ave",
    contactNo: "9876543211",
    managerInfo: { managerId: "M002", name: "Jane Smith" }
  },
  {
    storeId: 4,
    storeName: "Branch Store C",
    address: "789 Pine Rd",
    contactNo: "9876543212",
    managerInfo: { managerId: "M003", name: "Mike Johnson" }
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
      const selectedRow = dropdownRef.current.querySelector(`tr:nth-child(${selectedDropdownIndex + 1})`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedDropdownIndex, showDropdown]);

  // Handle product selection - Add directly to table
  const handleProductSelect = (product) => {
    // Check if product already exists in transfer items
    const exists = transferItems.some(item => item.productId === product.productId);
    
    if (exists) {
      alert('This product is already added to the transfer list');
      setShowDropdown(false);
      setSearchKey('');
      return;
    }

    // Add product directly to table
    const newItem = {
      id: Date.now(),
      inventoryId: null,
      packingId: '',
      productId: product.productId,
      productName: product.productName,
      category: product.category,
      quantity: 0,
      noOfBags: '',
      storeToTransfer: '',
      storeName: '',
      managerId: '',
      managerName: '',
      packingSize: '',
      packingUnit: '',
      availableQuantity: 0
    };

    setTransferItems([...transferItems, newItem]);
    setPackingOptions(dummyPackings);
    setStores(dummyStores);
    
    // Clear search and close dropdown
    setShowDropdown(false);
    setSearchKey('');
  };

  // Update item field
  const updateItem = (id, field, value) => {
    setTransferItems(items => items.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      // Handle packing change
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

      // Handle store change
      if (field === 'storeToTransfer') {
        const store = stores.find(s => s.storeId === parseInt(value));
        if (store) {
          updated.storeToTransfer = store.storeId;
          updated.storeName = store.storeName;
          updated.managerId = store.managerInfo.managerId;
          updated.managerName = store.managerInfo.name;
        }
      }

      // Handle bags change
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
    if (transferItems.length === 0) {
      alert('Please add at least one item to transfer');
      return;
    }

    const invalidItems = transferItems.filter(item => 
      !item.packingId || !item.storeToTransfer || !item.noOfBags || parseFloat(item.noOfBags) <= 0
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

    console.log('Submitting transfer:', transferItems);
    alert('Transfer submitted successfully!');
  };

  return (
    <div className={styles.mainStoreTransfer}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>
            <Package size={28} />
            Main Store Transfer
          </h2>
          <p className={styles.pageSubtitle}>Transfer stock from main store to branch stores</p>
        </div>

        {/* Search Section */}
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <label className={styles.formLabel}>Search Product</label>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={20} />
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Search by item code or name..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                onFocus={() => searchKey && setShowDropdown(true)}
                onKeyDown={handleKeyDown}
              />
              
              {showDropdown && filteredProducts.length > 0 && (
                <div className={styles.searchDropdown} ref={dropdownRef}>
                  <table className={styles.dropdownTable}>
                    <thead>
                      <tr>
                        <th>Item Code</th>
                        <th>Item Name</th>
                        <th>Type</th>
                        <th>Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product, index) => (
                        <tr 
                          key={product.productId}
                          onClick={() => handleProductSelect(product)}
                          className={selectedDropdownIndex === index ? styles.dropdownRowActive : ''}
                        >
                          <td>{product.productId}</td>
                          <td>{product.productName}</td>
                          <td>-</td>
                          <td>{product.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transfer Items Table */}
        {transferItems.length > 0 && (
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Packing Size *</th>
                      <th>Transfer To Store *</th>
                      <th>Bags *</th>
                      <th>Weight</th>
                      <th>Manager</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.productId}</td>
                        <td>{item.productName}</td>
                        <td>
                          <select
                            className={styles.selectInput}
                            value={item.packingId}
                            onChange={(e) => updateItem(item.id, 'packingId', e.target.value)}
                          >
                            <option value="">Select</option>
                            {packingOptions.map(packing => (
                              <option key={packing.packingId} value={packing.packingId}>
                                {packing.packingSize} {getUnitDisplay(packing.packingUnit)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className={styles.selectInput}
                            value={item.storeToTransfer}
                            onChange={(e) => updateItem(item.id, 'storeToTransfer', e.target.value)}
                          >
                            <option value="">Select</option>
                            {stores.map(store => (
                              <option key={store.storeId} value={store.storeId}>
                                {store.storeName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className={styles.numberInput}
                            placeholder="0"
                            value={item.noOfBags}
                            onChange={(e) => updateItem(item.id, 'noOfBags', e.target.value)}
                            min="0"
                          />
                        </td>
                        <td>
                          <span className={styles.weightBadge}>
                            {item.quantity} {item.packingUnit ? getUnitDisplay(item.packingUnit) : ''}
                          </span>
                        </td>
                        <td>{item.managerName || '-'}</td>
                        <td>
                          <button
                            className={styles.btnDelete}
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Footer */}
        {transferItems.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.footerContent}>
              <div>
                <div className={styles.totalLabel}>Transfer Summary</div>
                <div className={styles.itemCount}>Total Items: {transferItems.length}</div>
                <div className={styles.itemCount}>
                  Total Bags: {transferItems.reduce((sum, item) => sum + (parseFloat(item.noOfBags) || 0), 0)}
                </div>
              </div>
              <button className={styles.btnSubmit} onClick={handleSubmit}>
                <Check size={20} />
                Submit Transfer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainStoreTransfer;