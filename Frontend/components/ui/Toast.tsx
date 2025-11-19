
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const icons = {
  success: <CheckCircle className="h-6 w-6 text-green-500" />,
  error: <XCircle className="h-6 w-6 text-red-500" />,
  info: <Info className="h-6 w-6 text-blue-500" />,
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  return (
    <div className={`flex items-center bg-white shadow-lg rounded-lg p-4 max-w-sm w-full animate-in fade-in-0 slide-in-from-top-5`}>
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-primary-navy">{message}</p>
      </div>
      <div className="ml-4 flex-shrink-0 flex">
        <button onClick={onClose} className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <span className="sr-only">Close</span>
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;