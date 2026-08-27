import React from 'react';

export const InputGroup = ({ label, type = 'text', placeholder, value, onChange, required = false, className = '', ...inputProps }) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="field-label">{label}{required && '*'}</label>}
      <input
        {...inputProps}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="field-input"
        required={required}
      />
    </div>
  );
};
