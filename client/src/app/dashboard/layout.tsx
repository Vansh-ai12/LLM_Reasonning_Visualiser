'use client';

import { useState, ReactNode } from 'react';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

import { ChatProvider } from '@/context/chat-context';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ChatProvider>
      <div
        className={`dashboard-shell ${sidebarOpen ? 'dashboard-shell--sidebar-open' : 'dashboard-shell--sidebar-closed'}`}
      >
        <aside className="dashboard-sidebar">
          <DashboardSidebar onToggle={() => setSidebarOpen(false)} />
        </aside>

        <div className="dashboard-main">
          {!sidebarOpen && (
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
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
          )}
          {children}
        </div>
      </div>
    </ChatProvider>
  );
}
