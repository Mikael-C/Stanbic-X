import React, { useState, useEffect } from 'react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useToast } from '../components/Common/Toast';
import { orderBookApi, marketsApi, type OrderListing, type Position } from '../services/api';
import { formatUSD, formatAddress, getTimeAgo } from '../utils/format';
import { useWebSocket } from '../hooks/useWebSocket';

export default function OrderBook() {
  const { showToast } = useToast();
  const [listings, setListings] = useState<OrderListing[]>([]);
  const [myPositions, setMyPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  // List for sale modal
  const [showList, setShowList] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [listPrice, setListPrice] = useState('');
  const [listLoading, setListLoading] = useState(false);

  // Buy modal
  const [showBuy, setShowBuy] = useState(false);
  const [selectedListing, setSelectedListing] = useState<OrderListing | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);

  // WebSocket for real-time
  useWebSocket({
    onOrderBookUpdate: () => loadData(),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await orderBookApi.getListings();
      setListings(data);
    } catch (err) {
      console.error('Failed to fetch order book data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleList = async () => {
    if (!selectedPosition || !listPrice) return;
    setListLoading(true);
    try {
      await orderBookApi.listPosition(selectedPosition.id, parseFloat(listPrice));
      showToast('Position listed successfully!', 'success');
      setShowList(false);
      setListPrice('');
      loadData();
    } catch {
      showToast('Failed to list position', 'error');
    } finally {
      setListLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!selectedListing) return;
    setBuyLoading(true);
    try {
      await orderBookApi.buyPosition(selectedListing.id);
      showToast(`Purchased position for ${formatUSD(selectedListing.price)}!`, 'success');
      setShowBuy(false);
      loadData();
    } catch {
      showToast('Purchase failed', 'error');
    } finally {
      setBuyLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage size="lg" label="Loading order book..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2>Order Book</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>
          Browse and buy listed positions, or list your own for sale.
        </p>
      </div>

      {/* My Positions */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4>My Positions</h4>
        </div>
        {myPositions.length === 0 ? (
          <Card>
            <p style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
              You have no positions. Stake on a market to create positions.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {myPositions.map((pos) => (
              <Card key={pos.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className={`badge ${pos.outcome === 'yes' ? 'badge-success' : 'badge-danger'}`}>
                    {pos.outcome.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
                    Market #{pos.marketId}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>Staked</p>
                    <p style={{ fontWeight: 700 }}>{formatUSD(pos.amount)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>Potential</p>
                    <p style={{ fontWeight: 700, color: 'var(--color-success)' }}>{formatUSD(pos.potentialPayout)}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setSelectedPosition(pos);
                    setShowList(true);
                  }}
                >
                  List for Sale
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Listings */}
      <div>
        <h4 style={{ marginBottom: '12px' }}>Available Positions</h4>
        <Card padding="none">
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Outcome</th>
                  <th>Stake</th>
                  <th>Potential Payout</th>
                  <th>Price</th>
                  <th>Seller</th>
                  <th>Listed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id}>
                    <td style={{ maxWidth: '200px' }}>
                      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }} className="truncate" title={listing.marketQuestion}>
                        {listing.marketQuestion.length > 40 ? listing.marketQuestion.slice(0, 40) + '...' : listing.marketQuestion}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${listing.outcome === 'yes' ? 'badge-success' : 'badge-danger'}`}>
                        {listing.outcome.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{formatUSD(listing.originalStake)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatUSD(listing.potentialPayout)}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        fontSize: 'var(--font-base)',
                        color: 'var(--color-primary)',
                      }}>
                        {formatUSD(listing.price)}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-xs)' }}>
                      {formatAddress(listing.seller)}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-xs)' }}>
                      {getTimeAgo(listing.createdAt)}
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedListing(listing);
                          setShowBuy(true);
                        }}
                      >
                        Buy
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* List Modal */}
      <Modal
        isOpen={showList}
        onClose={() => setShowList(false)}
        title="List Position for Sale"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowList(false)}>Cancel</Button>
            <Button variant="primary" loading={listLoading} onClick={handleList}>
              List Position
            </Button>
          </>
        }
      >
        {selectedPosition && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>Outcome</span>
                <span className={`badge ${selectedPosition.outcome === 'yes' ? 'badge-success' : 'badge-danger'}`}>
                  {selectedPosition.outcome.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>Staked</span>
                <span style={{ fontWeight: 600 }}>{formatUSD(selectedPosition.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>Potential Payout</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatUSD(selectedPosition.potentialPayout)}</span>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Listing Price</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                style={{ fontSize: 'var(--font-xl)', fontWeight: 600 }}
              />
            </div>

            <div style={{
              padding: '12px 16px',
              background: 'var(--color-warning-muted)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-warning)' }}>
                Listing will forfeit your position. You'll receive the sale price instead.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Buy Modal */}
      <Modal
        isOpen={showBuy}
        onClose={() => setShowBuy(false)}
        title="Buy Position"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowBuy(false)}>Cancel</Button>
            <Button variant="primary" loading={buyLoading} onClick={handleBuy}>
              Confirm Purchase
            </Button>
          </>
        }
      >
        {selectedListing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {selectedListing.marketQuestion}
            </p>

            <div style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>Outcome</span>
                <span className={`badge ${selectedListing.outcome === 'yes' ? 'badge-success' : 'badge-danger'}`}>
                  {selectedListing.outcome.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>Original Stake</span>
                <span style={{ fontWeight: 500 }}>{formatUSD(selectedListing.originalStake)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>Potential Payout</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatUSD(selectedListing.potentialPayout)}</span>
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-sm)' }}>You send</span>
                <span style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {formatUSD(selectedListing.price)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
