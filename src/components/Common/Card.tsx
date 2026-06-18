import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  glow?: 'primary' | 'success' | 'accent' | 'none';
  onClick?: () => void;
  style?: React.CSSProperties;
}

const paddingMap = {
  none: '0',
  sm: 'var(--space-md)',
  md: 'var(--space-lg)',
  lg: 'var(--space-xl)',
};

const glowMap = {
  primary: 'var(--shadow-glow-primary)',
  success: 'var(--shadow-glow-success)',
  accent: 'var(--shadow-glow-accent)',
  none: 'none',
};

export default function Card({
  children,
  className = '',
  padding = 'md',
  hoverable = true,
  glow = 'none',
  onClick,
  style,
}: CardProps) {
  const cardStyle: React.CSSProperties = {
    padding: paddingMap[padding],
    cursor: onClick ? 'pointer' : undefined,
    boxShadow: glow !== 'none' ? glowMap[glow] : undefined,
    ...style,
  };

  return (
    <div
      className={`${hoverable ? 'glass-card' : 'glass-card-static'} ${className}`}
      style={cardStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}
