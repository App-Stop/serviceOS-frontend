import React from 'react';

export const Button = ({ children, variant = 'primary', icon, endIcon, type = 'button', disabled = false, onClick, className = '' }) => {
  const baseClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClass} ${className}`}
    >
      {/* Inner Radial Glow for Primary Button */}
      {variant === 'primary' && <span className="btn-primary-glow" />}

      {/* Start Icon */}
      {icon && <span className="relative z-10 flex items-center justify-center">{icon}</span>}
      
      {/* Label */}
      <span className="relative z-10">{children}</span>

      {/* End Icon */}
      {endIcon && <span className="relative z-10 flex items-center justify-center">{endIcon}</span>}
    </button>
  );
};
