import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { authApi } from '../services/api';

interface AuthState {
  wallet: string | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  totpVerified: boolean;
  totpSetup: { secret: string; qrCode: string } | null;
  signer: JsonRpcSigner | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  verifyTotp: (code: string) => Promise<boolean>;
  setupTotp: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    wallet: null,
    token: localStorage.getItem('sx_token'),
    isAuthenticated: false,
    isAdmin: false,
    totpVerified: false,
    totpSetup: null,
    signer: null,
    loading: true,
  });

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('sx_token');
    if (token) {
      authApi
        .getProfile()
        .then((profile) => {
          setState((prev) => ({
            ...prev,
            wallet: profile.wallet,
            isAuthenticated: true,
            isAdmin: profile.role === 'admin',
            totpVerified: true,
            loading: false,
          }));
        })
        .catch(() => {
          localStorage.removeItem('sx_token');
          setState((prev) => ({ ...prev, token: null, loading: false }));
        });
    } else {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      setState((prev) => ({ ...prev, loading: true }));

      const provider = new BrowserProvider(window.ethereum);
      
      // Use a timeout to prevent hanging if MetaMask crashes or doesn't respond
      const signerPromise = provider.getSigner();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('MetaMask is not responding. Please check your extension popup, or try restarting your browser/extension.')), 10000);
      });
      
      const signer = await Promise.race([signerPromise, timeoutPromise]);
      const wallet = await signer.getAddress();

      // Get nonce from server
      const { nonce } = await authApi.getNonce(wallet);

      // Sign the nonce
      const message = `Sign this message to authenticate with SX Secure.\n\nNonce: ${nonce}`;
      const signature = await signer.signMessage(message);

      // Login with signature
      const loginResult = await authApi.login(wallet, signature);

      if (loginResult.totpRequired && loginResult.totpSetup) {
        // Need TOTP setup
        localStorage.setItem('sx_token', loginResult.token);
        setState((prev) => ({
          ...prev,
          wallet,
          signer,
          token: loginResult.token,
          totpSetup: loginResult.totpSetup!,
          loading: false,
        }));
      } else if (loginResult.totpRequired) {
        // Need TOTP verification (already set up)
        localStorage.setItem('sx_token', loginResult.token);
        setState((prev) => ({
          ...prev,
          wallet,
          signer,
          token: loginResult.token,
          loading: false,
        }));
      } else {
        // No TOTP required - direct login
        localStorage.setItem('sx_token', loginResult.token);
        
        // Fetch profile to determine admin status
        let isAdmin = false;
        try {
          const profile = await authApi.getProfile();
          isAdmin = profile.role === 'admin';
        } catch {
          // Profile fetch failed, continue without admin
        }
        
        setState((prev) => ({
          ...prev,
          wallet,
          signer,
          token: loginResult.token,
          isAuthenticated: true,
          isAdmin,
          totpVerified: true,
          loading: false,
        }));
      }
    } catch (err: unknown) {
      setState((prev) => ({ ...prev, loading: false }));
      throw err;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    localStorage.removeItem('sx_token');
    setState({
      wallet: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      totpVerified: false,
      totpSetup: null,
      signer: null,
      loading: false,
    });
  }, []);

  const verifyTotp = useCallback(async (code: string): Promise<boolean> => {
    try {
      if (!state.wallet) return false;
      const result = await authApi.verifyTotp(code, state.wallet) as any;
      console.log('TOTP verify response:', JSON.stringify(result));
      
      if (result.verified) {
        // Backend may return jwt field or token field depending on version
        const jwtToken = result.jwt || result.token;
        if (!jwtToken) {
          console.error('TOTP verified but no JWT received:', result);
          return false;
        }
        localStorage.setItem('sx_token', jwtToken);
        
        // Try to get profile for admin status, but don't fail login if it errors
        let isAdmin = false;
        try {
          const profile = await authApi.getProfile();
          isAdmin = profile.role === 'admin';
        } catch (profileErr) {
          console.warn('Profile fetch failed after TOTP verify, continuing login:', profileErr);
        }
        
        setState((prev) => ({
          ...prev,
          token: jwtToken,
          isAuthenticated: true,
          isAdmin,
          totpVerified: true,
          totpSetup: null,
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('TOTP verification error:', err);
      return false;
    }
  }, [state.wallet]);

  const setupTotp = useCallback(async () => {
    const result = await authApi.setupTotp();
    setState((prev) => ({ ...prev, totpSetup: result }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        connectWallet,
        disconnectWallet,
        verifyTotp,
        setupTotp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// Extend window for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
