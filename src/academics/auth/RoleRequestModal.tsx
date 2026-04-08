// =============================================================================
// academics/auth/RoleRequestModal.tsx
// Modal: "Join the PediAid Academics Community" — request author/moderator/admin
// =============================================================================

import { useState, useEffect, useCallback, type ReactNode, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader2, CheckCircle2, AlertCircle, BookOpen, ShieldCheck, Settings2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE } from '../../lib/apiBase';
import type { AcadUserRole } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RequestableRole = 'author' | 'moderator' | 'admin';

interface RoleCard {
  role: RequestableRole;
  label: string;
  description: string;
  icon: ReactNode;
  accentColor: string;          // Tailwind border/ring colour class
  badgeBg: string;              // Tailwind badge background class
  badgeText: string;            // Tailwind badge text colour class
  borderSelected: string;       // border style when selected
}

// ---------------------------------------------------------------------------
// Role metadata
// ---------------------------------------------------------------------------

const ROLE_CARDS: RoleCard[] = [
  {
    role: 'author',
    label: 'Author',
    description: 'Write and publish clinical chapters',
    icon: <BookOpen size={22} aria-hidden="true" />,
    accentColor: 'border-blue-400',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    borderSelected: 'border-blue-500 ring-2 ring-blue-200',
  },
  {
    role: 'moderator',
    label: 'Moderator',
    description: 'Review and approve submitted content',
    icon: <ShieldCheck size={22} aria-hidden="true" />,
    accentColor: 'border-purple-400',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    borderSelected: 'border-purple-500 ring-2 ring-purple-200',
  },
  {
    role: 'admin',
    label: 'Admin',
    description: 'Full platform management',
    icon: <Settings2 size={22} aria-hidden="true" />,
    accentColor: 'border-red-400',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    borderSelected: 'border-red-500 ring-2 ring-red-200',
  },
];

// Role rank — higher number = higher privilege
const ROLE_RANK: Record<AcadUserRole, number> = {
  reader: 0,
  author: 1,
  moderator: 2,
  admin: 3,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RoleRequestModalProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// RoleRequestModal
// ---------------------------------------------------------------------------

export function RoleRequestModal({ open, onClose }: RoleRequestModalProps) {
  const { user, isAuthenticated } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<RequestableRole | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Determine which roles to show (only roles above the user's current rank)
  const currentRank = ROLE_RANK[user?.role ?? 'reader'];
  const availableCards = ROLE_CARDS.filter(
    (card) => ROLE_RANK[card.role] > currentRank,
  );

  // Auto-select the first available role when modal opens / available cards change
  useEffect(() => {
    if (open) {
      setSelectedRole(availableCards[0]?.role ?? null);
      setReason('');
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    },
    [open, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Auto-close 2s after success
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => onClose(), 2000);
    return () => clearTimeout(timer);
  }, [successMessage, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  // -------------------------------------------------------------------------
  // Not authenticated
  // -------------------------------------------------------------------------
  if (!isAuthenticated()) {
    return (
      <ModalOverlay onClose={onClose}>
        <ModalCard onClose={onClose} title="Join the PediAid Academics Community">
          <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
            <AlertCircle size={40} className="text-ink-muted" aria-hidden="true" />
            <p className="text-base font-medium text-ink">
              You need to be signed in to request a role.
            </p>
            <Link
              to="/academics/login"
              onClick={onClose}
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              Sign in to continue
            </Link>
          </div>
        </ModalCard>
      </ModalOverlay>
    );
  }

  // -------------------------------------------------------------------------
  // User already has the highest role (admin) — nothing to request
  // -------------------------------------------------------------------------
  if (availableCards.length === 0) {
    return (
      <ModalOverlay onClose={onClose}>
        <ModalCard onClose={onClose} title="Join the PediAid Academics Community">
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <CheckCircle2 size={40} className="text-success" aria-hidden="true" />
            <p className="text-base font-medium text-ink">
              You already have the highest role available.
            </p>
          </div>
        </ModalCard>
      </ModalOverlay>
    );
  }

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------
  async function handleSubmit() {
    if (!selectedRole) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`${API_BASE}/api/academics/dashboard/request-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          role: selectedRole,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        }),
      });

      if (!res.ok) {
        let msg = 'Something went wrong. Please try again.';
        try {
          const body = await res.json();
          if (body?.message) msg = body.message;
        } catch {
          // ignore parse error
        }
        setErrorMessage(msg);
        return;
      }

      setSuccessMessage(
        "Request submitted! You'll be notified by email when reviewed.",
      );
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <ModalOverlay onClose={onClose}>
      <ModalCard
        onClose={onClose}
        title="Join the PediAid Academics Community"
        subtitle="Request a role to contribute content, moderate, or administer."
      >
        {/* ---------------------------------------------------------------- */}
        {/* Success state                                                     */}
        {/* ---------------------------------------------------------------- */}
        {successMessage ? (
          <div
            className="flex flex-col items-center justify-center py-10 text-center gap-4 animate-fadeSlideIn"
            role="status"
          >
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-success" aria-hidden="true" />
            </div>
            <p className="text-base font-semibold text-ink max-w-xs">{successMessage}</p>
            <p className="text-sm text-ink-muted">Closing automatically…</p>
          </div>
        ) : (
          <>
            {/* ------------------------------------------------------------ */}
            {/* Role cards                                                     */}
            {/* ------------------------------------------------------------ */}
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${availableCards.length}, minmax(0, 1fr))`,
              }}
              role="radiogroup"
              aria-label="Select a role"
            >
              {availableCards.map((card) => {
                const isSelected = selectedRole === card.role;
                return (
                  <button
                    key={card.role}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedRole(card.role)}
                    className={[
                      'flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left',
                      'transition-all duration-150 cursor-pointer focus-visible:outline-none',
                      'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent',
                      isSelected
                        ? card.borderSelected
                        : 'border-border hover:border-gray-300 bg-white',
                    ].join(' ')}
                  >
                    {/* Icon badge */}
                    <span
                      className={[
                        'flex items-center justify-center w-10 h-10 rounded-xl',
                        card.badgeBg,
                        card.badgeText,
                      ].join(' ')}
                    >
                      {card.icon}
                    </span>

                    {/* Role label */}
                    <span className="font-semibold text-sm text-ink">
                      {card.label}
                    </span>

                    {/* Description */}
                    <span className="text-xs text-ink-muted leading-snug">
                      {card.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Reason textarea                                                */}
            {/* ------------------------------------------------------------ */}
            <div className="mt-5">
              <label
                htmlFor="role-request-reason"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Why are you applying for this role?{' '}
                <span className="text-ink-muted font-normal">(optional)</span>
              </label>
              <textarea
                id="role-request-reason"
                rows={4}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Share your background, qualifications, or motivation…"
                className="w-full px-4 py-3 rounded-xl border border-border text-sm
                           text-ink placeholder-ink-muted resize-none
                           outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                           transition-colors"
              />
              <p className="text-xs text-ink-muted text-right mt-1">
                {reason.length} / 500
              </p>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Error banner                                                   */}
            {/* ------------------------------------------------------------ */}
            {errorMessage && (
              <div
                className="flex items-start gap-2 px-4 py-3 rounded-xl border border-red-200
                            bg-red-50 text-sm text-danger"
                role="alert"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                {errorMessage}
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* Actions                                                        */}
            {/* ------------------------------------------------------------ */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-xl text-ink
                           hover:bg-gray-100 border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedRole}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm
                           font-semibold text-white transition-all
                           disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1e3a5f' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    Submitting…
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </>
        )}
      </ModalCard>
    </ModalOverlay>
  );
}

// ---------------------------------------------------------------------------
// ModalOverlay — shared backdrop
// ---------------------------------------------------------------------------

interface ModalOverlayProps {
  onClose: () => void;
  children: ReactNode;
}

function ModalOverlay({ onClose, children }: ModalOverlayProps) {
  function handleOverlayClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm
                 flex items-center justify-center px-4 py-6 animate-fadeIn"
      role="presentation"
      onClick={handleOverlayClick}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ModalCard — white rounded container
// ---------------------------------------------------------------------------

interface ModalCardProps {
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

function ModalCard({ onClose, title, subtitle, children }: ModalCardProps) {
  return (
    <div
      className="bg-card rounded-card shadow-card-hover w-full max-w-xl
                 overflow-hidden animate-fadeSlideIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-request-modal-title"
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        <div>
          <h2
            id="role-request-modal-title"
            className="text-lg font-bold text-white leading-snug"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-blue-200 mt-0.5">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1.5 rounded-lg text-blue-300 hover:text-white
                     hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-6 space-y-4">{children}</div>
    </div>
  );
}
