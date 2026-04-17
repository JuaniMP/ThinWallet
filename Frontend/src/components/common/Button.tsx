import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  icon?: string;
  children: ReactNode;
}

export function Button({ variant = 'primary', isLoading, icon, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? 'Cargando...' : (
        <>
          {children}
          {icon && <span className="material-symbols-outlined">{icon}</span>}
        </>
      )}
    </button>
  );
}
