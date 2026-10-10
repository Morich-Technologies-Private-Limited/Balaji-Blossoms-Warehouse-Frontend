import { useState, useEffect } from 'react';
import { Package, Trash2, Pencil, CalendarClock } from 'lucide-react';
import styles from './ProductExpiry.module.css';
import { findProducts } from '../../api/findProducts';
import {
  fetchProductExpiry,
  addProductExpiry,
  updateProductExpiry,
  deleteProductExpiry,
  fetchExpiryPackingAvailability,
} from '../../api/productExpiryApi';
import { UNIT_LABEL, unitsFor, formatQuantity, convertUnit, round3, containerLabel, isCountUnit, packsToStock, stockToPacks, packName } from '../utils/units';
import { formatDate } from '../utils/date';
import { getSessionData } from '../utils/getSessionData';
import { useStores } from '../../context/StoreContext';
import { notify, confirmAction } from '../utils/feedback';

// inputType: 'bags' (count x packing size, in packing unit) or 'quantity' (direct amount in quantityUnit)
const EMPTY_FORM = { expiryId: null, productId: '', productName: '', category: '', packingId: '', inputType: 'bags', quantity: '', quantityUnit: '', rackId: '', expiryDate: '' };
const EXPIRING_SOON_DAYS = 30;
const SMALL_UNITS = ['GRAM', 'MILLILITER'];

const daysLeft = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(expiryDate) - today) / (1000 * 60 * 60 * 24));
};

const ProductExpiry = () => {
  const [expiryList, setExpiryList] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchKey, setSearchKey] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [packingOptions, setPackingOptions] = useState([]);
  const [editingNote, setEditingNote] = useState(null);

  // Admin can switch store; managers always work on their own store
  const { role, storeId: sessionStoreId } = getSessionData();
  const isAdmin = role === "ADMIN";
  const { stores } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState(sessionStoreId || '');
  const storeId = isAdmin ? selectedStoreId : undefined;

  const loadExpiryList = async () => {
    try {
      const response = await fetchProductExpiry(undefined, storeId);
      setExpiryList(response.data.status === "SUCCESS" ? response.data.payload || [] : []);
    } catch (error) {
      console.error("Failed to load expiry list", error);
    }
  };

  useEffect(() => {
    loadExpiryList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => {
    const searchProducts = async () => {
      if (!searchKey.trim() || form.expiryId) {
        setFilteredProducts([]);
        return;
      }
      try {
        const response = await findProducts(searchKey);
        setFilteredProducts(response.data.status === "SUCCESS" ? response.data.payload : []);
      } catch {
        setFilteredProducts([]);
      }
    };
    searchProducts();
  }, [searchKey, form.expiryId]);

  // Packings of the selected product with store stock / max quantity allowed on expiry notes
  const loadPackingOptions = async (productId) => {
    try {
      const response = await fetchExpiryPackingAvailability(productId, storeId);
      const options = response.data.payload || [];
      setPackingOptions(options);
      return options;
    } catch (error) {
      notify.error(error.message || "Unable to load packings");
      setPackingOptions([]);
      return [];
    }
  };

  const handleProductSelect = async (product) => {
    setForm(prev => ({
      ...prev,
      productId: product.productId,
      productName: product.productName,
      category: product.category,
      packingId: '',
      quantity: '',
      quantityUnit: '',
    }));
    setSearchKey(product.productName);
    setFilteredProducts([]);
    await loadPackingOptions(product.productId);
  };

  const handlePackingSelect = (packingId) => {
    const packing = packingOptions.find(p => p.packingId === Number(packingId));
    setForm(prev => ({
      ...prev,
      packingId: packing ? packing.packingId : '',
      // count units are noted in packets (their stock unit); KG / L start as bags / bottles
      inputType: 'bags',
      quantity: '',
      quantityUnit: packing ? packing.packingUnit : '',
    }));
  };

  // switching between bags/bottles and direct quantity starts the value again in the packing unit
  const handleInputTypeChange = (inputType) => {
    setForm(prev => ({ ...prev, inputType, quantity: '', quantityUnit: selectedPacking?.packingUnit || prev.quantityUnit }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSearchKey('');
    setPackingOptions([]);
    setEditingNote(null);
  };

  const selectedPacking = packingOptions.find(p => p.packingId === Number(form.packingId));
  const isBags = form.inputType === 'bags';
  const container = containerLabel(selectedPacking?.packingUnit);

  // Unit the note is saved in: bags are always converted to the packing unit
  const noteUnit = isBags ? selectedPacking?.packingUnit : form.quantityUnit;

  // Note quantity in noteUnit, or null when nothing entered
  const noteQuantity = (() => {
    if (form.quantity === '' || !selectedPacking) return null;
    return isBags
      ? round3(packsToStock(form.quantity, selectedPacking.packingUnit, selectedPacking.packingSize))
      : round3(form.quantity);
  })();

  // Max for this note in noteUnit. When editing, the note's own quantity is available again.
  const maxAllowed = (() => {
    if (!selectedPacking || !noteUnit) return null;
    let maxInPackingUnit = selectedPacking.maxQuantity || 0;
    if (form.expiryId && editingNote) {
      maxInPackingUnit += convertUnit(editingNote.quantity, editingNote.quantityUnit || selectedPacking.packingUnit, selectedPacking.packingUnit);
    }
    return round3(convertUnit(maxInPackingUnit, selectedPacking.packingUnit, noteUnit));
  })();

  const maxBags = maxAllowed === null || !selectedPacking
    ? null
    : Math.floor(stockToPacks(maxAllowed, selectedPacking.packingUnit, selectedPacking.packingSize) * 100) / 100;

  const handleQuantityChange = (value) => {
    const wholeOnly = !isBags && SMALL_UNITS.includes(form.quantityUnit);
    const pattern = wholeOnly ? /^\d*$/ : /^\d*\.?\d{0,3}$/;
    if (value !== '' && !pattern.test(value)) return;

    if (value !== '' && maxAllowed !== null) {
      const entered = isBags ? round3(packsToStock(value, selectedPacking.packingUnit, selectedPacking.packingSize)) : round3(value);
      if (entered > maxAllowed) {
        notify.warning(isBags
          ? `Only ${maxBags} ${container} (${formatQuantity(maxAllowed, noteUnit)}) available for this packing`
          : `Only ${formatQuantity(maxAllowed, noteUnit)} available for this packing`);
        return;
      }
    }
    setForm(prev => ({ ...prev, quantity: value }));
  };

  const handleSubmit = async () => {
    if (!form.productId) {
      notify.warning("Please select a product");
      return;
    }
    if (!form.packingId) {
      notify.warning("Please select a packing");
      return;
    }
    if (!noteQuantity || noteQuantity <= 0) {
      notify.warning(isBags ? `Please enter number of ${container}` : "Please enter a valid quantity");
      return;
    }
    if (!noteUnit) {
      notify.warning("Please select quantity unit");
      return;
    }
    if (maxAllowed !== null && noteQuantity > maxAllowed) {
      notify.warning(`Only ${formatQuantity(maxAllowed, noteUnit)} available for this packing`);
      return;
    }
    if (!form.expiryDate) {
      notify.warning("Please select expiry date");
      return;
    }

    const payload = {
      expiryId: form.expiryId,
      productId: Number(form.productId),
      packingId: Number(form.packingId),
      quantity: noteQuantity,
      quantityUnit: noteUnit,
      rackId: form.rackId,
      expiryDate: form.expiryDate,
    };

    try {
      const response = form.expiryId ? await updateProductExpiry(payload, storeId) : await addProductExpiry(payload, storeId);
      if (response.data.status === "SUCCESS") {
        notify.success(response.data.message || (form.expiryId ? "Expiry note updated" : "Expiry note added"));
        resetForm();
        loadExpiryList();
      } else {
        notify.error(response.data.message || "Unable to save expiry");
      }
    } catch (error) {
      notify.error(error.message || "Unable to save expiry");
    }
  };

  const handleEdit = async (expiry) => {
    setEditingNote(expiry);
    setForm({
      expiryId: expiry.expiryId,
      productId: expiry.productId,
      productName: expiry.productName,
      category: '',
      packingId: expiry.packingId || '',
      // existing notes open as a direct quantity in their saved unit
      inputType: 'quantity',
      quantity: String(expiry.quantity),
      quantityUnit: expiry.quantityUnit || expiry.packingUnit || '',
      rackId: expiry.rackId || '',
      expiryDate: expiry.expiryDate,
    });
    setSearchKey(expiry.productName);
    await loadPackingOptions(expiry.productId);
  };

  const handleDelete = async (expiryId) => {
    const confirmed = await confirmAction('Are you sure you want to delete this expiry note?', {
      title: 'Delete expiry note',
      confirmText: 'Delete',
      danger: true,
    });
    if (!confirmed) return;
    try {
      await deleteProductExpiry(expiryId, storeId);
      notify.success('Expiry note deleted');
      if (form.expiryId === expiryId) resetForm();
      loadExpiryList();
    } catch (error) {
      notify.error(error.message || "Unable to delete expiry");
    }
  };

  const visibleList = expiryList.filter(expiry => {
    const key = filterText.trim().toLowerCase();
    if (!key) return true;
    return String(expiry.productId).includes(key)
      || expiry.productName?.toLowerCase().includes(key)
      || expiry.rackId?.toLowerCase().includes(key);
  });

  const statusOf = (expiryDate) => {
    const days = daysLeft(expiryDate);
    if (days < 0) return { label: `Expired ${-days}d ago`, className: styles.expired };
    if (days <= EXPIRING_SOON_DAYS) return { label: `${days}d left`, className: styles.expiringSoon };
    return { label: `${days}d left`, className: styles.ok };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Product Expiry</h1>
          {isAdmin && (
            <select
              className={styles.storeSelect}
              value={selectedStoreId}
              onChange={(e) => {
                setSelectedStoreId(e.target.value);
                resetForm();
              }}
            >
              {stores.map(store => (
                <option key={store.storeId} value={store.storeId}>{store.storeName}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Add / Edit form */}
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>
            {form.expiryId ? <Pencil size={16} /> : <CalendarClock size={16} />}
            {form.expiryId ? `Edit expiry note - ${form.productName}` : 'Add expiry note'}
          </h2>

          <div className={styles.formGroup}>
            <label className={styles.label}>Product</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Search by item code or name"
              value={searchKey}
              disabled={!!form.expiryId}
              onChange={(e) => {
                setSearchKey(e.target.value);
                setForm(prev => ({ ...prev, productId: '', productName: '', category: '', packingId: '', quantityUnit: '' }));
                setPackingOptions([]);
              }}
            />
            {filteredProducts.length > 0 && (
              <div className={styles.dropdown}>
                {filteredProducts.map(product => (
                  <div key={product.productId} className={styles.dropdownItem} onClick={() => handleProductSelect(product)}>
                    {product.productId} - {product.productName}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Packing</label>
            <select
              className={styles.input}
              value={form.packingId}
              onChange={(e) => handlePackingSelect(e.target.value)}
              disabled={!form.productId || (!!form.expiryId && !!editingNote?.packingId)}
            >
              <option value="">{form.productId ? 'Select packing' : 'Select product first'}</option>
              {packingOptions.map(packing => (
                <option key={packing.packingId} value={packing.packingId}>
                  {packing.packingSize} {UNIT_LABEL[packing.packingUnit]} (stock {formatQuantity(packing.availableQuantity, packing.packingUnit)})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Enter as</label>
            <select
              className={styles.input}
              value={form.inputType}
              onChange={(e) => handleInputTypeChange(e.target.value)}
              disabled={!form.packingId}
            >
              {/* count units: packets only (2.5 packets); KG / L: bags / bottles or a direct quantity */}
              <option value="bags">{isCountUnit(selectedPacking?.packingUnit) ? packName(selectedPacking.packingUnit) : 'Bags/Bottles'}</option>
              {!isCountUnit(selectedPacking?.packingUnit) && <option value="quantity">Direct Quantity</option>}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{isBags ? `No. of ${container}` : 'Quantity'}</label>
            <div className={styles.qtyRow}>
              <input
                type="text"
                className={styles.input}
                placeholder="0"
                value={form.quantity}
                disabled={!form.packingId || maxAllowed === 0}
                onChange={(e) => handleQuantityChange(e.target.value)}
              />
              {isBags ? (
                <span className={styles.qtySuffix}>{form.packingId ? container : ''}</span>
              ) : (
                <select
                  className={`${styles.input} ${styles.unitSelect}`}
                  value={form.quantityUnit}
                  onChange={(e) => setForm(prev => ({ ...prev, quantityUnit: e.target.value, quantity: '' }))}
                  disabled={!form.packingId}
                >
                  {unitsFor(form.category, selectedPacking?.packingUnit || form.quantityUnit).map(unit => (
                    <option key={unit} value={unit}>{UNIT_LABEL[unit]}</option>
                  ))}
                </select>
              )}
            </div>
            {maxAllowed !== null && (
              <small className={maxAllowed > 0 ? styles.hint : styles.hintError}>
                {maxAllowed <= 0
                  ? 'No stock available for expiry note'
                  : isBags
                    ? `Max: ${maxBags} ${container}${noteQuantity ? ` · = ${formatQuantity(noteQuantity, noteUnit)}` : ''}`
                    : `Max: ${formatQuantity(maxAllowed, noteUnit)}`}
              </small>
            )}
            {!isBags && form.packingId && SMALL_UNITS.includes(form.quantityUnit) && (
              <small className={styles.hint}>Only whole numbers allowed</small>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Rack ID</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. R-12"
              value={form.rackId}
              onChange={(e) => setForm(prev => ({ ...prev, rackId: e.target.value }))}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Expiry Date</label>
            <input
              type="date"
              className={styles.input}
              value={form.expiryDate}
              onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
            />
          </div>

          <div className={styles.formActions}>
            <button className={styles.primaryBtn} onClick={handleSubmit}>
              {form.expiryId ? 'Update' : 'Add'}
            </button>
            {(form.expiryId || form.productId) && (
              <button className={styles.secondaryBtn} onClick={resetForm}>Cancel</button>
            )}
          </div>
        </div>

        {/* List */}
        <div className={styles.tableCard}>
          <div className={styles.tableToolbar}>
            <CalendarClock size={18} />
            <span>{visibleList.length} expiry note(s)</span>
            <input
              type="text"
              className={styles.filterInput}
              placeholder="Filter by item code, name or rack"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Packing</th>
                  <th>Quantity</th>
                  <th>Rack ID</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleList.length > 0 ? (
                  visibleList.map(expiry => {
                    const status = statusOf(expiry.expiryDate);
                    return (
                      <tr key={expiry.expiryId}>
                        <td>{expiry.productId}</td>
                        <td>{expiry.productName}</td>
                        <td>{expiry.packingSize ? `${expiry.packingSize} ${UNIT_LABEL[expiry.packingUnit] || ''}` : '-'}</td>
                        <td>{formatQuantity(expiry.quantity, expiry.quantityUnit)}</td>
                        <td>{expiry.rackId || '-'}</td>
                        <td>{formatDate(expiry.expiryDate)}</td>
                        <td><span className={`${styles.badge} ${status.className}`}>{status.label}</span></td>
                        <td>
                          <button className={styles.iconBtn} onClick={() => handleEdit(expiry)} title="Edit">
                            <Pencil size={16} />
                          </button>
                          <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(expiry.expiryId)} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className={styles.emptyRow}>
                      <Package size={40} />
                      <p>No expiry notes found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductExpiry;
