// =============================================================================
// academics/guidelines/GuidelineChapterPage.tsx
// /academics/guidelines/:slug/c/:chapterNo
//
// Renders a single guideline chapter PDF inline via PdfViewer (pdfjs-dist —
// see PdfViewer.tsx for why this replaced a plain <iframe>).
// =============================================================================

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { getGuidelineSet } from './registry';
import { PdfViewer } from './PdfViewer';
import type { GuidelineChapter, GuidelineIndex } from './types';
import { safeFixed } from '../../lib/safeNumber';

export function GuidelineChapterPage() {
  const { slug, chapterNo } = useParams<{ slug: string; chapterNo: string }>();
  const guideline = slug ? getGuidelineSet(slug) : undefined;

  const [chapter, setChapter] = useState<GuidelineChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!guideline || !chapterNo) return;
    setLoading(true);
    setError(null);
    fetch(guideline.indexUrl)
      .then((r) => {
        if (!r.ok) throw new Error('Index not reachable');
        return r.json();
      })
      .then((json: GuidelineIndex) => {
        const ch = json.chapters.find((c) => c.no === chapterNo);
        if (!ch) throw new Error(`Chapter ${chapterNo} not found in this guideline`);
        setChapter(ch);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError((e as Error).message || 'Failed to load chapter');
        setLoading(false);
      });
  }, [guideline, chapterNo]);

  if (!guideline) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary mb-2">Guideline not found</p>
          <Link
            to="/academics"
            className="text-accent text-sm font-semibold hover:underline"
          >
            ← Back to Academics
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="max-w-browse mx-auto px-6 py-6 w-full">
        {/* Back link */}
        <Link
          to={`/academics/guidelines/${guideline.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted
                     hover:text-primary mb-4"
        >
          <ArrowLeft size={14} /> {guideline.name}
        </Link>

        {/* Header */}
        {chapter && (
          <div className="flex items-start gap-3 mb-4">
            <div
              className="shrink-0 w-10 h-10 rounded-xl flex items-center
                         justify-center text-white text-sm font-bold"
              style={{ backgroundColor: guideline.color }}
            >
              {chapter.no}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl font-extrabold text-primary
                             leading-snug">
                {chapter.title}
              </h1>
              <p className="text-[11px] text-ink-muted font-medium mt-0.5">
                {chapter.section || 'Uncategorised'}
                {chapter.pages != null && <> · {chapter.pages} pp</>}
                {chapter.size_kb != null && (
                  <> · {safeFixed((chapter.size_kb ?? 0) / 1024)} MB</>
                )}
                {' · '}{guideline.fullName}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <a
                href={chapter.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg
                           text-xs font-semibold border border-border bg-card
                           text-ink hover:bg-bg transition-colors"
              >
                <ExternalLink size={12} /> Open in new tab
              </a>
              <a
                href={chapter.url}
                download
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg
                           text-xs font-semibold text-white"
                style={{ backgroundColor: guideline.color }}
              >
                <Download size={12} /> Download PDF
              </a>
            </div>
          </div>
        )}
      </div>

      {/* PDF viewer fills the rest of the screen */}
      <div className="flex-1 px-6 pb-8 max-w-browse mx-auto w-full">
        {loading && (
          <div className="flex items-center justify-center py-32 text-ink-muted">
            <Loader2 size={18} className="animate-spin mr-2" /> Loading chapter…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl bg-danger/8 border border-danger/30
                          p-4 text-sm text-danger flex items-start gap-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold mb-0.5">Couldn't load this chapter</p>
              <p className="text-danger/80">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && chapter && (
          <div className="rounded-xl border border-border bg-card overflow-hidden
                          shadow-card">
            <PdfViewer key={chapter.url} url={chapter.url} accentColor={guideline.color} />
          </div>
        )}
      </div>
    </div>
  );
}
