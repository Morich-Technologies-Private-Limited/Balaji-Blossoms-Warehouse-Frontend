import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Trash2, Send, Building2, User, UserCheck, Phone, Car } from 'lucide-react';
import styles from './ShopTransfer.module.css';
import { fetchStoresWithUserApi } from '../../api/findStoreAndEmployee';
import { findProducts } from '../../api/findProducts';
import { findProductsPacking } from '../../api/findProductsPacking';
import { sendProductToStore } from '../../api/sendProductToStore';
import { downloadTransferPdf } from '../../api/downloadTransferPdf';
import { fetchProductExpiry } from '../../api/productExpiryApi';
import { fetchSupervisorsByStore, sendMainStoreToSupervisor } from '../../api/supervisorApi';
import { getSessionData } from '../utils/getSessionData';
import ExpirySelect from '../stock/ExpirySelect';
import { isExpiringSoon, daysLeft, expiryLabel, expiryText } from '../utils/expiry';
import { notify, confirmAction } from '../utils/feedback';
import { round3, formatQuantity, isCountUnit, hasLoosePieces, packsToStock, stockToPacks, piecesToStock, packName, containerLabel, PIECES_LABEL } from '../utils/units';

// ownSupervisorOnly: sub store Out Entry, stock can only go to the store's own supervisors
const ShopTransfer = ({ ownSupervisorOnly = false }) => {

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

  // Main store only: optional supervisor of the selected sub store (direct delivery)
  const { role, storeId: ownStoreId } = getSessionData();
  const canSendToSupervisor = role === 'MAIN_STORE_MANAGER';
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const selectedStoreObj = stores.find(s => s.storeId === parseInt(selectedStore));

  // Send to one of the store's own supervisors (single OUT entry of this store):
  // optional checkbox for main store, always on for the sub store Out Entry
  const [sendToOwnSupervisor, setSendToOwnSupervisor] = useState(ownSupervisorOnly);
  const [ownSupervisors, setOwnSupervisors] = useState([]);
  const [ownSupervisorId, setOwnSupervisorId] = useState('');

  const loadOwnSupervisors = async () => {
    try {
      const response = await fetchSupervisorsByStore(ownStoreId);
      setOwnSupervisors(response.data.payload || []);
    } catch (error) {
      console.error('Failed to load own supervisors', error);
      notify.error(error.message || 'Failed to load supervisors');
    }
  };

  const handleOwnSupervisorToggle = async (checked) => {
    setSendToOwnSupervisor(checked);
    setOwnSupervisorId('');
    setSelectedStore('');
    setSelectedUser('');
    setAvailableUsers([]);
    setSupervisors([]);
    setSelectedSupervisorId('');

    if (checked && ownSupervisors.length === 0) {
      await loadOwnSupervisors();
    }
  };

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // blocks a second submit while a transfer request is running
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Driver / vehicle details printed on the invoice
  const [driverName, setDriverName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [contactNo, setContactNo] = useState('');

  // Invoice (challan) preview shown after a successful transfer
  const [transferId, setTransferId] = useState('');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfBlob, setPdfBlob] = useState(null);

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
    if (ownSupervisorOnly) {
      loadOwnSupervisors();
    } else {
      loadStores();
    }
  }, [ownSupervisorOnly]);

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

  // Check if unit is a smaller unit (GRAM or MILLILITER)
  const isSmallerUnit = (unit) => {
    return unit === 'GRAM' || unit === 'MILLILITER';
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

  // Stock (in KG / L / count unit) shown in the unit the user is typing in
  const convertToInputUnit = (quantity, defaultUnit, inputUnit) => {
    const smallOfDefault = (defaultUnit === 'KILOGRAM' && inputUnit === 'GRAM') || (defaultUnit === 'LITER' && inputUnit === 'MILLILITER');
    return smallOfDefault ? quantity * 1000 : quantity;
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
      // bags x packing size (KG / L); packets of a count unit are the stock quantity itself
      if (!item.noOfBags || !item.packingSize) return 0;
      return round3(packsToStock(item.noOfBags, item.packingUnit, item.packingSize));
    } else {
      if (!item.directQuantity) return 0;
      return directToStock(item, item.directQuantity, item.inputUnit);
    }
  };

  // Direct quantity -> stock quantity.
  // Count units: loose pieces / packing size (20 pens of a 25 packet = 0.8 PACKET). KG / L: unit conversion.
  const directToStock = (item, value, inputUnit) => {
    if (isCountUnit(item.packingUnit)) {
      return round3(piecesToStock(value, item.packingSize));
    }
    return convertToDefaultUnit(value, inputUnit, item.defaultUnit);
  };

  // Stock that can still be sent, in what the user is typing (pieces for count units)
  const maxDirect = (item) => (isCountUnit(item.packingUnit)
    ? round3(item.availableQuantity * parseFloat(item.packingSize))
    : round3(convertToInputUnit(item.availableQuantity, item.defaultUnit, item.inputUnit)));

  const directUnitLabel = (item, unit) => (hasLoosePieces(item.packingUnit, item.packingSize) ? PIECES_LABEL : getUnitDisplay(unit));

  // a count unit with packing size 1 (NOS) has nothing to split: one way of entering only
  const singleInputType = (packingUnit, packingSize) => isCountUnit(packingUnit) && !hasLoosePieces(packingUnit, packingSize);

  // Validate numeric input based on unit and input type
  const handleNumericInput = (e, item = null, field = null) => {
    const value = e.target.value;
    
    // For bags input - allow decimals up to 2 decimal places
    if (field === 'noOfBags') {
      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
        return value;
      }
      return e.target.value.slice(0, -1);
    }
    
    // For direct quantity with smaller units (GRAM/MILLILITER) - only integers allowed
    if (field === 'directQuantity' && item && isSmallerUnit(item.inputUnit)) {
      if (value === '' || /^\d+$/.test(value)) {
        return value;
      }
      return e.target.value.slice(0, -1);
    }
    
    // For other cases (KG/LITER) - allow decimals up to 2 decimal places
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      return value;
    }
    return e.target.value.slice(0, -1);
  };

  // Validate contact number (10 digits)
  const handleContactNoInput = (e) => {
    const value = e.target.value;
    // Allow only digits and limit to 10 characters
    if (value === '' || /^\d{0,10}$/.test(value)) {
      setContactNo(value);
    }
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

  // Fetch expiry notes of a product for the logged-in store
  const fetchExpiryForProduct = async (productId) => {
    try {
      const response = await fetchProductExpiry(productId);
      return response.data.status === "SUCCESS" ? response.data.payload || [] : [];
    } catch (error) {
      console.error("Error fetching expiry notes:", error);
      return [];
    }
  };

  // Handle product selection
  const handleProductSelect = async (product) => {
    // Fetch packing options and expiry notes for the selected product
    const [packingOptions, expiryOptions] = await Promise.all([
      fetchPackingForProduct(product.productId),
      fetchExpiryForProduct(product.productId),
    ]);
    
    if (packingOptions.length === 0) {
      notify.warning('No packing options available for this product');
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
      packingOptions: packingOptions,
      expiryOptions: expiryOptions,
      expiryId: ''
    };

    setTransferItems([...transferItems, newItem]);
    setShowDropdown(false);
    setSearchKey('');
  };

  // Handle store selection
  const handleStoreSelect = async (storeId) => {
    const store = stores.find(s => s.storeId === parseInt(storeId));
    setSupervisors([]);
    setSelectedSupervisorId('');
    if (store) {
      setSelectedStore(storeId);
      setAvailableUsers(store.userList || []);
      setSelectedUser('');

      // Main store can send straight to a supervisor of a sub store
      if (canSendToSupervisor && store.storeType === 'SUB_STORE') {
        try {
          const response = await fetchSupervisorsByStore(store.storeId);
          setSupervisors(response.data.payload || []);
        } catch (error) {
          console.error('Failed to load supervisors', error);
        }
      }
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
          notify.warning('This product with the same packing size is already added to the transfer list');
          return item;
        }

        const packing = item.packingOptions.find(p => p.packingId === parseInt(value));
        if (packing) {
          const inventory = packing.inventoryList && packing.inventoryList.length > 0 
            ? packing.inventoryList[0] 
            : null;
          
          if (!inventory) {
            notify.warning('No inventory available for this packing');
            return item;
          }

          const maxBags = Math.floor(inventory.availableQuantity / parseFloat(packing.packingSize));
          
          updated.packingId = packing.packingId;
          updated.inventoryId = inventory.inventoryId;
          updated.packingSize = packing.packingSize;
          updated.packingUnit = packing.packingUnit;
          updated.defaultUnit = packing.packingUnit;
          updated.inputUnit = packing.packingUnit; // Default input unit same as packing unit
          if (singleInputType(packing.packingUnit, packing.packingSize)) {
            updated.inputType = 'quantity';
          }
          updated.availableQuantity = inventory.availableQuantity;
          updated.maxBags = maxBags;
          updated.noOfBags = '';
          updated.directQuantity = '';
          updated.quantity = 0;
        }
      }

      if (field === 'inputType') {
        if (singleInputType(item.packingUnit, item.packingSize)) {
          updated.inputType = 'quantity';
        }
        // Reset input values when switching type
        updated.noOfBags = '';
        updated.directQuantity = '';
        updated.quantity = 0;
      }

      if (field === 'noOfBags') {
        // Allow decimal values for bags (up to 2 decimal places)
        const numValue = parseFloat(value) || 0;
        
        // Calculate equivalent bags from available quantity
        const maxBagsFromQuantity = stockToPacks(updated.availableQuantity, updated.packingUnit, updated.packingSize);
        
        if (numValue > maxBagsFromQuantity) {
          notify.warning(`Maximum ${maxBagsFromQuantity.toFixed(2)} ${containerLabel(updated.packingUnit)} available`);
          return item;
        }
        
        updated.noOfBags = value;
        updated.quantity = calculateQuantity(updated);
      }

      if (field === 'directQuantity') {
        const numValue = parseFloat(value) || 0;
        updated.directQuantity = value;
        
        // Calculate quantity in default unit
        const quantityInDefaultUnit = directToStock(updated, numValue, updated.inputUnit);
        
        // Check if exceeds available
        if (quantityInDefaultUnit > updated.availableQuantity) {
          notify.warning(`Maximum available: ${maxDirect(updated)} ${directUnitLabel(updated, updated.inputUnit)}`);
          return item;
        }
        
        updated.quantity = quantityInDefaultUnit;
      }

      if (field === 'inputUnit') {
        // Clear directQuantity when switching units to prevent validation issues
        const previousUnit = item.inputUnit;
        updated.inputUnit = value;
        
        // If switching between units with different decimal rules, clear the input
        if ((isSmallerUnit(previousUnit) !== isSmallerUnit(value)) && updated.directQuantity) {
          updated.directQuantity = '';
          updated.quantity = 0;
        } else if (updated.directQuantity) {
          // Recalculate quantity with new unit
          const quantityInDefaultUnit = directToStock(updated, parseFloat(updated.directQuantity), value);
          
          if (quantityInDefaultUnit > updated.availableQuantity) {
            notify.warning(`Maximum available: ${round3(updated.availableQuantity)} ${getUnitDisplay(updated.defaultUnit)}`);
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
  const handleDelete = async (id) => {
    const confirmed = await confirmAction('Are you sure you want to delete this item?', {
      title: 'Remove item',
      confirmText: 'Delete',
      danger: true,
    });
    if (confirmed) {
      setTransferItems(items => items.filter(item => item.id !== id));
    }
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);

    // Cleanup blob URL to prevent memory leak
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
    }

    setPdfUrl('');
    setPdfBlob(null);
    setTransferId('');
  };

  const handlePrintPdf = () => {
    const iframe = document.getElementById('pdfIframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfBlob) return;

    try {
      // Create download link from already fetched blob
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${transferId}.pdf`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      notify.error("Failed to download invoice. Please try again.");
    }
  };

  // Fetch PDF after successful transfer
  const fetchAndShowPdf = async (newTransferId) => {
    try {
      const response = await downloadTransferPdf(newTransferId);

      // the api returns an error object (not a blob) when the invoice could not be loaded
      if (response.status !== 200 || !(response.data instanceof Blob)) {
        throw new Error(response.data?.message || 'Invoice not available');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Store blob for later download, URL for iframe viewing
      setPdfBlob(blob);
      setPdfUrl(window.URL.createObjectURL(blob));
      setTransferId(newTransferId);
      setShowPdfModal(true);
    } catch (error) {
      console.error('Failed to load PDF:', error);
      notify.error(error.message || 'Failed to load invoice preview. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // ignore double clicks: a second request would deduct the stock twice
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      if (sendToOwnSupervisor) {
        if (!ownSupervisorId) {
          notify.warning("Please select the supervisor");
          return;
        }
      } else {
        if (!selectedStore) {
          notify.warning("Please select a store to transfer to");
          return;
        }

        if (!selectedUser) {
          notify.warning("Please select a user");
          return;
        }

        // transfer to another store goes by vehicle: driver details are required
        if (!driverName.trim()) {
          notify.warning("Please enter driver name");
          return;
        }

        if (!vehicleNo.trim()) {
          notify.warning("Please enter vehicle number");
          return;
        }
      }

      // optional for a supervisor hand over, but must be complete when entered
      if ((!sendToOwnSupervisor || contactNo) && contactNo.length !== 10) {
        notify.warning("Contact number must be 10 digits");
        return;
      }

      if (transferItems.length === 0) {
        notify.warning("Please add at least one item to transfer");
        return;
      }

      // Validate items
      const invalidItems = transferItems.filter(item =>
        !item.packingId ||
        !item.quantity ||
        Number(item.quantity) <= 0
      );

      if (invalidItems.length > 0) {
        notify.warning("Please fill all required fields for all items");
        return;
      }

      // Quantity exceeded check
      const exceededItems = transferItems.filter(
        item => Number(item.quantity) > Number(item.availableQuantity)
      );

      if (exceededItems.length > 0) {
        notify.warning("Some items exceed available quantity");
        return;
      }

      // Get selected user details
      const selectedUserObj = availableUsers.find(
        user => user.userId === selectedUser
      );

      // Build DTO with transfer metadata
      const transferDto = {
        receiverStoreId: Number(selectedStore),
        userId: selectedUser,
        userName: selectedUserObj?.name || "",
        driverName: driverName.trim(),
        vehicleNo: vehicleNo.trim(),
        contactNo: contactNo,
        stockList: transferItems.map(item => {
          // Build transfer metadata
          let transferMetadata;
          
          if (item.inputType === 'bags') {
            // For bags transfer
            // number of bags / bottles (quantity / packing size), or packets of a count unit (the quantity itself)
            const numberOfBags = stockToPacks(item.quantity, item.packingUnit, item.packingSize);
            
            transferMetadata = {
              transferType: 'bags',
              transferUnit: item.packingUnit, // User's packing unit selection (KILOGRAM, GRAM, LITER, MILLILITER)
              weight: `${Number(item.quantity).toFixed(2)} ${item.packingUnit}`,
              unit: String(numberOfBags.toFixed(2)) // Actual number of bags rounded to 2 decimals
            };
          } else {
            // For weight/quantity transfer
            // equivalent bags / bottles / packets
            const equivalentBags = stockToPacks(item.quantity, item.packingUnit, item.packingSize);
            
            transferMetadata = {
              transferType: 'weight',
              transferUnit: item.inputUnit, // User selected unit (KILOGRAM, GRAM, LITER, MILLILITER)
              weight: `${Number(item.directQuantity).toFixed(2)} ${hasLoosePieces(item.packingUnit, item.packingSize) ? PIECES_LABEL : item.inputUnit}`,
              unit: String(equivalentBags.toFixed(2)) // Equivalent bags rounded to 2 decimals
            };
          }

          return {
            inventoryId: Number(item.inventoryId),
            packingId: Number(item.packingId),
            productId: Number(item.productId),
            quantityToTransfer: round3(item.quantity), // Already in default unit, max 3 decimals
            transferMetadata: transferMetadata,
            expiryId: item.expiryId ? Number(item.expiryId) : null
          };
        }),
      };

      // Own supervisor: receiver store is the main store itself -> single OUT entry of the main store
      if (sendToOwnSupervisor) {
        transferDto.receiverStoreId = Number(ownStoreId);
        transferDto.userId = null;
        transferDto.userName = "";
        transferDto.supervisorId = Number(ownSupervisorId);
      }

      // With a sub store supervisor selected: OUT main store -> IN sub store -> OUT to supervisor, all in one request
      if (!sendToOwnSupervisor && selectedSupervisorId) {
        transferDto.supervisorId = Number(selectedSupervisorId);
      }

      console.log("Transfer DTO:", transferDto);

      const response = transferDto.supervisorId
        ? await sendMainStoreToSupervisor(transferDto)
        : await sendProductToStore(transferDto);

      if(response.data.status === "SUCCESS") {
        notify.success(response.data.message || "Stock transferred successfully!");
        setTransferItems([]);
        setSelectedStore("");
        setSelectedUser("");
        setSupervisors([]);
        setSelectedSupervisorId("");
        setOwnSupervisorId("");
        setDriverName("");
        setVehicleNo("");
        setContactNo("");

        // payload is the sender (OUT) transfer id: show its invoice
        if (response.data.payload) {
          fetchAndShowPdf(response.data.payload);
        }
      } else {
        notify.error(response.data.message || "Unable to transfer stock");
      }

    } catch (error) {
      console.error("Transfer failed:", error);
      notify.error(error.message || "Stock transfer failed");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
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
          <h1 className={styles.title}>{ownSupervisorOnly ? 'Out Entry' : 'Stock Transfer'}</h1>
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

        {/* Store / receiver selection (or own supervisor), with the own-supervisor checkbox at the end */}
        <div className={styles.selectionRow}>
          {sendToOwnSupervisor ? (
            <div className={styles.selectGroup}>
              <label className={styles.inputLabel}>
                <UserCheck size={16} />
                Supervisor:
              </label>
              <select
                className={styles.selectInput}
                value={ownSupervisorId}
                onChange={(e) => setOwnSupervisorId(e.target.value)}
                disabled={ownSupervisors.length === 0}
              >
                <option value="">
                  {ownSupervisors.length === 0 ? 'No supervisor in this store' : 'Select supervisor'}
                </option>
                {ownSupervisors.map(supervisor => (
                  <option key={supervisor.supervisorId} value={supervisor.supervisorId}>
                    {supervisor.name} - {supervisor.phoneNumber}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
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

              {canSendToSupervisor && selectedStoreObj?.storeType === 'SUB_STORE' && (
                <div className={styles.selectGroup}>
                  <label className={styles.inputLabel}>
                    <UserCheck size={16} />
                    Supervisor (optional):
                  </label>
                  <select
                    className={styles.selectInput}
                    value={selectedSupervisorId}
                    onChange={(e) => setSelectedSupervisorId(e.target.value)}
                    disabled={!selectedUser || supervisors.length === 0}
                  >
                    <option value="">
                      {supervisors.length === 0 ? 'No supervisor in this store' : 'Deliver to sub store only'}
                    </option>
                    {supervisors.map(supervisor => (
                      <option key={supervisor.supervisorId} value={supervisor.supervisorId}>
                        {supervisor.name} - {supervisor.phoneNumber}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <User size={16} />
              Driver Name:
            </label>
            <input
              type="text"
              className={styles.selectInput}
              placeholder="Enter driver name"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <Car size={16} />
              Vehicle No:
            </label>
            <input
              type="text"
              className={styles.selectInput}
              placeholder="Enter vehicle number"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
            />
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <Phone size={16} />
              Contact No:
            </label>
            <input
              type="text"
              className={styles.selectInput}
              placeholder="Enter 10-digit contact number"
              value={contactNo}
              onChange={handleContactNoInput}
              maxLength={10}
            />
          </div>

          {canSendToSupervisor && !ownSupervisorOnly && (
            <label className={styles.inputLabel} style={{ gap: 8, cursor: 'pointer', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
              <input
                type="checkbox"
                checked={sendToOwnSupervisor}
                onChange={(e) => handleOwnSupervisorToggle(e.target.checked)}
              />
              Send to own supervisor
            </label>
          )}
        </div>

        {sendToOwnSupervisor && ownSupervisorId && (
          <div className={styles.chainInfo}>
            Entry will be created: <strong>OUT {ownSupervisorOnly ? 'sub store' : 'main store'}</strong> to supervisor <strong>{ownSupervisors.find(s => s.supervisorId === Number(ownSupervisorId))?.name}</strong>
          </div>
        )}

        {!sendToOwnSupervisor && selectedSupervisorId && (
          <div className={styles.chainInfo}>
            Entries will be created: <strong>OUT main store</strong> → <strong>IN {selectedStoreObj?.storeName}</strong> → <strong>OUT to supervisor {supervisors.find(s => s.supervisorId === Number(selectedSupervisorId))?.name}</strong>
          </div>
        )}


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
                <th>Expiry</th>
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
                          {round3(item.availableQuantity)} {getUnitDisplay(item.defaultUnit)}
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
                        {!singleInputType(item.packingUnit, item.packingSize) && (
                          <option value="bags">{isCountUnit(item.packingUnit) ? packName(item.packingUnit) : 'Bags/Bottles'}</option>
                        )}
                        <option value="quantity">
                          {hasLoosePieces(item.packingUnit, item.packingSize) ? `Direct Quantity (${PIECES_LABEL.toLowerCase()})` : 'Direct Quantity'}
                        </option>
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
                              const validated = handleNumericInput(e, item, 'noOfBags');
                              updateItem(item.id, 'noOfBags', validated);
                            }}
                            disabled={!item.packingId}
                          />
                          {item.packingId && (
                            <small style={{display: 'block', fontSize: '0.75rem', color: '#666', marginTop: '2px'}}>
                              Max: {stockToPacks(item.availableQuantity, item.packingUnit, item.packingSize).toFixed(2)} {containerLabel(item.packingUnit)}
                            </small>
                          )}
                        </div>
                      ) : (
                        <div style={{display: 'flex', gap: '4px', flexDirection: 'column'}}>
                          <div style={{display: 'flex', gap: '4px'}}>
                            <input
                              type="text"
                              className={styles.tableInput}
                              placeholder="0"
                              value={item.directQuantity}
                              onChange={(e) => {
                                const validated = handleNumericInput(e, item, 'directQuantity');
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
                                  {directUnitLabel(item, unit)}
                                </option>
                              ))}
                            </select>
                          </div>
                          {item.packingId && (
                            <small style={{fontSize: '0.75rem', color: '#666'}}>
                              Max: {maxDirect(item)} {directUnitLabel(item, item.inputUnit)}
                              {hasLoosePieces(item.packingUnit, item.packingSize) && ` · ${item.packingSize} ${PIECES_LABEL.toLowerCase()} = 1 ${getUnitDisplay(item.packingUnit)}`}
                            </small>
                          )}
                          {item.packingId && isSmallerUnit(item.inputUnit) && (
                            <small style={{fontSize: '0.7rem', color: '#ff6b00'}}>
                              Only whole numbers allowed
                            </small>
                          )}
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
                      {(() => {
                        const packingNotes = (item.expiryOptions || []).filter(expiry => !expiry.packingId || expiry.packingId === Number(item.packingId));
                        // earliest note of this packing that expires soon (or already expired)
                        const soonest = item.packingId
                          ? [...packingNotes].sort((a, b) => String(a.expiryDate).localeCompare(String(b.expiryDate))).find(note => isExpiringSoon(note.expiryDate))
                          : null;
                        const selected = packingNotes.find(note => note.expiryId === Number(item.expiryId));
                        return (
                          <>
                            <ExpirySelect
                              className={styles.tableSelect}
                              options={packingNotes}
                              value={item.expiryId}
                              onChange={(value) => updateItem(item.id, 'expiryId', value)}
                              disabled={!item.packingId}
                            />
                            {soonest && !item.expiryId && (
                              <div
                                className={`${styles.expiryHint} ${daysLeft(soonest.expiryDate) < 0 ? styles.expiryHintExpired : ''}`}
                                title={`${formatQuantity(soonest.quantity, soonest.quantityUnit)} ${daysLeft(soonest.expiryDate) < 0 ? 'expired' : 'expiring'} ${expiryText(soonest.expiryDate)}${soonest.rackId ? ` • Rack ${soonest.rackId}` : ''}`}
                              >
                                <span className={styles.expiryHintText}>
                                  {formatQuantity(soonest.quantity, soonest.quantityUnit)} • {expiryLabel(soonest.expiryDate)}
                                </span>
                                <button type="button" onClick={() => updateItem(item.id, 'expiryId', soonest.expiryId)}>Use first</button>
                              </div>
                            )}
                            {selected && isExpiringSoon(selected.expiryDate) && (
                              <small className={styles.expirySelected}>{expiryLabel(selected.expiryDate)} - good, using it first</small>
                            )}
                          </>
                        );
                      })()}
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
                  <td colSpan="9" className={styles.emptyRow}>
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
            disabled={transferItems.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Transferring...' : 'Transfer'}
          </button>
        </div>
      </div>

      {showPdfModal && (
        <div className={styles.modalOverlay} onClick={handleClosePdfModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Transfer Invoice</h2>
              <button
                className={styles.closeButton}
                onClick={handleClosePdfModal}
                title="Close"
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <iframe
                id="pdfIframe"
                src={pdfUrl}
                className={styles.pdfIframe}
                title="Transfer Invoice PDF"
              />
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.printButton}
                onClick={handlePrintPdf}
              >
                Print Invoice
              </button>
              <button
                className={styles.downloadButton}
                onClick={handleDownloadPdf}
              >
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShopTransfer;