'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

import { ChatProvider } from '@/context/chat-context';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ChatProvider>
      <div className="dashboard-shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              className="dashboard-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ borderRight: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-surface)', flexShrink: 0 }}
            >
              <DashboardSidebar onToggle={() => setSidebarOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>
        <div className="dashboard-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {!sidebarOpen && (
            <button
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: '6px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
