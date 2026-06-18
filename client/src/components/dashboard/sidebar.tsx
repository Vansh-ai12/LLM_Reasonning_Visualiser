'use client';

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';

interface SidebarProps {
  onToggle: () => void;
}

export function DashboardSidebar({ onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const { runs, activeRunId, setActiveRunId, isProcessing } = useChat();

  return (
    <div className="sidebar-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      {/* Header */}
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link href="/" className="sidebar-logo" style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>
          ThoughtDag
        </Link>
        <button onClick={onToggle} aria-label="Collapse sidebar" style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      </div>

      <button
        onClick={() => {
          if (!isProcessing) setActiveRunId(null);
        }}
        disabled={isProcessing}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border)',
          borderRadius: '6px',
          color: isProcessing ? 'var(--text-tertiary)' : 'var(--text-primary)',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        New Chat
      </button>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.05em' }}>
          History
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {runs.slice().reverse().map((run) => (
            <button
              key={run.id}
              onClick={() => setActiveRunId(run.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeRunId === run.id ? 'var(--bg-surface)' : 'transparent',
                color: activeRunId === run.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {run.input_data}
            </button>
          ))}
          {runs.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No previous chats.</p>
          )}
        </div>
      </div>

      {/* User profile */}
      {user && (
        <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="sidebar-user" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: '#0a0a0a', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{user.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{user.email}</span>
            </div>
          </div>
          <button onClick={logout} style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
        </div>
      )}
    </div>
  );
}
