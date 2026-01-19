import React, { useState, useEffect } from 'react';
import styles from './MessagePopUp.module.css';

// Status configuration with Bootstrap icons and colors
const statusConfig = {
  SUCCESS: {
    icon: '✓',
    iconClass: styles.successIcon,
    title: 'Success',
    color: '#10b981'
  },
  FAILED: {
    icon: '✕',
    iconClass: styles.failedIcon,
    title: 'Failed',
    color: '#ef4444'
  },
  NOT_FOUND: {
    icon: '⚠',
    iconClass: styles.notFoundIcon,
    title: 'Not Found',
    color: '#f59e0b'
  },
  UNAUTHORIZED: {
    icon: '🔒',
    iconClass: styles.unauthorizedIcon,
    title: 'Unauthorized',
    color: '#ef4444'
  },
  AUTHORIZED: {
    icon: '✓',
    iconClass: styles.authorizedIcon,
    title: 'Authorized',
    color: '#10b981'
  },
  ERROR: {
    icon: '!',
    iconClass: styles.errorIcon,
    title: 'Error',
    color: '#dc2626'
  },
  VALIDATION_ERROR: {
    icon: '⚠',
    iconClass: styles.validationErrorIcon,
    title: 'Validation Error',
    color: '#f59e0b'
  }
};

// Create a callback holder that's always available
let messagePopUpCallback = null;

// This is the function you import in other components
export const showMessagePopUp = (status, message, errorList = []) => {
  if (messagePopUpCallback) {
    messagePopUpCallback(status, message, errorList);
  } else {
    console.warn('MessagePopUp component is not mounted yet');
  }
};

const MessagePopUp = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('SUCCESS');
  const [message, setMessage] = useState('');
  const [errorList, setErrorList] = useState([]);

  useEffect(() => {
    // Register the callback when component mounts
    messagePopUpCallback = (newStatus, newMessage, newErrorList = []) => {
      setStatus(newStatus);
      setMessage(newMessage);
      setErrorList(newErrorList);
      setIsOpen(true);
    };

    return () => {
      // Cleanup when component unmounts
      messagePopUpCallback = null;
    };
  }, []);

  // Freeze background scroll and interactions when popup is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'relative';
      document.body.style.width = '100%';
      
      // Prevent keyboard interactions (Tab, Escape, etc.)
      const handleKeyDown = (e) => {
        // Allow only interactions within the popup
        if (!e.target.closest(`.${styles.modal}`)) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      document.addEventListener('keydown', handleKeyDown, true);

      // Cleanup function
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const config = statusConfig[status] || statusConfig.SUCCESS;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        {/* Close button */}
        <button className={styles.closeButton} onClick={handleClose}>
          ✕
        </button>

        {/* Icon */}
        <div className={`${styles.iconContainer} ${config.iconClass}`}>
          <span className={styles.icon}>{config.icon}</span>
        </div>

        {/* Title */}
        <h2 className={styles.title}>{config.title}</h2>

        {/* Message */}
        {message && <p className={styles.message}>{message}</p>}

        {/* Error List */}
        {errorList && errorList.length > 0 && (
          <div className={styles.errorListContainer}>
            <h3 className={styles.errorListTitle}>Details:</h3>
            <ul className={styles.errorList}>
              {errorList.map((error, index) => (
                <li key={index} className={styles.errorItem}>
                  <span className={styles.errorBullet}>•</span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        <button 
          className={styles.actionButton}
          style={{ backgroundColor: config.color }}
          onClick={handleClose}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default MessagePopUp;