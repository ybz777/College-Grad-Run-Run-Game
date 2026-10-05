import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  wide?: boolean;
}

export function Panel({ children, wide = false }: Props) {
  return <div className={`jr-panel${wide ? ' wide' : ''}`}>{children}</div>;
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'gold' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
}

export function Button({ children, onClick, variant = 'gold', type = 'button' }: ButtonProps) {
  return (
    <button type={type} className={`jr-btn ${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}
