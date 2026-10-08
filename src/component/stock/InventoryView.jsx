import React, { useState, useMemo, useEffect, useRef } from 'react';
import styles from './InventoryView.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useStores } from "../../context/StoreContext";
import { getSessionData } from '../utils/getSessionData';
import { fetchStoreProducts, fetchInventoryItems, groupItemsByProduct, INVENTORY_BATCH_SIZE } from '../../api/storeInventoryApi';
import { notify } from '../utils/feedback';
import { round3, isCountUnit } from '../utils/units';


const InventoryView = () => {
  const {stores} = useStores();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [allStores, setAllStores] = useState([]);
  const [defaultStore, setDefaultStore] = useState(null);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  
  // Filter states
  const [sortBy, setSortBy] = useState('none');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  // background loading of quantities: { loaded, total } products
  const [quantityProgress, setQuantityProgress] = useState(null);
  const requestIdRef = useRef(0); // ignore results of an older store / refresh

  const initRef = useRef(false);
  const sessionDataRef = useRef(null);
  const hasCalledApiRef = useRef(false);

  if (!sessionDataRef.current) {
    sessionDataRef.current = getSessionData();
  }

  const { role } = sessionDataRef.current;
  const isAdmin = role === "ADMIN";

  useEffect(() => {
    if (initRef.current || !stores?.length) return;    
    initRef.current = true;
    setAllStores(stores);

    const defaultOne = stores.find(
      (store) => store.tag === "DEFAULT"
    );

    setDefaultStore(defaultOne || null);
    setSelectedStore(defaultOne?.storeId || null);
  }, [stores]);

  useEffect(() => {
    if (selectedStore && !hasCalledApiRef.current) {
      hasCalledApiRef.current = true;
      fetchInventory(selectedStore);
    }
  }, [selectedStore]);

  // 1. product master (fast, shown immediately)  2. packings + quantities in batches in the background
  const fetchInventory = async (storeId) => {
    if (!storeId) return;
    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestId === requestIdRef.current;

    let productList = [];
    try {
      setIsLoading(true);
      setQuantityProgress(null);
      const response = await fetchStoreProducts(storeId);
      if (!isCurrent()) return;

      if (response.data.status !== "SUCCESS") {
        notify.error(response.data.message || "Unable to fetch inventory");
        return;
      }
      productList = response.data.payload || [];
      // packingList null = quantities not loaded yet
      setProducts(productList.map(product => ({ ...product, packingList: null })));
    } catch (err) {
      if (isCurrent()) notify.error(err.message || "Error fetching inventory");
      return;
    } finally {
      if (isCurrent()) setIsLoading(false);
    }

    const productIds = productList.map(product => product.productId);
    setQuantityProgress({ loaded: 0, total: productIds.length });

    for (let start = 0; start < productIds.length; start += INVENTORY_BATCH_SIZE) {
      const batch = productIds.slice(start, start + INVENTORY_BATCH_SIZE);
      try {
        const response = await fetchInventoryItems(storeId, batch);
        if (!isCurrent()) return;

        const packingsByProduct = groupItemsByProduct(response.data.payload || []);
        setProducts(prev => prev.map(product =>
          batch.includes(product.productId)
            ? { ...product, packingList: packingsByProduct[product.productId] || [] }
            : product
        ));
      } catch (err) {
        if (!isCurrent()) return;
        notify.error(err.message || "Error fetching quantities");
        // show N/A instead of loading forever for this batch
        setProducts(prev => prev.map(product =>
          batch.includes(product.productId) && product.packingList === null ? { ...product, packingList: [] } : product
        ));
      }
      setQuantityProgress({ loaded: Math.min(start + batch.length, productIds.length), total: productIds.length });
    }

    if (isCurrent()) setQuantityProgress(null);
  };

  const handleStoreChange = (e) => {
    const newStoreId = parseInt(e.target.value);
    setSelectedStore(newStoreId);
    hasCalledApiRef.current = false;
    fetchInventory(newStoreId);
  };

  const handleRefresh = () => {
    if (selectedStore) {
      fetchInventory(selectedStore);
    }
  };

  const calculateBags = (quantity, packingSize) => {
    return (quantity / packingSize).toFixed(1);
  };

  const getShortUnit = (unit) => {
    const unitMap = {
      'KILOGRAM': 'KG',
      'GRAM': 'G',
      'MILLILITER': 'ML',
      'LITER': 'L'
    };
    return unitMap[unit] || unit;
  };

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return uniqueCategories;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const key = searchTerm.toLowerCase();
    let filtered = products.filter(product =>
      product.productName.toLowerCase().includes(key) || String(product.productId).includes(key)
    );

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    if (sortBy !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        const totalA = (a.packingList || []).reduce((sum, packing) => {
          const inventorySum = (packing.inventoryList || []).reduce((invSum, inv) => invSum + inv.availableQuantity, 0);
          return sum + inventorySum;
        }, 0);
        
        const totalB = (b.packingList || []).reduce((sum, packing) => {
          const inventorySum = (packing.inventoryList || []).reduce((invSum, inv) => invSum + inv.availableQuantity, 0);
          return sum + inventorySum;
        }, 0);
        
        if (sortBy === 'quantity-low') {
          return totalA - totalB;
        } else if (sortBy === 'quantity-high') {
          return totalB - totalA;
        }
        return 0;
      });
    }

    return filtered;
  }, [products, searchTerm, categoryFilter, sortBy]);

  const hasActiveFilters = sortBy !== 'none' || categoryFilter !== 'all';

  const clearFilters = () => {
    setSortBy('none');
    setCategoryFilter('all');
  };

  return (     
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Inventory View</h1>
        </div>
      </div>


      <div className={styles.maincontent}>
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isAdmin && (
            <div className={styles.storeFilter}>
              <svg className={styles.storeIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <select 
                className={styles.storeSelect}
                value={selectedStore || ''}
                onChange={handleStoreChange}
              >
                {allStores.map((store) => (
                  <option key={store.storeId} value={store.storeId}>
                    {store.storeName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button 
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isLoading || !selectedStore}
            title="Refresh inventory"
          >
            <svg 
              className={isLoading ? styles.spinning : ''} 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <span>Refresh</span>
          </button>

          <button 
            className={`${styles.filterButton} ${hasActiveFilters ? styles.filterActive : ''}`}
            onClick={() => setShowFilterPopup(!showFilterPopup)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>Filters</span>
            {hasActiveFilters && <span className={styles.filterBadge}>•</span>}
          </button>
        </div>

        {showFilterPopup && (
          <>
            <div className={styles.filterOverlay} onClick={() => setShowFilterPopup(false)} />
            <div className={styles.filterPopup}>
              <div className={styles.filterHeader}>
                <h3>Filter & Sort</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowFilterPopup(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className={styles.filterContent}>
                <div className={styles.filterSection}>
                  <label className={styles.filterLabel}>Category</label>
                  <div className={styles.filterOptions}>
                    <button
                      className={`${styles.filterOption} ${categoryFilter === 'all' ? styles.filterOptionActive : ''}`}
                      onClick={() => setCategoryFilter('all')}
                    >
                      All Categories
                    </button>
                    {categories.map(category => (
                      <button
                        key={category}
                        className={`${styles.filterOption} ${categoryFilter === category ? styles.filterOptionActive : ''}`}
                        onClick={() => setCategoryFilter(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.filterSection}>
                  <label className={styles.filterLabel}>Sort by Quantity</label>
                  <div className={styles.filterOptions}>
                    <button
                      className={`${styles.filterOption} ${sortBy === 'none' ? styles.filterOptionActive : ''}`}
                      onClick={() => setSortBy('none')}
                    >
                      Default Order
                    </button>
                    <button
                      className={`${styles.filterOption} ${sortBy === 'quantity-low' ? styles.filterOptionActive : ''}`}
                      onClick={() => setSortBy('quantity-low')}
                    >
                      Lowest to Highest
                    </button>
                    <button
                      className={`${styles.filterOption} ${sortBy === 'quantity-high' ? styles.filterOptionActive : ''}`}
                      onClick={() => setSortBy('quantity-high')}
                    >
                      Highest to Lowest
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.filterFooter}>
                <button 
                  className={styles.clearButton}
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                >
                  Clear All
                </button>
                <button 
                  className={styles.applyButton}
                  onClick={() => setShowFilterPopup(false)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </>
        )}

        {hasActiveFilters && (
          <div className={styles.activeFilters}>
            <span className={styles.activeFiltersLabel}>Active Filters:</span>
            {categoryFilter !== 'all' && (
              <span className={styles.filterTag}>
                Category: {categoryFilter}
                <button onClick={() => setCategoryFilter('all')}>×</button>
              </span>
            )}
            {sortBy !== 'none' && (
              <span className={styles.filterTag}>
                Sort: {sortBy === 'quantity-low' ? 'Low to High' : 'High to Low'}
                <button onClick={() => setSortBy('none')}>×</button>
              </span>
            )}
            <button className={styles.clearAllLink} onClick={clearFilters}>
              Clear all
            </button>
          </div>
        )}

        {isLoading && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <span>Loading products...</span>
          </div>
        )}

        {!isLoading && quantityProgress && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <span>Loading quantities... {quantityProgress.loaded} / {quantityProgress.total} products</span>
          </div>
        )}

        <div className={styles.tableContainer}>
          <table className={`table table-bordered mb-0 ${styles.table}`}>
            <thead className={styles.thead}>
              <tr className={styles.mainHeader}>
                <th rowSpan="2" className={styles.headerCell}>Product Id</th>
                <th rowSpan="2" className={styles.headerCell}>Name</th>
                <th colSpan="3" className={`${styles.headerCell} ${styles.detailsHeader}`}>Details</th>
              </tr>
              <tr className={styles.subHeader}>
                <th className={styles.headerCell}>Packing Size</th>
                <th className={styles.headerCell}>Available Quantity</th>
                <th className={styles.headerCell}>Available Bags/ Bottles</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, productIndex) => {
                  // quantities for this product still loading in the background
                  if (product.packingList === null) {
                    return (
                      <tr key={`${product.productId}-${productIndex}`} className={styles.dataRow}>
                        <td className={styles.mergedCell}>{product.productId}</td>
                        <td className={styles.mergedCell}>{product.productName}</td>
                        <td colSpan="3" className={`${styles.regularCell} ${styles.pendingCell}`}>Loading...</td>
                      </tr>
                    );
                  }

                  const packingList = product.packingList || [];

                  if (packingList.length === 0) {
                    return (
                      <tr key={`${product.productId}-${productIndex}`} className={styles.dataRow}>
                        <td className={styles.mergedCell}>{product.productId}</td>
                        <td className={styles.mergedCell}>{product.productName}</td>
                        <td className={styles.regularCell}>N/A</td>
                        <td className={styles.regularCell}>N/A</td>
                        <td className={styles.regularCell}>N/A</td>
                      </tr>
                    );
                  }
                  
                  return (
                    <React.Fragment key={`${product.productId}-${productIndex}`}>
                      {packingList.map((packing, packingIndex) => {
                        const inventoryList = packing.inventoryList || [];
                        
                        if (inventoryList.length === 0) {
                          return (
                            <tr key={`${product.productId}-${productIndex}-${packingIndex}`} className={styles.dataRow}>
                              {packingIndex === 0 && (
                                <>
                                  <td rowSpan={packingList.length} className={styles.mergedCell}>
                                    {product.productId}
                                  </td>
                                  <td rowSpan={packingList.length} className={styles.mergedCell}>
                                    {product.productName}
                                  </td>
                                </>
                              )}
                              <td className={styles.regularCell}>{packing.packingSize} {getShortUnit(packing.packingUnit)}</td>
                              <td className={styles.regularCell}>N/A</td>
                              <td className={styles.regularCell}>N/A</td>
                            </tr>
                          );
                        }
                        
                        return inventoryList.map((inventory, invIndex) => (
                          <tr key={`${product.productId}-${productIndex}-${packingIndex}-${invIndex}`} className={styles.dataRow}>
                            {packingIndex === 0 && invIndex === 0 && (
                              <>
                                <td rowSpan={packingList.reduce((sum, p) => sum + (p.inventoryList?.length || 1), 0)} className={styles.mergedCell}>
                                  {product.productId}
                                </td>
                                <td rowSpan={packingList.reduce((sum, p) => sum + (p.inventoryList?.length || 1), 0)} className={styles.mergedCell}>
                                  {product.productName}
                                </td>
                              </>
                            )}
                            {invIndex === 0 && (
                              <td rowSpan={inventoryList.length} className={styles.regularCell}>
                                {packing.packingSize} {getShortUnit(packing.packingUnit)}
                              </td>
                            )}
                            <td className={styles.regularCell}>{round3(inventory.availableQuantity)} {getShortUnit(inventory.packingUnit)}</td>
                            <td className={styles.regularCell}>
                              {/* count unit stock already is the number of packets (never divided by the packing size) */}
                              {isCountUnit(packing.packingUnit) ? round3(inventory.availableQuantity) : calculateBags(inventory.availableQuantity, packing.packingSize)}
                            </td>
                          </tr>
                        ));
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className={styles.noResults}>
                    {isLoading ? 'Loading...' : 'No products found matching your criteria'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryView;