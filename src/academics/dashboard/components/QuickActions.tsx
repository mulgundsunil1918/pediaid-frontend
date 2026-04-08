// =============================================================================
// academics/dashboard/components/QuickActions.tsx — Horizontal quick-action bar
// =============================================================================

import { useNavigate } from 'react-router-dom';
import { FilePlus2, Library, ListChecks, History } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-2
        px-4 py-2.5
        rounded-xl border border-border bg-card
        text-sm font-medium text-ink
        hover:border-accent hover:text-accent hover:bg-blue-50
        transition-all duration-150
        whitespace-nowrap
        shadow-card hover:shadow-card-hover
      "
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </button>
  );
}

export function QuickActions() {
  const navigate = useNavigate();
  const { canAuthor, hasRole } = useAuthStore();

  return (
    <div className="flex flex-wrap gap-3">
      {canAuthor() && (
        <ActionButton
          icon={<FilePlus2 size={16} />}
          label="New Chapter"
          onClick={() => navigate('/academics/editor/new')}
        />
      )}

      <ActionButton
        icon={<Library size={16} />}
        label="Browse Content"
        onClick={() => navigate('/academics')}
      />

      {hasRole('moderator', 'admin') && (
        <ActionButton
          icon={<ListChecks size={16} />}
          label="View Queue"
          onClick={() => navigate('/academics/moderator/queue')}
        />
      )}

      {hasRole('moderator', 'admin') && (
        <ActionButton
          icon={<History size={16} />}
          label="History"
          onClick={() => navigate('/academics/moderator/history')}
        />
      )}
    </div>
  );
}
