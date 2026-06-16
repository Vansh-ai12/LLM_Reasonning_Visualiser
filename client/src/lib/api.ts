const DEFAULT_API_URL = '/backend';

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

export interface User {
  id: string;
  name: string;
  email: string;
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
