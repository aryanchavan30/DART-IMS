
import React from 'react';

interface CheckboxProps {
  label: React.ReactNode;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, name, checked, onChange, required }) => {
  return (
    <label className="flex items-start space-x-3 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        required={required}
        className="h-5 w-5 mt-0.5 rounded border-gray-300 text-primary-red focus:ring-primary-red"
      />
      <span className="text-sm text-primary-navy">{label}</span>
    </label>
  );
};

export default Checkbox;
