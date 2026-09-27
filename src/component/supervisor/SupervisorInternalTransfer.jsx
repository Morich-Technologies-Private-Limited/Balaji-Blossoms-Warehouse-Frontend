import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Package, Trash2, Plus, User, UserCheck, Phone, Building2, RefreshCw } from 'lucide-react';
import styles from './SupervisorInternalTransfer.module.css';
import { useStores } from '../../context/StoreContext';
import { getSessionData } from '../utils/getSessionData';
import { findSupervisorInventory } from '../../api/findSupervisorInventory';
import { findSupervisors } from '../../api/findSupervisors';
import { transferBetweenSupervisors } from '../../api/transferBetweenSupervisors';

/**
 * SupervisorInternalTransfer - supervisor to supervisor stock transfer.
 *
 * Flow:
 *   1. Load the logged in supervisor's own inventory (findSupervisorInventory).
 *   2. Supervisor picks the receiving store, which loads that store's supervisors
 *      (findSupervisors) into the receiver dropdown.
 *   3. Supervisor adds inventory rows to a transfer list and enters a quantity
 *      (either in bags/bottles or as a direct weight/volume).
 *   4. Submit posts a StockTransferSupervisorDto to /supervisor/transfer-between-supervisors.
 *
 * React Native port notes:
 *   - The api/ layer needs no change; only getSessionData() moves from
 *     sessionStorage to AsyncStorage (it becomes async, so await it in an effect).
 *   - <table> has no RN equivalent: render each table as a <FlatList> whose row
 *     is a <View style={{flexDirection:'row'}}> of <Text> cells.
 *   - <input> -> <TextInput> (keyboardType="numeric" replaces the regex guards below,
 *     but keep the guards, RN's numeric keyboard still allows pasted text).
 *   - <select> -> @react-native-picker/picker.
 *   - alert() -> Alert.alert(); window.confirm() -> Alert.alert with two buttons + callback.
 *   - The CSS module maps to StyleSheet.create; the layout is already flex based.
 */
const SupervisorInternalTransfer = () => {
  const { stores, loadStores } = useStores();

  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [transferItems, setTransferItems] = useState([]);

  const [receiverStoreId, setReceiverStoreId] = useState('');
  const [supervisors, setSupervisors] = useState([]);
  const [receiverSupervisorId, setReceiverSupervisorId] = useState('');
  const [receiverContactNo, setReceiverContactNo] = useState('');

  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [isLoadingSupervisors, setIsLoadingSupervisors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionDataRef = useRef(null);

  if (!sessionDataRef.current) {
    sessionDataRef.current = getSessionData();
  }

  // Sender is always the logged in supervisor, taken from the saved login data
  const { user, storeId: sessionStoreId } = sessionDataRef.current;
  const senderId = user?.userId || '';
  const senderName = user?.name || '';

  const [mobileNo, setMobileNo] = useState(user?.contactNumber || '');

  useEffect(() => {
    loadInventory();

    // Store list is loaded at login and cached; pull it if this is a fresh tab
    if (!stores?.length) {
      loadStores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default the receiving store to the supervisor's own store, still changeable
  useEffect(() => {
    if (receiverStoreId || !stores?.length) return;

    const ownStore = stores.find(
      store => String(store.storeId) === String(sessionStoreId)
    );

    if (ownStore) {
      setReceiverStoreId(String(ownStore.storeId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores]);

  // Receiver list always follows the selected store
  useEffect(() => {
    if (!receiverStoreId) return;
    loadSupervisors(receiverStoreId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiverStoreId]);

  // Name of the store the stock is being handed over in
  const receiverStoreName = useMemo(() => {
    const store = (stores || []).find(
      s => String(s.storeId) === String(receiverStoreId)
    );
    return store ? store.storeName : '';
  }, [stores, receiverStoreId]);

  /**
   * ProductDto[] is nested product -> packing -> inventory. The tables need one
   * row per inventory record, so flatten it once here.
   */
  const flattenInventory = (productList) => {
    const rows = [];

    (productList || []).forEach(product => {
      (product.packingList || []).forEach(packing => {
        (packing.inventoryList || []).forEach(inventory => {
          rows.push({
            inventoryId: inventory.inventoryId,
            packingId: packing.packingId,
            productId: product.productId,
            productName: product.productName,
            category: product.category,
            packingSize: packing.packingSize,
            packingUnit: packing.packingUnit,
            availableQuantity: inventory.availableQuantity,
            storeName: inventory.storeName,
          });
        });
      });
    });

    return rows;
  };

  const loadInventory = async () => {
    if (!senderId) return;

    try {
      setIsLoadingInventory(true);
      const response = await findSupervisorInventory(senderId);

      if (response.data.status === "SUCCESS") {
        setInventory(flattenInventory(response.data.payload));
      } else {
        // NOT_FOUND simply means the supervisor is holding no stock
        setInventory([]);
      }
    } catch (err) {
      console.error("Failed to load supervisor inventory", err);
      alert(err.message || "Error fetching your inventory");
    } finally {
      setIsLoadingInventory(false);
    }
  };

  const loadSupervisors = async (storeId) => {
    if (!storeId) return;

    try {
      setIsLoadingSupervisors(true);
      setSupervisors([]);
      setReceiverSupervisorId('');
      setReceiverContactNo('');

      const response = await findSupervisors(storeId);

      if (response.data.status === "SUCCESS") {
        setSupervisors(response.data.payload || []);
      } else {
        setSupervisors([]);
      }
    } catch (err) {
      console.error("Failed to load supervisors", err);
      setSupervisors([]);
    } finally {
      setIsLoadingSupervisors(false);
    }
  };

  // Stock cannot be transferred to yourself (only possible in your own store)
  const receiverOptions = useMemo(
    () => supervisors.filter(s => String(s.supervisorId) !== String(senderId)),
    [supervisors, senderId]
  );

  // Contact number comes with the supervisor, so fill it in on selection
  const handleReceiverChange = (supervisorId) => {
    setReceiverSupervisorId(supervisorId);

    const supervisor = receiverOptions.find(
      s => String(s.supervisorId) === String(supervisorId)
    );

    setReceiverContactNo(supervisor?.contactNumber || '');
  };

  // Display short unit (KILOGRAM -> KG)
  const getUnitDisplay = (unit) => {
    const unitMap = {
      'KILOGRAM': 'KG',
      'GRAM': 'G',
      'LITER': 'L',
      'MILLILITER': 'ML'
    };
    return unitMap[unit] || unit;
  };

  // GRAM / MILLILITER are the sub units of the stored KILOGRAM / LITER
  const isSmallerUnit = (unit) => {
    return unit === 'GRAM' || unit === 'MILLILITER';
  };

  // Inventory is stored in the packing's own unit, so convert the typed value to it
  const convertToDefaultUnit = (quantity, fromUnit, defaultUnit) => {
    if (!quantity) return 0;

    const value = parseFloat(quantity);

    if (defaultUnit === 'KILOGRAM') {
      if (fromUnit === 'GRAM') {
        return value / 1000;
      }
      return value;
    }

    if (defaultUnit === 'LITER') {
      if (fromUnit === 'MILLILITER') {
        return value / 1000;
      }
      return value;
    }

    return value;
  };

  const getAvailableUnits = (defaultUnit) => {
    if (defaultUnit === 'KILOGRAM') {
      return ['KILOGRAM', 'GRAM'];
    }
    if (defaultUnit === 'LITER') {
      return ['LITER', 'MILLILITER'];
    }
    return [defaultUnit];
  };

  // Transfer quantity in the stored unit, from either input mode
  const calculateQuantity = (item) => {
    if (item.inputType === 'bags') {
      if (!item.noOfBags || !item.packingSize) return 0;
      return parseFloat(item.noOfBags) * parseFloat(item.packingSize);
    }

    if (!item.directQuantity) return 0;
    return convertToDefaultUnit(item.directQuantity, item.inputUnit, item.defaultUnit);
  };

  /**
   * Keeps the raw text input numeric.
   * Bags and KG/L allow 2 decimals, G/ML are whole numbers only.
   * RN note: keep this even with keyboardType="numeric".
   */
  const handleNumericInput = (e, item = null, field = null) => {
    const value = e.target.value;

    if (field === 'noOfBags') {
      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
        return value;
      }
      return e.target.value.slice(0, -1);
    }

    if (field === 'directQuantity' && item && isSmallerUnit(item.inputUnit)) {
      if (value === '' || /^\d+$/.test(value)) {
        return value;
      }
      return e.target.value.slice(0, -1);
    }

    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      return value;
    }
    return e.target.value.slice(0, -1);
  };

  // Inventory rows not already in the transfer list, filtered by the search box
  const availableInventory = useMemo(() => {
    const addedIds = new Set(transferItems.map(item => item.inventoryId));

    return inventory.filter(row =>
      !addedIds.has(row.inventoryId) &&
      row.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, transferItems, searchTerm]);

  const handleAddItem = (row) => {
    if (!row.availableQuantity || row.availableQuantity <= 0) {
      alert("No stock available for this item");
      return;
    }

    setTransferItems(items => [
      ...items,
      {
        ...row,
        // inventoryId is unique per row, so it doubles as the list key
        inputType: 'bags',
        noOfBags: '',
        directQuantity: '',
        inputUnit: row.packingUnit,
        defaultUnit: row.packingUnit,
        quantity: 0,
      }
    ]);
  };

  const updateItem = (inventoryId, field, value) => {
    setTransferItems(items => items.map(item => {
      if (item.inventoryId !== inventoryId) return item;

      const updated = { ...item, [field]: value };

      if (field === 'inputType') {
        // Reset input values when switching type
        updated.noOfBags = '';
        updated.directQuantity = '';
        updated.quantity = 0;
      }

      if (field === 'noOfBags') {
        const numValue = parseFloat(value) || 0;
        const maxBags = updated.availableQuantity / parseFloat(updated.packingSize);

        if (numValue > maxBags) {
          alert(`Maximum ${maxBags.toFixed(2)} bags available`);
          return item;
        }

        updated.noOfBags = value;
        updated.quantity = calculateQuantity(updated);
      }

      if (field === 'directQuantity') {
        const numValue = parseFloat(value) || 0;
        updated.directQuantity = value;

        const quantityInDefaultUnit = convertToDefaultUnit(numValue, updated.inputUnit, updated.defaultUnit);

        if (quantityInDefaultUnit > updated.availableQuantity) {
          alert(`Maximum available: ${updated.availableQuantity} ${getUnitDisplay(updated.defaultUnit)}`);
          return item;
        }

        updated.quantity = quantityInDefaultUnit;
      }

      if (field === 'inputUnit') {
        const previousUnit = item.inputUnit;
        updated.inputUnit = value;

        // Switching between whole number and decimal units invalidates the typed value
        if ((isSmallerUnit(previousUnit) !== isSmallerUnit(value)) && updated.directQuantity) {
          updated.directQuantity = '';
          updated.quantity = 0;
        } else if (updated.directQuantity) {
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

  const handleDelete = (inventoryId) => {
    // RN note: replace with Alert.alert(title, msg, [{text:'Cancel'},{text:'OK', onPress}])
    if (window.confirm('Remove this item from the transfer?')) {
      setTransferItems(items => items.filter(item => item.inventoryId !== inventoryId));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!receiverStoreId) {
        alert("Please select the receiving store");
        return;
      }

      if (!receiverSupervisorId) {
        alert("Please select the receiving supervisor");
        return;
      }

      if (!receiverContactNo.trim()) {
        alert("Please enter the receiver's mobile number");
        return;
      }

      if (transferItems.length === 0) {
        alert("Please add at least one item to transfer");
        return;
      }

      const invalidItems = transferItems.filter(
        item => !item.quantity || Number(item.quantity) <= 0
      );

      if (invalidItems.length > 0) {
        alert("Please enter a quantity for all items");
        return;
      }

      const exceededItems = transferItems.filter(
        item => Number(item.quantity) > Number(item.availableQuantity)
      );

      if (exceededItems.length > 0) {
        alert("Some items exceed available quantity");
        return;
      }

      const receiver = receiverOptions.find(
        s => String(s.supervisorId) === String(receiverSupervisorId)
      );

      const transferDto = {
        supervisorId: senderId,
        supervisorName: senderName,
        contactNo: mobileNo,
        receiverSupervisorId: receiverSupervisorId,
        receiverSupervisorName: receiver ? receiver.name : '',
        receiverContactNo: receiverContactNo,
        storeName: receiverStoreName,
        stockList: transferItems.map(item => {
          // transferMetadata records what the user actually typed, so the slip
          // can show "5 bags" or "500 G" instead of only the converted value
          let transferMetadata;

          if (item.inputType === 'bags') {
            const numberOfBags = item.quantity / parseFloat(item.packingSize);

            transferMetadata = {
              transferType: 'bags',
              transferUnit: item.packingUnit,
              weight: `${Number(item.quantity).toFixed(2)} ${item.packingUnit}`,
              unit: String(numberOfBags.toFixed(2))
            };
          } else {
            const equivalentBags = item.quantity / parseFloat(item.packingSize);

            transferMetadata = {
              transferType: 'weight',
              transferUnit: item.inputUnit,
              weight: `${Number(item.directQuantity).toFixed(2)} ${item.inputUnit}`,
              unit: String(equivalentBags.toFixed(2))
            };
          }

          return {
            inventoryId: Number(item.inventoryId),
            packingId: Number(item.packingId),
            productId: Number(item.productId),
            quantityToTransfer: Number(item.quantity), // always in the packing's own unit
            transferMetadata: transferMetadata
          };
        }),
      };

      setIsSubmitting(true);
      const response = await transferBetweenSupervisors(transferDto);

      if (response.data.status === "SUCCESS") {
        alert(response.data.message || "Stock transferred successfully!");
        setTransferItems([]);
        setReceiverSupervisorId("");
        setReceiverContactNo("");
        loadInventory(); // quantities changed, pull the fresh stock
      } else {
        alert(response.data.message || "Unable to transfer stock");
      }

    } catch (error) {
      console.error("Transfer failed:", error);
      alert(error.message || "Stock transfer failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalBags = transferItems.reduce((sum, item) => {
    if (item.inputType === 'bags') {
      return sum + (parseFloat(item.noOfBags) || 0);
    }
    return sum;
  }, 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Supervisor to Supervisor Transfer</h1>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Sender (logged in supervisor) and receiver details */}
        <div className={styles.selectionRow}>
          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <User size={16} />
              Sender:
            </label>
            <input
              type="text"
              className={styles.textInput}
              value={senderName}
              readOnly
            />
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <Phone size={16} />
              Sender Mobile No:
            </label>
            <input
              type="text"
              className={styles.selectInput}
              placeholder="Enter mobile number"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
            />
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <Building2 size={16} />
              Receiver Store:
            </label>
            <select
              className={styles.selectInput}
              value={receiverStoreId}
              onChange={(e) => setReceiverStoreId(e.target.value)}
            >
              <option value="">Select store</option>
              {(stores || []).map(store => (
                <option key={store.storeId} value={store.storeId}>
                  {store.storeName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <UserCheck size={16} />
              Receiver Supervisor:
            </label>
            <select
              className={styles.selectInput}
              value={receiverSupervisorId}
              onChange={(e) => handleReceiverChange(e.target.value)}
              disabled={isLoadingSupervisors || !receiverOptions.length}
            >
              <option value="">
                {isLoadingSupervisors
                  ? 'Loading supervisors...'
                  : receiverOptions.length
                    ? 'Select supervisor'
                    : 'No other supervisors found'}
              </option>
              {receiverOptions.map(supervisor => (
                <option key={supervisor.supervisorId} value={supervisor.supervisorId}>
                  {supervisor.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <Phone size={16} />
              Receiver Mobile No:
            </label>
            <input
              type="text"
              className={styles.selectInput}
              placeholder="Enter mobile number"
              value={receiverContactNo}
              onChange={(e) => setReceiverContactNo(e.target.value)}
            />
          </div>
        </div>

        {/* Step 1 - the supervisor's own stock */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>My Inventory</h2>

            <div className={styles.panelActions}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                className={styles.refreshBtn}
                onClick={loadInventory}
                disabled={isLoadingInventory}
                title="Refresh inventory"
              >
                <RefreshCw size={16} className={isLoadingInventory ? styles.spinning : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Packing Size</th>
                  <th>Available</th>
                  <th>Bags/Bottles</th>
                  <th>Add</th>
                </tr>
              </thead>
              <tbody>
                {availableInventory.length > 0 ? (
                  availableInventory.map((row) => (
                    <tr key={row.inventoryId}>
                      <td>{row.productId}</td>
                      <td>{row.productName}</td>
                      <td>{row.packingSize} {getUnitDisplay(row.packingUnit)}</td>
                      <td>{row.availableQuantity} {getUnitDisplay(row.packingUnit)}</td>
                      <td>{(row.availableQuantity / parseFloat(row.packingSize)).toFixed(2)}</td>
                      <td>
                        <button
                          className={styles.addBtn}
                          onClick={() => handleAddItem(row)}
                          title="Add to transfer"
                        >
                          <Plus size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={styles.emptyRow}>
                      <Package size={40} />
                      <p>
                        {isLoadingInventory
                          ? 'Loading your inventory...'
                          : inventory.length
                            ? 'All matching items are already added to the transfer.'
                            : 'You are not holding any stock right now.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step 2 - what is being handed over */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Transfer List</h2>
          </div>

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
                    <tr key={item.inventoryId}>
                      <td>{item.productId}</td>
                      <td>{item.productName}</td>
                      <td>{item.packingSize} {getUnitDisplay(item.packingUnit)}</td>
                      <td>
                        <div className={styles.availableText}>
                          {item.availableQuantity} {getUnitDisplay(item.defaultUnit)}
                        </div>
                      </td>

                      <td>
                        <select
                          className={styles.tableSelect}
                          value={item.inputType}
                          onChange={(e) => updateItem(item.inventoryId, 'inputType', e.target.value)}
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
                                const validated = handleNumericInput(e, item, 'noOfBags');
                                updateItem(item.inventoryId, 'noOfBags', validated);
                              }}
                            />
                            <small className={styles.hintText}>
                              Max: {(item.availableQuantity / parseFloat(item.packingSize)).toFixed(2)} bags
                            </small>
                          </div>
                        ) : (
                          <div className={styles.quantityInputGroup}>
                            <div className={styles.quantityInputRow}>
                              <input
                                type="text"
                                className={styles.tableInput}
                                placeholder="0"
                                value={item.directQuantity}
                                onChange={(e) => {
                                  const validated = handleNumericInput(e, item, 'directQuantity');
                                  updateItem(item.inventoryId, 'directQuantity', validated);
                                }}
                              />
                              <select
                                className={styles.unitSelect}
                                value={item.inputUnit}
                                onChange={(e) => updateItem(item.inventoryId, 'inputUnit', e.target.value)}
                              >
                                {getAvailableUnits(item.defaultUnit).map(unit => (
                                  <option key={unit} value={unit}>
                                    {getUnitDisplay(unit)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {isSmallerUnit(item.inputUnit) && (
                              <small className={styles.warnText}>
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
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(item.inventoryId)}
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
                      <Package size={40} />
                      <p>No items added yet. Add products from your inventory above.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
              <span className={styles.totalValue}>{totalBags.toFixed(2)}</span>
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
    </div>
  );
};

export default SupervisorInternalTransfer;
