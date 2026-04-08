// =============================================================================
// academics/cme/components/AddToCalendar.tsx — calendar export dropdown
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import type { CMEEvent } from '../hooks/useCME';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AddToCalendarProps {
  event: CMEEvent;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert ISO string to Google Calendar date-time token: YYYYMMDDTHHmmssZ */
function toGCalToken(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Convert ISO string to iCal DTSTART/DTEND token */
function toICalToken(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Escape special chars in iCal text fields */
function icalEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function buildICSContent(event: CMEEvent): string {
  const location = event.venue ?? event.onlineUrl ?? 'Online';
  const description = event.description;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PediAid//CME Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@pediaid.app`,
    `DTSTAMP:${toICalToken(new Date().toISOString())}`,
    `DTSTART:${toICalToken(event.startsAt)}`,
    `DTEND:${toICalToken(event.endsAt)}`,
    `SUMMARY:${icalEscape(event.title)}`,
    `DESCRIPTION:${icalEscape(description)}`,
    `LOCATION:${icalEscape(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function buildGoogleCalendarUrl(event: CMEEvent): string {
  const location = event.venue ?? event.onlineUrl ?? 'Online';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toGCalToken(event.startsAt)}/${toGCalToken(event.endsAt)}`,
    details: event.description,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadICS(event: CMEEvent, filename: string): void {
  const content = buildICSContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddToCalendar({ event }: AddToCalendarProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const safeSlug = event.slug.replace(/[^a-z0-9-]/gi, '_');

  const options: { label: string; action: () => void }[] = [
    {
      label: 'Google Calendar',
      action: () => {
        window.open(buildGoogleCalendarUrl(event), '_blank', 'noopener,noreferrer');
        setOpen(false);
      },
    },
    {
      label: 'Apple / iCal (.ics)',
      action: () => {
        downloadICS(event, `${safeSlug}.ics`);
        setOpen(false);
      },
    },
    {
      label: 'Outlook (.ics)',
      action: () => {
        downloadICS(event, `${safeSlug}-outlook.ics`);
        setOpen(false);
      },
    },
  ];

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-accent border border-accent rounded-lg hover:bg-accent/10 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        <Calendar size={15} />
        Add to Calendar
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] bg-card border border-border rounded-card shadow-card-hover animate-fadeSlideIn">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-bg transition-colors first:rounded-t-card last:rounded-b-card"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
