import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FormField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder,
  disabled = false,
  className = '',
  autoComplete,
  min,
  max,
  step,
  rows = 3,
  options = [], // for select fields
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const inputClasses = `
    w-full px-4 py-3 bg-white/5 border rounded-lg transition-all duration-200
    text-neutral placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/50
    ${error ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-primary'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  const labelClasses = `
    absolute left-4 transition-all duration-200 pointer-events-none
    ${isFocused || value || (type === 'date' && value) || (type === 'select' && value)
      ? 'top-1 text-xs text-primary'
      : 'top-3 text-sm text-neutral/70'}
  `;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderInput = () => {
    const commonProps = {
      id: name,
      name,
      value,
      onChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      disabled,
      autoComplete,
      className: inputClasses,
      placeholder: isFocused ? placeholder : '',
      ...props
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
            minLength={min}
            maxLength={max}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="" disabled hidden></option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'password':
        return (
          <div className="relative">
            <input
              {...commonProps}
              type={showPassword ? 'text' : 'password'}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral/70 hover:text-neutral transition-colors duration-200"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        );

      default:
        return (
          <input
            {...commonProps}
            type={type}
            min={min}
            max={max}
            step={step}
          />
        );
    }
  };

  return (
    <div className="relative mb-6">
      {renderInput()}
      <label htmlFor={name} className={labelClasses}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {error && (
        <p className="mt-1 text-sm text-red-500 flex items-center">
          {error}
        </p>
      )}

      {/* Character count for textarea */}
      {type === 'textarea' && max && (
        <p className="mt-1 text-xs text-neutral/50">
          {value?.length || 0}/{max} characters
        </p>
      )}
    </div>
  );
};

export default FormField;
