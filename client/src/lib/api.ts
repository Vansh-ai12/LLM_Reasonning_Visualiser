const DEFAULT_API_URL = 'http://localhost:8000';

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

interface AuthSuccess {
  message?: string;
  id?: string;
}

interface AuthError {
  error?: string;
  Error?: string;
}

type AuthResponse = AuthSuccess & AuthError;

async function parseAuthResponse(res: Response): Promise<AuthResponse> {
  try {
    return (await res.json()) as AuthResponse;
  } catch {
    return { error: 'Unexpected server response' };
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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export async function fetchUserStatus(): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${getApiUrl()}/users/status`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${getApiUrl()}/users/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore
  }
}

export function getGitHubAuthUrl(): string {
  return `${getApiUrl()}/users/oauth/github`;
}

export interface ReasoningRun {
  id: string;
  user_id: string;
  reasoning_type: string;
  input_data: string;
  output_data: string;
  summary: string | null;
  created_at: string;
}

export interface ReasoningStep {
  id: number;
  run_id: string;
  type: 'hypothesis' | 'lookup' | 'calculation' | 'correction' | 'conclusion';
  confidence: 'high' | 'medium' | 'low';
  label: string;
  content: string;
  depends_on: string; // JSON string "[1,2]"
  entropy: number | null;
}

export async function fetchRuns(): Promise<ReasoningRun[]> {
  try {
    const res = await fetch(`${getApiUrl()}/run/history`, {
      credentials: 'include',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchSteps(runId: string): Promise<ReasoningStep[]> {
  try {
    const res = await fetch(`${getApiUrl()}/run/${runId}/steps`, {
      credentials: 'include',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function askQuestion(question: string): Promise<{ taskId: string, runId: string } | null> {
  try {
    const res = await fetch(`${getApiUrl()}/run/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ question }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { taskId: data.task_id, runId: data.run_id };
  } catch {
    return null;
  }
}

export async function pollTask(taskId: string): Promise<{ state: string, result?: unknown }> {
  try {
    const res = await fetch(`${getApiUrl()}/task/${taskId}`);
    if (!res.ok) return { state: 'FAILURE' };
    return await res.json();
  } catch {
    return { state: 'FAILURE' };
  }
}
