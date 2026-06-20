'use client';

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { askQuestion, pollTask } from '@/lib/api';
import { useChat } from '@/context/chat-context';

export function ChatPanel() {
  const { runs, activeRunId, setActiveRunId, isProcessing, setIsProcessing, refreshRuns } =
    useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [runs, isProcessing]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) {
      return;
    }

    setIsProcessing(true);
    const question = input.trim();
    setInput('');

    const result = await askQuestion(question);
    if (result) {
      setActiveRunId(result.runId);

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
      void handleSend();
    }
  };

  const activeRun = runs.find((run) => run.id === activeRunId);

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {activeRunId === null && !isProcessing && (
          <div className="chat-empty">
            <h2>What should we trace?</h2>
            <p>
              Ask a question to generate a reasoning path. The response will appear
              here and map to a DAG on the right.
            </p>
          </div>
        )}

        {activeRun && (
          <div className="chat-thread">
            <article className="chat-bubble chat-bubble--user">
              <div className="chat-bubble-avatar chat-bubble-avatar--user">U</div>
              <p>{activeRun.input_data}</p>
            </article>

            <article
              className={clsx('chat-bubble chat-bubble--assistant', {
                'chat-bubble--active': activeRunId === activeRun.id,
              })}
              onClick={() => setActiveRunId(activeRun.id)}
            >
              <div className="chat-bubble-avatar chat-bubble-avatar--assistant">
                T
              </div>
              <p>
                {activeRun.output_data ? (
                  activeRun.output_data
                ) : (
                  <span className="chat-pending">Processing trace...</span>
                )}
              </p>
            </article>
          </div>
        )}

        {isProcessing && !activeRun?.output_data && (
          <article className="chat-bubble chat-bubble--assistant">
            <div className="chat-bubble-avatar chat-bubble-avatar--assistant">
              T
            </div>
            <p className="chat-pending">Thinking...</p>
          </article>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Describe a task or paste a prompt to trace..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            type="button"
            className="chat-send-btn"
            onClick={() => void handleSend()}
            disabled={!input.trim() || isProcessing}
            aria-label="Send message"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
        <p className="chat-disclaimer">
          ThoughtDag visualizes LLM reasoning traces.
        </p>
      </div>
    </div>
  );
}
