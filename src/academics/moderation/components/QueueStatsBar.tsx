// =============================================================================
// moderation/components/QueueStatsBar.tsx
// =============================================================================

interface QueueStatsBarProps {
  pending: number;
  reviewedToday: number;
  avgHoursInQueue: number;
}

function pendingColor(n: number): string {
  if (n === 0) return '#38a169';
  if (n <= 5) return '#1e3a5f';
  if (n <= 10) return '#d69e2e';
  return '#e53e3e';
}

interface StatTileProps {
  value: string | number;
  label: string;
  color: string;
  pulse?: boolean;
  onClick?: () => void;
}

function StatTile({ value, label, color, pulse, onClick }: StatTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex-1 min-w-[120px] bg-white border border-border rounded-card px-4 py-4',
        'text-left transition-all duration-150',
        onClick ? 'hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer' : 'cursor-default',
      ].join(' ')}
    >
      <div
        className={['text-[2rem] font-bold font-sans leading-none mb-1', pulse ? 'animate-pulse' : ''].join(' ')}
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-xs text-ink-muted font-medium">{label}</div>
    </button>
  );
}

export function QueueStatsBar({ pending, reviewedToday, avgHoursInQueue }: QueueStatsBarProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      <StatTile
        value={pending}
        label="Pending Review"
        color={pendingColor(pending)}
        pulse={pending > 10}
      />
      <StatTile
        value={reviewedToday}
        label="Reviewed Today"
        color="#38a169"
      />
      <StatTile
        value={`${avgHoursInQueue.toFixed(1)} hrs`}
        label="Avg. Wait Time"
        color="#718096"
      />
    </div>
  );
}
