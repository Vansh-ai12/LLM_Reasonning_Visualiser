'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { RequireAuth } from '@/components/require-auth';
import { DashboardNav } from '@/components/dashboard-nav';
import { useAuth } from '@/components/auth-provider';

function ProfileContent() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <p className="profile-kicker">Account</p>
          <h1 className="profile-title">Profile</h1>
        </div>
        <DashboardNav />
      </header>

      <motion.div
        className="profile-card"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="profile-field">
          <span className="profile-label">Name</span>
          <span className="profile-value">{user.name}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">Email</span>
          <span className="profile-value">{user.email}</span>
        </div>
        <div className="profile-field">
          <span className="profile-label">User ID</span>
          <span className="profile-value profile-value--mono">{user.id}</span>
        </div>

        <div className="profile-actions">
          <Link href="/dashboard" className="profile-link-btn">
            Back to dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
