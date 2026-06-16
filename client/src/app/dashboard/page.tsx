import { RequireAuth } from '@/components/require-auth';
import { DashboardShell } from '@/components/dashboard-shell';

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardShell />
    </RequireAuth>
  );
}
