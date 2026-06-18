import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWeb3 } from '../../context/Web3Context';
import { formatAddress } from '../../utils/format';

export default function Navbar() {
  const { wallet, isAuthenticated, disconnectWallet } = useAuth();
  const { network, networkKey, switchNetwork } = useWeb3();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isLoginPage = location.pathname === '/login';

  return (
    <nav style={styles.navbar}>
      {/* Logo */}
      <Link to="/" style={styles.logo}>
        <div style={styles.logoIcon}>
          <span style={styles.logoText}>SX</span>
        </div>
        <span style={styles.logoLabel}>Secure</span>
      </Link>

      {/* Right Section */}
      <div style={styles.right}>
        {/* Network Indicator */}
        {isAuthenticated && (
          <div style={styles.networkBadge}>
            <span style={styles.networkDot} />
            <select
              value={networkKey}
              onChange={(e) => switchNetwork(e.target.value)}
              style={styles.networkSelect}
            >
              <option value="baseSepolia">Base Sepolia</option>
              <option value="hoodi">Hoodi</option>
            </select>
          </div>
        )}

        {/* Wallet */}
        {isAuthenticated && wallet ? (
          <div style={styles.userSection}>
            <button
              style={styles.walletButton}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div style={styles.walletAvatar}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span style={styles.walletAddr}>{formatAddress(wallet)}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showUserMenu && (
              <>
                <div style={styles.menuBackdrop} onClick={() => setShowUserMenu(false)} />
                <div style={styles.userMenu}>
                  <div style={styles.menuHeader}>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
                      Connected as
                    </span>
                    <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {formatAddress(wallet)}
                    </span>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
                      {network.name}
                    </span>
                  </div>
                  <div style={styles.menuDivider} />
                  <button style={styles.menuItem} onClick={disconnectWallet}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16,17 21,12 16,7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span style={{ color: 'var(--color-danger)' }}>Disconnect</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : !isLoginPage ? (
          <Link to="/login" className="btn btn-primary btn-sm">
            Connect Wallet
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 'var(--navbar-height)',
    background: 'rgba(10, 14, 39, 0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    color: 'var(--color-text)',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'var(--gradient-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-glow-primary)',
  },
  logoText: {
    fontWeight: 800,
    fontSize: '14px',
    color: 'white',
    letterSpacing: '-0.02em',
  },
  logoLabel: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    background: 'var(--gradient-primary)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  networkBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-xs)',
  },
  networkDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--color-success)',
    boxShadow: '0 0 8px var(--color-success)',
  },
  networkSelect: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
  },
  userSection: {
    position: 'relative' as const,
  },
  walletButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-full)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    transition: 'var(--transition-fast)',
  },
  walletAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'var(--gradient-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletAddr: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-xs)',
  },
  menuBackdrop: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 99,
  },
  userMenu: {
    position: 'absolute' as const,
    top: 'calc(100% + 8px)',
    right: 0,
    width: '240px',
    background: '#1e293b',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-xl)',
    zIndex: 100,
    animation: 'slideDown 0.2s ease-out',
    overflow: 'hidden',
  },
  menuHeader: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  menuDivider: {
    height: '1px',
    background: 'var(--color-border)',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
};
