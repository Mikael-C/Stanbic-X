import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { StatusBadge } from '../components/Common/Badge';
import { useToast } from '../components/Common/Toast';
import { marketsApi, type MarketDetail as MarketDetailType, type Position, type StakeHistory } from '../services/api';
import { formatUSD, formatOdds, formatCountdown, formatDate, formatAddress, getTimeAgo } from '../utils/format';

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, wallet } = useAuth();
  const { showToast } = useToast();

  const [market, setMarket] = useState<MarketDetailType | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<StakeHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Staking
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeOutcome, setStakeOutcome] = useState<'yes' | 'no' | null>(null);
  const [stakeLoading, setStakeLoading] = useState(false);

  // Resolution
  const [resolveWinner, setResolveWinner] = useState<'yes' | 'no'>('yes');
  const [resolveLoading, setResolveLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  useEffect(() => {
    loadMarket();
  }, [id]);

  const loadMarket = async () => {
    if (!id) return;
    try {
      const data = await marketsApi.getById(id);
      setMarket(data);
      setPositions(data.positions || []);
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to fetch market detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!stakeOutcome || !stakeAmount || !id) return;
    setStakeLoading(true);
    try {
      const result = await marketsApi.stake(id, stakeOutcome, parseFloat(stakeAmount));
      showToast(`Staked ${formatUSD(parseFloat(stakeAmount))} on ${stakeOutcome.toUpperCase()}. Potential payout: ${formatUSD(result.potentialPayout)}`, 'success');
      setStakeAmount('');
      setStakeOutcome(null);
      loadMarket();
    } catch (err: any) {
      showToast(err.message || 'Stake failed. Please try again.', 'error');
    } finally {
      setStakeLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!id) return;
    setResolveLoading(true);
    try {
      await marketsApi.resolve(id, resolveWinner);
      showToast(`Market resolved — ${resolveWinner.toUpperCase()} wins!`, 'success');
      loadMarket();
    } catch {
      showToast('Resolution failed.', 'error');
    } finally {
      setResolveLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!id) return;
    setClaimLoading(true);
    try {
      const result = await marketsApi.claimPayout(id);
      showToast(`Payout claimed: ${formatUSD(result.payout)}`, 'success');
      loadMarket();
    } catch {
      showToast('Claim failed.', 'error');
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading || !market) return <LoadingSpinner fullPage size="lg" label="Loading market..." />;

  const total = market.totalYesStake + market.totalNoStake;
  const yesPct = total > 0 ? (market.totalYesStake / total) * 100 : 50;
  const potentialPayout = stakeAmount && stakeOutcome
    ? parseFloat(stakeAmount) * (stakeOutcome === 'yes' ? market.yesOdds : market.noOdds)
    : 0;
  const isEnded = new Date(market.endDate).getTime() <= Date.now();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/markets')}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-sm)', cursor: 'pointer', fontFamily: 'var(--font-family)',
          padding: 0, width: 'fit-content', transition: 'color 0.2s',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Markets
      </button>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <StatusBadge status={market.status} />
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ⏱ {formatCountdown(market.endDate)}
          </span>
          {market.winner && (
            <span className={`badge ${market.winner === 'yes' ? 'badge-success' : 'badge-danger'}`}>
              Winner: {market.winner.toUpperCase()}
            </span>
          )}
        </div>
        <h2 style={{ lineHeight: 1.3, maxWidth: '800px' }}>{market.question}</h2>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-xs)', marginTop: '8px' }}>
          Created by {formatAddress(market.creator)} · {formatDate(market.createdAt)} · Min stake: {formatUSD(market.minStake)}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Odds Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Card
              glow="success"
              style={{
                textAlign: 'center',
                cursor: market.status === 'open' ? 'pointer' : 'default',
                border: stakeOutcome === 'yes' ? '2px solid var(--color-success)' : undefined,
              }}
              onClick={() => market.status === 'open' && setStakeOutcome('yes')}
            >
              <p style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                Yes
              </p>
              <p style={{ fontSize: 'var(--font-4xl)', fontWeight: 800, color: 'var(--color-success)', letterSpacing: '-0.02em' }}>
                {formatOdds(market.yesOdds)}
              </p>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
                {formatUSD(market.totalYesStake)} staked
              </p>
            </Card>

            <Card
              glow="primary"
              style={{
                textAlign: 'center',
                cursor: market.status === 'open' ? 'pointer' : 'default',
                border: stakeOutcome === 'no' ? '2px solid var(--color-danger)' : undefined,
              }}
              onClick={() => market.status === 'open' && setStakeOutcome('no')}
            >
              <p style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                No
              </p>
              <p style={{ fontSize: 'var(--font-4xl)', fontWeight: 800, color: 'var(--color-danger)', letterSpacing: '-0.02em' }}>
                {formatOdds(market.noOdds)}
              </p>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
                {formatUSD(market.totalNoStake)} staked
              </p>
            </Card>
          </div>

          {/* Odds Bar */}
          <Card hoverable={false}>
            <p style={{ fontSize: 'var(--font-sm)', fontWeight: 600, marginBottom: '12px' }}>Market Distribution</p>
            <div style={{ height: '12px', borderRadius: 'var(--radius-full)', display: 'flex', overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ width: `${yesPct}%`, background: 'var(--gradient-success)', borderRadius: 'var(--radius-full) 0 0 var(--radius-full)', transition: 'width 0.8s ease' }} />
              <div style={{ width: `${100 - yesPct}%`, background: 'var(--gradient-danger)', borderRadius: '0 var(--radius-full) var(--radius-full) 0', transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-success)', fontWeight: 600 }}>
                {yesPct.toFixed(1)}% Yes · {formatUSD(market.totalYesStake)}
              </span>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-danger)', fontWeight: 600 }}>
                {(100 - yesPct).toFixed(1)}% No · {formatUSD(market.totalNoStake)}
              </span>
            </div>
            <p style={{ textAlign: 'center', marginTop: '10px', fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
              Total Volume: {formatUSD(total)}
            </p>
          </Card>

          {/* Positions */}
          <div>
            <h5 style={{ marginBottom: '12px' }}>Your Positions</h5>
            {positions.length === 0 ? (
              <Card>
                <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '24px' }}>
                  No positions yet. Stake on an outcome to get started.
                </p>
              </Card>
            ) : (
              <Card padding="none">
                <div className="table-container" style={{ border: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Outcome</th>
                        <th>Amount</th>
                        <th>Potential Payout</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos) => (
                        <tr key={pos.id}>
                          <td>
                            <span className={`badge ${pos.outcome === 'yes' ? 'badge-success' : 'badge-danger'}`}>
                              {pos.outcome.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatUSD(pos.amount)}</td>
                          <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatUSD(pos.potentialPayout)}</td>
                          <td style={{ color: 'var(--color-text-secondary)' }}>{getTimeAgo(pos.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* Stake History */}
          <div>
            <h5 style={{ marginBottom: '12px' }}>Stake History</h5>
            <Card padding="none">
              <div className="table-container" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Wallet</th>
                      <th>Outcome</th>
                      <th>Amount</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-xs)' }}>{formatAddress(h.wallet)}</td>
                        <td>
                          <span className={`badge ${h.outcome === 'yes' ? 'badge-success' : 'badge-danger'}`}>
                            {h.outcome.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatUSD(h.amount)}</td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{getTimeAgo(h.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: 'calc(var(--navbar-height) + 24px)' }}>
          {/* Staking */}
          {market.status === 'open' && (
            <Card hoverable={false}>
              <h5 style={{ marginBottom: '16px' }}>Place Your Stake</h5>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  onClick={() => setStakeOutcome('yes')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                    border: stakeOutcome === 'yes' ? '2px solid var(--color-success)' : '1px solid var(--color-border)',
                    background: stakeOutcome === 'yes' ? 'rgba(16,185,129,0.1)' : 'transparent',
                    color: stakeOutcome === 'yes' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    cursor: 'pointer', fontFamily: 'var(--font-family)', fontWeight: 700,
                    fontSize: 'var(--font-sm)', transition: 'all 0.2s ease',
                  }}
                >
                  YES {formatOdds(market.yesOdds)}
                </button>
                <button
                  onClick={() => setStakeOutcome('no')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                    border: stakeOutcome === 'no' ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                    background: stakeOutcome === 'no' ? 'rgba(239,68,68,0.1)' : 'transparent',
                    color: stakeOutcome === 'no' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                    cursor: 'pointer', fontFamily: 'var(--font-family)', fontWeight: 700,
                    fontSize: 'var(--font-sm)', transition: 'all 0.2s ease',
                  }}
                >
                  NO {formatOdds(market.noOdds)}
                </button>
              </div>

              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label">You send</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  style={{ fontSize: 'var(--font-xl)', fontWeight: 600 }}
                  min={market.minStake}
                />
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
                  Min: {formatUSD(market.minStake)}
                </span>
              </div>

              {potentialPayout > 0 && (
                <div style={{
                  padding: '14px',
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>You receive if correct</span>
                  <span style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--color-success)' }}>
                  {formatUSD(potentialPayout)}
                  </span>
                </div>
              )}

              {isEnded ? (
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  disabled={true}
                >
                  Market Ended
                </Button>
              ) : (
                <Button
                  variant={stakeOutcome === 'yes' ? 'success' : stakeOutcome === 'no' ? 'danger' : 'primary'}
                  fullWidth
                  size="lg"
                  onClick={handleStake}
                  loading={stakeLoading}
                  disabled={!stakeOutcome || !stakeAmount || market.status !== 'open'}
                >
                  Stake on {stakeOutcome ? stakeOutcome.toUpperCase() : 'OUTCOME'}
                </Button>
              )}
            </Card>
          )}

          {/* Claim Payout */}
          {market.status === 'resolved' && (
            <Card hoverable={false} glow="success">
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</p>
                <h5 style={{ marginBottom: '8px' }}>Market Resolved</h5>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)', marginBottom: '16px' }}>
                  Winner: <strong style={{ color: market.winner === 'yes' ? 'var(--color-success)' : 'var(--color-danger)' }}>{market.winner?.toUpperCase()}</strong>
                </p>
                <Button variant="success" fullWidth size="lg" loading={claimLoading} onClick={handleClaim}>
                  Claim Payout
                </Button>
              </div>
            </Card>
          )}

          {/* Admin Resolution */}
          {isAdmin && market.status === 'open' && (
            <Card hoverable={false}>
              <h5 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Admin: Resolve Market
              </h5>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  onClick={() => setResolveWinner('yes')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 'var(--radius-md)',
                    border: resolveWinner === 'yes' ? '2px solid var(--color-success)' : '1px solid var(--color-border)',
                    background: resolveWinner === 'yes' ? 'rgba(16,185,129,0.15)' : 'transparent',
                    color: resolveWinner === 'yes' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    cursor: 'pointer', fontFamily: 'var(--font-family)', fontWeight: 700,
                    fontSize: 'var(--font-sm)',
                  }}
                >
                  YES Wins
                </button>
                <button
                  onClick={() => setResolveWinner('no')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 'var(--radius-md)',
                    border: resolveWinner === 'no' ? '2px solid var(--color-danger)' : '1px solid var(--color-border)',
                    background: resolveWinner === 'no' ? 'rgba(239,68,68,0.15)' : 'transparent',
                    color: resolveWinner === 'no' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                    cursor: 'pointer', fontFamily: 'var(--font-family)', fontWeight: 700,
                    fontSize: 'var(--font-sm)',
                  }}
                >
                  NO Wins
                </button>
              </div>
              <Button variant="danger" fullWidth loading={resolveLoading} onClick={handleResolve}>
                Resolve Market
              </Button>
            </Card>
          )}

          {/* Market Info */}
          <Card hoverable={false}>
            <h5 style={{ marginBottom: '12px' }}>Market Info</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                ['Status', market.status],
                ['End Date', formatDate(market.endDate)],
                ['Min Stake', formatUSD(market.minStake)],
                ['Total Volume', formatUSD(total)],
                ['Creator', formatAddress(market.creator)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{label}</span>
                  <span style={{ fontWeight: 500, textTransform: label === 'Status' ? 'capitalize' : 'none' }}>{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
