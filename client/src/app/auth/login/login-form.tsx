'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InputField } from '@/components/input-field';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputField
        label="Email"
        type="email"
        name="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <InputField
        label="Password"
        type="password"
        name="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        showPasswordToggle
      />

      {error && <p className="auth-error">{error}</p>}

      <button
        type="submit"
        className="primary-btn"
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      <p className="auth-footer">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup">Create one</Link>
      </p>
    </form>
  );
}
