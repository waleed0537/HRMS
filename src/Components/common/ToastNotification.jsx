// ToastNotification.jsx
import React, { useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

function ToastNotification({ 
  id,
  message, 
  type = 'success', 
  onClose, 
  duration = 3000
}) {
  const timerRef = useRef(null);
  
  // Set up auto-close timer when component mounts
  useEffect(() => {
    // Set timer to close after duration
    if (duration) {
      timerRef.current = setTimeout(() => {
        if (onClose) {
          onClose(id);
        }
      }, duration);
    }
    
    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration, id, onClose]);
  
  // Get icon based on toast type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="toast-icon" size={18} />;
      case 'error':
        return <AlertCircle className="toast-icon" size={18} />;
      default:
        return <Info className="toast-icon" size={18} />;
    }
  };
  
  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-content">
        {getIcon()}
        <p className="toast-message">{message}</p>
      </div>
      <button 
        className="toast-close" 
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
      <div className="toast-progress-bar">
        <div 
          className="toast-progress"
          style={{
            animationDuration: `${duration}ms`
          }}
        />
      </div>
    </div>
  );
}

export default ToastNotification;