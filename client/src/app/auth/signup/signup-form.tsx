'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { InputField } from '@/components/input-field';
import { registerUser } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';

export function SignupForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const passwordError =
    passwordTouched && password.length > 0 && password.length < 8
      ? 'Must be at least 8 characters'
      : undefined;

  const confirmError =
    confirmTouched && confirmPassword.length > 0 && confirmPassword !== password
      ? 'Passwords do not match'
      : undefined;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setPasswordTouched(true);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmTouched(true);
      return;
    }

    setLoading(true);

    const result = await registerUser({ name, email, password });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    await refresh();
    router.push('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputField
        label="Full name"
        type="text"
        name="name"
        placeholder="Jane Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
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
        onBlur={() => setPasswordTouched(true)}
        error={passwordError}
        showPasswordToggle
      />
      <InputField
        label="Confirm password"
        type="password"
        name="confirmPassword"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onBlur={() => setConfirmTouched(true)}
        error={confirmError}
        showPasswordToggle
      />

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" className="primary-btn" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <p className="auth-footer">
        Already have an account?{' '}
        <Link href="/auth/login">Sign in</Link>
      </p>
    </form>
  );
}
