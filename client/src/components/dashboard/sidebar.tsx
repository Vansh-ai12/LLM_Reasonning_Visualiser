'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';

interface SidebarProps {
  onToggle: () => void;
}

export function DashboardSidebar({ onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const { runs, activeRunId, setActiveRunId, isProcessing } = useChat();

  return (
    <div className="sidebar-content">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-logo">
          ThoughtDag
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="sidebar-icon-btn"
          aria-label="Collapse sidebar"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!isProcessing) {
            setActiveRunId(null);
          }
        }}
        disabled={isProcessing}
        className="sidebar-new-btn"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New chat
      </button>

      <div className="sidebar-history">
        <p className="sidebar-history-label">History</p>
        <div className="sidebar-history-list">
          {runs
            .slice()
            .reverse()
            .map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => setActiveRunId(run.id)}
                className={clsx('sidebar-history-item', {
                  'sidebar-history-item--active': activeRunId === run.id,
                })}
              >
                {run.input_data}
              </button>
            ))}
          {runs.length === 0 && (
            <p className="sidebar-history-empty">No previous chats.</p>
          )}
        </div>
      </div>

      {user && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-meta">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-email">{user.email}</span>
            </div>
          </div>
          <button type="button" onClick={logout} className="sidebar-logout-btn">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
