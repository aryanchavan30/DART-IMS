
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, id, children, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-secondary-blue mb-1">{label}</label>}
        <select
          id={id}
          ref={ref}
          className={`block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-red focus:border-primary-red sm:text-sm rounded-md ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;