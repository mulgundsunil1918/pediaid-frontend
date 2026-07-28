// =============================================================================
// academics/guidelines/PdfViewer.tsx
//
// Renders a PDF by fetching its bytes and drawing each page to a <canvas>
// with pdfjs-dist, instead of embedding the PDF in an <iframe>.
//
// Iframing a cross-origin PDF turned out to be unreliable: some browsers
// (enterprise Chrome policies, certain extensions) silently swap the frame's
// content for their own "blocked" placeholder. That placeholder still fires
// the iframe's `load` event, so there's no reliable way to detect the
// failure from the parent page. Fetching the bytes directly and rendering
// them ourselves sidesteps browser/iframe framing policies entirely — the
// only requirement is that the PDF's host allows cross-origin fetch, which
// every source this app uses already does (`access-control-allow-origin: *`).
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, ExternalLink, Download } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  url: string;
  accentColor: string;
}

export function PdfViewer({ url, accentColor }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    async function render() {
      try {
        const doc = await pdfjsLib.getDocument({ url }).promise;
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';
        const targetWidth = container.clientWidth || 800;

        for (let pageNo = 1; pageNo <= doc.numPages; pageNo++) {
          const page = await doc.getPage(pageNo);
          if (cancelled) return;

          const unscaled = page.getViewport({ scale: 1 });
          const scale = targetWidth / unscaled.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = '100%';
          canvas.style.display = 'block';
          canvas.style.marginBottom = '12px';
          canvas.style.borderRadius = '8px';
          canvas.style.boxShadow = '0 1px 4px rgba(0,0,0,0.12)';
          container.appendChild(canvas);

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        }

        if (!cancelled) setStatus('ready');
      } catch (e) {
        console.error('[PdfViewer] render failed', e);
        if (!cancelled) setStatus('error');
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (status === 'error') {
    return (
      <div className="p-10 text-center text-ink-muted text-sm h-[78vh]
                      flex flex-col items-center justify-center">
        <AlertCircle size={28} className="mb-3 text-danger/70" />
        <p className="font-semibold text-ink mb-1">Couldn't load this PDF</p>
        <p className="max-w-sm mb-4">
          The file couldn't be fetched or rendered. You can still open or
          download it directly.
        </p>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg
                       text-sm font-semibold border border-border bg-card
                       text-ink hover:bg-bg transition-colors"
          >
            <ExternalLink size={14} /> Open in new tab
          </a>
          <a
            href={url}
            download
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg
                       text-sm font-semibold text-white"
            style={{ backgroundColor: accentColor }}
          >
            <Download size={14} /> Download PDF
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {status === 'loading' && (
        <div className="flex items-center justify-center py-32 text-ink-muted">
          <Loader2 size={18} className="animate-spin mr-2" /> Rendering PDF…
        </div>
      )}
      <div
        ref={containerRef}
        className="p-3 bg-bg"
        style={{ display: status === 'ready' ? 'block' : 'none' }}
      />
    </div>
  );
}
