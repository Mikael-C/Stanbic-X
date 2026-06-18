import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Badge, { StatusBadge } from '../components/Common/Badge';
import { useToast } from '../components/Common/Toast';
import { marketsApi, type Market } from '../services/api';
import { formatUSD, formatOdds, formatCountdown, shortenText } from '../utils/format';

export default function Markets() {
  const { showToast } = useToast();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Create form
  const [createQ, setCreateQ] = useState('');
  const [createEnd, setCreateEnd] = useState('');
  const [createMin, setCreateMin] = useState('10');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    try {
      const data = await marketsApi.getAll();
      setMarkets(data);
    } catch (err) {
      console.error('Failed to fetch markets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createQ || !createEnd || !createMin) return;
    setCreateLoading(true);
    try {
      await marketsApi.create({ question: createQ, endDate: createEnd, minStake: parseFloat(createMin) });
      showToast('Market created successfully!', 'success');
      setShowCreate(false);
      setCreateQ('');
      setCreateEnd('');
      setCreateMin('10');
      loadMarkets();
    } catch {
      showToast('Failed to create market', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Filtering & sorting
  const filtered = markets
    .filter((m) => statusFilter === 'all' || m.status === statusFilter)
    .filter((m) => !search || m.question.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'volume') return (b.totalYesStake + b.totalNoStake) - (a.totalYesStake + a.totalNoStake);
      return 0;
    });

  if (loading) return <LoadingSpinner fullPage size="lg" label="Loading markets..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>Markets</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>
            Browse prediction markets or create your own.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)} icon={<span>+</span>}>
          Create Market
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '400px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="input"
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '3px', border: '1px solid var(--color-border)' }}>
          {['all', 'open', 'closed', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: statusFilter === s ? 'var(--color-primary)' : 'transparent',
                color: statusFilter === s ? 'white' : 'var(--color-text-secondary)',
                fontSize: 'var(--font-xs)',
                fontWeight: 600,
                fontFamily: 'var(--font-family)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 'auto', minWidth: '140px' }}>
          <option value="newest">Newest First</option>
          <option value="volume">Highest Volume</option>
        </select>
      </div>

      {/* Markets Grid */}
      {filtered.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-secondary)' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📊</p>
            <h4>No markets found</h4>
            <p style={{ fontSize: 'var(--font-sm)', marginTop: '8px' }}>Try adjusting your filters or create a new market.</p>
          </div>
        </Card>
      ) : (
        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
          {filtered.map((market) => {
            const total = market.totalYesStake + market.totalNoStake;
            const yesPct = total > 0 ? (market.totalYesStake / total) * 100 : 50;

            return (
              <Link key={market.id} to={`/markets/${market.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card style={{ height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <StatusBadge status={market.status} />
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                      ⏱ {formatCountdown(market.endDate)}
                    </span>
                  </div>

                  <h5 style={{ marginBottom: '16px', lineHeight: 1.4, fontWeight: 600, minHeight: '48px' }}>
                    {shortenText(market.question, 90)}
                  </h5>

                  {/* Odds Display */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <div style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                    }}>
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-success)', fontWeight: 600, marginBottom: '4px' }}>YES</p>
                      <p style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--color-success)' }}>{formatOdds(market.yesOdds)}</p>
                    </div>
                    <div style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                    }}>
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-danger)', fontWeight: 600, marginBottom: '4px' }}>NO</p>
                      <p style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--color-danger)' }}>{formatOdds(market.noOdds)}</p>
                    </div>
                  </div>

                  {/* Odds Bar */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{
                      height: '8px',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      overflow: 'hidden',
                      background: 'rgba(255,255,255,0.05)',
                    }}>
                      <div style={{ width: `${yesPct}%`, background: 'var(--color-success)', transition: 'width 0.5s ease', borderRadius: 'var(--radius-full) 0 0 var(--radius-full)' }} />
                      <div style={{ width: `${100 - yesPct}%`, background: 'var(--color-danger)', transition: 'width 0.5s ease', borderRadius: '0 var(--radius-full) var(--radius-full) 0' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-success)' }}>{yesPct.toFixed(0)}% Yes</span>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-danger)' }}>{(100 - yesPct).toFixed(0)}% No</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
                      Total Staked
                    </span>
                    <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--color-text)' }}>
                      {formatUSD(total)}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Market Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Market"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" loading={createLoading} onClick={handleCreate}>
              Create Market
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <label className="input-label">Question</label>
            <textarea
              className="input"
              placeholder="Will [event] happen by [date]?"
              value={createQ}
              onChange={(e) => setCreateQ(e.target.value)}
              rows={3}
            />
          </div>
          <div className="input-group">
            <label className="input-label">End Date</label>
            <input type="datetime-local" className="input" value={createEnd} onChange={(e) => setCreateEnd(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Minimum Stake ($)</label>
            <input type="number" className="input" placeholder="10" value={createMin} onChange={(e) => setCreateMin(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
