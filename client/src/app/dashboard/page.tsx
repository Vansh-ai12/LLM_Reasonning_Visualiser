'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChatPanel } from '@/components/dashboard/chat-panel';
import { GraphPanel } from '@/components/dashboard/graph-panel';

type ViewMode = 'split' | 'chat' | 'graph';

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  return (
    <motion.div
      className="dashboard-content"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
    >
      {/* View mode tabs */}
      <div className="dashboard-tabs" style={{ display: 'flex', gap: '8px', padding: '16px', borderBottom: '1px solid var(--bg-border)', flexShrink: 0, justifyContent: 'center' }}>
        <button 
          onClick={() => setViewMode('split')}
          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: viewMode === 'split' ? 'var(--bg-elevated)' : 'transparent', color: viewMode === 'split' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          Split view
        </button>
        <button 
          onClick={() => setViewMode('chat')}
          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: viewMode === 'chat' ? 'var(--bg-elevated)' : 'transparent', color: viewMode === 'chat' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          Chat only
        </button>
        <button 
          onClick={() => setViewMode('graph')}
          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: viewMode === 'graph' ? 'var(--bg-elevated)' : 'transparent', color: viewMode === 'graph' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          Graph only
        </button>
      </div>

      {/* Panels */}
      <div className="dashboard-panels" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {(viewMode === 'split' || viewMode === 'chat') && (
          <div style={{ flex: viewMode === 'split' ? 0.5 : 1, display: 'flex', borderRight: viewMode === 'split' ? '1px solid var(--bg-border)' : 'none', minWidth: '400px' }}>
            <ChatPanel />
          </div>
        )}
        {(viewMode === 'split' || viewMode === 'graph') && (
          <div style={{ flex: viewMode === 'split' ? 0.5 : 1, display: 'flex', flexDirection: 'column', minWidth: '400px', backgroundColor: 'var(--bg-base)' }}>
            <GraphPanel />
          </div>
        )}
      </div>
    </motion.div>
  );
}
