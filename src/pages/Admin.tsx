import React, { useState, useEffect } from 'react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Badge, { StatusBadge } from '../components/Common/Badge';
import { useToast } from '../components/Common/Toast';
import { adminApi, marketsApi, type Market, type ContractVerification, type SecurityLog, type LockedUser } from '../services/api';
import { formatAddress, formatUSD, formatDate, getTimeAgo } from '../utils/format';

type AdminTab = 'markets' | 'verification' | 'security';

export default function Admin() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<AdminTab>('markets');
  const [loading, setLoading] = useState(true);

  // Data
  const [pendingMarkets, setPendingMarkets] = useState<Market[]>([]);
  const [verifications, setVerifications] = useState<ContractVerification[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [lockedUsers, setLockedUsers] = useState<LockedUser[]>([]);

  const [resolveLoading, setResolveLoading] = useState<string | null>(null);
  const [unlockLoading, setUnlockLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'markets') {
        const data = await adminApi.getPendingMarkets();
        setPendingMarkets(data);
      } else if (tab === 'verification') {
        const data = await adminApi.getVerification();
        setVerifications(data);
      } else {
        const [logs, locked] = await Promise.all([
          adminApi.getSecurityLogs(),
          adminApi.getLockedUsers(),
        ]);
        setSecurityLogs(logs);
        setLockedUsers(locked);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (marketId: string, winner: 'yes' | 'no') => {
    setResolveLoading(marketId);
    try {
      await marketsApi.resolve(marketId, winner);
      showToast(`Market resolved — ${winner.toUpperCase()} wins!`, 'success');
      loadData();
    } catch {
      showToast('Resolution failed', 'error');
    } finally {
      setResolveLoading(null);
    }
  };

  const handleUnlock = async (wallet: string) => {
    setUnlockLoading(wallet);
    try {
      await adminApi.unlockUser(wallet);
      showToast(`User ${wallet} unlocked`, 'success');
      loadData();
    } catch {
      showToast('Unlock failed', 'error');
    } finally {
      setUnlockLoading(null);
    }
  };

  const handleDeploy = (verification: ContractVerification) => {
    if (!verification.verified) {
      showToast('Cannot deploy: Contract not formally verified', 'error');
      return;
    }
    showToast(`Deploying ${verification.name}...`, 'success');
  };

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'markets', label: 'Markets', icon: '📊' },
    { key: 'verification', label: 'Verification', icon: '✅' },
    { key: 'security', label: 'Security', icon: '🔒' },
  ];

  const severityColors: Record<string, string> = {
    high: 'var(--color-danger)',
    medium: 'var(--color-warning)',
    low: 'var(--color-text-tertiary)',
  };

  const severityBadge: Record<string, 'danger' | 'warning' | 'neutral'> = {
    high: 'danger',
    medium: 'warning',
    low: 'neutral',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Admin Panel
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>
          Manage markets, verify contracts, and monitor security.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '4px', border: '1px solid var(--color-border)', width: 'fit-content' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: tab === t.key ? 'var(--gradient-primary)' : 'transparent',
              color: tab === t.key ? 'white' : 'var(--color-text-secondary)',
              fontSize: 'var(--font-sm)',
              fontWeight: 600,
              fontFamily: 'var(--font-family)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner fullPage size="lg" />
      ) : (
        <>
          {/* Markets Tab */}
          {tab === 'markets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4>Pending Resolution ({pendingMarkets.length})</h4>
              {pendingMarkets.length === 0 ? (
                <Card>
                  <p style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                    No markets pending resolution.
                  </p>
                </Card>
              ) : (
                pendingMarkets.map((market) => (
                  <Card key={market.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <StatusBadge status={market.status} />
                          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
                            Market #{market.id}
                          </span>
                        </div>
                        <h5 style={{ marginBottom: '8px' }}>{market.question}</h5>
                        <div style={{ display: 'flex', gap: '16px', fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                          <span>Yes: {formatUSD(market.totalYesStake)}</span>
                          <span>No: {formatUSD(market.totalNoStake)}</span>
                          <span>Volume: {formatUSD(market.totalYesStake + market.totalNoStake)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="success"
                          size="sm"
                          loading={resolveLoading === market.id}
                          onClick={() => handleResolve(market.id, 'yes')}
                        >
                          ✓ YES Wins
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={resolveLoading === market.id}
                          onClick={() => handleResolve(market.id, 'no')}
                        >
                          ✕ NO Wins
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Verification Tab */}
          {tab === 'verification' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4>Contract Verification Status</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {verifications.map((v) => (
                  <Card key={v.name} glow={v.verified ? 'success' : 'none'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <h5>{v.name}</h5>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: v.verified ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                      }}>
                        {v.verified ? '✅' : '❌'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                        <span style={{ color: 'var(--color-text-tertiary)' }}>Address</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-xs)' }}>{formatAddress(v.address)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                        <span style={{ color: 'var(--color-text-tertiary)' }}>Network</span>
                        <span>{v.network}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                        <span style={{ color: 'var(--color-text-tertiary)' }}>Status</span>
                        <Badge variant={v.verified ? 'success' : 'danger'} dot>
                          {v.verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                        <span style={{ color: 'var(--color-text-tertiary)' }}>Properties Verified</span>
                        <span style={{ color: v.verified ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {v.propertiesVerified || 0} / {v.totalProperties || 0} passed
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--color-text-tertiary)' }}>Last Checked</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{getTimeAgo(v.lastChecked)}</span>
                      </div>
                      <Button
                        variant={v.verified ? "primary" : "outline"}
                        size="sm"
                        fullWidth
                        onClick={() => handleDeploy(v)}
                      >
                        Deploy Contract
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {tab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Locked Users */}
              {lockedUsers.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--color-danger)' }}>🔒</span>
                    Locked Users ({lockedUsers.length})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
                    {lockedUsers.map((user) => (
                      <Card key={user.wallet}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                            {user.wallet}
                          </span>
                          <Badge variant="danger" dot>Locked</Badge>
                        </div>
                        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                          {user.reason}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginBottom: '12px' }}>
                          <span>Locked: {getTimeAgo(user.lockedAt)}</span>
                          <span>Unlock: {formatDate(user.unlockAt)}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          fullWidth
                          loading={unlockLoading === user.wallet}
                          onClick={() => handleUnlock(user.wallet)}
                        >
                          Unlock User
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Logs */}
              <div>
                <h4 style={{ marginBottom: '12px' }}>Security Logs</h4>
                <Card padding="none">
                  <div className="table-container" style={{ border: 'none' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Severity</th>
                          <th>Type</th>
                          <th>Wallet</th>
                          <th>Message</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {securityLogs.map((log) => (
                          <tr key={log.id}>
                            <td>
                              <Badge variant={severityBadge[log.severity] || 'neutral'}>
                                {log.severity.toUpperCase()}
                              </Badge>
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: 'var(--font-sm)',
                                fontWeight: 500,
                                textTransform: 'capitalize',
                                color: log.type === 'jailbreak' ? 'var(--color-danger)' : 'var(--color-text)',
                              }}>
                                {log.type === 'jailbreak' ? '🚨' : log.type === 'rate_limit' ? '⏱' : '⚠️'}
                                {log.type.replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-xs)' }}>
                              {log.wallet}
                            </td>
                            <td style={{ fontSize: 'var(--font-sm)', maxWidth: '300px' }}>
                              <span className="truncate" style={{ display: 'block' }} title={log.message}>
                                {log.message}
                              </span>
                            </td>
                            <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-xs)', whiteSpace: 'nowrap' }}>
                              {getTimeAgo(log.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
