// ToastContent.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification from './ToastNotification';
import '../../assets/css/ToastNotification.css';

// Create context
const ToastContext = createContext(null);

// Hook to use the toast context
function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Provider component
function ToastProvider({ children, position = 'top-right' }) {
  const [toasts, setToasts] = useState([]);
  
  // Add a toast
  const addToast = useCallback((message, type = 'success', duration = 5000) => {
    const id = 'toast-' + Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    return id;
  }, []);
  
  // Remove a toast by its ID
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);
  
  // Helper functions
  const success = useCallback((message, duration) => 
    addToast(message, 'success', duration), [addToast]);
    
  const error = useCallback((message, duration) => 
    addToast(message, 'error', duration), [addToast]);
    
  const info = useCallback((message, duration) => 
    addToast(message, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
      {children}
      <div className={`toast-container ${position}`}>
        {toasts.map(toast => (
          <ToastNotification
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Export the components and hooks
export { useToast, ToastContext };
export default ToastProvider;