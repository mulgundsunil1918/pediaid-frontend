// =============================================================================
// academics/admin/pages/AnalyticsPage.tsx — who is actually using PediAid
//
// Every number here was uncollectable until this week. Age, gender and
// qualifications lived only in SharedPreferences on each handset: unreadable
// by anyone, and deleted by every reinstall. The profile form writes them to
// Firestore and the app syncs them here, which is what makes this page
// possible at all.
//
// So the most important chart is the least interesting one — the completion
// rate. Until that climbs, every other chart on this page describes a small
// and self-selected slice, and reading it as the user base would be wrong.
// =============================================================================

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useProfileAnalytics } from '../hooks/useAdmin';
import type { AnalyticsBucket } from '../hooks/useAdmin';

// Sequential rather than categorical: these are shares of one population, not
// unrelated series, and a rainbow would imply differences that are not there.
const SLICE = ['#0F5CA8', '#2E7DC8', '#5B9FDC', '#8CBEE9', '#B9D8F2', '#DCEAF8'];

export function AnalyticsPage() {
  const { data, isLoading, isError, error } = useProfileAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-accent" size={28} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-card border border-danger/30 bg-danger/10">
        <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-danger">Could not load analytics</p>
          <p className="text-sm text-ink-muted mt-1">
            {error?.message ?? 'Unknown error.'}
          </p>
        </div>
      </div>
    );
  }

  const t = data.totals;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">User analytics</h1>
        <p className="text-sm text-ink-muted mt-1">
          Aggregated from the profile every signed-in user now completes.
          Nothing on this page identifies a person.
        </p>
      </div>

      {/* Completion first, deliberately. Every chart below is a slice of it. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Active users" value={t.users.toLocaleString('en-IN')} />
        <Stat
          label="Profile started"
          value={t.withProfile.toLocaleString('en-IN')}
        />
        <Stat label="Complete" value={t.complete.toLocaleString('en-IN')} />
        <Stat
          label="Completion"
          value={`${t.completionRate}%`}
          tone={
            t.completionRate >= 70
              ? 'good'
              : t.completionRate >= 30
                ? 'warn'
                : 'bad'
          }
        />
      </div>

      {t.completionRate < 50 && (
        <p className="text-xs text-ink-muted bg-warning/10 border border-warning/30 rounded-lg px-3 py-2">
          Fewer than half of users have completed a profile, so the charts
          below describe a self-selected slice rather than the whole user base.
          Read them as a direction of travel, not a measurement.
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <Card
          title="Qualifications"
          subtitle="Each user may hold several, so these sum above the user count"
        >
          <BarsH data={data.qualifications.slice(0, 12)} />
        </Card>

        <Card title="Specialties" subtitle="As typed by users">
          <BarsH data={data.specialties.slice(0, 12)} />
        </Card>

        <Card title="Age" subtitle="Derived from year of birth">
          <BarsV data={data.ageBands} />
        </Card>

        <Card title="Gender">
          <Donut data={data.genders} />
        </Card>

        <Card
          title="Sign-ups by month"
          subtitle="From account creation, not profile completion"
          className="lg:col-span-2"
        >
          <Trend data={data.signupsByMonth} />
        </Card>
      </div>

      {data.cached && (
        <p className="text-[11px] text-ink-muted">
          Served from a five-minute cache — the database sleeps when idle, and
          billing follows wake time rather than queries.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'bad';
}) {
  const colour =
    tone === 'good'
      ? 'text-success'
      : tone === 'warn'
        ? 'text-warning'
        : tone === 'bad'
          ? 'text-danger'
          : 'text-ink';
  return (
    <div className="bg-card border border-border rounded-card p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${colour}`}>{value}</p>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-card border border-border rounded-card p-4 ${className}`}
    >
      <h2 className="font-semibold text-ink">{title}</h2>
      {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Empty() {
  return (
    <p className="text-sm text-ink-muted py-8 text-center">
      Nothing recorded yet.
    </p>
  );
}

/** Horizontal bars — for labels too long to sit under a vertical axis. */
function BarsH({ data }: { data: AnalyticsBucket[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 30)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="currentColor" opacity={0.08} />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={150}
          tick={{ fontSize: 11 }}
        />
        <Tooltip cursor={{ opacity: 0.06 }} />
        <Bar dataKey="count" fill={SLICE[0]} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Vertical bars — for an ordered distribution, where shape is the point. */
function BarsV({ data }: { data: AnalyticsBucket[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: -16, right: 8 }}>
        <CartesianGrid vertical={false} stroke="currentColor" opacity={0.08} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip cursor={{ opacity: 0.06 }} />
        <Bar dataKey="count" fill={SLICE[1]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Donut({ data }: { data: AnalyticsBucket[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          innerRadius={52}
          outerRadius={84}
          paddingAngle={2}
          label={(e: { name?: string }) => e.name ?? ''}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={SLICE[i % SLICE.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function Trend({ data }: { data: AnalyticsBucket[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: -16, right: 8 }}>
        <CartesianGrid vertical={false} stroke="currentColor" opacity={0.08} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip cursor={{ opacity: 0.06 }} />
        <Line
          type="monotone"
          dataKey="count"
          stroke={SLICE[0]}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
