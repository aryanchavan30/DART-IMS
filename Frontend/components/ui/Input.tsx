
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  // FIX: Add subLabel to support hint text.
  subLabel?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, type = 'text', className = '', icon, subLabel, ...props }, ref) => {
    const hasIcon = icon != null;
    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-secondary-blue mb-1">{label}</label>}
        <div className="relative">
          {hasIcon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
          <input
            id={id}
            type={type}
            ref={ref}
            className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-red focus:border-primary-red sm:text-sm ${hasIcon ? 'pl-10' : ''} ${className}`}
            {...props}
          />
        </div>
        {/* FIX: Render subLabel when provided. */}
        {subLabel && <p className="text-xs text-slate-500 mt-1">{subLabel}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;