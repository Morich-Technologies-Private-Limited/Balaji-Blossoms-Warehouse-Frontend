import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import styles from './Dashboard.module.css';
import { useStores } from "../../context/StoreContext";
import { getSessionData } from '../utils/getSessionData';
import { findStoreInventory } from '../../api/findStoreInventory';
import { showMessagePopUp } from '../modal/MessagePopUp';

const Dashboard = () => {
  const { stores } = useStores();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unitToggle, setUnitToggle] = useState({});
  const [selectedStore, setSelectedStore] = useState(null);
  const [allStores, setAllStores] = useState([]);
  const [defaultStore, setDefaultStore] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const fetchInventory = async (storeId) => {
    if (!storeId) return;
    
    try {
      setIsLoading(true);
      const response = await findStoreInventory(storeId);

      if (response.data.status === "SUCCESS") {
        setProducts(response.data.payload);
      } else {
       showMessagePopUp(response.data.status, response.data.message, response.data.errorList || []);
      }
    } catch (err) {
      showMessagePopUp("FAILED",err.message || "Error fetching inventory");
    } finally {
      setIsLoading(false);
    }
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const convertToBaseUnit = (value, unit, targetUnit) => {
    if (unit === targetUnit) return value;
    
    if (unit === "GRAM" && targetUnit === "KILOGRAM") {
      return value / 1000;
    } else if (unit === "KILOGRAM" && targetUnit === "GRAM") {
      return value * 1000;
    } else if (unit === "MILLILITER" && targetUnit === "LITER") {
      return value / 1000;
    } else if (unit === "LITER" && targetUnit === "MILLILITER") {
      return value * 1000;
    }
    
    return value;
  };

  const getTotalInventoryInBaseUnit = (packingList, baseUnit) => {
    return packingList.reduce((total, packing) => {
      const packingTotal = (packing.inventoryList || []).reduce((sum, inv) => {
        const convertedValue = convertToBaseUnit(inv.availableQuantity, inv.packingUnit, baseUnit);
        return sum + convertedValue;
      }, 0);
      return total + packingTotal;
    }, 0);
  };

  const getDisplayUnit = (packingList) => {
    const hasKilogram = packingList.some(p => p.packingUnit === "KILOGRAM");
    const hasLiter = packingList.some(p => p.packingUnit === "LITER");
    const hasGram = packingList.some(p => p.packingUnit === "GRAM");
    const hasMilliliter = packingList.some(p => p.packingUnit === "MILLILITER");

    if (hasKilogram) {
      return { primary: "KILOGRAM", secondary: "GRAM" };
    } else if (hasLiter) {
      return { primary: "LITER", secondary: "MILLILITER" };
    } else if (hasGram) {
      return { primary: "GRAM", secondary: null };
    } else if (hasMilliliter) {
      return { primary: "MILLILITER", secondary: null };
    }
    
    return { primary: "KILOGRAM", secondary: null };
  };

  const getUnitLabel = (unit) => {
    const labels = {
      "KILOGRAM": "KG",
      "GRAM": "GM",
      "LITER": "LTR",
      "MILLILITER": "ML"
    };
    return labels[unit] || unit;
  };

  const getPackageLabel = (unit) => {
    if (unit === "LITER" || unit === "MILLILITER") {
      return "Bottles";
    }
    return "Bags";
  };

  const calculatePackageCount = (availableQuantity, packingSize) => {
     return (availableQuantity / packingSize).toFixed(2);
  };

  const toggleUnit = (productId) => {
    setUnitToggle(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const getMaxInventory = (products) => {
    return Math.max(
      ...products.map(product => {
        const displayUnits = getDisplayUnit(product.packingList || []);
        return getTotalInventoryInBaseUnit(product.packingList || [], displayUnits.primary);
      })
    );
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const productName = (product.productName || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    
    return productName.includes(query) || category.includes(query);
  });
  
  return (
    <div className={styles.dashboardWrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
      </div>

      
        <div className={styles.headerControls}>
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

          <div className={styles.searchContainer}>
            <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button className={styles.clearButton} onClick={clearSearch}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

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
        </div>
   
      <Container fluid className={styles.dashboard}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading inventory data...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{searchQuery ? `No products found matching "${searchQuery}"` : 'No inventory data available'}</p>
          </div>
        ) : (
          <Row className="g-4">
            {filteredProducts.map((product, index) => {
              const packingList = product.packingList || [];
              if (packingList.length === 0) {
                return null;
              }

              const displayUnits = getDisplayUnit(packingList);
              const isToggled = unitToggle[product.productId] || false;
              const currentUnit = isToggled && displayUnits.secondary ? displayUnits.secondary : displayUnits.primary;
              const totalInventory = getTotalInventoryInBaseUnit(packingList, currentUnit);
              const totalInBaseUnit = getTotalInventoryInBaseUnit(packingList, displayUnits.primary);
      
              return (
                <Col xs={12} md={6} lg={4} key={product.productId}>
                  <Card className={styles.productCard} style={{ animationDelay: `${index * 0.1}s` }}>
                    <Card.Body className={styles.cardBody}>
                      <div className={styles.cardHeader}>
                        <div className={styles.productHeader}>
                          <h3 className={styles.productName}>{product.productName}</h3>
                          {product.category && (
                            <span className={styles.category}>{product.category}</span>
                          )}
                        </div>

                        <div className={styles.totalInventory}>
                          <span className={styles.inventoryLabel}>Total Stock</span>
                          <span className={styles.inventoryValue}>
                            {totalInventory.toFixed(1)} {getUnitLabel(currentUnit)}
                          </span>
                        </div>

                        {displayUnits.secondary && (
                          <div className={styles.unitToggleContainer}>
                            <button
                              className={styles.unitToggleButton}
                              onClick={() => toggleUnit(product.productId)}
                            >
                              Switch to {isToggled ? displayUnits.primary : displayUnits.secondary}
                            </button>
                          </div>
                        )}
                      </div>
               
                      <div className={styles.packingBreakdown}>
                        <h4 className={styles.breakdownTitle}>Packing Sizes</h4>
                        <div className={styles.packingList}>
                          {packingList.map((packing, idx) => {
                            const inventoryList = packing.inventoryList || [];
                            const packingTotal = inventoryList.reduce((sum, inv) => {
                              return sum + inv.availableQuantity;
                            }, 0);
                            const packageCount = calculatePackageCount(packingTotal, packing.packingSize);
                            const packageLabel = getPackageLabel(packing.packingUnit);
                            const packingTotalInBaseUnit = convertToBaseUnit(packingTotal, packing.packingUnit, displayUnits.primary);
                            const packingPercentage = totalInBaseUnit > 0 ? (packingTotalInBaseUnit / totalInBaseUnit) * 100 : 0;

                            return (
                              <div key={idx} className={styles.packingItem}>
                                <div className={styles.packingInfo}>
                                  <span className={styles.packingSize}>
                                    {packing.packingSize} {getUnitLabel(packing.packingUnit)}
                                  </span>
                                  <span className={styles.packingQuantity}>
                                    {packageCount} {packageLabel} ({packingTotal.toFixed(1)} {getUnitLabel(packing.packingUnit)})
                                  </span>
                                </div>
                                <div className={styles.miniBar}>
                                  <div 
                                    className={styles.miniBarFill}
                                    style={{ 
                                      width: `${packingPercentage}%`,
                                      animationDelay: `${index * 0.1 + idx * 0.05 + 0.5}s`
                                    }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Dashboard;