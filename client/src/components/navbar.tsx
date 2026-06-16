'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export function Navbar() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          ThoughtDag
        </Link>

        <div className="navbar-actions">
          {loading ? (
            <span className="navbar-skeleton" aria-hidden="true" />
          ) : user ? (
            <>
              <Link href="/dashboard" className="navbar-link-btn">
                Dashboard
              </Link>
              <Link href="/profile" className="navbar-link-btn">
                Profile
              </Link>
              <button
                type="button"
                className="navbar-ghost-btn"
                onClick={() => void handleLogout()}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="navbar-ghost-btn">
                Login
              </Link>
              <Link href="/auth/signup" className="navbar-cta">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
