'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { fetchRuns, ReasoningRun } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

interface ChatContextValue {
  runs: ReasoningRun[];
  activeRunId: string | null;
  setActiveRunId: (id: string | null) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  refreshRuns: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [runs, setRuns] = useState<ReasoningRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const refreshRuns = useCallback(async () => {
    if (user) {
      const data = await fetchRuns();
      setRuns(data);
    }
  }, [user]);

  useEffect(() => {
    refreshRuns();
  }, [refreshRuns]);

  return (
    <ChatContext.Provider
      value={{
        runs,
        activeRunId,
        setActiveRunId,
        isProcessing,
        setIsProcessing,
        refreshRuns
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
