import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useToast } from '../components/Common/Toast';
import { leaderboardApi, type LeaderboardEntry } from '../services/api';
import { formatAddress, formatUSD, formatPercent, formatDate } from '../utils/format';

export default function Leaderboard() {
  const { wallet, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [tab, setTab] = useState<'accuracy' | 'volume'>('accuracy');
  const [loading, setLoading] = useState(true);
  const [rewardPool, setRewardPool] = useState({ totalPool: 0, nextDistribution: '' });
  const [claimLoading, setClaimLoading] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [tab]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const [data, rewards] = await Promise.all([
        leaderboardApi.get(tab),
        leaderboardApi.getRewardPool(),
      ]);
      setEntries(data);
      setRewardPool(rewards);
    } catch (err) {
      console.error('Failed to fetch leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    setClaimLoading(true);
    try {
      const result = await leaderboardApi.claimReward();
      showToast(`Claimed ${formatUSD(result.amount)} in rewards!`, 'success');
    } catch {
      showToast('No rewards to claim', 'warning');
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage size="lg" label="Loading leaderboard..." />;

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const userEntry = wallet ? entries.find((e) => e.wallet.toLowerCase() === wallet.toLowerCase()) : null;

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const medalEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '20px 0 0' }}>
        <h1 style={{ marginBottom: '8px' }}>
          <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Top Predictors
          </span>
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto', fontSize: 'var(--font-base)' }}>
          The most accurate and prolific predictors on SX Secure. Climb the ranks, earn rewards.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface)', borderRadius: 'var(--radius-full)', padding: '4px', border: '1px solid var(--color-border)' }}>
          {(['accuracy', 'volume'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 24px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: tab === t ? 'var(--gradient-primary)' : 'transparent',
                color: tab === t ? 'white' : 'var(--color-text-secondary)',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                fontFamily: 'var(--font-family)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'capitalize',
              }}
            >
              {t === 'accuracy' ? '🎯 Accuracy' : '📊 Volume'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '16px', alignItems: 'flex-end', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {[1, 0, 2].map((idx) => {
          const entry = top3[idx];
          if (!entry) return <div key={idx} />;
          const isFirst = idx === 0;
          return (
            <div key={entry.rank} className="animate-slideUp" style={{ animationDelay: `${idx * 0.1}s` }}>
              <Card
                glow={isFirst ? 'primary' : 'none'}
                style={{
                  textAlign: 'center',
                  padding: isFirst ? '32px 20px' : '24px 16px',
                  background: isFirst
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))'
                    : 'var(--glass-bg)',
                }}
              >
                <div style={{ fontSize: isFirst ? '48px' : '36px', marginBottom: '8px' }}>
                  {medalEmojis[entry.rank - 1]}
                </div>
                <p style={{
                  fontSize: isFirst ? 'var(--font-3xl)' : 'var(--font-2xl)',
                  fontWeight: 800,
                  color: medalColors[entry.rank - 1],
                  marginBottom: '4px',
                }}>
                  #{entry.rank}
                </p>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--font-xs)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '12px',
                }}>
                  {formatAddress(entry.wallet)}
                </p>
                <p style={{
                  fontSize: isFirst ? 'var(--font-2xl)' : 'var(--font-xl)',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  marginBottom: '4px',
                }}>
                  {tab === 'accuracy' ? formatPercent(entry.accuracy || 0) : formatUSD(entry.volume || 0)}
                </p>
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
                  {entry.totalBets} bets · {formatUSD(entry.profit)} profit
                </p>
                <div style={{
                  marginTop: '12px',
                  padding: '6px 12px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--color-warning)' }}>
                    🏆 {formatUSD(entry.rewards)}
                  </span>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <Card padding="none">
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Wallet</th>
                  <th>{tab === 'accuracy' ? 'Accuracy' : 'Volume'}</th>
                  <th>Total Bets</th>
                  <th>Profit</th>
                  <th>Rewards</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((entry) => (
                  <tr key={entry.rank}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>#{entry.rank}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-xs)' }}>
                      {formatAddress(entry.wallet)}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {tab === 'accuracy' ? formatPercent(entry.accuracy || 0) : formatUSD(entry.volume || 0)}
                    </td>
                    <td>{entry.totalBets}</td>
                    <td style={{ fontWeight: 600, color: entry.profit > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {entry.profit > 0 ? '+' : ''}{formatUSD(entry.profit)}
                    </td>
                    <td style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                      {formatUSD(entry.rewards)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* User's rank & Reward pool */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* User rank */}
        {isAuthenticated && (
          <Card glow="primary">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: 800, color: 'white',
              }}>
                {userEntry ? `#${userEntry.rank}` : '?'}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 'var(--font-lg)' }}>Your Rank</p>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                  {userEntry
                    ? `${formatPercent(userEntry.accuracy || 0)} accuracy · ${userEntry.totalBets} bets`
                    : 'Place your first prediction to appear on the leaderboard'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Reward pool */}
        <Card glow="accent">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Reward Pool
              </p>
              <p style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--color-warning)' }}>
                {formatUSD(rewardPool.totalPool)}
              </p>
            </div>
            <span style={{ fontSize: '36px' }}>💰</span>
          </div>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginBottom: '12px' }}>
            Next distribution: {rewardPool.nextDistribution ? formatDate(rewardPool.nextDistribution) : 'TBD'}
          </p>
          {isAuthenticated && (
            <Button variant="primary" fullWidth loading={claimLoading} onClick={handleClaim}>
              Claim Rewards
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
