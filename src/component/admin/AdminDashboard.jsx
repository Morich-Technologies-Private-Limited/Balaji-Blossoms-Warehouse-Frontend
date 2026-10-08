import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import styles from './AdminDashboard.module.css';
import { createProductGraph } from '../../api/createProductGraph';
import { findAllProducts } from '../../api/findAllProducts';
import { showMessagePopUp } from '../modal/MessagePopUp';

const AdminDashboard = () => {
  const [productIds, setProductIds] = useState([]);
  const [viewLayout, setViewLayout] = useState('grid');
  const [productsData, setProductsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [scaleSettings, setScaleSettings] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  // Pagination state
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchingProductIds, setFetchingProductIds] = useState(new Set());
  const [productsWithData, setProductsWithData] = useState([]);
  
  const observerTarget = useRef(null);
  const PRODUCTS_TO_DISPLAY = 5;

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    setLoading(true);
    
    const response = await findAllProducts();

    
    if(response.data.status!=="SUCCESS"){
     showMessagePopUp(response.data.status, response.data.message,response.data.errorList || []);
     setLoading(false);
     return;
    }

    const allProducts = response.data.payload;
    
    // Extract product IDs from fetched data and ensure uniqueness
    const uniqueIds = [...new Set(allProducts.map(product => product.productId))];
    setProductIds(uniqueIds);
    
    // Reset pagination when fetching new product list
    setCurrentBatchIndex(0);
    setProductsData({});
    setFetchingProductIds(new Set());
    setProductsWithData([]);
    
    setLoading(false);
  };

  // Fetch product graph data and filter only products with data
  const fetchProductGraphData = useCallback(async (productIdsToFetch) => {
    // Filter out already fetched or currently fetching products
    const newProductIds = productIdsToFetch.filter(
      id => !productsData[id] && !fetchingProductIds.has(id)
    );

    if (newProductIds.length === 0) return 0;

    // Mark these products as being fetched
    setFetchingProductIds(prev => {
      const newSet = new Set(prev);
      newProductIds.forEach(id => newSet.add(id));
      return newSet;
    });

    const dataMap = {};
    const validProductIds = [];
    
    for (const productId of newProductIds) {
      try {
        const response = await createProductGraph(productId);
        if (response.data.status === "SUCCESS") {
          const productData = response.data.payload;
          
          // Check if product has valid data (has packing list)
          if (productData?.product?.packingList && productData.product.packingList.length > 0) {
            dataMap[productId] = productData;
            validProductIds.push(productId);
          }
        }
      } catch (err) {
        console.error(`Error fetching product ${productId}:`, err);
      }
    }
    
    // Update products data
    setProductsData(prev => ({ ...prev, ...dataMap }));
    
    // Add valid products to the list of products with data (prevent duplicates)
    setProductsWithData(prev => {
      const existingIds = new Set(prev);
      const uniqueNewIds = validProductIds.filter(id => !existingIds.has(id));
      return [...prev, ...uniqueNewIds];
    });
    
    // Remove from fetching set
    setFetchingProductIds(prev => {
      const newSet = new Set(prev);
      newProductIds.forEach(id => newSet.delete(id));
      return newSet;
    });
    
    return validProductIds.length;
  }, [productsData, fetchingProductIds]);

  // Get filtered product IDs based on search
  const getFilteredProductIds = useCallback(() => {
    return productIds.filter(productId => {
      if (!searchQuery) return true;
      const productData = productsData[productId];
      if (!productData) return true; // Include unfetched products to load them
      return productData.product.productName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [productIds, searchQuery, productsData]);

  // Fetch products in batches until we have enough with valid data
  const fetchNextBatch = useCallback(async () => {
    if (loadingMore) return;
    
    const filteredIds = getFilteredProductIds();
    const allProcessedIds = Object.keys(productsData);
    
    // Filter only products that match search and have data
    const filteredProductsWithData = productsWithData.filter(id => {
      if (!searchQuery) return true;
      const productData = productsData[id];
      return productData?.product?.productName.toLowerCase().includes(searchQuery.toLowerCase());
    });
    
    // Check if we already have enough products with data
    if (filteredProductsWithData.length >= PRODUCTS_TO_DISPLAY) {
      return;
    }
    
    // Check if there are more products to fetch
    if (currentBatchIndex >= filteredIds.length) {
      return;
    }
    
    setLoadingMore(true);
    
    const BATCH_SIZE = 5;
    let productsFound = 0;
    let batchIndex = currentBatchIndex;
    
    // Keep fetching batches until we have enough products with data
    while (
      filteredProductsWithData.length + productsFound < PRODUCTS_TO_DISPLAY && 
      batchIndex < filteredIds.length
    ) {
      const batchStart = batchIndex;
      const batchEnd = Math.min(batchIndex + BATCH_SIZE, filteredIds.length);
      const batchIds = filteredIds.slice(batchStart, batchEnd);
      
      // Fetch this batch
      const foundCount = await fetchProductGraphData(batchIds);
      if (foundCount) {
        productsFound += foundCount;
      }
      
      batchIndex = batchEnd;
      
      // If we've processed all products, stop
      if (batchIndex >= filteredIds.length) {
        break;
      }
    }
    
    setCurrentBatchIndex(batchIndex);
    setLoadingMore(false);
  }, [
    loadingMore, 
    getFilteredProductIds, 
    productsData, 
    productsWithData, 
    searchQuery, 
    currentBatchIndex, 
    fetchProductGraphData
  ]);

  // Initial fetch when component loads or search changes
  useEffect(() => {
    if (productIds.length > 0 && !loading) {
      fetchNextBatch();
    }
  }, [productIds, searchQuery]);

  // Reset when search changes
  useEffect(() => {
    setCurrentBatchIndex(0);
  }, [searchQuery]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !loading) {
          const filteredIds = getFilteredProductIds();
          
          // Filter products with data that match search
          const filteredProductsWithData = productsWithData.filter(id => {
            if (!searchQuery) return true;
            const productData = productsData[id];
            return productData?.product?.productName.toLowerCase().includes(searchQuery.toLowerCase());
          });
          
          // Load more if we don't have enough products or haven't fetched all
          if (
            filteredProductsWithData.length < PRODUCTS_TO_DISPLAY && 
            currentBatchIndex < filteredIds.length
          ) {
            fetchNextBatch();
          }
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [
    loadingMore, 
    loading, 
    getFilteredProductIds, 
    productsWithData, 
    searchQuery, 
    productsData, 
    currentBatchIndex, 
    fetchNextBatch
  ]);

  const getColorHex = (colorName) => {
    const colorMap = {
      'BLUE': '#0066FF',
      'YELLOW': '#FFD700',
      'RED': '#DC3545',
      'GREEN': '#28A745',
      'PURPLE': '#6F42C1',
      'ORANGE': '#FD7E14',
      'PINK': '#E83E8C',
      'CYAN': '#17A2B8',
      'INDIGO': '#6610F2',
      'TEAL': '#20C997'
    };
    return colorMap[colorName?.toUpperCase()] || '#4A90E2';
  };

  const getUnitGroups = (productData) => {
    if (!productData || !productData.product || !productData.product.packingList) return [];

    const category = productData.product.category;
    const packingList = productData.product.packingList;

    if (category === 'LIQUID') {
      const literPacking = packingList.filter(p => p.packingUnit === 'LITER');
      const mlPacking = packingList.filter(p => p.packingUnit === 'MILLILITER');
      
      const groups = [];
      if (literPacking.length > 0) {
        groups.push({ unit: 'LITER', packings: literPacking, label: 'Liters' });
      }
      if (mlPacking.length > 0) {
        groups.push({ unit: 'MILLILITER', packings: mlPacking, label: 'Milliliters' });
      }
      return groups;
    } else if (category === 'POWDER') {
      const kgPacking = packingList.filter(p => p.packingUnit === 'KILOGRAM');
      const gPacking = packingList.filter(p => p.packingUnit === 'GRAM');
      
      const groups = [];
      if (kgPacking.length > 0) {
        groups.push({ unit: 'KILOGRAM', packings: kgPacking, label: 'Kilograms' });
      }
      if (gPacking.length > 0) {
        groups.push({ unit: 'GRAM', packings: gPacking, label: 'Grams' });
      }
      return groups;
    }

    return [{ unit: 'ALL', packings: packingList, label: 'All Units' }];
  };

  const prepareChartDataByStore = (productData, packings) => {
    if (!productData || !productData.storeList || !packings) return [];

    const chartData = [];

    packings.forEach((packing) => {
      const packingLabel = getPackingLabel(packing);
      const packingData = {
        packingName: packingLabel
      };

      productData.storeList.forEach(store => {
        const inventory = packing.inventoryList?.find(
          inv => inv.storeId === store.storeId
        );
        packingData[store.storeName] = inventory?.availableQuantity || 0;
      });

      chartData.push(packingData);
    });

    return chartData;
  };

  const getPackingLabel = (packing) => {
    if (!packing) return '';
    const unitMap = {
      KILOGRAM: 'kg',
      GRAM: 'g',
      MILLILITER: 'ml',
      LITER: 'L'
    };
    return `${packing.packingSize} ${unitMap[packing.packingUnit] || packing.packingUnit}`;
  };

  const getAutoMaxValue = (chartData, storeList) => {
    let max = 0;
    chartData.forEach(item => {
      storeList.forEach(store => {
        if (item[store.storeName] > max) {
          max = item[store.storeName];
        }
      });
    });
    return Math.ceil(max * 1.15);
  };

  const handleScaleChange = (productId, unitType, value, isCustom) => {
    const key = `${productId}-${unitType}`;
    setScaleSettings(prev => ({
      ...prev,
      [key]: {
        mode: isCustom ? 'custom' : 'auto',
        value: isCustom ? value : null
      }
    }));
  };

  const getYAxisMax = (productId, unitType, chartData, storeList) => {
    const key = `${productId}-${unitType}`;
    const settings = scaleSettings[key];
    if (settings?.mode === 'custom' && settings.value) {
      const val = parseFloat(settings.value);
      return val > 0 ? val : getAutoMaxValue(chartData, storeList);
    }
    return getAutoMaxValue(chartData, storeList);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipHeader}>{label}</p>
          <div className={styles.tooltipContent}>
            {payload.map((entry, index) => (
              <div key={index} className={styles.tooltipRow}>
                <div className={styles.tooltipStore}>
                  <span 
                    className={styles.tooltipColorDot}
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className={styles.tooltipStoreName}>{entry.name}</span>
                </div>
                <span className={styles.tooltipValue}>{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderSingleGraph = (productData, unitGroup, productId) => {
    const chartData = prepareChartDataByStore(productData, unitGroup.packings);
    const storeList = productData.storeList || [];
    
    if (chartData.length === 0) {
      return null;
    }

    const currentScale = scaleSettings[`${productId}-${unitGroup.unit}`] || { mode: 'auto', value: null };
    const maxValue = getYAxisMax(productId, unitGroup.unit, chartData, storeList);

    // Responsive chart configuration
    const chartHeight = isMobile ? 350 : 300;
    const chartMargin = isMobile 
      ? { top: 20, right: 10, left: 0, bottom: 80 }
      : { top: 20, right: 30, left: 20, bottom: 60 };

    return (
      <div key={unitGroup.unit} className={styles.unitGraphCard}>
        <div className={styles.graphSectionHeader}>
          <h4 className={styles.unitLabel}>{unitGroup.label}</h4>
        </div>

        <div className={styles.scaleControl}>
          <label className={styles.scaleLabel}>Y-Axis Scale:</label>
          <div className={styles.scaleInputGroup}>
            <select
              className={styles.scaleSelect}
              value={currentScale.mode}
              onChange={(e) => handleScaleChange(productId, unitGroup.unit, null, e.target.value === 'custom')}
            >
              <option value="auto">Auto</option>
              <option value="custom">Custom</option>
            </select>
            {currentScale.mode === 'custom' && (
              <input
                type="number"
                min="1"
                step="1"
                className={styles.scaleInput}
                placeholder="Max value"
                value={currentScale.value || ''}
                onChange={(e) => handleScaleChange(productId, unitGroup.unit, e.target.value, true)}
              />
            )}
          </div>
        </div>

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              margin={chartMargin}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="packingName"
                tick={{ fill: '#555', fontSize: isMobile ? 9 : 11 }}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 80 : 60}
                interval={0}
                label={!isMobile ? {
                  value: 'Packing Size',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fontSize: 12, fill: '#555', fontWeight: 600 }
                } : undefined}
              />
              <YAxis
                domain={[0, maxValue]}
                tick={{ fill: '#555', fontSize: isMobile ? 9 : 11 }}
                width={isMobile ? 35 : 60}
                label={{
                  value: 'Quantity',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: isMobile ? 10 : 12, fill: '#555' }
                }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(74, 144, 226, 0.1)' }}
              />
              {/* {!isMobile && (
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                />
              )} */}
              {storeList.map((store, storeIndex) => (
                <Bar
                  key={storeIndex}
                  dataKey={store.storeName}
                  fill={getColorHex(store.color)}
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                  barSize={isMobile ? 20 : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.storeLegend}>
          <div className={styles.legendContainer}>
            {storeList.map((store, storeIndex) => (
              <div key={storeIndex} className={styles.legendItem}>
                <span
                  className={styles.legendColor}
                  style={{ background: getColorHex(store.color) }}
                />
                <span className={styles.legendLabel}>{store.storeName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderProductCard = (productId) => {
    const productData = productsData[productId];
    
    if (!productData) {
      return (
        <div className={styles.loadingCard}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading...</p>
        </div>
      );
    }

    const unitGroups = getUnitGroups(productData);
    
    if (unitGroups.length === 0) {
      return (
        <div className={styles.noDataCard}>
          <i className="bi bi-inbox" />
          <p>No data available</p>
        </div>
      );
    }

    return (
      <div className={styles.productCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <h3>{productData.product.productName}</h3>
            <span className={styles.productId}>ID: {productData.product.productId}</span>
          </div>
          <div className={styles.categoryBadge}>
            {productData.product.category || 'N/A'}
          </div>
        </div>

        <div className={`${styles.unitGraphsGrid} ${viewLayout === 'grid' ? styles.gridLayout : styles.listLayout}`}>
          {unitGroups.map(unitGroup => renderSingleGraph(productData, unitGroup, productId))}
        </div>
      </div>
    );
  };

  const filteredProductIds = getFilteredProductIds();
  
  // Get products with data that match the search query (ensuring uniqueness)
  const displayedProductIds = [...new Set(productsWithData)]
    .filter(id => {
      if (!searchQuery) return true;
      const productData = productsData[id];
      return productData?.product?.productName.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .slice(0, PRODUCTS_TO_DISPLAY);
  
  const hasMoreToFetch = currentBatchIndex < filteredProductIds.length;

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Admin Dashboard</h1>
        </div>
      </div>

      <div className={styles.controlBar}>
        <div className={styles.controlBarContent}>
  

          <div className={styles.rightControls}>
            <div className={styles.searchBar}>
              <i className="bi bi-search" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button 
                  className={styles.clearBtn}
                  onClick={() => setSearchQuery('')}
                >
                  <i className="bi bi-x-circle-fill" />
                </button>
              )}
            </div>
            
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${viewLayout === 'grid' ? styles.active : ''}`}
                onClick={() => setViewLayout('grid')}
                title="Grid View"
              >
                <i className="bi bi-grid-3x3-gap-fill" />
              </button>
              <button
                className={`${styles.viewBtn} ${viewLayout === 'list' ? styles.active : ''}`}
                onClick={() => setViewLayout('list')}
                title="List View"
              >
                <i className="bi bi-list-ul" />
              </button>
            </div>
            
            <button className={styles.refreshBtn} onClick={fetchAllProducts}>
              <i className="bi bi-arrow-clockwise" />
              <span className={styles.btnText}>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.productsContainer}>
          {displayedProductIds.map((productId) => (
            <div key={productId}>
              {renderProductCard(productId)}
            </div>
          ))}
          
          {/* Loading indicator for pagination */}
          {loadingMore && (
            <div className={styles.loadingCard}>
              <div className={styles.spinner} />
              <p className={styles.loadingText}>Scanning for products with data...</p>
            </div>
          )}
          
          {/* Intersection observer target */}
          {(hasMoreToFetch || displayedProductIds.length < PRODUCTS_TO_DISPLAY) && (
            <div ref={observerTarget} style={{ height: '20px', margin: '20px 0' }} />
          )}
        </div>

        {filteredProductIds.length === 0 && !loading && productIds.length > 0 && (
          <div className={styles.emptyState}>
            <i className="bi bi-inbox" />
            <h3>No Products Found</h3>
            <p>Try adjusting your search query.</p>
          </div>
        )}
        
        {displayedProductIds.length === 0 && !loading && !loadingMore && productIds.length > 0 && filteredProductIds.length > 0 && (
          <div className={styles.emptyState}>
            <i className="bi bi-inbox" />
            <h3>No Products with Data Found</h3>
            <p>Scanned products but none have inventory data available.</p>
          </div>
        )}
        
        {productIds.length === 0 && !loading && (
          <div className={styles.emptyState}>
            <i className="bi bi-inbox" />
            <h3>No Products Available</h3>
            <p>Add new products to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;