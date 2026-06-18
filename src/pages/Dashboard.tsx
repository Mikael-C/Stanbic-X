import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Modal from '../components/Common/Modal';
import ProgressBar from '../components/Common/ProgressBar';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { StatusBadge } from '../components/Common/Badge';
import { useToast } from '../components/Common/Toast';
import { balanceApi, type SubAccount, type Transaction } from '../services/api';
import { formatAddress, formatUSD, formatDate, formatPercent, getTimeAgo } from '../utils/format';

export default function Dashboard() {
  const { wallet } = useAuth();
  const { showToast } = useToast();
  const [balance, setBalance] = useState({
    unified: 0,
    committed: 0,
    uncommitted: 0,
    totalYield: 0,
    subAccounts: [] as SubAccount[],
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositCoin, setDepositCoin] = useState('USDC');
  const [committedPct, setCommittedPct] = useState(70);
  const [depositLoading, setDepositLoading] = useState(false);

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawSource, setWithdrawSource] = useState('uncommitted');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balData, txData] = await Promise.all([
        balanceApi.getBalance(),
        balanceApi.getTransactions(),
      ]);
      setBalance(balData);
      setTransactions(txData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setDepositLoading(true);
    try {
      await balanceApi.deposit(parseFloat(depositAmount), depositCoin, committedPct);
      showToast(`Deposited ${formatUSD(parseFloat(depositAmount))} successfully!`, 'success');
      setShowDeposit(false);
      setDepositAmount('');
      loadData();
    } catch {
      showToast('Deposit failed. Please try again.', 'error');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    setWithdrawLoading(true);
    try {
      const result = await balanceApi.withdraw(parseFloat(withdrawAmount), withdrawSource);
      showToast(`Withdrawal successful! You will receive ${formatUSD(result.netReceived)}`, 'success');
      setShowWithdraw(false);
      setWithdrawAmount('');
      loadData();
    } catch {
      showToast('Withdrawal failed. Please try again.', 'error');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage size="lg" label="Loading dashboard..." />;

  const statsCards = [
    {
      label: 'Unified Balance',
      value: formatUSD(balance.unified),
      icon: '💎',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
      borderColor: 'rgba(59,130,246,0.3)',
    },
    {
      label: 'Committed',
      value: formatUSD(balance.committed),
      icon: '🔒',
      gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))',
      borderColor: 'rgba(139,92,246,0.3)',
    },
    {
      label: 'Uncommitted',
      value: formatUSD(balance.uncommitted),
      icon: '💰',
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))',
      borderColor: 'rgba(16,185,129,0.3)',
    },
    {
      label: 'Total Yield',
      value: formatUSD(balance.totalYield),
      icon: '📈',
      gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.15))',
      borderColor: 'rgba(245,158,11,0.3)',
    },
  ];

  const txIcons: Record<string, string> = {
    deposit: '↓',
    withdraw: '↑',
    stake: '⚡',
    payout: '🎉',
    yield: '📈',
  };

  const txColors: Record<string, string> = {
    deposit: 'var(--color-success)',
    withdraw: 'var(--color-danger)',
    stake: 'var(--color-primary)',
    payout: 'var(--color-accent)',
    yield: 'var(--color-warning)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ marginBottom: '4px' }}>
            Welcome back
            {wallet && <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}> · {formatAddress(wallet)}</span>}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>
            Here's an overview of your portfolio and yield performance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="primary" onClick={() => setShowDeposit(true)} icon={<span>↓</span>}>
            Deposit
          </Button>
          <Button variant="secondary" onClick={() => setShowWithdraw(true)} icon={<span>↑</span>}>
            Withdraw
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stagger-children" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
      }}>
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: stat.gradient,
              border: `1px solid ${stat.borderColor}`,
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                  {stat.value}
                </p>
              </div>
              <span style={{ fontSize: '28px' }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Committed Sub-Accounts */}
      <div>
        <h4 style={{ marginBottom: '16px' }}>Committed Sub-Accounts</h4>
        {balance.subAccounts.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-secondary)' }}>
              <p style={{ fontSize: 'var(--font-3xl)', marginBottom: '12px' }}>🔒</p>
              <p style={{ fontWeight: 500 }}>No committed sub-accounts yet</p>
              <p style={{ fontSize: 'var(--font-sm)', marginTop: '4px' }}>Deposit funds with a committed percentage to start earning yield.</p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
            {balance.subAccounts.map((sub) => (
              <Card key={sub.id} glow="accent">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'var(--color-accent-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      🔒
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Sub-Account #{sub.id}</p>
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
                        Created {formatDate(sub.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Principal</p>
                    <p style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>{formatUSD(sub.principal)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>Yield Accrued</p>
                    <p style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--color-success)' }}>+{formatUSD(sub.yieldAccrued)}</p>
                  </div>
                </div>

                <ProgressBar
                  value={sub.maturityProgress}
                  variant="accent"
                  label="Maturity Progress"
                  showPercent
                />
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
                  Matures: {formatDate(sub.maturityDate)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <h4 style={{ marginBottom: '16px' }}>Recent Transactions</h4>
        <Card padding="none">
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: `${txColors[tx.type]}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          color: txColors[tx.type],
                          fontWeight: 700,
                        }}>
                          {txIcons[tx.type]}
                        </div>
                        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{tx.type}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: tx.type === 'deposit' || tx.type === 'payout' || tx.type === 'yield'
                          ? 'var(--color-success)' : 'var(--color-text)',
                      }}>
                        {tx.type === 'deposit' || tx.type === 'payout' || tx.type === 'yield' ? '+' : '-'}
                        {formatUSD(tx.amount)}
                      </span>
                    </td>
                    <td><StatusBadge status={tx.status} /></td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{getTimeAgo(tx.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Deposit Modal */}
      <Modal
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        title="Deposit Funds"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeposit(false)}>Cancel</Button>
            <Button variant="primary" loading={depositLoading} onClick={handleDeposit}>
              Confirm Deposit
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <label className="input-label">You send</label>
            <input
              type="number"
              className="input"
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              style={{ fontSize: 'var(--font-xl)', fontWeight: 600 }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Stablecoin</label>
            <select className="input" value={depositCoin} onChange={(e) => setDepositCoin(e.target.value)}>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
              <option value="DAI">DAI</option>
            </select>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="input-label">Committed Percentage</label>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--color-accent)' }}>
                {committedPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={committedPct}
              onChange={(e) => setCommittedPct(parseInt(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
              <span>0% (all uncommitted)</span>
              <span>100% (all committed)</span>
            </div>
          </div>

          {depositAmount && parseFloat(depositAmount) > 0 && (
            <div style={{
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Committed</span>
                <span style={{ fontWeight: 600 }}>{formatUSD(parseFloat(depositAmount) * committedPct / 100)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Uncommitted</span>
                <span style={{ fontWeight: 600 }}>{formatUSD(parseFloat(depositAmount) * (100 - committedPct) / 100)}</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        title="Withdraw Funds"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowWithdraw(false)}>Cancel</Button>
            <Button variant="primary" loading={withdrawLoading} onClick={handleWithdraw}>
              Confirm Withdrawal
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <label className="input-label">Source</label>
            <select className="input" value={withdrawSource} onChange={(e) => setWithdrawSource(e.target.value)}>
              <option value="uncommitted">Uncommitted ({formatUSD(balance.uncommitted)})</option>
              <option value="yield">Yield ({formatUSD(balance.totalYield)})</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Amount</label>
            <input
              type="number"
              className="input"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              style={{ fontSize: 'var(--font-xl)', fontWeight: 600 }}
            />
          </div>

          {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
            <div style={{
              padding: '16px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>You receive</span>
              <span style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--color-success)' }}>
                {formatUSD(parseFloat(withdrawAmount))}
              </span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
