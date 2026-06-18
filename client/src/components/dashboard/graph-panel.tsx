'use client';

import { useState, useEffect } from 'react';
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
      if (showLoading) setLoading(true);
      const data = await fetchSteps(activeRunId);
      setSteps(data);
      if (showLoading) setLoading(false);
    }

    loadSteps(true);

    if (activeRunId) {
      interval = setInterval(() => loadSteps(false), 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeRunId]);

  if (!activeRunId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        Select a message in the chat to view its reasoning graph.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        Loading visualization...
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        No graph data available for this step yet.
      </div>
    );
  }

  return (
    <div className="graph-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="graph-tabs" style={{ display: 'flex', gap: '2px', backgroundColor: 'var(--bg-elevated)', padding: '8px 16px' }}>
        <button 
          style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'dag' ? 'var(--bg-surface)' : 'transparent', color: activeTab === 'dag' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          onClick={() => setActiveTab('dag')}
        >
          DAG View
        </button>
        <button 
          style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'entropy' ? 'var(--bg-surface)' : 'transparent', color: activeTab === 'entropy' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          onClick={() => setActiveTab('entropy')}
        >
          Entropy Chart
        </button>
        <button 
          style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'details' ? 'var(--bg-surface)' : 'transparent', color: activeTab === 'details' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          onClick={() => setActiveTab('details')}
        >
          Step Details
        </button>
      </div>
      <div className="graph-content" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'dag' && <DAGView steps={steps} />}
        {activeTab === 'entropy' && <EntropyChart steps={steps} />}
        {activeTab === 'details' && <StepDetails steps={steps} />}
      </div>
    </div>
  );
}
