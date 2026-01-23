// Updated DynamicSidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './DynamicSidebar.module.css';
import { Logout } from '../utils/Logout';
import Logo2 from "../../assets/logo2.png"
import Logo3 from "../../assets/logo3.png"
import { createBackupApi } from '../../api/createBackupApi';
import { showMessagePopUp } from '../modal/MessagePopUp';

const DynamicSidebar = ({ role, onSidebarChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Notify parent when sidebar state changes
  useEffect(() => {
    if (onSidebarChange) {
      onSidebarChange(isOpen);
    }
  }, [isOpen, onSidebarChange]);

  const toggleSidebar = () => setIsOpen(prev => !prev);

  const closeSidebarOnMobile = () => {
    if (isMobile) setIsOpen(false);
  };

  const handleNavigation = (link) => {
    navigate(link);
    closeSidebarOnMobile();
  };

  // 🔹 Handle item click (navigation or action)
  const handleItemClick = (item) => {
    if (item.action === 'backup') {
      handleCreateBackup();
    } else if (item.link) {
      handleNavigation(item.link);
    }
  };

  const handleLogout = () => {
    Logout(navigate);
    closeSidebarOnMobile();
  };

  // 🔹 Handle Backup Creation
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await createBackupApi();
      
      if (response.data.status === 'SUCCESS') {
        showMessagePopUp(response.data.status, response.data.message, response.data.errorList || []);
      } else {
        showMessagePopUp(response.data.status || "FAILED", response.data.message || "BACKUP FAILED", response.data.errorList || []);
      }
    } catch (error) {
      console.error('Backup creation error:', error);
      showMessagePopUp("ERROR", `❌ Error creating backup: ${error.message || 'Server error'}`, []);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // 🔹 Sidebar configuration
  const sidebarConfig = {
    admin: {
      logo: 'Balaji Admin',
      title: 'Admin Panel',
      navItems: [
        { icon: 'bi-house-door-fill', text: 'Home', link: '/admin' },
        { icon: 'bi-people', text: 'Create User', link: '/admin/users/register' },
        { icon: 'bi-shop', text: 'Create Store', link: '/admin/create/store' },
        { icon: 'bi-person-badge', text: 'User Management', link: '/admin/user/management' },
        { icon: 'bi-boxes', text: 'View Inventory', link: '/admin/view/inventory' },
        { icon: 'bi-boxes', text: 'Request View', link: '/admin/request/view' },
        { icon: 'bi-clock-history', text: 'Transfer History', link: '/admin/view/tranferHistory' },
        { icon: 'bi-database-fill-up', text: 'Create Backup', action: 'backup' },
      ]
    },

    mainstore: {
      logo: 'Balaji Blossoms',
      title: 'Main Store',
      navItems: [
        { icon: 'bi-house-door-fill', text: 'Home', link: '/mainstore/dashboard' },
        { icon: 'bi-clock-history', text: 'In Entry', link: '/mainstore/import' },
        { icon: 'bi-shop', text: 'Out Entry', link: '/mainstore/transfer' },
        { icon: 'bi-box', text: 'Product Master', link: '/mainstore/product/add' },
        { icon: 'bi-boxes', text: 'Inventory View', link: '/mainstore/view/inventory' },
        { icon: 'bi-clock-history', text: 'Transfer History', link: '/mainstore/view/tranferHistory'},
        { icon: 'bi-database-fill-up', text: 'Create Backup', action: 'backup' },
      ]
    },

    substore: {
      logo: 'Balaji Blossoms',
      title: 'Sub Store',
      navItems: [
        { icon: 'bi-house-door-fill', text: 'Home', link: '/substore/dashboard' },
        { icon: 'bi-arrow-up-circle', text: 'Stock Transfer', link: '/substore/transfer' },
        { icon: 'bi-clock-history', text: 'In Entry', link: '/substore/import' },
        { icon: 'bi-arrow-up-circle', text: 'Out Entry', link: '/substore/supervisor/transfer' },
        { icon: 'bi-file-text', text: 'Transfer History', link: '/substore/view/tranferHistory' },
        { icon: 'bi-boxes', text: 'Inventory View', link: '/substore/view/inventory' },
        { icon: 'bi-database-fill-up', text: 'Create Backup', action: 'backup' },
      ]
    },
  };

  // 🔥 FIX: Backend enum → sidebar key mapping
  const roleKeyMap = {
    ADMIN: 'admin',
    MAIN_STORE_MANAGER: 'mainstore',
    SUB_STORE_MANAGER: 'substore',
    SUB_STORE_SUPERVISOR: 'substore',
  };

  const sidebarKey = roleKeyMap[role] || 'mainstore';
  const config = sidebarConfig[sidebarKey];

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div className={styles.overlay} onClick={closeSidebarOnMobile} />
      )}

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <img 
              src={isOpen ? Logo2 : Logo3} 
              alt="Logo" 
              className={styles.logoImage} 
            />
          </div>
          {isMobile && (
            <button className={styles.closeBtn} onClick={closeSidebarOnMobile}>
              <i className="bi bi-chevron-left"></i>
            </button>
          )}
        </div>

        <nav className={styles.sidebarNav}>
          {config.navItems.map((item, index) => (
            <div
              key={index}
              className={`${styles.navItem} ${
                item.link && location.pathname === item.link ? styles.active : ''
              } ${item.action === 'backup' ? styles.backupItem : ''} ${
                isCreatingBackup && item.action === 'backup' ? styles.loading : ''
              }`}
              onClick={() => handleItemClick(item)}
              role="button"
              tabIndex={0}
            >
              <i className={item.icon}></i>
              <span className={styles.navText}>
                {isCreatingBackup && item.action === 'backup' ? 'Creating...' : item.text}
              </span>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div
            className={styles.logoutBtn}
            onClick={handleLogout}
            role="button"
            tabIndex={0}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span className={styles.navText}>Logout</span>
          </div>

          <div className={styles.footerInfo}>
            <div className={styles.footerText}>{config.title}</div>
            <div className={styles.copyright}>
              © 2025 All Rights Reserved
            </div>
          </div>
        </div>
      </div>

      {/* Toggle button */}
      <button
        className={`${styles.toggleBtn} ${!isOpen ? styles.toggleBtnClosed : ''}`}
        onClick={toggleSidebar}
      >
        <i className={`bi ${isOpen ? 'bi-chevron-left' : 'bi-chevron-right'}`}></i>
      </button>
    </>
  );
};

export default DynamicSidebar;