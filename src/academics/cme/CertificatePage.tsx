// =============================================================================
// academics/cme/CertificatePage.tsx — /academics/cme/certificates route
// =============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Check,
  Clock,
  Copy,
  Download,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useMyCertificates } from './hooks/useCME';
import type { Certificate } from './hooks/useCME';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Copy-to-clipboard with feedback
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy verification code"
      className={`p-1.5 rounded-md border transition-colors focus:outline-none ${
        copied
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-border text-ink-muted hover:text-ink hover:bg-bg'
      }`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Certificate card
// ---------------------------------------------------------------------------

function CertificateCard({ cert }: { cert: Certificate }) {
  return (
    <div className="bg-card border border-border rounded-card shadow-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Award size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-ink leading-snug">{cert.eventTitle}</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Issued to: <span className="font-medium text-ink">{cert.recipientName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Details row */}
      <div className="flex flex-wrap gap-3">
        {/* Completion date */}
        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Clock size={13} />
          <span>Completed {formatDate(cert.completedAt)}</span>
        </div>

        {/* Credit hours */}
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
          <Award size={11} />
          {cert.creditHours.toFixed(1)} {cert.creditType} Credits
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Verification code */}
      <div>
        <p className="text-xs text-ink-muted mb-1.5">Verification Code</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-1.5 bg-bg border border-border rounded-lg font-mono text-sm text-ink tracking-wide truncate">
            {cert.verificationCode}
          </code>
          <CopyButton text={cert.verificationCode} />
        </div>
        <p className="text-xs text-ink-muted mt-1">
          Issued on {formatDate(cert.issuedAt)}
        </p>
      </div>

      {/* Download PDF — coming soon */}
      <button
        disabled
        title="PDF download coming soon"
        className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-ink-muted opacity-50 cursor-not-allowed w-fit"
      >
        <Download size={14} />
        Download PDF
        <span className="text-xs bg-border px-1.5 py-0.5 rounded-full">Soon</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-20 h-20 rounded-full bg-border flex items-center justify-center">
        <BookOpen size={36} className="text-ink-muted" />
      </div>
      <div>
        <p className="text-lg font-semibold text-ink">No certificates yet</p>
        <p className="text-sm text-ink-muted mt-1 max-w-sm mx-auto">
          Attend a CME event to earn credits and receive your certificate.
        </p>
      </div>
      <button
        onClick={() => navigate('/academics/cme')}
        className="px-5 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
      >
        Browse CME Events
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function CertificatePage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/academics', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const { data: certificates, isLoading, isError, error } = useMyCertificates();

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">My CME Certificates</h1>
          <p className="mt-1 text-ink-muted">
            Your continuing medical education credentials
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-accent" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="p-4 bg-danger/10 border border-danger/30 rounded-card text-danger text-sm">
            {error?.message ?? 'Failed to load certificates. Please try again.'}
          </div>
        )}

        {/* Certificate list */}
        {!isLoading && !isError && certificates != null && (
          <>
            {certificates.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {/* Summary bar */}
                <div className="mb-6 flex items-center gap-2 text-sm text-ink-muted">
                  <Award size={15} className="text-primary" />
                  <span>
                    <span className="font-semibold text-ink">{certificates.length}</span>{' '}
                    certificate{certificates.length !== 1 ? 's' : ''} earned
                    {' · '}
                    <span className="font-semibold text-ink">
                      {certificates.reduce((sum, c) => sum + c.creditHours, 0).toFixed(1)}
                    </span>{' '}
                    total credits
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {certificates.map((cert) => (
                    <CertificateCard key={cert.id} cert={cert} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
