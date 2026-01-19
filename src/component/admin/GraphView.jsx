import React, { useState, useEffect } from 'react';
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
import styles from './GraphView.module.css';
import { createProductGraph } from '../../api/createProductGraph';

const GraphView = ({ productId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [viewMode, setViewMode] = useState('weight'); // 'weight' or 'bag'
  const [selectedPacking, setSelectedPacking] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [maxScale, setMaxScale] = useState('auto');
  const [customScale, setCustomScale] = useState('');

  useEffect(() => {
    fetchGraphData();
  }, [productId]);

  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await createProductGraph(productId);

      if (response.data.status !== "SUCCESS") {
        setError('No data found');
        setLoading(false);
        return;
      }

      if (response.data.status === 'SUCCESS') {
        setData(response.data.payload);
      } else {
        setError(response.data.message|| 'Failed to fetch data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!data || !data.storeList || !data.product) return [];

    const packingList = data.product.packingList || [];
    if (packingList.length === 0) return [];

    const currentPacking = packingList[selectedPacking];
    if (!currentPacking) return [];

    return data.storeList.map(store => {
      const inventory = currentPacking.inventoryList?.find(
        inv => inv.storeId === store.storeId
      );

      let quantity = inventory?.availableQuantity || 0;

      if (viewMode === 'bag' && currentPacking.packingSize) {
        quantity = (quantity / currentPacking.packingSize).toFixed(2);
      }

      return {
        storeName: store.storeName,
        quantity: parseFloat(quantity),
        color: store.color || '#4A90E2',
        storeId: store.storeId
      };
    });
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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const currentPacking = data.product.packingList[selectedPacking];
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipStore}>{payload[0].payload.storeName}</p>
          <p className={styles.tooltipProduct}>{data.product.productName}</p>
          <p className={styles.tooltipPacking}>
            Packing: {getPackingLabel(currentPacking)}
          </p>
          <p className={styles.tooltipQuantity}>
            {viewMode === 'weight' ? 'Quantity' : 'Bags'}: {payload[0].value}
            {viewMode === 'weight' ? ` ${currentPacking.packingUnit?.toLowerCase()}` : ' bags'}
          </p>
        </div>
      );
    }
    return null;
  };

  const getMaxValue = () => {
    if (maxScale !== 'auto') {
      return parseFloat(customScale) || undefined;
    }
    const chartData = prepareChartData();
    const max = Math.max(...chartData.map(d => d.quantity));
    return Math.ceil(max * 1.1);
  };

  const renderChart = (isModal = false) => {
    const chartData = prepareChartData();
    const height = isModal ? 500 : 350;

    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="storeName"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: '#555', fontSize: isModal ? 14 : 12 }}
          />
          <YAxis
            domain={[0, getMaxValue()]}
            tick={{ fill: '#555', fontSize: isModal ? 14 : 12 }}
            label={{
              value: viewMode === 'weight' ? 'Quantity' : 'Bags',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: isModal ? 14 : 12, fill: '#555' }
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(74, 144, 226, 0.1)' }} />
          <Bar
            dataKey="quantity"
            fill="#4A90E2"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
            animationBegin={0}
          >
            {chartData.map((entry, index) => (
              <Bar key={`bar-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading graph data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <i className="bi bi-exclamation-triangle-fill"></i>
        <p className={styles.errorText}>{error}</p>
        <button className={`btn btn-primary ${styles.retryBtn}`} onClick={fetchGraphData}>
          <i className="bi bi-arrow-clockwise"></i> Retry
        </button>
      </div>
    );
  }

  if (!data || !data.product || !data.product.packingList || data.product.packingList.length === 0) {
    return (
      <div className={styles.noDataContainer}>
        <i className="bi bi-inbox"></i>
        <p className={styles.noDataText}>No inventory data available</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.graphViewContainer}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h3 className={styles.productTitle}>{data.product.productName}</h3>
            <span className={styles.productId}>ID: {data.product.productId}</span>
          </div>
          <button
            className={styles.expandBtn}
            onClick={() => setShowModal(true)}
            title="Expand graph"
          >
            <i className="bi bi-arrows-fullscreen"></i>
          </button>
        </div>

        <div className={styles.controls}>
          <div className="row g-3">
            <div className="col-md-4 col-sm-6">
              <label className={styles.controlLabel}>View Mode</label>
              <div className={styles.toggleGroup}>
                <button
                  className={`${styles.toggleBtn} ${viewMode === 'weight' ? styles.active : ''}`}
                  onClick={() => setViewMode('weight')}
                >
                  <i className="bi bi-speedometer2"></i> Weight
                </button>
                <button
                  className={`${styles.toggleBtn} ${viewMode === 'bag' ? styles.active : ''}`}
                  onClick={() => setViewMode('bag')}
                >
                  <i className="bi bi-bag"></i> Bag
                </button>
              </div>
            </div>

            <div className="col-md-4 col-sm-6">
              <label className={styles.controlLabel}>Packing Size</label>
              <select
                className={`form-select ${styles.selectInput}`}
                value={selectedPacking}
                onChange={(e) => setSelectedPacking(parseInt(e.target.value))}
              >
                {data.product.packingList.map((packing, index) => (
                  <option key={index} value={index}>
                    {getPackingLabel(packing)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 col-sm-12">
              <label className={styles.controlLabel}>Y-Axis Scale</label>
              <div className={styles.scaleControl}>
                <select
                  className={`form-select ${styles.selectInput}`}
                  value={maxScale}
                  onChange={(e) => setMaxScale(e.target.value)}
                >
                  <option value="auto">Auto</option>
                  <option value="custom">Custom</option>
                </select>
                {maxScale === 'custom' && (
                  <input
                    type="number"
                    className={`form-control ${styles.scaleInput}`}
                    placeholder="Max value"
                    value={customScale}
                    onChange={(e) => setCustomScale(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.chartContainer}>
          {renderChart()}
        </div>

        <div className={styles.footer}>
          <div className={styles.legendContainer}>
            {data.storeList.map((store, index) => (
              <div key={index} className={styles.legendItem}>
                <span
                  className={styles.legendColor}
                  style={{ backgroundColor: store.color || '#4A90E2' }}
                ></span>
                <span className={styles.legendLabel}>{store.storeName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for enlarged view */}
      {showModal && (
        <div className={`modal fade show ${styles.modalOverlay}`} style={{ display: 'block' }} onClick={() => setShowModal(false)}>
          <div className="modal-dialog modal-xl modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-content ${styles.modalContent}`}>
              <div className="modal-header">
                <h5 className="modal-title">{data.product.productName} - Inventory Graph</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className={styles.modalControls}>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className={styles.controlLabel}>View Mode</label>
                      <div className={styles.toggleGroup}>
                        <button
                          className={`${styles.toggleBtn} ${viewMode === 'weight' ? styles.active : ''}`}
                          onClick={() => setViewMode('weight')}
                        >
                          <i className="bi bi-speedometer2"></i> Weight
                        </button>
                        <button
                          className={`${styles.toggleBtn} ${viewMode === 'bag' ? styles.active : ''}`}
                          onClick={() => setViewMode('bag')}
                        >
                          <i className="bi bi-bag"></i> Bag
                        </button>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className={styles.controlLabel}>Packing Size</label>
                      <select
                        className={`form-select ${styles.selectInput}`}
                        value={selectedPacking}
                        onChange={(e) => setSelectedPacking(parseInt(e.target.value))}
                      >
                        {data.product.packingList.map((packing, index) => (
                          <option key={index} value={index}>
                            {getPackingLabel(packing)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className={styles.controlLabel}>Y-Axis Scale</label>
                      <div className={styles.scaleControl}>
                        <select
                          className={`form-select ${styles.selectInput}`}
                          value={maxScale}
                          onChange={(e) => setMaxScale(e.target.value)}
                        >
                          <option value="auto">Auto</option>
                          <option value="custom">Custom</option>
                        </select>
                        {maxScale === 'custom' && (
                          <input
                            type="number"
                            className={`form-control ${styles.scaleInput}`}
                            placeholder="Max value"
                            value={customScale}
                            onChange={(e) => setCustomScale(e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {renderChart(true)}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GraphView;