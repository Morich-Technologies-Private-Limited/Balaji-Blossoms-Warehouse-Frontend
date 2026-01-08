// Updated DynamicSidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './DynamicSidebar.module.css';
import { Logout } from '../utils/Logout';

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

  const handleLogout = () => {
    Logout(navigate);
    closeSidebarOnMobile();
  };

  const sidebarConfig = {
    admin: {
      logo: 'Balaji Admin',
      title: 'Admin Panel',
      navItems: [
        { icon: 'bi-house-door-fill', text: 'Home', link: '/admin' },
        { icon: 'bi-people', text: 'Create User', link: '/admin/users/register' },
        { icon: 'bi-shop', text: 'Create Store', link: '/admin/create-store' },
        { icon: 'bi-person-badge', text: 'User Management', link: '/admin/manage/user' },
        { icon: 'bi-people', text: 'Assign Supervisor', link: '/admin/assign-supervisor' },
        { icon: 'bi-boxes', text: 'View Inventory', link: '/admin/inventory' },
        { icon: 'bi-clock-history', text: 'Transfer History', link: '/admin/transfer-history' },
      ]
    },
    mainstore: {
      logo: 'Balaji Blossoms',
      title: 'Main Store',
      navItems: [
        { icon: 'bi-house-door-fill', text: 'Home', link: '/mainstore' },
        { icon: 'bi-clock-history', text: 'In Entry', link: '/mainstore/in'},
        { icon: 'bi-shop', text: 'Out Entry', link: '/mainstore/transfer' },
        { icon: 'bi-arrow-left-right', text: 'Shop Transfer', link: '/mainstore/dashboard2' },
        { icon: 'bi-clock-history', text: 'Transfer History', link: '/mainstore/dashboard3' },
        { icon: 'bi-clock-history', text: 'Product Master', link: '/mainstore/product/add'},
        { icon: 'bi-boxes', text: 'Inventory View', link: '/mainstore/inventory' },
      ]
    },
    substore: {
       logo: 'Balaji Blossoms',
      title: 'Sub Store',
      navItems: [
        { icon: 'bi-house-door-fill', text: 'Home', link: '/substore' },
        { icon: 'bi-arrow-up-circle', text: 'Stock Transfer', link: '/substore/sales' },
        { icon: 'bi-file-text', text: 'Transfer History', link: '/substore/products' },
        { icon: 'bi-person-plus-fill', text: 'View Supervisor', link: '/substore/orders' },
      ]
    },
    storehouse: {
      logo: 'Balaji Blossoms',
      title: 'Warehouse Hub',
      navItems: [
        { icon: 'bi-house-door-fill', text: 'Home', link: '/storehouse' },
        { icon: 'bi-box-seam-fill', text: 'Inventory', link: '/storehouse/inventory' },
        { icon: 'bi-truck', text: 'Shipments', link: '/storehouse/shipments' },
        { icon: 'bi-clipboard-check', text: 'Stock Control', link: '/storehouse/stock-control' },
        { icon: 'bi-arrow-down-up', text: 'Transfers', link: '/storehouse/transfers' },
        { icon: 'bi-journal-text', text: 'Logs', link: '/storehouse/logs' },
        { icon: 'bi-gear-fill', text: 'Configuration', link: '/storehouse/configuration' },
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
          {/* Logout Button */}
          <div 
            className={styles.logoutBtn}
            onClick={handleLogout}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleLogout();
              }
            }}
            title="Logout"
          >
            <i className="bi bi-box-arrow-right"></i>
            <span className={styles.navText}>Logout</span>
          </div>
          
          {/* Footer Info */}
          <div className={styles.footerInfo}>
            <div className={styles.footerText}>{config.title}</div>
            <div className={styles.copyright}>© 2025 All Rights Reserved</div>
          </div>
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