/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ReasoningStep } from '@/lib/api';

interface StepDetailsProps {
  steps: ReasoningStep[];
}

const typeColors: Record<string, string> = {
  hypothesis: '#3b82f6',
  lookup: '#8b5cf6',
  calculation: '#f59e0b',
  correction: '#ef4444',
  conclusion: '#00c897',
};

export function StepDetails({ steps }: StepDetailsProps) {
  return (
    <div className="step-details" style={{ height: '100%', overflowY: 'auto', padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '40px 100px 1fr 100px 80px 100px', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--bg-border)', marginBottom: '16px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span>ID</span>
        <span>Type</span>
        <span>Label</span>
        <span>Confidence</span>
        <span>Entropy</span>
        <span>Depends On</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {steps.map(step => {
          let deps: any[] = [];
          try {
            const parsed = JSON.parse(step.depends_on || '[]');
            deps = Array.isArray(parsed) ? parsed : [];
          } catch {}
          
          return (
            <div key={step.id} style={{ display: 'grid', gridTemplateColumns: '40px 100px 1fr 100px 80px 100px', gap: '12px', alignItems: 'center', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}>
              <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', color: 'var(--text-tertiary)' }}>{step.id}</span>
              <span>
                <span style={{ color: typeColors[step.type], border: `1px solid ${typeColors[step.type]}40`, backgroundColor: `${typeColors[step.type]}10`, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', textTransform: 'capitalize' }}>
                  {step.type}
                </span>
              </span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.label}</span>
              <span style={{ textTransform: 'capitalize' }}>{step.confidence}</span>
              <span style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}>{step.entropy !== null ? step.entropy.toFixed(2) : '—'}</span>
              <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', color: 'var(--text-tertiary)' }}>{deps.length > 0 ? deps.join(', ') : '—'}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '32px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '16px' }}>Step Content</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {steps.map(step => (
            <div key={step.id} style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Step {step.id}</span>
                <span style={{ color: typeColors[step.type], fontSize: '12px', textTransform: 'capitalize' }}>{step.type}</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{step.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
