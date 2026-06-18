import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  requireAuth?: boolean;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    requireAuth: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    path: '/markets',
    label: 'Markets',
    requireAuth: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
      </svg>
    ),
  },
  {
    path: '/orderbook',
    label: 'Order Book',
    requireAuth: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
  {
    path: '/leaderboard',
    label: 'Leaderboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 6 9 6 9z" />
        <path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 18 9 18 9z" />
        <path d="M4 22h16" />
        <path d="M10 22V8c0-1 .6-3 2-3s2 2 2 3v14" />
        <path d="M6 22v-5c0-1 .4-2 1.5-2h9c1.1 0 1.5 1 1.5 2v5" />
      </svg>
    ),
  },
  {
    path: '/ai-chat',
    label: 'AI Chat',
    requireAuth: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <circle cx="9" cy="10" r="1" fill="currentColor" />
        <circle cx="12" cy="10" r="1" fill="currentColor" />
        <circle cx="15" cy="10" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    path: '/admin',
    label: 'Admin',
    adminOnly: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.requireAuth && !isAuthenticated) return false;
    return true;
  });

  return (
    <aside style={styles.sidebar}>
      <nav style={styles.nav}>
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              }}
            >
              {isActive && <div style={styles.activeIndicator} />}
              <span style={{
                ...styles.navIcon,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
              }}>
                {item.icon}
              </span>
              <span style={{
                ...styles.navLabel,
                color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
                fontWeight: isActive ? 600 : 400,
              }}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={styles.bottom}>
        <div style={styles.divider} />
        <div style={styles.branding}>
          <span style={styles.version}>v1.0.0</span>
          <span style={styles.powered}>Powered by SX Protocol</span>
        </div>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 'var(--navbar-height)',
    bottom: 0,
    width: 'var(--sidebar-width)',
    background: 'rgba(10, 14, 39, 0.6)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '20px 12px',
    zIndex: 50,
    transition: 'var(--transition-base)',
    overflowY: 'auto',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  navLinkActive: {
    background: 'var(--color-primary-muted)',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '20px',
    borderRadius: '0 4px 4px 0',
    background: 'var(--color-primary)',
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    flexShrink: 0,
    transition: 'color 0.2s ease',
  },
  navLabel: {
    fontSize: 'var(--font-sm)',
    transition: 'color 0.2s ease',
    whiteSpace: 'nowrap',
  },
  bottom: {
    marginTop: 'auto',
  },
  divider: {
    height: '1px',
    background: 'var(--color-border)',
    margin: '12px 0',
  },
  branding: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 14px',
  },
  version: {
    fontSize: 'var(--font-xs)',
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  powered: {
    fontSize: 'var(--font-xs)',
    color: 'var(--color-text-muted)',
  },
};
