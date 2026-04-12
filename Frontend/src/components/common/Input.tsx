import { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

export function Input({ label, error, icon, className = '', id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <div className={`input-group ${className}`}>
      {label && <label htmlFor={inputId}>{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="material-symbols-outlined">{icon}</span>}
        <input
          id={inputId}
          className={error ? 'input-error' : ''}
          style={!icon ? { paddingLeft: '16px' } : undefined}
          {...props}
        />
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
