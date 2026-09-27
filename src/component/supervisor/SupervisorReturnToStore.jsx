import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Package, Trash2, Plus, User, UserCheck, Phone, Building2, Truck, RefreshCw } from 'lucide-react';
// Same layout as the supervisor to supervisor screen, so the stylesheet is shared
import styles from './SupervisorInternalTransfer.module.css';
import { getSessionData } from '../utils/getSessionData';
import { fetchStoresWithUserApi } from '../../api/findStoreAndEmployee';
import { findSupervisorInventory } from '../../api/findSupervisorInventory';
import { returnStockToStore } from '../../api/returnStockToStore';

/**
 * SupervisorReturnToStore - supervisor hands stock back to their own store.
 *
 * Flow:
 *   1. Load the logged in supervisor's own inventory (findSupervisorInventory).
 *   2. Supervisor picks the store the stock goes back to and, from that store's
 *      user list, who receives it (plus optional driver / vehicle details).
 *      Stores and their users both come from /store/find/all-store/user.
 *   3. Supervisor adds rows to a return list and enters a quantity
 *      (either in bags/bottles or as a direct weight/volume).
 *   4. Submit posts a TransferDto to /supervisor/return-to-store.
 *
 * Same picking flow as SupervisorInternalTransfer, but the destination is a
 * store rather than another supervisor, so the body is TransferDto.
 *
 * React Native port notes:
 *   - The api/ layer needs no change; only getSessionData() moves from
 *     sessionStorage to AsyncStorage (it becomes async, so await it in an effect).
 *   - <table> has no RN equivalent: render each table as a <FlatList> whose row
 *     is a <View style={{flexDirection:'row'}}> of <Text> cells.
 *   - <input> -> <TextInput>, <select> -> @react-native-picker/picker.
 *   - alert() -> Alert.alert(); window.confirm() -> Alert.alert with two buttons + callback.
 */
const SupervisorReturnToStore = () => {
  const [stores, setStores] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [returnItems, setReturnItems] = useState([]);

  // TransferDto header fields
  const [receiverStoreId, setReceiverStoreId] = useState('');
  const [receiverUserId, setReceiverUserId] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');

  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionDataRef = useRef(null);

  if (!sessionDataRef.current) {
    sessionDataRef.current = getSessionData();
  }

  // Sender is always the logged in supervisor, taken from the saved login data
  const { user, storeId: sessionStoreId } = sessionDataRef.current;
  const senderId = user?.userId || '';
  const senderName = user?.name || '';

  useEffect(() => {
    loadInventory();
    loadStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * GET /store/find/all-store/user - StoreDto[] with the users of each store,
   * so the same call feeds both the store and the receiver dropdowns.
   */
  const loadStores = async () => {
    try {
      const response = await fetchStoresWithUserApi();

      if (response.data.status === "SUCCESS") {
        const storeList = response.data.payload || [];
        setStores(storeList);

        // Default the destination to the supervisor's own store, still changeable
        const ownStore = storeList.find(
          store => String(store.storeId) === String(sessionStoreId)
        );

        if (ownStore) {
          setReceiverStoreId(String(ownStore.storeId));
        }
      } else {
        setStores([]);
      }
    } catch (err) {
      console.error("Failed to load stores", err);
      setStores([]);
    }
  };

  // Users of the selected store, used for the receiver dropdown
  const receiverOptions = useMemo(() => {
    const store = stores.find(
      s => String(s.storeId) === String(receiverStoreId)
    );
    return store?.userList || [];
  }, [stores, receiverStoreId]);

  const handleStoreChange = (storeId) => {
    setReceiverStoreId(storeId);
    // The previous receiver belongs to the previous store
    setReceiverUserId('');
    setContactNo('');
  };

  // Contact number comes with the user, so fill it in on selection
  const handleReceiverChange = (userId) => {
    setReceiverUserId(userId);

    const receiver = receiverOptions.find(
      u => String(u.userId) === String(userId)
    );

    setContactNo(receiver?.contactNumber || '');
  };

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

  // Return quantity in the stored unit, from either input mode
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

  // Inventory rows not already in the return list, filtered by the search box
  const availableInventory = useMemo(() => {
    const addedIds = new Set(returnItems.map(item => item.inventoryId));

    return inventory.filter(row =>
      !addedIds.has(row.inventoryId) &&
      row.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, returnItems, searchTerm]);

  const handleAddItem = (row) => {
    if (!row.availableQuantity || row.availableQuantity <= 0) {
      alert("No stock available for this item");
      return;
    }

    setReturnItems(items => [
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
    setReturnItems(items => items.map(item => {
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
    if (window.confirm('Remove this item from the return?')) {
      setReturnItems(items => items.filter(item => item.inventoryId !== inventoryId));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!receiverStoreId) {
        alert("Please select the store to return the stock to");
        return;
      }

      if (!receiverUserId) {
        alert("Please select who receives the stock");
        return;
      }

      if (!contactNo.trim()) {
        alert("Please enter the receiver's mobile number");
        return;
      }

      if (returnItems.length === 0) {
        alert("Please add at least one item to return");
        return;
      }

      const invalidItems = returnItems.filter(
        item => !item.quantity || Number(item.quantity) <= 0
      );

      if (invalidItems.length > 0) {
        alert("Please enter a quantity for all items");
        return;
      }

      const exceededItems = returnItems.filter(
        item => Number(item.quantity) > Number(item.availableQuantity)
      );

      if (exceededItems.length > 0) {
        alert("Some items exceed available quantity");
        return;
      }

      const receiver = receiverOptions.find(
        u => String(u.userId) === String(receiverUserId)
      );

      const returnDto = {
        receiverStoreId: Number(receiverStoreId),
        supervisorId: senderId,          // who is returning the stock
        userId: receiverUserId,          // who accepts it at the store
        receiverName: receiver ? receiver.name : '',
        contactNo: contactNo,
        driverName: driverName,
        vehicleNo: vehicleNo,
        stockList: returnItems.map(item => {
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
      const response = await returnStockToStore(returnDto);

      if (response.data.status === "SUCCESS") {
        alert(response.data.message || "Stock returned successfully!");
        setReturnItems([]);
        setReceiverUserId("");
        setContactNo("");
        setDriverName("");
        setVehicleNo("");
        loadInventory(); // quantities changed, pull the fresh stock
      } else {
        alert(response.data.message || "Unable to return stock");
      }

    } catch (error) {
      console.error("Return failed:", error);
      alert(error.message || "Stock return failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalBags = returnItems.reduce((sum, item) => {
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
          <h1 className={styles.title}>Return Stock to Store</h1>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Who is returning and where it goes */}
        <div className={styles.selectionRow}>
          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <User size={16} />
              Supervisor:
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
              <Building2 size={16} />
              Return To Store:
            </label>
            <select
              className={styles.selectInput}
              value={receiverStoreId}
              onChange={(e) => handleStoreChange(e.target.value)}
            >
              <option value="">Select store</option>
              {stores.map(store => (
                <option key={store.storeId} value={store.storeId}>
                  {store.storeName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <UserCheck size={16} />
              Receiver:
            </label>
            <select
              className={styles.selectInput}
              value={receiverUserId}
              onChange={(e) => handleReceiverChange(e.target.value)}
              disabled={!receiverOptions.length}
            >
              <option value="">
                {receiverStoreId
                  ? receiverOptions.length
                    ? 'Select receiver'
                    : 'No users in this store'
                  : 'Select a store first'}
              </option>
              {receiverOptions.map(receiver => (
                <option key={receiver.userId} value={receiver.userId}>
                  {receiver.name}
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
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value)}
            />
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <Truck size={16} />
              Driver Name:
            </label>
            <input
              type="text"
              className={styles.selectInput}
              placeholder="Optional"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>
              <Truck size={16} />
              Vehicle No:
            </label>
            <input
              type="text"
              className={styles.selectInput}
              placeholder="Optional"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
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
                          title="Add to return"
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
                            ? 'All matching items are already added to the return.'
                            : 'You are not holding any stock right now.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step 2 - what is going back to the store */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Return List</h2>
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
                  <th>Return Qty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {returnItems.length > 0 ? (
                  returnItems.map((item) => (
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
            <span className={styles.totalValue}>{returnItems.length}</span>
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
            disabled={returnItems.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Returning...' : 'Return to Store'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupervisorReturnToStore;
