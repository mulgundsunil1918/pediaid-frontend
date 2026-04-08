// =============================================================================
// academics/dashboard/components/StatsRow.tsx — Four KPI stat cards
// =============================================================================

import { BookOpen, Clock, AlertCircle, Eye } from 'lucide-react';
import type { DashboardStats } from '../hooks/useDashboard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatsRowProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colorClasses: string;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Single stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  colorClasses,
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-card shadow-card p-5 flex items-center gap-4 animate-pulse">
        <div className="w-11 h-11 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        bg-card rounded-card shadow-card p-5
        flex items-center gap-4
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-card-hover
        cursor-default
      "
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClasses}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-ink tabular-nums leading-tight">
          {value}
        </p>
        <p className="text-sm text-ink-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatsRow
// ---------------------------------------------------------------------------

export function StatsRow({ stats, isLoading }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Published"
        value={stats?.publishedChapters ?? 0}
        icon={<BookOpen size={20} className="text-success" />}
        colorClasses="bg-green-50"
        isLoading={isLoading}
      />
      <StatCard
        label="Pending Review"
        value={stats?.pendingChapters ?? 0}
        icon={<Clock size={20} className="text-warning" />}
        colorClasses="bg-yellow-50"
        isLoading={isLoading}
      />
      <StatCard
        label="Rejected"
        value={stats?.rejectedChapters ?? 0}
        icon={<AlertCircle size={20} className="text-danger" />}
        colorClasses="bg-red-50"
        isLoading={isLoading}
      />
      <StatCard
        label="Total Views"
        value={
          isLoading
            ? 0
            : (stats?.totalViews ?? 0) >= 1000
              ? `${((stats?.totalViews ?? 0) / 1000).toFixed(1)}k`
              : (stats?.totalViews ?? 0)
        }
        icon={<Eye size={20} className="text-accent" />}
        colorClasses="bg-blue-50"
        isLoading={isLoading}
      />
    </div>
  );
}
