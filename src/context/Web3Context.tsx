import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers';

interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorer: string;
  contracts: {
    predictionMarket: string;
    treasury: string;
    usdc: string;
  };
}

const NETWORKS: Record<string, NetworkConfig> = {
  hoodi: {
    chainId: 560048,
    name: 'Hoodi Testnet',
    rpcUrl: 'https://rpc.hoodi.ethpandaops.io',
    explorer: 'https://hoodi.etherscan.io',
    contracts: {
      predictionMarket: '0x0000000000000000000000000000000000000001',
      treasury: '0x0000000000000000000000000000000000000002',
      usdc: '0x0000000000000000000000000000000000000003',
    },
  },
  localhost: {
    chainId: 31337,
    name: 'Local Hardhat',
    rpcUrl: 'http://127.0.0.1:8545',
    explorer: '',
    contracts: {
      predictionMarket: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      treasury: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
      usdc: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    },
  },
  baseSepolia: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
    contracts: {
      predictionMarket: '0x0000000000000000000000000000000000000001',
      treasury: '0x0000000000000000000000000000000000000002',
      usdc: '0x0000000000000000000000000000000000000003',
    },
  },
};

interface Web3ContextType {
  provider: BrowserProvider | null;
  readProvider: JsonRpcProvider | null;
  network: NetworkConfig;
  networkKey: string;
  isCorrectNetwork: boolean;
  switchNetwork: (networkKey: string) => Promise<void>;
  getContract: (name: keyof NetworkConfig['contracts'], abi: unknown[]) => Contract | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [networkKey, setNetworkKey] = useState<string>('baseSepolia');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const network = NETWORKS[networkKey];
  const readProvider = new JsonRpcProvider(network.rpcUrl);

  useEffect(() => {
    if (window.ethereum) {
      const browserProvider = new BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  useEffect(() => {
    async function checkNetwork() {
      if (provider) {
        try {
          const net = await provider.getNetwork();
          setIsCorrectNetwork(Number(net.chainId) === network.chainId);
        } catch {
          setIsCorrectNetwork(false);
        }
      }
    }
    checkNetwork();
  }, [provider, network.chainId]);

  const switchNetwork = useCallback(
    async (key: string) => {
      const target = NETWORKS[key];
      if (!target || !window.ethereum) return;

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${target.chainId.toString(16)}` }],
        });
        setNetworkKey(key);
      } catch (err: unknown) {
        const error = err as { code?: number };
        if (error.code === 4902) {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${target.chainId.toString(16)}`,
                chainName: target.name,
                rpcUrls: [target.rpcUrl],
                blockExplorerUrls: [target.explorer],
              },
            ],
          });
          setNetworkKey(key);
        }
      }
    },
    []
  );

  const getContract = useCallback(
    (name: keyof NetworkConfig['contracts'], abi: unknown[]): Contract | null => {
      if (!provider) return null;
      const address = network.contracts[name];
      if (address.startsWith('0x000000000000000000000000000000000000000')) {
        console.warn(`WARNING: Using placeholder contract address for ${name}. Do not use in production.`);
      }
      return new Contract(address, abi as any, readProvider);
    },
    [provider, network, readProvider]
  );

  return (
    <Web3Context.Provider
      value={{
        provider,
        readProvider,
        network,
        networkKey,
        isCorrectNetwork,
        switchNetwork,
        getContract,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3(): Web3ContextType {
  const context = useContext(Web3Context);
  if (!context) throw new Error('useWeb3 must be used within Web3Provider');
  return context;
}
