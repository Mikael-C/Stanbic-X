import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Common/Button';
import { useToast } from '../components/Common/Toast';

type Step = 'connect' | 'totp-setup' | 'totp-verify';

export default function Login() {
  const { connectWallet, verifyTotp, wallet, totpSetup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('connect');
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      await connectWallet();
      // After connect, check if TOTP setup is needed
      setStep('totp-setup');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async () => {
    if (totpCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const success = await verifyTotp(totpCode);
      if (success) {
        showToast('Authentication successful!', 'success');
        navigate('/');
      } else {
        setError('Invalid code. Please try again.');
        showToast('Invalid TOTP code', 'error');
      }
    } catch {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background effects */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.bgOrb3} />
      <div style={styles.gridBg} />

      <div style={styles.container}>
        {/* Hero Section */}
        <div style={styles.hero}>
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>
              <span style={styles.logoText}>SX</span>
            </div>
          </div>
          <h1 style={styles.title}>
            <span style={styles.titleGradient}>Prediction</span>{' '}
            Marketplace
          </h1>
          <p style={styles.subtitle}>
            Secure, decentralized prediction markets with integrated DeFi yield.
            Stake on outcomes, earn rewards, and trade positions.
          </p>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <div style={styles.cardShine} />

          {step === 'connect' && (
            <div style={styles.stepContent} className="animate-fadeIn">
              <div style={styles.stepHeader}>
                <div style={styles.stepNumber}>1</div>
                <div>
                  <h3 style={styles.stepTitle}>Connect Your Wallet</h3>
                  <p style={styles.stepDesc}>Link your MetaMask wallet to get started</p>
                </div>
              </div>

              <div style={styles.walletOptions}>
                <button style={styles.walletOption} onClick={handleConnect} disabled={loading}>
                  <div style={styles.walletIconWrap}>
                    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                      <rect width="40" height="40" rx="8" fill="#F6851B" fillOpacity="0.15" />
                      <path d="M30.4 10l-9.2 6.8 1.7-4L30.4 10z" fill="#E2761B" />
                      <path d="M9.6 10l9.1 6.9-1.6-4.1L9.6 10zM27 25.5l-2.4 3.7 5.2 1.4 1.5-5.1H27zM8.7 25.5l1.5 5.1 5.2-1.4-2.4-3.7H8.7z" fill="#E4761B" />
                      <path d="M15.1 19.1l-1.4 2.2 5.2.2-.2-5.6-3.6 3.2zM24.9 19.1l-3.7-3.3-.1 5.7 5.2-.2-1.4-2.2z" fill="#E4761B" />
                      <path d="M15.4 29.2l3.1-1.5-2.7-2.1-.4 3.6zM21.5 27.7l3.1 1.5-.4-3.6-2.7 2.1z" fill="#E4761B" />
                    </svg>
                  </div>
                  <div>
                    <span style={styles.walletName}>MetaMask</span>
                    <span style={styles.walletDesc}>Connect with browser extension</span>
                  </div>
                  {loading && <span className="spinner spinner-sm" style={{ marginLeft: 'auto' }} />}
                </button>
              </div>

              {error && (
                <div style={styles.errorBox}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              <div style={styles.features}>
                <div style={styles.featureItem}>
                  <span style={{ ...styles.featureDot, background: 'var(--color-success)' }} />
                  <span>Non-custodial & secure</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={{ ...styles.featureDot, background: 'var(--color-primary)' }} />
                  <span>2FA protected</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={{ ...styles.featureDot, background: 'var(--color-accent)' }} />
                  <span>DeFi yield integration</span>
                </div>
              </div>
            </div>
          )}

          {step === 'totp-setup' && (
            <div style={styles.stepContent} className="animate-slideUp">
              <div style={styles.stepHeader}>
                <div style={{ ...styles.stepNumber, background: 'var(--color-accent)' }}>2</div>
                <div>
                  <h3 style={styles.stepTitle}>Set Up 2FA</h3>
                  <p style={styles.stepDesc}>Scan the QR code with your authenticator app</p>
                </div>
              </div>

              {wallet && (
                <div style={styles.connectedBadge}>
                  <span style={styles.connectedDot} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-xs)' }}>
                    {wallet.slice(0, 6)}...{wallet.slice(-4)}
                  </span>
                  <span style={{ color: 'var(--color-success)', fontSize: 'var(--font-xs)' }}>Connected</span>
                </div>
              )}

              {totpSetup?.qrCode && (
                <div style={styles.qrContainer}>
                  <div style={styles.qrBox}>
                    <img
                      src={totpSetup.qrCode}
                      alt="TOTP QR Code"
                      style={styles.qrImage}
                    />
                  </div>
                  <div style={styles.secretContainer}>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
                      Or enter manually:
                    </span>
                    <code style={styles.secretCode}>{totpSetup.secret}</code>
                  </div>
                </div>
              )}

              <div style={styles.totpInputGroup}>
                <label style={styles.inputLabel}>Enter 6-digit code</label>
                <input
                  type="text"
                  className="input"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyTotp()}
                  style={{
                    textAlign: 'center',
                    fontSize: 'var(--font-2xl)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.3em',
                    fontWeight: 700,
                  }}
                  autoFocus
                />
              </div>

              {error && (
                <div style={styles.errorBox}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onClick={handleVerifyTotp}
              >
                Verify & Enter
              </Button>

              <button
                style={styles.backLink}
                onClick={() => { setStep('connect'); setError(''); }}
              >
                ← Back to wallet connect
              </button>
            </div>
          )}
        </div>

        {/* Bottom text */}
        <p style={styles.footerText}>
          By connecting, you agree to the Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
  },
  bgOrb1: {
    position: 'absolute',
    top: '-15%',
    left: '-10%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
    animation: 'float 8s ease-in-out infinite',
  },
  bgOrb2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-10%',
    width: '700px',
    height: '700px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
    animation: 'float 10s ease-in-out infinite reverse',
  },
  bgOrb3: {
    position: 'absolute',
    top: '40%',
    right: '30%',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
    animation: 'float 12s ease-in-out infinite',
  },
  gridBg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    maskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 70%)',
    WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 30%, transparent 70%)',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px',
    width: '100%',
    maxWidth: '480px',
    zIndex: 2,
  },
  hero: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  logoContainer: {
    marginBottom: '8px',
  },
  logoIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    background: 'var(--gradient-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)',
    animation: 'glowPulse 3s ease-in-out infinite',
  },
  logoText: {
    fontWeight: 800,
    fontSize: '24px',
    color: 'white',
    letterSpacing: '-0.02em',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: 'var(--color-text)',
    lineHeight: 1.1,
  },
  titleGradient: {
    background: 'var(--gradient-primary)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 'var(--font-base)',
    color: 'var(--color-text-secondary)',
    maxWidth: '380px',
    lineHeight: 1.6,
  },
  card: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: '0 16px 64px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
    position: 'relative',
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
  },
  stepContent: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  stepNumber: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 'var(--font-sm)',
    color: 'white',
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: 'var(--font-lg)',
    fontWeight: 700,
    color: 'var(--color-text)',
  },
  stepDesc: {
    fontSize: 'var(--font-sm)',
    color: 'var(--color-text-secondary)',
    marginTop: '2px',
  },
  walletOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  walletOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-family)',
    color: 'var(--color-text)',
    width: '100%',
    textAlign: 'left',
  },
  walletIconWrap: {
    flexShrink: 0,
  },
  walletName: {
    display: 'block',
    fontWeight: 600,
    fontSize: 'var(--font-base)',
  },
  walletDesc: {
    display: 'block',
    fontSize: 'var(--font-xs)',
    color: 'var(--color-text-tertiary)',
    marginTop: '2px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: 'var(--color-danger-muted)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-danger)',
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 'var(--radius-md)',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-text-secondary)',
  },
  featureDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  connectedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: 'var(--radius-full)',
    width: 'fit-content',
  },
  connectedDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--color-success)',
    boxShadow: '0 0 8px var(--color-success)',
  },
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  qrBox: {
    padding: '16px',
    background: 'white',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 0 30px rgba(59, 130, 246, 0.15)',
  },
  qrImage: {
    width: '180px',
    height: '180px',
    display: 'block',
  },
  secretContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  secretCode: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-xs)',
    padding: '6px 12px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    letterSpacing: '0.1em',
    userSelect: 'all',
    color: 'var(--color-text-secondary)',
  },
  totpInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inputLabel: {
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-tertiary)',
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--font-sm)',
    cursor: 'pointer',
    textAlign: 'center',
    padding: '4px',
    transition: 'color 0.2s ease',
  },
  footerText: {
    fontSize: 'var(--font-xs)',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
  },
};
