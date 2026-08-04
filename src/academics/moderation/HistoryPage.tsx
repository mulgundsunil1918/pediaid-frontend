// =============================================================================
// moderation/HistoryPage.tsx
// =============================================================================

import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ModerationHistory } from './components/ModerationHistory';
import { useAuthStore } from '../../store/authStore';

export function HistoryPage() {
  const navigate = useNavigate();

  // Moderator surface, not an admin one — it doesn't use AdminLayout, so it
  // needs its own check. canModerate now includes super_admin; every action
  // is enforced server-side regardless, so this is about not showing a
  // review UI to someone who can't use it.
  const canModerate = useAuthStore((s) => s.canModerate);
  if (!canModerate()) {
    return (
      <Navigate
        to={`/academics/login?next=${encodeURIComponent(window.location.pathname)}`}
        replace
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/academics/moderator/queue')}
          className="p-2 rounded-xl hover:bg-gray-100 text-ink-muted transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Moderation History</h1>
          <p className="text-sm text-ink-muted mt-0.5">Your past review decisions</p>
        </div>
      </div>

      <ModerationHistory />
    </div>
  );
}
