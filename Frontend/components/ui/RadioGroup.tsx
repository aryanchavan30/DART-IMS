
import React from 'react';

interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  inline?: boolean;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ name, options, value, onChange, required, inline = true }) => {
  return (
    <div className={`flex ${inline ? 'space-x-4' : 'flex-col space-y-2'}`}>
      {options.map(option => (
        <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            required={required}
            className="h-4 w-4 text-primary-red border-gray-300 focus:ring-primary-red"
          />
          <span className="text-sm text-primary-navy">{option.label}</span>
        </label>
      ))}
    </div>
  );
};

export default RadioGroup;
