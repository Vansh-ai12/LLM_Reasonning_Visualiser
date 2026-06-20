'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { DAGView } from './dag-view';
import { EntropyChart } from './entropy-chart';
import { StepDetails } from './step-details';
import { fetchSteps, ReasoningStep } from '@/lib/api';
import { useChat } from '@/context/chat-context';

type GraphTab = 'dag' | 'entropy' | 'details';

export function GraphPanel() {
  const { activeRunId } = useChat();
  const [activeTab, setActiveTab] = useState<GraphTab>('dag');
  const [steps, setSteps] = useState<ReasoningStep[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function loadSteps(showLoading = false) {
      if (!activeRunId) {
        setSteps([]);
        return;
      }
      if (showLoading) {
        setLoading(true);
      }
      const data = await fetchSteps(activeRunId);
      setSteps(data);
      if (showLoading) {
        setLoading(false);
      }
    }

    void loadSteps(true);

    if (activeRunId) {
      interval = setInterval(() => {
        void loadSteps(false);
      }, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeRunId]);

  if (!activeRunId) {
    return (
      <div className="graph-panel-empty">
        Select a chat to view its reasoning graph.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="graph-panel-empty">Loading visualization...</div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="graph-panel-empty">
        No graph data available for this trace yet.
      </div>
    );
  }

  return (
    <div className="graph-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <div className="graph-tabs" role="tablist" aria-label="Graph views" style={{ flexShrink: 0 }}>
        {(
          [
            ['dag', 'DAG View'],
            ['entropy', 'Entropy Chart'],
            ['details', 'Step Details'],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={clsx('graph-tab', {
              'graph-tab--active': activeTab === tab,
            })}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="graph-content" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'dag' && <DAGView steps={steps} />}
        {activeTab === 'entropy' && <EntropyChart steps={steps} />}
        {activeTab === 'details' && <StepDetails steps={steps} />}
      </div>
    </div>
  );
}
