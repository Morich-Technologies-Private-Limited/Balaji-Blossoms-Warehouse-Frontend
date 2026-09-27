```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './DynamicSidebar.module.css';
import { Logout } from '../utils/Logout';
import Logo2 from "../../assets/logo2.png";
import Logo3 from "../../assets/logo3.png";

// 🔹 Build flag - set to false before the production deploy
const IS_DEVELOPMENT_MODE = true;

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
      setIsOpen(!mobile);
    };

    checkMobile();

    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Notify parent when sidebar state changes
  useEffect(() => {
    if (onSidebarChange) {
      onSidebarChange(isOpen);
    }
  }, [isOpen, onSidebarChange]);

  const toggleSidebar = () => {
    setIsOpen(prev => !prev);
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

  // ============================================================
  // SIDEBAR CONFIGURATION
  // ============================================================

  const sidebarConfig = {
    // ==========================================================
    // ADMIN
    // ==========================================================
    admin: {
      logo: 'Balaji Admin',
      title: 'Admin Panel',

      navItems: [
        {
          icon: 'bi-house-door-fill',
          text: 'Home',
          link: '/admin'
        },
        {
          icon: 'bi-people',
          text: 'Create User',
          link: '/admin/users/register'
        },
        {
          icon: 'bi-shop',
          text: 'Create Store',
          link: '/admin/create/store'
        },
        {
          icon: 'bi-person-badge',
          text: 'User Management',
          link: '/admin/manage/user'
        },
        {
          icon: 'bi-boxes',
          text: 'View Inventory',
          link: '/admin/view/inventory'
        },

        // Release branch
        {
          icon: 'bi-person-badge',
          text: 'Supervisors',
          link: '/admin/supervisors'
        },
        {
          icon: 'bi-box-seam',
          text: 'Supervisor Inventory',
          link: '/admin/supervisor/inventory'
        },
        {
          icon: 'bi-calendar-x',
          text: 'Product Expiry',
          link: '/admin/product/expiry'
        },
        {
          icon: 'bi-sliders',
          text: 'Inventory Correction',
          link: '/admin/inventory-correction'
        },

        // Test branch
        {
          icon: 'bi-arrow-up-circle',
          text: 'Supervisor Transfer',
          link: '/admin/supervisor/transfer'
        },

        {
          icon: 'bi-clock-history',
          text: 'Transfer History',
          link: '/admin/view/tranferHistory'
        }
      ]
    },


    // ==========================================================
    // MAIN STORE
    // ==========================================================
    mainstore: {
      logo: 'Balaji Blossoms',
      title: 'Main Store',

      navItems: [
        {
          icon: 'bi-house-door-fill',
          text: 'Home',
          link: '/mainstore/dashboard'
        },
        {
          icon: 'bi-clock-history',
          text: 'In Entry',
          link: '/mainstore/import'
        },
        {
          icon: 'bi-shop',
          text: 'Out Entry',
          link: '/mainstore/transfer'
        },
        {
          icon: 'bi-box',
          text: 'Product Master',
          link: '/mainstore/product/add'
        },
        {
          icon: 'bi-boxes',
          text: 'Inventory View',
          link: '/mainstore/view/inventory'
        },

        // Release branch
        {
          icon: 'bi-calendar-x',
          text: 'Product Expiry',
          link: '/mainstore/product/expiry'
        },
        {
          icon: 'bi-sliders',
          text: 'Inventory Correction',
          link: '/mainstore/inventory-correction'
        },

        // Test branch
        {
          icon: 'bi-arrow-up-circle',
          text: 'Supervisor Transfer',
          link: '/mainstore/supervisor/transfer'
        },
        {
          icon: 'bi-person-lines-fill',
          text: 'Supervisor Inventory',
          link: '/mainstore/supervisor/inventory'
        },

        {
          icon: 'bi-clock-history',
          text: 'Transfer History',
          link: '/mainstore/view/tranferHistory'
        }
      ]
    },


    // ==========================================================
    // SUB STORE
    // ==========================================================
    substore: {
      logo: 'Balaji Blossoms',
      title: 'Sub Store',

      navItems: [
        {
          icon: 'bi-house-door-fill',
          text: 'Home',
          link: '/substore/dashboard'
        },
        {
          icon: 'bi-arrow-up-circle',
          text: 'Stock Transfer',
          link: '/substore/transfer'
        },
        {
          icon: 'bi-clock-history',
          text: 'In Entry',
          link: '/substore/import'
        },
        {
          icon: 'bi-arrow-up-circle',
          text: 'Out Entry',
          link: '/substore/supervisor/transfer'
        },
        {
          icon: 'bi-file-text',
          text: 'Transfer History',
          link: '/substore/view/tranferHistory'
        },
        {
          icon: 'bi-boxes',
          text: 'Inventory View',
          link: '/substore/view/inventory'
        },

        // Release branch
        {
          icon: 'bi-calendar-x',
          text: 'Product Expiry',
          link: '/substore/product/expiry'
        },
        {
          icon: 'bi-sliders',
          text: 'Inventory Correction',
          link: '/substore/inventory-correction'
        },
        {
          icon: 'bi-person-badge',
          text: 'Supervisors',
          link: '/substore/supervisors'
        },

        // Shared supervisor inventory
        {
          icon: 'bi-person-lines-fill',
          text: 'Supervisor Inventory',
          link: '/substore/supervisor/inventory'
        }
      ]
    },


    // ==========================================================
    // SUPERVISOR
    // ==========================================================
    supervisor: {
      logo: 'Balaji Blossoms',
      title: 'Supervisor',

      navItems: [
        // Release branch
        {
          icon: 'bi-box-seam',
          text: 'My Stock',
          link: '/supervisor/stock'
        },
        {
          icon: 'bi-pencil-square',
          text: 'Log Usage',
          link: '/supervisor/log-usage'
        },
        {
          icon: 'bi-clock-history',
          text: 'Usage History',
          link: '/supervisor/usage'
        },
        {
          icon: 'bi-box-arrow-in-down',
          text: 'Received Stock',
          link: '/supervisor/received'
        },

        // Test branch
        {
          icon: 'bi-boxes',
          text: 'My Inventory',
          link: '/supervisor/my/inventory'
        },
        {
          icon: 'bi-arrow-left-right',
          text: 'Transfer to Supervisor',
          link: '/supervisor/transfer/supervisor'
        },
        {
          icon: 'bi-arrow-return-left',
          text: 'Return to Store',
          link: '/supervisor/transfer/store'
        },
        {
          icon: 'bi-clipboard-check',
          text: 'Record Usage',
          link: '/supervisor/usage'
        }
      ]
    }
  };


  // ============================================================
  // BACKEND ROLE → SIDEBAR KEY
  // ============================================================

  const roleKeyMap = {
    ADMIN: 'admin',
    MAIN_STORE_MANAGER: 'mainstore',
    SUB_STORE_MANAGER: 'substore',
    SUB_STORE_SUPERVISOR: 'substore',
    SUPERVISOR: 'supervisor',
    SHOP_MANAGER: 'mainstore'
  };

  const sidebarKey = roleKeyMap[role] || 'mainstore';

  const config = sidebarConfig[sidebarKey];


  // ============================================================
  // SAFETY CHECK
  // ============================================================

  if (!config) {
    return null;
  }


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* ======================================================
          MOBILE OVERLAY
          ====================================================== */}
      {isMobile && isOpen && (
        <div
          className={styles.overlay}
          onClick={closeSidebarOnMobile}
        />
      )}


      {/* ======================================================
          SIDEBAR
          ====================================================== */}
      <div
        className={`${styles.sidebar} ${
          isOpen ? styles.open : styles.closed
        }`}
      >

        {/* ====================================================
            SIDEBAR HEADER
            ==================================================== */}
        <div className={styles.sidebarHeader}>

          <div className={styles.logo}>
            <img
              src={isOpen ? Logo2 : Logo3}
              alt="Logo"
              className={styles.logoImage}
            />
          </div>

          {isMobile && (
            <button
              className={styles.closeBtn}
              onClick={closeSidebarOnMobile}
              type="button"
              aria-label="Close sidebar"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          )}

        </div>


        {/* ====================================================
            DEVELOPMENT MODE BADGE
            ==================================================== */}
        {IS_DEVELOPMENT_MODE && (
          <div
            className={styles.devBadge}
            title="Development build"
          >
            <i className="bi bi-code-slash"></i>

            <span className={styles.navText}>
              Development Mode
            </span>
          </div>
        )}


        {/* ====================================================
            NAVIGATION
            ==================================================== */}
        <nav className={styles.sidebarNav}>

          {config.navItems.map((item, index) => {

            const isActive = location.pathname === item.link;

            return (
              <div
                key={`${item.link}-${index}`}
                className={`${styles.navItem} ${
                  isActive ? styles.active : ''
                }`}
                onClick={() => handleNavigation(item.link)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNavigation(item.link);
                  }
                }}
              >

                <i className={item.icon}></i>

                <span className={styles.navText}>
                  {item.text}
                </span>

              </div>
            );
          })}

        </nav>


        {/* ====================================================
            FOOTER
            ==================================================== */}
        <div className={styles.sidebarFooter}>

          {/* Logout */}
          <div
            className={styles.logoutBtn}
            onClick={handleLogout}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLogout();
              }
            }}
          >
            <i className="bi bi-box-arrow-right"></i>

            <span className={styles.navText}>
              Logout
            </span>
          </div>


          {/* Footer information */}
          <div className={styles.footerInfo}>

            <div className={styles.footerText}>
              {config.title}
            </div>

            <div className={styles.copyright}>
              © 2025 All Rights Reserved
            </div>

          </div>

        </div>

      </div>


      {/* ======================================================
          SIDEBAR TOGGLE BUTTON
          ====================================================== */}
      <button
        type="button"
        className={`${styles.toggleBtn} ${
          !isOpen ? styles.toggleBtnClosed : ''
        }`}
        onClick={toggleSidebar}
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <i
          className={`bi ${
            isOpen
              ? 'bi-chevron-left'
              : 'bi-chevron-right'
          }`}
        ></i>
      </button>
    </>
  );
};

export default DynamicSidebar;
```
