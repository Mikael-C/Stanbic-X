import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'success' | 'accent';
  label?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  label,
  fullPage = false,
}: LoadingSpinnerProps) {
  const colorClass = color !== 'primary' ? `spinner-${color}` : '';

  const spinner = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-md)',
      }}
    >
      <div className={`spinner spinner-${size} ${colorClass}`} />
      {label && (
        <span
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--color-text-secondary)',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          width: '100%',
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}
