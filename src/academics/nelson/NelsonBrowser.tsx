// =============================================================================
// academics/nelson/NelsonBrowser.tsx — Nelson Textbook of Pediatrics TOC browser
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Search, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NelsonSubchapter {
  number: string;
  title: string;
}

interface NelsonChapter {
  number: string;
  title: string;
  section: string | null;
  subchapters: NelsonSubchapter[];
}

interface NelsonPart {
  roman: string;
  number: number;
  title: string;
  chapters: NelsonChapter[];
}

// ---------------------------------------------------------------------------
// Detail modal
// ---------------------------------------------------------------------------

function DetailPanel({
  item,
  onClose,
}: {
  item: { number: string; title: string; isSubchapter?: boolean };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {item.number}
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
              {item.isSubchapter ? 'Subchapter' : 'Chapter'}
            </p>
            <h2 className="text-base font-bold text-gray-900 leading-snug">{item.title}</h2>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-gray-500">Content Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">
            This chapter will be authored and peer-reviewed by contributors.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Part colour palette (cycles through 35 parts)
// ---------------------------------------------------------------------------

const PART_COLORS = [
  '#1e3a5f', '#2563eb', '#7c3aed', '#db2777', '#ea580c',
  '#16a34a', '#0891b2', '#9333ea', '#dc2626', '#0d9488',
  '#d97706', '#4f46e5', '#be123c', '#15803d', '#1d4ed8',
  '#6d28d9', '#b45309', '#0e7490', '#047857', '#9f1239',
  '#1e40af', '#6b21a8', '#c2410c', '#065f46', '#7e22ce',
  '#92400e', '#164e63', '#14532d', '#1e1b4b', '#450a0a',
  '#4a1942', '#0c4a6e', '#1a2e05', '#422006', '#052e16',
];

function partColor(index: number): string {
  return PART_COLORS[index % PART_COLORS.length] ?? '#1e3a5f';
}

// ---------------------------------------------------------------------------
// Chapter row
// ---------------------------------------------------------------------------

function ChapterRow({
  chapter,
  color,
  searchQ,
  onSelect,
}: {
  chapter: NelsonChapter;
  color: string;
  searchQ: string;
  onSelect: (item: { number: string; title: string; isSubchapter?: boolean }) => void;
}) {
  const [open, setOpen] = useState(false);

  // Auto-expand when searching and has matching subchapters
  useEffect(() => {
    if (searchQ && chapter.subchapters.some(s =>
      s.title.toLowerCase().includes(searchQ) || s.number.includes(searchQ)
    )) {
      setOpen(true);
    } else if (!searchQ) {
      setOpen(false);
    }
  }, [searchQ, chapter.subchapters]);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden mb-1.5">
      {/* Chapter header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        onClick={() => {
          if (chapter.subchapters.length > 0) {
            setOpen(v => !v);
          } else {
            onSelect({ number: chapter.number, title: chapter.title });
          }
        }}
      >
        <span
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: color }}
        >
          {chapter.number}
        </span>
        <span className="flex-1 text-sm font-medium text-gray-800 text-left leading-snug">
          {chapter.title}
        </span>
        {chapter.subchapters.length > 0 ? (
          <span className="shrink-0 text-gray-400">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        ) : (
          <span className="shrink-0 text-gray-300">
            <ChevronRight size={16} />
          </span>
        )}
      </button>

      {/* Subchapters */}
      {open && chapter.subchapters.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50">
          {chapter.subchapters.map(sub => (
            <button
              key={sub.number}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-0"
              onClick={() => onSelect({ number: sub.number, title: sub.title, isSubchapter: true })}
            >
              <span
                className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: color + 'cc' }}
              >
                {sub.number}
              </span>
              <span className="flex-1 text-xs text-gray-700 text-left leading-snug">{sub.title}</span>
              <ChevronRight size={14} className="shrink-0 text-gray-300" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Part section
// ---------------------------------------------------------------------------

function PartSection({
  part,
  index,
  searchQ,
  onSelect,
}: {
  part: NelsonPart;
  index: number;
  searchQ: string;
  onSelect: (item: { number: string; title: string; isSubchapter?: boolean }) => void;
}) {
  const color = partColor(index);
  const [collapsed, setCollapsed] = useState(false);

  // Auto-expand when searching
  useEffect(() => {
    if (searchQ) setCollapsed(false);
  }, [searchQ]);

  return (
    <div className="mb-4">
      {/* Part header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white font-bold text-sm mb-2"
        style={{ backgroundColor: color }}
        onClick={() => setCollapsed(v => !v)}
      >
        <span className="text-white/70 font-normal text-xs shrink-0">PART {part.roman}</span>
        <span className="flex-1 text-left">{part.title}</span>
        <span className="text-white/70 text-xs shrink-0">{part.chapters.length} ch</span>
        <span className="shrink-0 text-white/70">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Chapters */}
      {!collapsed && (
        <div className="pl-2">
          {part.chapters.map(ch => (
            <ChapterRow
              key={ch.number}
              chapter={ch}
              color={color}
              searchQ={searchQ}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main browser
// ---------------------------------------------------------------------------

export function NelsonBrowser() {
  const [parts, setParts] = useState<NelsonPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ number: string; title: string; isSubchapter?: boolean } | null>(null);

  useEffect(() => {
    fetch('/nelson_toc.json')
      .then(r => r.json())
      .then((data: NelsonPart[]) => { setParts(data); setLoading(false); })
      .catch(() => { setError('Failed to load index'); setLoading(false); });
  }, []);

  const q = query.toLowerCase().trim();

  const filtered = useMemo((): NelsonPart[] => {
    if (!q) return parts;
    return parts
      .map(part => ({
        ...part,
        chapters: part.chapters.filter(ch =>
          ch.title.toLowerCase().includes(q) ||
          ch.number.includes(q) ||
          ch.subchapters.some(s => s.title.toLowerCase().includes(q) || s.number.includes(q))
        ),
      }))
      .filter(part =>
        part.title.toLowerCase().includes(q) ||
        part.roman.toLowerCase() === q ||
        part.chapters.length > 0
      );
  }, [parts, q]);

  const totalChapters = filtered.reduce((a, p) => a + p.chapters.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Paediatrics Index</h1>
              <p className="text-xs text-gray-500">Table of Contents</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search chapters, topics…"
              className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#1e3a5f' } as React.CSSProperties}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {q && (
            <p className="text-xs text-gray-500 mt-2">
              {totalChapters} chapter{totalChapters !== 1 ? 's' : ''} matching "{query}"
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-500 text-sm">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No chapters found</p>
            <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
          </div>
        )}

        {!loading && !error && filtered.map((part, i) => (
          <PartSection
            key={part.roman}
            part={part}
            index={parts.indexOf(part)}
            searchQ={q}
            onSelect={setSelected}
          />
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <DetailPanel item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
