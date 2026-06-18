import { useState, useCallback } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import { useWeb3 } from '../context/Web3Context';

interface ContractCall {
  loading: boolean;
  error: string | null;
}

const PREDICTION_MARKET_ABI = [
  'function createMarket(string question, uint256 endDate, uint256 minStake) external returns (uint256)',
  'function stake(uint256 marketId, bool outcome) external payable',
  'function resolve(uint256 marketId, bool winner) external',
  'function claimPayout(uint256 marketId) external',
  'function getMarket(uint256 marketId) external view returns (tuple(string question, uint256 endDate, uint256 yesStake, uint256 noStake, bool resolved, bool winner))',
  'event MarketCreated(uint256 indexed marketId, string question, address creator)',
  'event Staked(uint256 indexed marketId, address indexed staker, bool outcome, uint256 amount)',
  'event MarketResolved(uint256 indexed marketId, bool winner)',
  'event PayoutClaimed(uint256 indexed marketId, address indexed claimer, uint256 amount)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
];

export function useContract() {
  const { provider, network } = useWeb3();
  const [state, setState] = useState<ContractCall>({ loading: false, error: null });

  const getSignerContract = useCallback(
    async (address: string, abi: string[]) => {
      if (!provider) throw new Error('No wallet connected');
      const browserProvider = new BrowserProvider(window.ethereum!);
      const signer = await browserProvider.getSigner();
      return new Contract(address, abi, signer);
    },
    [provider]
  );

  const createMarket = useCallback(
    async (question: string, endDate: number, minStake: bigint) => {
      setState({ loading: true, error: null });
      try {
        const contract = await getSignerContract(
          network.contracts.predictionMarket,
          PREDICTION_MARKET_ABI
        );
        const tx = await contract.createMarket(question, endDate, minStake);
        const receipt = await tx.wait();
        setState({ loading: false, error: null });
        return receipt;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Transaction failed';
        setState({ loading: false, error: msg });
        throw err;
      }
    },
    [getSignerContract, network]
  );

  const stakeOnMarket = useCallback(
    async (marketId: number, outcome: boolean, amount: bigint) => {
      setState({ loading: true, error: null });
      try {
        const contract = await getSignerContract(
          network.contracts.predictionMarket,
          PREDICTION_MARKET_ABI
        );
        const tx = await contract.stake(marketId, outcome, { value: amount });
        const receipt = await tx.wait();
        setState({ loading: false, error: null });
        return receipt;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Transaction failed';
        setState({ loading: false, error: msg });
        throw err;
      }
    },
    [getSignerContract, network]
  );

  const resolveMarket = useCallback(
    async (marketId: number, winner: boolean) => {
      setState({ loading: true, error: null });
      try {
        const contract = await getSignerContract(
          network.contracts.predictionMarket,
          PREDICTION_MARKET_ABI
        );
        const tx = await contract.resolve(marketId, winner);
        const receipt = await tx.wait();
        setState({ loading: false, error: null });
        return receipt;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Transaction failed';
        setState({ loading: false, error: msg });
        throw err;
      }
    },
    [getSignerContract, network]
  );

  const claimPayout = useCallback(
    async (marketId: number) => {
      setState({ loading: true, error: null });
      try {
        const contract = await getSignerContract(
          network.contracts.predictionMarket,
          PREDICTION_MARKET_ABI
        );
        const tx = await contract.claimPayout(marketId);
        const receipt = await tx.wait();
        setState({ loading: false, error: null });
        return receipt;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Transaction failed';
        setState({ loading: false, error: msg });
        throw err;
      }
    },
    [getSignerContract, network]
  );

  const approveToken = useCallback(
    async (tokenAddress: string, spender: string, amount: bigint) => {
      setState({ loading: true, error: null });
      try {
        const contract = await getSignerContract(tokenAddress, ERC20_ABI);
        const tx = await contract.approve(spender, amount);
        const receipt = await tx.wait();
        setState({ loading: false, error: null });
        return receipt;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Transaction failed';
        setState({ loading: false, error: msg });
        throw err;
      }
    },
    [getSignerContract]
  );

  return {
    ...state,
    createMarket,
    stakeOnMarket,
    resolveMarket,
    claimPayout,
    approveToken,
  };
}
