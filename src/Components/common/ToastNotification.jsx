// ToastNotification.jsx
import React, { useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

function ToastNotification({ 
  id,
  message, 
  type = 'success', 
  onClose, 
  duration = 5000
}) {
  const timerRef = useRef(null);
  const toastRef = useRef(null);
  
  // Setup close function
  const close = () => {
    // Add exit class for animation
    if (toastRef.current) {
      toastRef.current.classList.add('toast-exit');
      
      // Wait for animation to complete before actually removing
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 300); // Match this with CSS animation duration
    }
  };
  
  // Set up auto-close timer when component mounts
  useEffect(() => {
    // Set timer to close after duration
    if (duration) {
      timerRef.current = setTimeout(() => {
        close();
      }, duration);
    }
    
    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  // Get icon based on toast type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="toast-icon" size={20} />;
      case 'error':
        return <AlertCircle className="toast-icon" size={20} />;
      default:
        return <Info className="toast-icon" size={20} />;
    }
  };
  
  return (
    <div 
      ref={toastRef}
      className={`toast-notification ${type}`}
      onClick={(e) => e.stopPropagation()}
      data-id={id}
    >
      <div className="toast-content">
        {getIcon()}
        <p className="toast-message">{message}</p>
      </div>
      <button 
        className="toast-close" 
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
      {/* Progress bar that triggers close when animation ends */}
      <div className="toast-progress-bg">
        <div 
          className="toast-progress" 
          style={{ animationDuration: `${duration}ms` }}
          onAnimationEnd={close}
        />
      </div>
    </div>
  );
}

export default ToastNotification;