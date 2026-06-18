'use client';

import { useState, useRef, useEffect } from 'react';
import { askQuestion, pollTask } from '@/lib/api';
import { useChat } from '@/context/chat-context';

export function ChatPanel() {
  const { runs, activeRunId, setActiveRunId, isProcessing, setIsProcessing, refreshRuns } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [runs]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    const question = input.trim();
    setInput('');
    
    // Optimistic UI could go here
    
    const result = await askQuestion(question);
    if (result) {
      setActiveRunId(result.runId);
      
      // Poll
      const poll = setInterval(async () => {
        const task = await pollTask(result.taskId);
        if (task.state === 'SUCCESS' || task.state === 'FAILURE') {
          clearInterval(poll);
          await refreshRuns();
          setIsProcessing(false);
        }
      }, 2000);
    } else {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: 'var(--bg-base)' }}>
      {/* Messages area */}
      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {activeRunId === null && !isProcessing && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <h3>New Chat</h3>
            <p>Ask a question to start generating a reasoning trace.</p>
          </div>
        )}
        {runs.filter(r => r.id === activeRunId).map(run => (
          <div key={run.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignSelf: 'flex-end', maxWidth: '80%' }}>
              <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', border: '1px solid var(--bg-border)' }}>
                {run.input_data}
              </div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px' }}>U</div>
            </div>
            
            <div 
              style={{ display: 'flex', gap: '16px', alignSelf: 'flex-start', maxWidth: '80%', cursor: 'pointer', padding: '8px', borderRadius: '8px', backgroundColor: activeRunId === run.id ? 'var(--bg-hover)' : 'transparent', border: activeRunId === run.id ? '1px solid var(--bg-border)' : '1px solid transparent' }}
              onClick={() => setActiveRunId(run.id)}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 'bold' }}>T</div>
              <div style={{ padding: '4px 0', color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                {run.output_data ? run.output_data : <span style={{ color: 'var(--text-secondary)' }}>Processing...</span>}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div style={{ display: 'flex', gap: '16px', alignSelf: 'flex-start', maxWidth: '80%' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: 'bold' }}>T</div>
            <div style={{ padding: '8px 0', color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                  </path>
                </g>
              </svg>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area" style={{ padding: '20px', borderTop: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="chat-input-wrapper" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', backgroundColor: 'var(--bg-base)', border: '1px solid var(--bg-border)', borderRadius: '8px', padding: '8px' }}>
          <textarea
            className="chat-input"
            placeholder="Ask about a reasoning trace..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: 'var(--text-primary)', resize: 'none', outline: 'none', padding: '8px', fontFamily: 'inherit', fontSize: '14px', minHeight: '24px', maxHeight: '120px' }}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: input.trim() && !isProcessing ? 'var(--accent)' : 'var(--bg-elevated)', color: input.trim() && !isProcessing ? '#0a0a0a' : 'var(--text-secondary)', border: 'none', cursor: input.trim() && !isProcessing ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="chat-disclaimer" style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '12px' }}>ThoughtDag visualizes LLM reasoning traces. Results are analytical, not generative.</p>
      </div>
    </div>
  );
}
