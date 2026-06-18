import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketEvents {
  onMarketUpdate?: (data: unknown) => void;
  onPriceUpdate?: (data: unknown) => void;
  onNewStake?: (data: unknown) => void;
  onOrderBookUpdate?: (data: unknown) => void;
  onLeaderboardUpdate?: (data: unknown) => void;
  onNotification?: (data: { message: string; type: string }) => void;
}

export function useWebSocket(events?: WebSocketEvents) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sx_token');

    const socket = io(window.location.origin, {
      path: '/socket.io',
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Register event handlers
    if (events?.onMarketUpdate) {
      socket.on('market:update', events.onMarketUpdate);
    }
    if (events?.onPriceUpdate) {
      socket.on('price:update', events.onPriceUpdate);
    }
    if (events?.onNewStake) {
      socket.on('stake:new', events.onNewStake);
    }
    if (events?.onOrderBookUpdate) {
      socket.on('orderbook:update', events.onOrderBookUpdate);
    }
    if (events?.onLeaderboardUpdate) {
      socket.on('leaderboard:update', events.onLeaderboardUpdate);
    }
    if (events?.onNotification) {
      socket.on('notification', events.onNotification);
    }

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const subscribe = useCallback((channel: string) => {
    socketRef.current?.emit('subscribe', channel);
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    socketRef.current?.emit('unsubscribe', channel);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    subscribe,
    unsubscribe,
  };
}
