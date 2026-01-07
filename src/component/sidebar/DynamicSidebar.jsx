// Updated DynamicSidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './DynamicSidebar.module.css';

const DynamicSidebar = ({ role, onSidebarChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Notify parent component whenever sidebar state changes
  useEffect(() => {
    if (onSidebarChange) {
      onSidebarChange(isOpen);
    }
  }, [isOpen, onSidebarChange]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleNavigation = (link) => {
    navigate(link);
    closeSidebarOnMobile();
  };

  // Define sidebar configurations for each role
  const sidebarConfig = {
    mainstore: {
      logo: 'Balaji Blossoms',
      title: 'Main Store',
      navItems: [
        { icon: 'bi-house-door-fill', text: 'Home', link: '/mainstore' },
        { icon: 'bi-speedometer2', text: 'Store Transfer', link: '/mainstore/transfer' },
        { icon: 'bi-graph-up-arrow', text: 'Shop Transfer 2', link: '/mainstore/dashboard2' },
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
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className={styles.overlay}
          onClick={closeSidebarOnMobile}
        />
      )}

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <i className="bi bi-building"></i>
            <span className={styles.logoText}>{config.logo}</span>
          </div>
          {/* Close button for mobile */}
          {isMobile && isOpen && (
            <button 
              className={styles.closeBtn}
              onClick={closeSidebarOnMobile}
              aria-label="Close sidebar"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        <nav className={styles.sidebarNav}>
          {config.navItems.map((item, index) => (
            <div 
              key={index}
              onClick={() => handleNavigation(item.link)}
              className={`${styles.navItem} ${location.pathname === item.link ? styles.active : ''}`}
              title={!isOpen ? item.text : ''}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleNavigation(item.link);
                }
              }}
            >
              <i className={item.icon}></i>
              <span className={styles.navText}>{item.text}</span>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.footerText}>{config.title}</div>
          <div className={styles.copyright}>© 2025 All Rights Reserved</div>
        </div>
      </div>

      {/* Toggle button */}
      <button 
        className={`${styles.toggleBtn} ${!isOpen ? styles.toggleBtnClosed : ''}`}
        onClick={toggleSidebar}
        title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <i className={`bi ${isOpen ? 'bi-chevron-left' : 'bi-list'}`}></i>
      </button>
    </>
  );
};

export default DynamicSidebar;