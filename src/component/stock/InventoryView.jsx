import React, { useState, useMemo } from 'react';
import styles from './InventoryView.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Sample data with multiple packing sizes per product
const sampleProducts = [
  {
    productId: 1,
    productName: "Basmati Rice",
    category: "Solid",
    packings: [
      { packingSize: 10, packingUnit: "KG", availableQuantity: 15 },
      { packingSize: 20, packingUnit: "KG", availableQuantity: 40 },
      { packingSize: 30, packingUnit: "KG", availableQuantity: 20 }
    ]
  },
  {
    productId: 2,
    productName: "Wheat Flour",
    category: "Solid",
    packings: [
      { packingSize: 25, packingUnit: "KG", availableQuantity: 100 },
      { packingSize: 50, packingUnit: "KG", availableQuantity: 75 }
    ]
  },
  {
    productId: 3,
    productName: "Sunflower Oil",
    category: "Liquid",
    packings: [
      { packingSize: 5, packingUnit: "LITER", availableQuantity: 120 },
      { packingSize: 10, packingUnit: "LITER", availableQuantity: 60 }
    ]
  },
  {
    productId: 4,
    productName: "Sugar",
    category: "Solid",
    packings: [
      { packingSize: 1, packingUnit: "KG", availableQuantity: 500 }
    ]
  },{
    productId: 1,
    productName: "Basmati Rice",
    category: "Solid",
    packings: [
      { packingSize: 10, packingUnit: "KG", availableQuantity: 15 },
      { packingSize: 20, packingUnit: "KG", availableQuantity: 40 },
      { packingSize: 30, packingUnit: "KG", availableQuantity: 20 }
    ]
  },
  {
    productId: 2,
    productName: "Wheat Flour",
    category: "Solid",
    packings: [
      { packingSize: 25, packingUnit: "KG", availableQuantity: 100 },
      { packingSize: 50, packingUnit: "KG", availableQuantity: 75 }
    ]
  },
  {
    productId: 3,
    productName: "Sunflower Oil",
    category: "Liquid",
    packings: [
      { packingSize: 5, packingUnit: "LITER", availableQuantity: 120 },
      { packingSize: 10, packingUnit: "LITER", availableQuantity: 60 }
    ]
  },
  {
    productId: 4,
    productName: "Sugar",
    category: "Solid",
    packings: [
      { packingSize: 1, packingUnit: "KG", availableQuantity: 500 }
    ]
  },{
    productId: 1,
    productName: "Basmati Rice",
    category: "Solid",
    packings: [
      { packingSize: 10, packingUnit: "KG", availableQuantity: 15 },
      { packingSize: 20, packingUnit: "KG", availableQuantity: 40 },
      { packingSize: 30, packingUnit: "KG", availableQuantity: 20 }
    ]
  },
  {
    productId: 2,
    productName: "Wheat Flour",
    category: "Solid",
    packings: [
      { packingSize: 25, packingUnit: "KG", availableQuantity: 100 },
      { packingSize: 50, packingUnit: "KG", availableQuantity: 75 }
    ]
  },
  {
    productId: 3,
    productName: "Sunflower Oil",
    category: "Liquid",
    packings: [
      { packingSize: 5, packingUnit: "LITER", availableQuantity: 120 },
      { packingSize: 10, packingUnit: "LITER", availableQuantity: 60 }
    ]
  },
  {
    productId: 4,
    productName: "Sugar",
    category: "Solid",
    packings: [
      { packingSize: 1, packingUnit: "KG", availableQuantity: 500 }
    ]
  },{
    productId: 1,
    productName: "Basmati Rice",
    category: "Solid",
    packings: [
      { packingSize: 10, packingUnit: "KG", availableQuantity: 15 },
      { packingSize: 20, packingUnit: "KG", availableQuantity: 40 },
      { packingSize: 30, packingUnit: "KG", availableQuantity: 20 }
    ]
  },
  {
    productId: 2,
    productName: "Wheat Flour",
    category: "Solid",
    packings: [
      { packingSize: 25, packingUnit: "KG", availableQuantity: 100 },
      { packingSize: 50, packingUnit: "KG", availableQuantity: 75 }
    ]
  },
  {
    productId: 3,
    productName: "Sunflower Oil",
    category: "Liquid",
    packings: [
      { packingSize: 5, packingUnit: "LITER", availableQuantity: 120 },
      { packingSize: 10, packingUnit: "LITER", availableQuantity: 60 }
    ]
  },
  {
    productId: 4,
    productName: "Sugar",
    category: "Solid",
    packings: [
      { packingSize: 1, packingUnit: "KG", availableQuantity: 500 }
    ]
  }
];

const InventoryView = () => {
  const [products] = useState(sampleProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('All Stores');

  // Calculate available bags
  const calculateBags = (quantity, packingSize) => {
    return (quantity / packingSize).toFixed(1);
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (     
    <div className={styles.container}>
      <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Inventory</h1>
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
        
        <div className={styles.storeFilter}>
          <svg className={styles.storeIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <select 
            className={styles.storeSelect}
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            <option>All Stores</option>
            <option>Main Store</option>
            <option>Warehouse A</option>
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={`table table-bordered mb-0 ${styles.table}`}>
          <thead className={styles.thead}>
            <tr className={styles.mainHeader}>
              <th rowSpan="2" className={styles.headerCell}>Product Id</th>
              <th rowSpan="2" className={styles.headerCell}>Name</th>
              <th rowSpan="2" className={styles.headerCell}>Category</th>
              <th colSpan="4" className={`${styles.headerCell} ${styles.detailsHeader}`}>Details</th>
            </tr>
            <tr className={styles.subHeader}>
              <th className={styles.headerCell}>Packing Size</th>
              <th className={styles.headerCell}>Available Quantity</th>
              <th className={styles.headerCell}>Available Bags</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <React.Fragment key={product.productId}>
                {product.packings.map((packing, index) => (
                  <tr key={`${product.productId}-${index}`} className={styles.dataRow}>
                    {index === 0 && (
                      <>
                        <td rowSpan={product.packings.length} className={styles.mergedCell}>
                          {product.productId}
                        </td>
                        <td rowSpan={product.packings.length} className={styles.mergedCell}>
                          {product.productName}
                        </td>
                        <td rowSpan={product.packings.length} className={styles.mergedCell}>
                          {product.category}
                        </td>
                      </>
                    )}
                    <td className={styles.regularCell}>{packing.packingSize}  {packing.packingUnit}</td>
           
                    <td className={styles.regularCell}>{packing.availableQuantity}</td>
                    <td className={styles.regularCell}>
                      {calculateBags(packing.availableQuantity, packing.packingSize)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

export default InventoryView;