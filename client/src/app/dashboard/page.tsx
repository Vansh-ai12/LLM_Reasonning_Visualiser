'use client';

import { useState } from 'react';
import clsx from 'clsx';
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
    >
      <div className="dashboard-tabs">
        {(
          [
            ['split', 'Split view'],
            ['chat', 'Chat only'],
            ['graph', 'Graph only'],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            className={clsx('dashboard-tab', {
              'dashboard-tab--active': viewMode === mode,
            })}
            onClick={() => setViewMode(mode)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="dashboard-panels">
        {(viewMode === 'split' || viewMode === 'chat') && (
          <div
            className={clsx('dashboard-panel dashboard-panel--chat', {
              'dashboard-panel--full': viewMode === 'chat',
            })}
            style={{ flex: viewMode === 'split' ? 0.52 : 1 }}
          >
            <ChatPanel />
          </div>
        )}
        {(viewMode === 'split' || viewMode === 'graph') && (
          <div
            className={clsx('dashboard-panel dashboard-panel--graph', {
              'dashboard-panel--full': viewMode === 'graph',
            })}
            style={{ flex: viewMode === 'split' ? 0.48 : 1 }}
          >
            <GraphPanel />
          </div>
        )}
      </div>
    </motion.div>
  );
}
