import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconOnly = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    iconOnly ? 'btn-icon' : '',
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="spinner spinner-sm" style={{ borderTopColor: 'currentColor' }} />
      ) : icon ? (
        <span style={{ display: 'flex', alignItems: 'center', fontSize: '1.1em' }}>{icon}</span>
      ) : null}
      {!iconOnly && children}
    </button>
  );
}
