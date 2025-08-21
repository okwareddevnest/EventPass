import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const Notification = ({ notifications, removeNotification }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'info':
      default:
        return <Info size={20} className="text-blue-500" />;
    }
  };

  const getStyles = (type) => {
    const baseStyles = "flex items-start p-4 mb-4 rounded-lg shadow-lg border backdrop-blur-md transition-all duration-300";

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-500/10 border-green-500/20 text-green-100`;
      case 'error':
        return `${baseStyles} bg-red-500/10 border-red-500/20 text-red-100`;
      case 'warning':
        return `${baseStyles} bg-yellow-500/10 border-yellow-500/20 text-yellow-100`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-500/10 border-blue-500/20 text-blue-100`;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={getStyles(notification.type)}
        >
          <div className="flex-shrink-0 mr-3 mt-0.5">
            {getIcon(notification.type)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {notification.message}
            </p>
          </div>

          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 ml-3 p-1 hover:bg-white/10 rounded transition-colors duration-200"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notification;
