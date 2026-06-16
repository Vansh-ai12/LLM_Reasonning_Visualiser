'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { DashboardNav } from '@/components/dashboard-nav';
import {
  DagGraph,
  MOCK_DAG_LINKS,
  MOCK_DAG_NODES,
  type DagLink,
  type DagNode,
} from '@/components/dag-graph';

interface HistoryItem {
  id: string;
  title: string;
  updatedAt: string;
}

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: '1',
    title: 'Greedy decode — math word problem',
    updatedAt: '2h ago',
  },
  {
    id: '2',
    title: 'Multi-hop retrieval trace',
    updatedAt: 'Yesterday',
  },
  {
    id: '3',
    title: 'Cross-model reasoning comparison',
    updatedAt: 'Jun 10',
  },
  {
    id: '4',
    title: 'Chain correction on factual QA',
    updatedAt: 'Jun 8',
  },
  {
    id: '5',
    title: 'Beam search attribution run',
    updatedAt: 'Jun 5',
  },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_MESSAGES: ChatMessage[] = [
  {
    id: 'starter',
    role: 'assistant',
    content:
      'Submit a prompt to inspect how a model structures its reasoning. Each response will map steps into a trace you can explore as a DAG.',
  },
];

type WorkspaceView = 'chat' | 'split' | 'graph';

export function DashboardShell() {
  const [activeId, setActiveId] = useState(MOCK_HISTORY[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>(STARTER_MESSAGES);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [view, setView] = useState<WorkspaceView>('chat');
  const [dagNodes, setDagNodes] = useState<DagNode[]>([]);
  const [dagLinks, setDagLinks] = useState<DagLink[]>([]);
  const [hasGraph, setHasGraph] = useState(false);

  const showGraphPanel = view === 'split' || view === 'graph';
  const showChatPanel = view === 'chat' || view === 'split';

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content:
            'Trace preview is UI-only for now. When connected, this response will expand into labeled reasoning steps with dependency edges and confidence scores.',
        },
      ]);
      setDagNodes(MOCK_DAG_NODES);
      setDagLinks(MOCK_DAG_LINKS);
      setHasGraph(true);
      setView('split');
      setSending(false);
    }, 600);
  };

  const handleNewTrace = () => {
    setActiveId('new');
    setMessages(STARTER_MESSAGES);
    setInput('');
    setDagNodes([]);
    setDagLinks([]);
    setHasGraph(false);
    setView('chat');
  };

  const openGraph = () => {
    if (!hasGraph) {
      return;
    }
    setView((current) => (current === 'graph' ? 'split' : 'graph'));
  };

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-top">
          <Link href="/" className="dash-brand">
            ThoughtDag
          </Link>
          <button
            type="button"
            className="dash-new-btn"
            onClick={handleNewTrace}
          >
            New trace
          </button>
        </div>

        <div className="dash-history">
          <p className="dash-history-label">History</p>
          <ul className="dash-history-list">
            {MOCK_HISTORY.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={clsx('dash-history-item', {
                    'dash-history-item--active': item.id === activeId,
                  })}
                  onClick={() => setActiveId(item.id)}
                >
                  <span className="dash-history-title">{item.title}</span>
                  <span className="dash-history-meta">{item.updatedAt}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="dash-sidebar-footer">
          <DashboardNav />
        </div>
      </aside>

      <section className="dash-main">
        <header className="dash-toolbar">
          <div className="dash-view-tabs" role="tablist" aria-label="Workspace view">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'chat'}
              className={clsx('dash-view-tab', {
                'dash-view-tab--active': view === 'chat',
              })}
              onClick={() => setView('chat')}
            >
              Chat
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'split'}
              className={clsx('dash-view-tab', {
                'dash-view-tab--active': view === 'split',
              })}
              onClick={() => setView('split')}
              disabled={!hasGraph}
            >
              Split
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'graph'}
              className={clsx('dash-view-tab', {
                'dash-view-tab--active': view === 'graph',
              })}
              onClick={() => setView('graph')}
              disabled={!hasGraph}
            >
              Graph
            </button>
          </div>

          <div className="dash-toolbar-actions">
            <button
              type="button"
              className="dash-graph-btn"
              onClick={openGraph}
              disabled={!hasGraph}
            >
              View reasoning graph
            </button>
            <div className="dash-main-header-nav">
              <DashboardNav />
            </div>
          </div>
        </header>

        <div
          className={clsx('dash-workspace', {
            'dash-workspace--split': view === 'split',
            'dash-workspace--graph': view === 'graph',
          })}
        >
          {showChatPanel && (
            <div className="dash-chat-column">
              <div className="dash-messages">
                <div className="dash-messages-inner">
                  {messages.map((message) => (
                    <article
                      key={message.id}
                      className={clsx('dash-message', {
                        'dash-message--user': message.role === 'user',
                        'dash-message--assistant': message.role === 'assistant',
                      })}
                    >
                      <p className="dash-message-content">{message.content}</p>
                      {message.role === 'assistant' && hasGraph && (
                        <button
                          type="button"
                          className="dash-message-graph-btn"
                          onClick={() => setView('graph')}
                        >
                          Open graph nodes
                        </button>
                      )}
                    </article>
                  ))}
                  {sending && (
                    <article className="dash-message dash-message--assistant">
                      <p className="dash-message-content dash-message-content--pending">
                        Generating step map...
                      </p>
                    </article>
                  )}
                </div>
              </div>

              <form className="dash-composer" onSubmit={handleSubmit}>
                <div className="dash-composer-wrap">
                  <div className="dash-composer-inner">
                    <textarea
                      className="dash-composer-input"
                      rows={1}
                      placeholder="Describe a task or paste a prompt to trace..."
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                    />
                    <button
                      type="submit"
                      className="dash-composer-submit"
                      disabled={!input.trim() || sending}
                    >
                      Run trace
                    </button>
                  </div>
                  <p className="dash-composer-hint">
                    UI preview only — server integration comes next.
                  </p>
                </div>
              </form>
            </div>
          )}

          {showGraphPanel && (
            <aside className="dash-graph-column">
              <div className="dash-graph-header">
                <div>
                  <p className="dash-graph-kicker">Reasoning DAG</p>
                  <h2 className="dash-graph-title">
                    {hasGraph ? `${dagNodes.length} nodes` : 'Empty graph'}
                  </h2>
                </div>
                {view === 'split' && (
                  <button
                    type="button"
                    className="dash-graph-expand"
                    onClick={() => setView('graph')}
                  >
                    Expand
                  </button>
                )}
              </div>
              <DagGraph nodes={dagNodes} links={dagLinks} />
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}
