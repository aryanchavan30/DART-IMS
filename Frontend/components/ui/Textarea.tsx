
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  // FIX: Add subLabel to support hint text.
  subLabel?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, id, className = '', subLabel, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-secondary-blue mb-1">{label}</label>}
        <textarea
          id={id}
          ref={ref}
          className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-red focus:border-primary-red sm:text-sm ${className}`}
          rows={4}
          {...props}
        />
        {/* FIX: Render subLabel when provided. */}
        {subLabel && <p className="mt-1 text-xs text-slate-500">{subLabel}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;