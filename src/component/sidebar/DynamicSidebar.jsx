// DynamicSidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './DynamicSidebar.module.css';

const DynamicSidebar = ({ role }) => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Define sidebar configurations for each role
  const sidebarConfig = {
    mainstore: {
      logo: 'Balaji Petals',
      title: 'Main Store',
      navItems: [
        { icon: 'bi-house-door-fill', text: 'Home', link: '/mainstore' },
        { icon: 'bi-speedometer2', text: 'Dashboard 1', link: '/mainstore/dashboard1' },
        { icon: 'bi-graph-up-arrow', text: 'Dashboard 2', link: '/mainstore/dashboard2' },
        { icon: 'bi-bar-chart-fill', text: 'Dashboard 3', link: '/mainstore/dashboard3' },
        { icon: 'bi-box-seam-fill', text: 'Inventory', link: '/mainstore/inventory' },
        { icon: 'bi-people-fill', text: 'Customers', link: '/mainstore/customers' },
        { icon: 'bi-gear-fill', text: 'Settings', link: '/mainstore/settings' },
      ]
    },
    substore: {
      logo: 'Balaji Buds',
      title: 'Sub Store',
      navItems: [
        { icon: 'bi-house-door-fill', text: 'Home', link: '/substore' },
        { icon: 'bi-cart-fill', text: 'Sales', link: '/substore/sales' },
        { icon: 'bi-box-seam-fill', text: 'Products', link: '/substore/products' },
        { icon: 'bi-receipt', text: 'Orders', link: '/substore/orders' },
        { icon: 'bi-clock-history', text: 'History', link: '/substore/history' },
        { icon: 'bi-gear-fill', text: 'Settings', link: '/substore/settings' },
      ]
    },
    storehouse: {
      logo: 'Balaji Blossoms',
      title: 'Warehouse Hub',
      navItems: [
        { icon: 'bi-house-door-fill', text: 'Home', link: '/storehouse' },
        { icon: 'bi-box-seam-fill', text: 'Inventory', link: '/storehouse/inventory' },
        { icon: 'bi-truck', text: 'Shipments', link: '/storehouse/shipments' },
        { icon: 'bi-clipboard-data-fill', text: 'Stock Control', link: '/storehouse/stock-control' },
        { icon: 'bi-arrow-left-right', text: 'Transfers', link: '/storehouse/transfers' },
        { icon: 'bi-journal-text', text: 'Logs', link: '/storehouse/logs' },
        { icon: 'bi-sliders', text: 'Configuration', link: '/storehouse/configuration' },
      ]
    }
  };

  const config = sidebarConfig[role] || sidebarConfig.mainstore;

  return (
    <>
      <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <i className="bi bi-building"></i>
            <span className={styles.logoText}>{config.logo}</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {config.navItems.map((item, index) => (
            <Link 
              key={index}
              to={item.link} 
              className={`${styles.navItem} ${location.pathname === item.link ? styles.active : ''}`}
              title={!isOpen ? item.text : ''}
            >
              <i className={item.icon}></i>
              <span className={styles.navText}>{item.text}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.footerText}>{config.title}</div>
          <div className={styles.copyright}>© 2025 All Rights Reserved</div>
        </div>
      </div>

      <button 
        className={`${styles.toggleBtn} ${!isOpen ? styles.toggleBtnClosed : ''}`}
        onClick={toggleSidebar}
        title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <i className={`bi ${isOpen ? 'bi-chevron-left' : 'bi-chevron-right'}`}></i>
      </button>
    </>
  );
};

export default DynamicSidebar;