import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X, Info } from 'lucide-react';

interface ToastNotificationProps {
  type: 'success' | 'error' | 'info';
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function ToastNotification({ 
  type, 
  message, 
  isVisible, 
  onClose, 
  duration = 4000 
}: ToastNotificationProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
          border: 'border-green-200',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          text: 'text-green-800',
          title: 'Success!'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-50 to-pink-50',
          border: 'border-red-200',
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          text: 'text-red-800',
          title: 'Error!'
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          border: 'border-blue-200',
          icon: <Info className="w-5 h-5 text-blue-600" />,
          title: 'Info'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-out">
      <div className={`${styles.bg} ${styles.border} border rounded-xl shadow-lg max-w-sm w-full overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {styles.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${styles.text}`}>
                {styles.title}
              </p>
              <p className={`text-sm mt-1 ${styles.text}`}>
                {message}
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={onClose}
                className={`${styles.text} hover:opacity-70 transition-opacity p-1 rounded-lg hover:bg-white hover:bg-opacity-50`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 animate-pulse" />
      </div>
    </div>
  );
}
