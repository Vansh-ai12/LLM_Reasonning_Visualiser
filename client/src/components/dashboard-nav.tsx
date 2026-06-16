'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export function DashboardNav() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="dash-nav-actions">
      <Link href="/profile" className="dash-nav-link">
        Profile
      </Link>
      <button
        type="button"
        className="dash-nav-link dash-nav-link--button"
        onClick={() => void handleLogout()}
      >
        Logout
      </button>
    </div>
  );
}
