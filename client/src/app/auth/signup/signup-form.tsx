'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InputField } from '@/components/input-field';

export function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 1500);
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

      <button
        type="submit"
        className="primary-btn"
        disabled={loading}
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <p className="auth-footer">
        Already have an account?{' '}
        <Link href="/auth/login">Sign in</Link>
      </p>
    </form>
  );
}
