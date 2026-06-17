'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { DashboardNav } from '@/components/dashboard-nav';
import { getUserStatus } from '@/lib/api';
import {
  DagGraph,
  type DagLink,
  type DagNode,
} from '@/components/dag-graph';
import {
  askResearch,
  getResearchTask,
  type ResearchStep,
} from '@/lib/api';

import { useEffect } from 'react';

interface HistoryItem {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const APP_VERSION = 'v1.0.0';

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: '1',
    title: 'Math word problem trace',
    updatedAt: '2h ago',
  },
  {
    id: '2',
    title: 'Retrieval reasoning path',
    updatedAt: 'Yesterday',
  },
  {
    id: '3',
    title: 'Model comparison run',
    updatedAt: 'Jun 10',
  },
  {
    id: '4',
    title: 'Factual QA correction',
    updatedAt: 'Jun 8',
  },
  {
    id: '5',
    title: 'Beam search attribution',
    updatedAt: 'Jun 5',
  },
];

const STARTER_MESSAGES: ChatMessage[] = [];

const PROMPT_SUGGESTIONS = [
  'Trace a multi-step math solution',
  'Compare two model reasoning paths',
  'Find weak links in a factual answer',
  'Visualize retrieval and synthesis steps',
];

function parseDependsOn(dependsOn: ResearchStep['depends_on']): Array<number | string> {
  if (Array.isArray(dependsOn)) {
    return dependsOn;
  }

  try {
    const parsed = JSON.parse(dependsOn) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter(
          (value): value is number | string =>
            typeof value === 'number' || typeof value === 'string',
        )
      : [];
  } catch {
    return [];
  }
}

function stepsToGraph(steps: ResearchStep[]): {
  nodes: DagNode[];
  links: DagLink[];
} {
  const nodes = steps.map((step) => ({
    id: String(step.id),
    label: step.label || step.content.slice(0, 40),
    type: step.type,
  }));

  const links = steps.flatMap((step) =>
    parseDependsOn(step.depends_on).map((sourceId) => ({
      source: String(sourceId),
      target: String(step.id),
    })),
  );

  return { nodes, links };
}

async function waitForResearchResult(taskId: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const task = await getResearchTask(taskId);
    if (!task.ok) {
      throw new Error(task.error);
    }

    if (task.data.state === 'FAILURE') {
      throw new Error('The research task failed');
    }

    if (task.data.result) {
      return task.data.result;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 2000));
  }

  throw new Error('The research task is still running. Try again in a moment.');
}

export function DashboardShell() {
  const [activeId, setActiveId] = useState('new');
  const [messages, setMessages] = useState<ChatMessage[]>(STARTER_MESSAGES);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [dagNodes, setDagNodes] = useState<DagNode[]>([]);
  const [dagLinks, setDagLinks] = useState<DagLink[]>([]);
  const [graphOpen, setGraphOpen] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const result = await getUserStatus();

      if (result.ok) {
        setUserId(result.user.id);
      }
    }

    void loadUser();
  }, []);

  const hasMessages = messages.length > 0;
  const hasGraph = dagNodes.length > 0;

  const sendPrompt = async (value: string) => {
    const trimmed = value.trim();
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

    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const askResponse = await askResearch(
        trimmed,
        userId
      );
      if (!askResponse.ok) {
        throw new Error(askResponse.error);
      }

      const result = await waitForResearchResult(askResponse.data.task_id);
      const graph = stepsToGraph(result.steps);

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.final_answer || 'Trace completed without a final answer.',
        },
      ]);
      setDagNodes(graph.nodes);
      setDagLinks(graph.links);
      setGraphOpen(true);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content:
            error instanceof Error
              ? error.message
              : 'Could not complete the research trace.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendPrompt(input);
  };

  const handleNewTrace = () => {
    setActiveId('new');
    setMessages(STARTER_MESSAGES);
    setInput('');
    setDagNodes([]);
    setDagLinks([]);
    setGraphOpen(false);
  };

  return (
    <div className="dash-layout dash-layout--gpt">
      <aside className="dash-sidebar dash-sidebar--gpt">
        <div className="dash-sidebar-top">
          <div className="dash-brand-row">
            <Link href="/" className="dash-brand">
              ThoughtDag
            </Link>
            <span className="dash-version">{APP_VERSION}</span>
          </div>
          <button
            type="button"
            className="dash-new-btn"
            onClick={handleNewTrace}
          >
            New chat
          </button>
        </div>

        <div className="dash-history">
          <p className="dash-history-label">Today</p>
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

      <section className="dash-main dash-main--gpt">
        <header className="dash-topbar">
          <button
            type="button"
            className="dash-mobile-new"
            onClick={handleNewTrace}
          >
            New
          </button>
          <div className="dash-topbar-title">
            <span>ThoughtDag</span>
            <span>{APP_VERSION}</span>
          </div>
          <button
            type="button"
            className="dash-graph-toggle"
            onClick={() => setGraphOpen((open) => !open)}
            disabled={!hasGraph}
          >
            Graph
          </button>
        </header>

        <div className="dash-chat-stage">
          <main className="dash-chat">
            {!hasMessages && (
              <div className="dash-empty-state">
                <h1>What are we tracing today?</h1>
                <p>
                  Ask ThoughtDag to inspect a prompt, compare reasoning paths,
                  or turn model steps into a DAG.
                </p>
                <div className="dash-suggestion-grid">
                  {PROMPT_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="dash-suggestion"
                      onClick={() => void sendPrompt(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasMessages && (
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
                      <div className="dash-message-avatar">
                        {message.role === 'assistant' ? 'TD' : 'You'}
                      </div>
                      <p className="dash-message-content">{message.content}</p>
                    </article>
                  ))}
                  {sending && (
                    <article className="dash-message dash-message--assistant">
                      <div className="dash-message-avatar">TD</div>
                      <p className="dash-message-content dash-message-content--pending">
                        Retrieving memory and tracing the answer...
                      </p>
                    </article>
                  )}
                </div>
              </div>
            )}

            <form className="dash-composer" onSubmit={handleSubmit}>
              <div className="dash-composer-wrap">
                <div className="dash-composer-inner">
                  <textarea
                    className="dash-composer-input"
                    rows={1}
                    placeholder="Message ThoughtDag"
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
                    aria-label="Send message"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 19V5M5 12l7-7 7 7"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <p className="dash-composer-hint">
                  ThoughtDag can make mistakes. Verify important traces.
                </p>
              </div>
            </form>
          </main>

          <aside
            className={clsx('dash-graph-drawer', {
              'dash-graph-drawer--open': graphOpen,
            })}
          >
            <div className="dash-graph-header">
              <div>
                <p className="dash-graph-kicker">Reasoning DAG</p>
                <h2 className="dash-graph-title">
                  {hasGraph ? `${dagNodes.length} nodes` : 'No graph yet'}
                </h2>
              </div>
              <button
                type="button"
                className="dash-graph-close"
                onClick={() => setGraphOpen(false)}
              >
                Close
              </button>
            </div>
            <DagGraph nodes={dagNodes} links={dagLinks} />
          </aside>
        </div>
      </section>
    </div>
  );
}
