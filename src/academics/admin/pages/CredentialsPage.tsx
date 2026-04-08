// =============================================================================
// academics/admin/pages/CredentialsPage.tsx — Admin credential verification
// =============================================================================

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  BadgeCheck,
  FileText,
  ExternalLink,
  CheckCircle,
  X,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { AdminLayout } from '../AdminLayout';
import {
  usePendingCredentials,
  useVerifiedCredentials,
  useVerifyCredentials,
  useRejectCredentials,
  type PendingCredential,
} from '../hooks/useAdmin';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function daysAgo(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Reject Modal
// ---------------------------------------------------------------------------

interface RejectModalProps {
  credential: PendingCredential;
  onClose: () => void;
}

function RejectModal({ credential, onClose }: RejectModalProps) {
  const [reason, setReason] = useState('');
  const rejectMutation = useRejectCredentials();
  const isValid = reason.trim().length >= 20;

  function handleSend() {
    if (!isValid) return;
    rejectMutation.mutate(
      { userId: credential.userId, reason: reason.trim() },
      {
        onSuccess: () => onClose(),
        onError: (e) => alert(`Error: ${e.message}`),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-card shadow-card max-w-lg w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-ink">Request More Information</h3>
            <p className="text-xs text-ink-muted mt-0.5">{credential.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <label className="block text-sm font-medium text-ink mb-2">
          Additional documents / information needed:
          <span className="text-danger ml-0.5">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          placeholder="Describe what additional credentials or documents are required…"
          className="w-full border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
        />
        {reason.trim().length > 0 && reason.trim().length < 20 && (
          <p className="text-xs text-danger mt-1">
            Please provide at least 20 characters ({20 - reason.trim().length} more needed).
          </p>
        )}

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            disabled={rejectMutation.isPending}
            className="px-4 py-2 text-sm border border-border rounded-lg text-ink-muted hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!isValid || rejectMutation.isPending}
            className="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {rejectMutation.isPending ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Credential Card
// ---------------------------------------------------------------------------

interface CredentialCardProps {
  credential: PendingCredential;
}

function CredentialCard({ credential }: CredentialCardProps) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const [confirmingVerify, setConfirmingVerify] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const verifyMutation = useVerifyCredentials();

  const days = daysAgo(credential.createdAt);

  function handleVerify() {
    verifyMutation.mutate(credential.userId, {
      onSuccess: () => setConfirmingVerify(false),
      onError: (e) => alert(`Error: ${e.message}`),
    });
  }

  return (
    <>
      <div className="bg-white rounded-card shadow-card border border-border p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-base"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {getInitials(credential.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-ink">{credential.fullName}</h3>
            <p className="text-sm text-ink-muted">
              {[credential.qualification, credential.specialty].filter(Boolean).join(' · ')}
            </p>
            {credential.institution && (
              <p className="text-sm text-ink-muted">{credential.institution}</p>
            )}
            <p className="text-xs text-ink-muted mt-1">
              Registered {days === 0 ? 'today' : `${days} day${days !== 1 ? 's' : ''} ago`}
            </p>
          </div>
        </div>

        {/* Documents */}
        {credential.verificationDocuments.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
              Verification Documents
            </p>
            <div className="space-y-2">
              {credential.verificationDocuments.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="text-ink-muted flex-shrink-0" />
                    <span className="text-sm text-ink truncate">{doc.name}</span>
                  </div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline flex-shrink-0 flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORCID */}
        {credential.orcid && (
          <div className="flex items-center gap-2">
            <ExternalLink size={14} className="text-ink-muted" />
            <a
              href={`https://orcid.org/${credential.orcid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:underline"
            >
              orcid.org/{credential.orcid}
            </a>
          </div>
        )}

        {/* Bio */}
        {credential.bio && (
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Bio</p>
            <p
              className={`text-sm text-ink-muted leading-relaxed ${
                !bioExpanded ? 'line-clamp-3' : ''
              }`}
            >
              {credential.bio}
            </p>
            <button
              onClick={() => setBioExpanded(!bioExpanded)}
              className="text-xs text-accent hover:underline mt-1"
            >
              {bioExpanded ? 'Less' : 'More'}
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => setConfirmingVerify(true)}
            disabled={verifyMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-success text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifyMutation.isPending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={15} />
            )}
            Verify Credentials
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg text-ink hover:bg-gray-50"
          >
            <X size={15} />
            Request More Info
          </button>
        </div>
      </div>

      {/* Verify confirmation dialog */}
      {confirmingVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-card shadow-card max-w-sm w-full p-6">
            <h3 className="font-bold text-ink mb-2">Verify {credential.fullName}?</h3>
            <p className="text-sm text-ink-muted mb-6">
              They will receive author access and be able to publish chapters on PediAid Academics.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmingVerify(false)}
                disabled={verifyMutation.isPending}
                className="px-4 py-2 text-sm border border-border rounded-lg text-ink-muted hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={verifyMutation.isPending}
                className="px-4 py-2 text-sm bg-success text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {verifyMutation.isPending && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Confirm Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <RejectModal credential={credential} onClose={() => setShowRejectModal(false)} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// CredentialsPage
// ---------------------------------------------------------------------------

export function CredentialsPage() {
  // Auth guard
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!hasRole('admin')) return <Navigate to="/academics" replace />;

  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');

  const { data: pending = [], isLoading: loadingPending } = usePendingCredentials();
  const { data: verified = [], isLoading: loadingVerified } = useVerifiedCredentials();

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BadgeCheck size={22} className="text-primary" />
        <div>
          <h2 className="text-lg font-bold text-primary">Credential Verification</h2>
          <p className="text-xs text-ink-muted">
            Review and verify author credential submissions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-white text-primary shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Pending Verification
          {pending.length > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-warning text-white flex items-center justify-center">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('verified')}
          className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
            activeTab === 'verified'
              ? 'bg-white text-primary shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Verified
        </button>
      </div>

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <>
          {loadingPending && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-card border border-border p-5 animate-pulse space-y-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-40" />
                      <div className="h-3 bg-gray-200 rounded w-56" />
                    </div>
                  </div>
                  <div className="h-16 bg-gray-200 rounded" />
                  <div className="flex gap-3">
                    <div className="h-9 bg-gray-200 rounded w-36" />
                    <div className="h-9 bg-gray-200 rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loadingPending && pending.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CheckCircle size={40} className="text-success mb-3" />
              <p className="text-success font-medium">No credentials pending.</p>
              <p className="text-xs text-ink-muted mt-1">All submissions have been reviewed.</p>
            </div>
          )}
          {!loadingPending && pending.length > 0 && (
            <div className="space-y-4">
              {pending.map((cred) => (
                <CredentialCard key={cred.userId} credential={cred} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Verified Tab */}
      {activeTab === 'verified' && (
        <div className="bg-white rounded-card shadow-card border border-border overflow-hidden">
          {loadingVerified ? (
            <div className="p-6 space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded" />
              ))}
            </div>
          ) : verified.length === 0 ? (
            <div className="py-16 text-center text-ink-muted text-sm">
              No verified credentials yet.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Specialty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Institution
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    Member Since
                  </th>
                </tr>
              </thead>
              <tbody>
                {verified.map((v) => (
                  <tr key={v.userId} className="border-b border-border hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <BadgeCheck size={14} className="text-accent flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-ink">{v.fullName}</div>
                          <div className="text-xs text-ink-muted">{v.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-muted">{v.specialty ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted">{v.institution ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted">
                      {new Date(v.verifiedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
