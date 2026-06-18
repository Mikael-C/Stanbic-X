import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  variant?: 'primary' | 'success' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showPercent?: boolean;
  animated?: boolean;
}

export default function ProgressBar({
  value,
  variant = 'primary',
  size = 'md',
  label,
  showPercent = false,
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const variantClass =
    variant === 'success'
      ? 'progress-bar-success'
      : variant === 'accent'
        ? 'progress-bar-accent'
        : '';

  const sizeClass = size === 'lg' ? 'progress-container-lg' : '';

  return (
    <div style={{ width: '100%' }}>
      {(label || showPercent) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
          }}
        >
          {label && (
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)' }}>
              {label}
            </span>
          )}
          {showPercent && (
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text)', fontWeight: 600 }}>
              {clamped.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`progress-container ${sizeClass}`}>
        <div
          className={`progress-bar ${variantClass}`}
          style={{
            width: `${clamped}%`,
            transition: animated ? 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}
        />
      </div>
    </div>
  );
}
