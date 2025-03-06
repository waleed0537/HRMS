// ToastNotification.jsx
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import '../../assets/css/ToastNotification.css';

const ToastNotification = ({ 
  message, 
  type = 'success', 
  onClose, 
  duration = 5000,
  position = 'bottom-right'
}) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="toast-icon" />;
      case 'error':
        return <AlertCircle className="toast-icon" />;
      case 'info':
        return <Info className="toast-icon" />;
      default:
        return <Info className="toast-icon" />;
    }
  };

  return (
    <div className={`toast-notification ${type} ${position} toast-show`}>
      <div className="toast-content">
        {getIcon()}
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={onClose}>
        <X size={16} />
      </button>
      <div className="toast-progress"></div>
    </div>
  );
};

export default ToastNotification;