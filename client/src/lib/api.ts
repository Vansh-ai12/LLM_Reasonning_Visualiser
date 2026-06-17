const DEFAULT_API_URL = '/backend';

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface MemoryMatch {
  text: string;
  memory_type: string;
  created_at: string;
  score: number;
}

export interface ResearchAskResponse {
  task_id: string;
}

export interface ResearchStep {
  id: number;
  type: 'hypothesis' | 'lookup' | 'calculation' | 'correction' | 'conclusion';
  label: string;
  content: string;
  depends_on: string | number[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ResearchResult {
  final_answer: string;
  steps: ResearchStep[];
  retrieved_memories?: MemoryMatch[];
}

export interface TaskStatus {
  task_id: string;
  state: string;
  result?: ResearchResult;
}

function isResearchAskResponse(
  data: unknown
): data is ResearchAskResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'task_id' in data &&
    typeof data.task_id === 'string'
  );
}
interface AuthSuccess {
  message: string;
  id?: string;
}

interface AuthError {
  error?: string;
  Error?: string;
}

type AuthResponse = Partial<AuthSuccess & AuthError>;

async function parseAuthResponse(res: Response): Promise<AuthResponse> {
  try {
    return (await res.json()) as AuthResponse;
  } catch {
    return { error: 'Unexpected server response' };
  }
}

export async function getUserStatus(): Promise<
  { ok: true; user: User } | { ok: false }
> {
  try {
    const res = await fetch(`${getApiUrl()}/users/status`, {
      credentials: 'include',
    });

    if (!res.ok) {
      return { ok: false };
    }

    const user = (await res.json()) as User;
    return { ok: true, user };
  } catch {
    return { ok: false };
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`${getApiUrl()}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const data = await parseAuthResponse(res);

  if (!res.ok || data.error) {
    return { ok: false, error: data.error ?? 'Sign in failed' };
  }

  return { ok: true };
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`${getApiUrl()}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await parseAuthResponse(res);

  if (!res.ok || data.error || data.Error) {
    return {
      ok: false,
      error: data.error ?? data.Error ?? 'Could not create account',
    };
  }

  return { ok: true };
}

export async function logoutUser(): Promise<void> {
  await fetch(`${getApiUrl()}/users/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export function getGitHubAuthUrl(): string {
  return `${getApiUrl()}/users/oauth/github`;
}

export async function askResearch(
  question: string, user_id:string
): Promise<{ ok: true; data: ResearchAskResponse } | { ok: false; error: string }> {
  const res = await fetch(`${getApiUrl()}/research/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ question, user_id:user_id }),
  });

  const data = (await res.json().catch(() => null)) as unknown;

  if (!res.ok || !isResearchAskResponse(data)) {
    const detail =
      typeof data === 'object' &&
      data !== null &&
      'detail' in data &&
      typeof data.detail === 'string'
        ? data.detail
        : null;

    return {
      ok: false,
      error: detail ?? 'Research request failed',
    };
  }

  return { ok: true, data };
}

export async function getResearchTask(
  taskId: string,
): Promise<{ ok: true; data: TaskStatus } | { ok: false; error: string }> {
  const res = await fetch(`${getApiUrl()}/task/${taskId}`, {
    credentials: 'include',
  });

  const data = (await res.json().catch(() => null)) as TaskStatus | null;

  if (!res.ok || !data) {
    return { ok: false, error: 'Could not load task status' };
  }

  return { ok: true, data };
}
