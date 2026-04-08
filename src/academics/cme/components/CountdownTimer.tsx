// =============================================================================
// academics/cme/components/CountdownTimer.tsx — live countdown to event start
// =============================================================================

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CountdownTimerProps {
  targetDate: string; // ISO 8601
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function calcTimeLeft(targetDate: string): TimeLeft {
  const diff = Math.floor((new Date(targetDate).getTime() - Date.now()) / 1000);
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: diff };

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return { days, hours, minutes, seconds, totalSeconds: diff };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(targetDate));

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(id);
  }, [targetDate]);

  // Event has ended (targetDate is the end date when used from detail page)
  if (timeLeft.totalSeconds < -1) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
        <Clock size={14} />
        Ended
      </span>
    );
  }

  // In progress / just started
  if (timeLeft.totalSeconds <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success animate-pulse">
        <Clock size={14} />
        In Progress
      </span>
    );
  }

  const totalSecondsLeft = timeLeft.totalSeconds;
  const isUnderOneHour = totalSecondsLeft < 3600;
  const isUnderOneDay = totalSecondsLeft < 86400;

  const colorClass = isUnderOneHour
    ? 'text-danger'
    : isUnderOneDay
      ? 'text-warning'
      : 'text-ink';

  const pulseClass = isUnderOneHour ? 'animate-pulse' : '';

  const parts: string[] = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  parts.push(`${timeLeft.hours}h`);
  parts.push(`${timeLeft.minutes}m`);
  parts.push(`${timeLeft.seconds}s`);

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium tabular-nums ${colorClass} ${pulseClass}`}>
      <Clock size={14} />
      {parts.join(' ')}
    </span>
  );
}
