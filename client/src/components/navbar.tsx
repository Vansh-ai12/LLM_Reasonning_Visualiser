'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          ThoughtDag
        </Link>
        <div className="navbar-links">
          <a href="#" className="navbar-link">
            Docs
          </a>
          <a
            href="https://github.com"
            className="navbar-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
        {!loading && (
          <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user ? (
              <>
                <Link href="/dashboard" className="navbar-cta">Dashboard</Link>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: '#0a0a0a', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button onClick={logout} style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="navbar-link">Sign in</Link>
                <Link href="/auth/signup" className="navbar-cta">Get started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
