import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import styles from './Dashboard.module.css';

// Dummy data matching your DTOs
const dummyProducts = [
  {
    productId: 1,
    productName: "Premium Rice",
    category: "GRAINS",
    packingList: [
      {
        packingSize: 1,
        packingUnit: "KG",
        inventoryList: [
          { availableQuantity: 450.5, packingUnit: "KG" }
        ]
      },
      {
        packingSize: 5,
        packingUnit: "KG",
        inventoryList: [
          { availableQuantity: 850.0, packingUnit: "KG" }
        ]
      },
      {
        packingSize: 25,
        packingUnit: "KG",
        inventoryList: [
          { availableQuantity: 1200.0, packingUnit: "KG" }
        ]
      }
    ]
  },
  {
    productId: 2,
    productName: "Organic Wheat Flour",
    category: "FLOUR",
    packingList: [
      {
        packingSize: 500,
        packingUnit: "GM",
        inventoryList: [
          { availableQuantity: 320.5, packingUnit: "KG" }
        ]
      },
      {
        packingSize: 1,
        packingUnit: "KG",
        inventoryList: [
          { availableQuantity: 680.0, packingUnit: "KG" }
        ]
      },
      {
        packingSize: 10,
        packingUnit: "KG",
        inventoryList: [
          { availableQuantity: 950.0, packingUnit: "KG" }
        ]
      }
    ]
  },
  {
    productId: 3,
    productName: "Red Lentils (Masoor Dal)",
    category: "PULSES",
    packingList: [
      {
        packingSize: 500,
        packingUnit: "GM",
        inventoryList: [
          { availableQuantity: 280.0, packingUnit: "KG" }
        ]
      },
      {
        packingSize: 1,
        packingUnit: "KG",
        inventoryList: [
          { availableQuantity: 420.5, packingUnit: "KG" }
        ]
      }
    ]
  },
  {
    productId: 4,
    productName: "Sunflower Oil",
    category: "OILS",
    packingList: [
      {
        packingSize: 1,
        packingUnit: "LTR",
        inventoryList: [
          { availableQuantity: 350.0, packingUnit: "LTR" }
        ]
      },
      {
        packingSize: 5,
        packingUnit: "LTR",
        inventoryList: [
          { availableQuantity: 720.0, packingUnit: "LTR" }
        ]
      },
      {
        packingSize: 15,
        packingUnit: "LTR",
        inventoryList: [
          { availableQuantity: 480.0, packingUnit: "LTR" }
        ]
      }
    ]
  },
  {
    productId: 5,
    productName: "Basmati Rice Premium",
    category: "GRAINS",
    packingList: [
      {
        packingSize: 1,
        packingUnit: "KG",
        inventoryList: [
          { availableQuantity: 520.0, packingUnit: "KG" }
        ]
      },
      {
        packingSize: 5,
        packingUnit: "KG",
        inventoryList: [
          { availableQuantity: 1100.0, packingUnit: "KG" }
        ]
      }
    ]
  },
  {
    productId: 6,
    productName: "Chickpeas (Chana)",
    category: "PULSES",
    packingList: [
      {
        packingSize: 500,
        packingUnit: "GM",
        inventoryList: [
          { availableQuantity: 180.0, packingUnit: "KG" }
        ]
      },
      {
        packingSize: 1,
        packingUnit: "KG",
        inventoryList: [
          { availableQuantity: 390.0, packingUnit: "KG" }
        ]
      }
    ]
  }
];

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts(dummyProducts);
      setIsLoading(false);
    }, 500);
  }, []);

  const getTotalInventory = (packingList) => {
    return packingList.reduce((total, packing) => {
      const packingTotal = packing.inventoryList.reduce(
        (sum, inv) => sum + inv.availableQuantity,
        0
      );
      return total + packingTotal;
    }, 0);
  };

  const getMaxInventory = (products) => {
    return Math.max(
      ...products.map(product => getTotalInventory(product.packingList))
    );
  };

  const maxInventory = products.length > 0 ? getMaxInventory(products) : 1000;

  return (
    <div className={styles.dashboardWrapper}>
      <Container fluid className={styles.dashboard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Inventory Dashboard</h1>
          <p className={styles.subtitle}>Real-time stock overview across all products</p>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading inventory data...</p>
          </div>
        ) : (
          <Row className="g-4">
            {products.map((product, index) => {
              const totalInventory = getTotalInventory(product.packingList);
              const percentage = (totalInventory / maxInventory) * 100;

              return (
                <Col xs={12} md={6} lg={4} key={product.productId}>
                  <Card className={styles.productCard} style={{ animationDelay: `${index * 0.1}s` }}>
                    <Card.Body>
                      <div className={styles.productHeader}>
                        <h3 className={styles.productName}>{product.productName}</h3>
                        <span className={styles.category}>{product.category}</span>
                      </div>

                      <div className={styles.totalInventory}>
                        <span className={styles.inventoryLabel}>Total Stock</span>
                        <span className={styles.inventoryValue}>
                          {totalInventory.toFixed(1)}
                        </span>
                      </div>

                      <div className={styles.barGraphContainer}>
                        <div className={styles.barBackground}>
                          <div 
                            className={styles.barFill}
                            style={{ 
                              width: `${percentage}%`,
                              animationDelay: `${index * 0.1 + 0.3}s`
                            }}
                          >
                            <div className={styles.barGlow}></div>
                          </div>
                        </div>
                        <div className={styles.barLabel}>
                          <span>{percentage.toFixed(0)}% of max</span>
                        </div>
                      </div>

                      <div className={styles.packingBreakdown}>
                        <h4 className={styles.breakdownTitle}>Packing Sizes</h4>
                        <div className={styles.packingList}>
                          {product.packingList.map((packing, idx) => {
                            const packingTotal = packing.inventoryList.reduce(
                              (sum, inv) => sum + inv.availableQuantity,
                              0
                            );
                            const packingPercentage = (packingTotal / totalInventory) * 100;

                            return (
                              <div key={idx} className={styles.packingItem}>
                                <div className={styles.packingInfo}>
                                  <span className={styles.packingSize}>
                                    {packing.packingSize} {packing.packingUnit}
                                  </span>
                                  <span className={styles.packingQuantity}>
                                    {packingTotal.toFixed(1)} {packing.packingUnit}
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