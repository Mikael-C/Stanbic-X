import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'neutral';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'neutral',
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${dot ? 'badge-dot' : ''} ${className}`}>
      {children}
    </span>
  );
}

// Convenience helpers for market status
export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    open: { variant: 'success', label: 'Open' },
    closed: { variant: 'warning', label: 'Closed' },
    resolved: { variant: 'primary', label: 'Resolved' },
    active: { variant: 'success', label: 'Active' },
    matured: { variant: 'accent', label: 'Matured' },
    pending: { variant: 'warning', label: 'Pending' },
    completed: { variant: 'success', label: 'Completed' },
    failed: { variant: 'danger', label: 'Failed' },
  };

  const cfg = config[status] || { variant: 'neutral' as const, label: status };

  return (
    <Badge variant={cfg.variant} dot>
      {cfg.label}
    </Badge>
  );
}
