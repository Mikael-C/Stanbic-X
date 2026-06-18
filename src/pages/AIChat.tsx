import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import { aiChatApi } from '../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  flagged?: boolean;
  timestamp: Date;
}

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your SX Secure AI assistant. I can help you understand prediction markets, check your positions, and answer questions about the platform. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [rateWarning, setRateWarning] = useState(false);
  const [lockout, setLockout] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lockoutInterval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await aiChatApi.getStatus();
        if (status.lockout?.isLocked && status.lockout?.unlockAt) {
          const unlockDate = new Date(status.lockout.unlockAt);
          const secondsRemaining = Math.max(0, Math.ceil((unlockDate.getTime() - Date.now()) / 1000));
          if (secondsRemaining > 0) {
            setLockout(secondsRemaining);
          }
        }
      } catch (err) {
        console.error('Failed to fetch AI chat status:', err);
      }
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    if (lockout > 0) {
      lockoutInterval.current = setInterval(() => {
        setLockout((prev) => {
          if (prev <= 1) {
            clearInterval(lockoutInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(lockoutInterval.current);
    }
  }, [lockout]);

  const sendMessage = async () => {
    if (!input.trim() || sending || lockout > 0) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setRateWarning(false);

    try {
      const result = await aiChatApi.sendMessage(userMsg.content);

      if (result.flagged) {
        const alertMsg: ChatMessage = {
          id: `alert-${Date.now()}`,
          role: 'system',
          content: '🚨 Your message was flagged as a potential jailbreak attempt. This incident has been logged. Repeated attempts will result in account lockout.',
          flagged: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, alertMsg]);

        if (result.lockout) {
          setLockout(result.lockout);
        }
      } else {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.reply || result.response || '',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: unknown) {
      const error = err as {
        status?: number;
        message?: string;
        data?: { success?: boolean; error?: string; code?: string; unlockAt?: string };
      };
      if (error.status === 403 && error.data?.code === 'JAILBREAK_DETECTED') {
        const alertMsg: ChatMessage = {
          id: `alert-${Date.now()}`,
          role: 'system',
          content: '🚨 Your message was flagged as a potential jailbreak attempt. This incident has been logged. Repeated attempts will result in account lockout.',
          flagged: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, alertMsg]);
      } else if (error.status === 429 && error.data?.unlockAt) {
        const unlockDate = new Date(error.data.unlockAt);
        const secondsRemaining = Math.max(0, Math.ceil((unlockDate.getTime() - Date.now()) / 1000));
        setLockout(secondsRemaining);
        
        const lockoutMsg: ChatMessage = {
          id: `lockout-${Date.now()}`,
          role: 'system',
          content: '🔒 Account temporarily locked due to repeated policy violations. Please wait before trying again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, lockoutMsg]);
      } else if (error.status === 429) {
        setRateWarning(true);
        const warnMsg: ChatMessage = {
          id: `warn-${Date.now()}`,
          role: 'system',
          content: '⚠️ Rate limit reached. Please wait a moment before sending another message.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, warnMsg]);
      } else {
        // Demo response
        const demoMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: getDemoResponse(userMsg.content),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, demoMsg]);
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.aiAvatar}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.27A7 7 0 015.27 19H4a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
              <circle cx="9" cy="15" r="1" fill="currentColor" />
              <circle cx="15" cy="15" r="1" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h4 style={{ fontSize: 'var(--font-lg)' }}>SX AI Assistant</h4>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
              Online · Jailbreak Protected
            </p>
          </div>
        </div>
        {rateWarning && (
          <div style={{
            padding: '4px 12px',
            background: 'var(--color-warning-muted)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-xs)',
            color: 'var(--color-warning)',
            fontWeight: 600,
          }}>
            ⚠ Rate Limited
          </div>
        )}
      </div>

      {/* Lockout Banner */}
      {lockout > 0 && (
        <div style={styles.lockoutBanner}>
          <div style={styles.lockoutContent}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <div>
              <p style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Account Temporarily Locked</p>
              <p style={{ fontSize: 'var(--font-xs)', opacity: 0.8 }}>
                Due to security violations. Unlocks in {Math.floor(lockout / 60)}:{(lockout % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>
          <div style={styles.lockoutTimer}>
            <span style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {Math.floor(lockout / 60)}:{(lockout % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={styles.messages}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.messageRow,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.role === 'assistant' && (
              <div style={styles.msgAvatar}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.27A7 7 0 015.27 19H4a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
                </svg>
              </div>
            )}
            <div
              style={{
                ...styles.messageBubble,
                ...(msg.role === 'user'
                  ? styles.userBubble
                  : msg.role === 'system'
                    ? msg.flagged
                      ? styles.alertBubble
                      : styles.warnBubble
                    : styles.assistantBubble),
                maxWidth: msg.role === 'system' ? '100%' : '75%',
              }}
            >
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.content}</p>
              <span style={styles.timestamp}>{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}

        {sending && (
          <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
            <div style={styles.msgAvatar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.27A7 7 0 015.27 19H4a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
              </svg>
            </div>
            <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
              <div style={styles.typing}>
                <span style={{ ...styles.typingDot, animationDelay: '0s' }} />
                <span style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
                <span style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <div style={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            style={styles.chatInput}
            placeholder={lockout > 0 ? 'Chat disabled during lockout...' : 'Type a message...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={lockout > 0}
          />
          <button
            style={{
              ...styles.sendButton,
              opacity: !input.trim() || sending || lockout > 0 ? 0.4 : 1,
            }}
            onClick={sendMessage}
            disabled={!input.trim() || sending || lockout > 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22,2 15,22 11,13 2,9" />
            </svg>
          </button>
        </div>
        <p style={styles.disclaimer}>
          AI responses are for informational purposes only. Not financial advice.
        </p>
      </div>
    </div>
  );
}

function getDemoResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('market') || lower.includes('predict')) {
    return 'There are currently 6 active prediction markets. The most popular is "Will Bitcoin exceed $150,000 by December 2025?" with $74,000 in total stakes. You can browse all markets in the Markets tab.';
  }
  if (lower.includes('balance') || lower.includes('deposit') || lower.includes('withdraw')) {
    return 'You can manage your funds in the Dashboard. Currently, you can deposit USDC, USDT, or DAI. Your committed funds earn yield through our DeFi integration, while uncommitted funds are available for staking.';
  }
  if (lower.includes('yield') || lower.includes('earn')) {
    return 'Your committed sub-accounts earn yield through our DeFi vault integration. Current APY varies based on market conditions, but historical rates have been between 4-8%. You can view your yield accrual in real-time on the Dashboard.';
  }
  if (lower.includes('odds') || lower.includes('stake') || lower.includes('bet')) {
    return 'Odds are determined by the ratio of YES to NO stakes. When you stake, you see the current multiplier — for example, 1.6x means you would receive 1.6 times your stake if your prediction is correct. The minimum stake varies by market.';
  }
  if (lower.includes('leaderboard') || lower.includes('rank')) {
    return 'The Leaderboard ranks predictors by accuracy and volume. Top performers receive rewards from the reward pool, which is distributed monthly. You can view the leaderboard even without logging in!';
  }
  return 'I\'d be happy to help you with SX Secure Prediction Marketplace! You can ask me about markets, staking, yields, your balance, the leaderboard, or how the platform works. What would you like to know?';
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - var(--navbar-height) - 64px)',
    maxHeight: '800px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--color-border)',
    background: 'rgba(255,255,255,0.03)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  aiAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'var(--gradient-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  lockoutBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
  },
  lockoutContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: 'var(--color-danger)',
  },
  lockoutTimer: {
    color: 'var(--color-danger)',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  },
  msgAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-primary)',
    flexShrink: 0,
  },
  messageBubble: {
    padding: '12px 16px',
    borderRadius: '16px',
    fontSize: 'var(--font-sm)',
    lineHeight: 1.5,
    position: 'relative',
  },
  userBubble: {
    background: 'var(--gradient-primary)',
    color: 'white',
    borderBottomRightRadius: '4px',
  },
  assistantBubble: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    borderBottomLeftRadius: '4px',
  },
  alertBubble: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'var(--color-danger)',
    borderRadius: 'var(--radius-md)',
  },
  warnBubble: {
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    color: 'var(--color-warning)',
    borderRadius: 'var(--radius-md)',
  },
  timestamp: {
    display: 'block',
    fontSize: '10px',
    opacity: 0.5,
    marginTop: '6px',
    textAlign: 'right' as const,
  },
  typing: {
    display: 'flex',
    gap: '4px',
    padding: '4px 0',
  },
  typingDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--color-text-secondary)',
    animation: 'bounce 1.2s ease-in-out infinite',
    display: 'inline-block',
  },
  inputArea: {
    borderTop: '1px solid var(--color-border)',
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.02)',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '4px 4px 4px 16px',
    transition: 'border-color 0.2s ease',
  },
  chatInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--color-text)',
    fontSize: 'var(--font-sm)',
    fontFamily: 'var(--font-family)',
    padding: '8px 0',
  },
  sendButton: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'var(--gradient-primary)',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  disclaimer: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    marginTop: '8px',
  },
};
