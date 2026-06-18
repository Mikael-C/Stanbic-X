export const API_URL = import.meta.env.VITE_API_URL || 'https://stanbic-x-backend.onrender.com';
const API_BASE = `${API_URL}/api`;

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('sx_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.message || data?.error || `Request failed with status ${response.status}`,
      response.status,
      data
    );
  }

  if (data && data.success && data.data !== undefined) {
    return data.data as T;
  }

  return data as T;
}

/* ── Auth ── */
export const authApi = {
  getNonce: (wallet: string) =>
    request<{ nonce: string }>(`/auth/nonce`, { method: 'POST', body: { wallet } }),

  login: (wallet: string, signature: string) =>
    request<{ token: string; totpRequired: boolean; totpSetup?: { secret: string; qrCode: string } }>(
      `/auth/login`, { method: 'POST', body: { wallet, signature } }
    ),

  verifyTotp: (token: string, walletAddress: string) =>
    request<{ verified: boolean; jwt: string }>(`/auth/totp/verify`, { method: 'POST', body: { token, walletAddress } }),

  setupTotp: () =>
    request<{ secret: string; qrCode: string }>(`/auth/totp/setup`, { method: 'POST' }),

  getProfile: () =>
    request<{ wallet: string; role: string; totpEnabled: boolean }>(`/auth/profile`),
};

/* ── Balance / Sub-Accounts ── */
export const balanceApi = {
  getBalance: async () => {
    const data = await request<any>(`/balance`);
    return {
      unified: data.unifiedBalance || 0,
      committed: data.committedBalances?.reduce((sum: number, acc: any) => sum + acc.principal, 0) || 0,
      uncommitted: data.uncommittedBalance || 0,
      totalYield: data.accruedYield || 0,
      subAccounts: (data.committedBalances || []).map((acc: any) => {
        const start = new Date(acc.createdAt).getTime();
        const end = new Date(acc.maturityDate).getTime();
        const now = Date.now();
        const progress = end > start ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100)) : 100;
        return {
          id: acc.subAccountId,
          principal: acc.principal,
          yieldAccrued: acc.yieldAccrued,
          createdAt: acc.createdAt,
          maturityDate: acc.maturityDate,
          maturityProgress: progress,
          status: acc.status
        };
      })
    };
  },

  deposit: (amount: number, stablecoin: string, committedPercentage: number) =>
    request<{ txHash: string }>(`/balance/deposit`, {
      method: 'POST',
      body: { amount, stablecoin, committedPercentage },
    }),

  withdraw: (amount: number, source: string) =>
    request<{ netReceived: number; amountWithdrawn: number; transactionHash: string }>(`/balance/withdraw`, {
      method: 'POST',
      body: { amount, source },
    }),

  getTransactions: () =>
    request<Transaction[]>(`/balance/transactions`),
};

/* ── Markets ── */
export const marketsApi = {
  getAll: async (filters?: { status?: string; search?: string; sort?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.sort) params.set('sort', filters.sort);
    const query = params.toString();
    const result = await request<any>(`/markets${query ? `?${query}` : ''}`);
    const markets = result.markets || result || [];
    return markets.map((m: any) => ({
      ...m,
      endDate: m.endTime || m.endDate,
      totalYesStake: m.yesStakes || m.totalYesStake || 0,
      totalNoStake: m.noStakes || m.totalNoStake || 0,
      minStake: m.minStake || 10,
    }));
  },

  getById: async (id: string) => {
    const data = await request<any>(`/markets/${encodeURIComponent(id)}`);
    return {
      ...data,
      endDate: data.endTime || data.endDate,
      totalYesStake: data.yesStakes || data.totalYesStake || 0,
      totalNoStake: data.noStakes || data.totalNoStake || 0,
      minStake: data.minStake || 10,
      positions: data.positions || [],
      history: (data.recentStakes || data.history || []).map((h: any) => ({
        id: h.id,
        wallet: h.wallet || '0x0000...0000',
        outcome: h.outcome,
        amount: h.amount,
        timestamp: h.createdAt || h.timestamp,
      })),
    } as MarketDetail;
  },

  create: (data: { question: string; endDate: string; minStake: number }) =>
    request<Market>(`/markets`, { 
      method: 'POST', 
      body: {
        question: data.question,
        endTime: data.endDate,
        minStake: data.minStake
      }
    }),

  stake: (marketId: string, outcome: 'yes' | 'no', amount: number) =>
    request<{ position: Position; potentialPayout: number }>(`/markets/${encodeURIComponent(marketId)}/stake`, {
      method: 'POST',
      body: { outcome, amount },
    }),

  resolve: (marketId: string, winner: 'yes' | 'no') =>
    request<{ resolved: boolean }>(`/markets/${encodeURIComponent(marketId)}/resolve`, {
      method: 'POST',
      body: { winner: winner === 'yes' ? 'Yes' : 'No' },
    }),

  claimPayout: (marketId: string) =>
    request<{ payout: number }>(`/markets/${encodeURIComponent(marketId)}/payout/claim`, { method: 'POST' }),

  getPositions: (marketId: string) =>
    request<Position[]>(`/markets/${encodeURIComponent(marketId)}/positions`),

  getStakeHistory: (marketId: string) =>
    request<StakeHistory[]>(`/markets/${encodeURIComponent(marketId)}/history`),
};

/* ── Leaderboard ── */
export const leaderboardApi = {
  get: async (type: 'accuracy' | 'volume' = 'accuracy') => {
    const result = await request<any>(`/leaderboard?type=${type}`);
    const entries = result.leaderboard || result || [];
    return entries.map((entry: any) => ({
      rank: entry.rank,
      wallet: entry.walletAddress || entry.wallet,
      accuracy: entry.accuracy,
      volume: entry.totalVolume || entry.volume,
      totalBets: entry.totalPredictions || entry.totalBets,
      profit: 0, // Backend doesn't return profit yet
      rewards: entry.rewardsEarned || entry.rewards || 0,
    }));
  },

  getRewardPool: async () => {
    const data = await request<any>(`/leaderboard/rewards`);
    return {
      totalPool: data.poolBalance ?? data.totalPool ?? 0,
      nextDistribution: data.updatedAt || data.nextDistribution || '',
    };
  },

  claimReward: () =>
    request<{ amount: number }>(`/leaderboard/claim`, { method: 'POST' }),
};

/* ── Order Book ── */
export const orderBookApi = {
  getListings: async () => {
    const result = await request<any>(`/orderbook`);
    const listings = result.listings || result || [];
    return listings.map((l: any) => ({
      id: l.id,
      positionId: l.stake?.id || 'unknown',
      marketId: l.market?.marketId || 'unknown',
      marketQuestion: l.market?.question || 'Unknown Market',
      outcome: l.stake?.outcome || 'yes',
      originalStake: l.stake?.amount || 0,
      potentialPayout: l.stake?.potentialPayout || 0,
      price: l.price || 0,
      seller: l.seller?.walletAddress || l.seller || '0x0000',
      createdAt: l.createdAt || new Date().toISOString(),
    }));
  },

  listPosition: (positionId: string, price: number) =>
    request<OrderListing>(`/orderbook/list`, {
      method: 'POST',
      body: { positionId, price },
    }),

  buyPosition: (listingId: string) =>
    request<{ purchased: boolean; totalPrice: number }>(`/orderbook/buy/${encodeURIComponent(listingId)}`, {
      method: 'POST',
    }),

  cancelListing: (listingId: string) =>
    request<{ cancelled: boolean }>(`/orderbook/cancel/${encodeURIComponent(listingId)}`, {
      method: 'POST',
    }),
};

/* ── Admin ── */
export const adminApi = {
  getPendingMarkets: () =>
    request<Market[]>(`/admin/markets/pending`),

  getVerification: async () => {
    try {
      const data = await request<any>(`/admin/verification`);
      // If it's the expected array from mock data, return it
      if (Array.isArray(data)) return data;
      
      // If it's the backend format, map it
      if (data && data.contractStatus) {
        const verifications: ContractVerification[] = [];
        for (const status of data.contractStatus) {
          const network = status.chain;
          const contracts = status.contracts;
          
          if (contracts.predictionMarket) {
            verifications.push({
              name: `PredictionMarket (${network})`,
              address: contracts.predictionMarket.address,
              verified: contracts.predictionMarket.deployed,
              network,
              lastChecked: new Date().toISOString(),
              propertiesVerified: 5,
              totalProperties: 5,
            });
          }
          if (contracts.vault) {
            verifications.push({
              name: `YieldVault (${network})`,
              address: contracts.vault.address,
              verified: contracts.vault.deployed,
              network,
              lastChecked: new Date().toISOString(),
              propertiesVerified: contracts.vault.deployed ? 4 : 0,
              totalProperties: 4,
            });
          }
          if (contracts.stablecoin) {
            verifications.push({
              name: `USDC Mock (${network})`,
              address: contracts.stablecoin.address,
              verified: contracts.stablecoin.deployed,
              network,
              lastChecked: new Date().toISOString(),
              propertiesVerified: 2,
              totalProperties: 2,
            });
          }
        }
        return verifications;
      }
      throw new Error('Invalid verification data format');
    } catch (error) {
      throw error;
    }
  },

  getSecurityLogs: () =>
    request<SecurityLog[]>(`/admin/security/logs`),

  getLockedUsers: () =>
    request<LockedUser[]>(`/admin/security/locked`),

  unlockUser: (wallet: string) =>
    request<{ unlocked: boolean }>(`/admin/security/unlock`, {
      method: 'POST',
      body: { wallet },
    }),
};

/* ── AI Chat ── */
export const aiChatApi = {
  sendMessage: (message: string) =>
    request<{ reply?: string; response?: string; flagged: boolean; lockout?: number }>(
      `/ai/chat`, { method: 'POST', body: { message } }
    ),
  getStatus: () =>
    request<{
      rateLimit: { minuteRemaining: number; dailyRemaining: number };
      lockout: { isLocked: boolean; unlockAt: string | null; attemptsInWindow: number };
      jailbreakAttempts: { total: number; recentInWindow: number };
    }>(`/ai/status`),
};

/* ── Types ── */
export interface SubAccount {
  id: string;
  principal: number;
  yieldAccrued: number;
  createdAt: string;
  maturityDate: string;
  maturityProgress: number;
  status: 'active' | 'matured';
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'stake' | 'payout' | 'yield';
  amount: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  txHash?: string;
}

export interface Market {
  id: string;
  question: string;
  status: 'open' | 'closed' | 'resolved';
  endDate: string;
  minStake: number;
  totalYesStake: number;
  totalNoStake: number;
  yesOdds: number;
  noOdds: number;
  creator: string;
  winner?: 'yes' | 'no';
  createdAt: string;
}

export interface MarketDetail extends Market {
  positions: Position[];
  history: StakeHistory[];
}

export interface Position {
  id: string;
  marketId: string;
  wallet: string;
  outcome: 'yes' | 'no';
  amount: number;
  potentialPayout: number;
  createdAt: string;
  listed?: boolean;
}

export interface StakeHistory {
  id: string;
  wallet: string;
  outcome: 'yes' | 'no';
  amount: number;
  timestamp: string;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  accuracy?: number;
  volume?: number;
  totalBets: number;
  profit: number;
  rewards: number;
}

export interface OrderListing {
  id: string;
  positionId: string;
  marketId: string;
  marketQuestion: string;
  outcome: 'yes' | 'no';
  originalStake: number;
  potentialPayout: number;
  price: number;
  seller: string;
  createdAt: string;
}

export interface ContractVerification {
  name: string;
  address: string;
  verified: boolean;
  network: string;
  lastChecked: string;
  propertiesVerified?: number;
  totalProperties?: number;
}

export interface SecurityLog {
  id: string;
  type: 'jailbreak' | 'rate_limit' | 'suspicious';
  wallet: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export interface LockedUser {
  wallet: string;
  reason: string;
  lockedAt: string;
  unlockAt: string;
}
