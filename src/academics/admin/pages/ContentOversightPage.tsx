// =============================================================================
// academics/admin/pages/ContentOversightPage.tsx — Admin chapter oversight
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Eye,
  Trash2,
  ChevronDown,
  AlertTriangle,
  Search,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { AdminLayout } from '../AdminLayout';
import {
  useAdminChapters,
  useArchiveChapter,
  useHardDeleteChapter,
  type AdminChapter,
} from '../hooks/useAdmin';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StatusFilter = '' | 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadgeClass(status: AdminChapter['status']): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-600';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'approved':
      return 'bg-green-100 text-green-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    case 'archived':
      return 'bg-gray-100 text-gray-400 italic';
  }
}

// ---------------------------------------------------------------------------
// Hard Delete Modal
// ---------------------------------------------------------------------------

interface HardDeleteModalProps {
  chapter: AdminChapter;
  onClose: () => void;
}

function HardDeleteModal({ chapter, onClose }: HardDeleteModalProps) {
  const [typed, setTyped] = useState('');
  const deleteMutation = useHardDeleteChapter();
  const confirmed = typed === chapter.title;

  function handleDelete() {
    if (!confirmed) return;
    deleteMutation.mutate(chapter.id, {
      onSuccess: () => onClose(),
      onError: (e) => alert(`Error: ${e.message}`),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-card shadow-card max-w-md w-full overflow-hidden">
        {/* Red header */}
        <div className="bg-danger px-5 py-4 flex items-center gap-3">
          <Trash2 size={20} className="text-white" />
          <h3 className="text-white font-bold">Permanently Delete Chapter</h3>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger">
              This action cannot be undone. The chapter, all its content, comments, and
              view history will be permanently deleted.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Type the chapter title to confirm:
            </label>
            <p className="text-xs text-ink-muted mb-2 font-mono bg-gray-50 border border-border rounded px-2 py-1 break-all">
              {chapter.title}
            </p>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type title here…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-danger/30"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm border border-border rounded-lg text-ink-muted hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!confirmed || deleteMutation.isPending}
              className="px-4 py-2 text-sm bg-danger text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleteMutation.isPending && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Archive Confirmation Modal
// ---------------------------------------------------------------------------

interface ArchiveModalProps {
  chapter: AdminChapter;
  onClose: () => void;
}

function ArchiveModal({ chapter, onClose }: ArchiveModalProps) {
  const archiveMutation = useArchiveChapter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-card shadow-card max-w-sm w-full p-6">
        <h3 className="font-bold text-ink mb-2">Archive Chapter?</h3>
        <p className="text-sm text-ink-muted mb-1">
          <span className="font-medium text-ink">{chapter.title}</span>
        </p>
        <p className="text-sm text-ink-muted mb-6">
          The chapter will be hidden from readers but can be restored later.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={archiveMutation.isPending}
            className="px-4 py-2 text-sm border border-border rounded-lg text-ink-muted hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              archiveMutation.mutate(chapter.id, {
                onSuccess: () => onClose(),
                onError: (e) => alert(`Error: ${e.message}`),
              })
            }
            disabled={archiveMutation.isPending}
            className="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
          >
            {archiveMutation.isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Actions Popover
// ---------------------------------------------------------------------------

interface ActionsPopoverProps {
  chapter: AdminChapter;
  onClose: () => void;
  onArchive: () => void;
  onHardDelete: () => void;
}

function ActionsPopover({ chapter, onClose, onArchive, onHardDelete }: ActionsPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 z-30 w-48 bg-white rounded-card shadow-card border border-border py-1"
    >
      <a
        href={`/academics/c/${chapter.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-gray-50"
        onClick={onClose}
      >
        <Eye size={14} />
        View Chapter
      </a>
      <a
        href={`/academics/editor/${chapter.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-gray-50"
        onClick={onClose}
      >
        <FileText size={14} />
        View in Editor
      </a>
      <div className="border-t border-border mt-1 pt-1">
        <button
          onClick={() => { onArchive(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-muted hover:bg-gray-50"
        >
          Archive
        </button>
        <button
          onClick={() => { onHardDelete(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-red-50"
        >
          <Trash2 size={14} />
          Hard Delete
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Row
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-border">
      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-48" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded w-20" /></td>
      <td className="px-4 py-3">
        <div className="h-3 bg-gray-200 rounded w-28 mb-1" />
        <div className="h-3 bg-gray-200 rounded w-36" />
      </td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-32" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-12" /></td>
      <td className="px-4 py-3"><div className="h-8 bg-gray-200 rounded w-20" /></td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// ContentOversightPage
// ---------------------------------------------------------------------------

export function ContentOversightPage() {
  // Auth guard
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!hasRole('admin')) return <Navigate to="/academics" replace />;

  const [searchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') ?? '') as StatusFilter;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [authorSearch, setAuthorSearch] = useState('');
  const [debouncedAuthor, setDebouncedAuthor] = useState('');
  const [page, setPage] = useState(1);
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [archivingChapter, setArchivingChapter] = useState<AdminChapter | null>(null);
  const [deletingChapter, setDeletingChapter] = useState<AdminChapter | null>(null);

  // Debounce author search (client-side filter)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAuthor(authorSearch), 300);
    return () => clearTimeout(t);
  }, [authorSearch]);

  const { data, isLoading } = useAdminChapters({
    status: statusFilter || undefined,
    page,
  });

  const allChapters = data?.chapters ?? [];
  // Client-side filter by author name
  const chapters = debouncedAuthor
    ? allChapters.filter((c) =>
        c.authorName.toLowerCase().includes(debouncedAuthor.toLowerCase()) ||
        c.authorEmail.toLowerCase().includes(debouncedAuthor.toLowerCase())
      )
    : allChapters;

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: '', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FileText size={22} className="text-primary" />
        <div>
          <h2 className="text-lg font-bold text-primary">Content Oversight</h2>
          <p className="text-xs text-ink-muted">Manage and moderate chapter submissions</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter);
            setPage(1);
          }}
          className="border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="text"
            value={authorSearch}
            onChange={(e) => setAuthorSearch(e.target.value)}
            placeholder="Filter by author name…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          {authorSearch && (
            <button
              onClick={() => setAuthorSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-card shadow-card border border-border overflow-x-auto mb-4">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Author
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Subject · Topic
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Views
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

            {!isLoading && chapters.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center text-ink-muted text-sm">
                  No chapters found matching your filters.
                </td>
              </tr>
            )}

            {!isLoading &&
              chapters.map((chapter) => (
                <tr
                  key={chapter.id}
                  className="border-b border-border hover:bg-gray-50 transition-colors"
                >
                  {/* Title */}
                  <td className="px-4 py-3 max-w-[220px]">
                    <a
                      href={`/academics/c/${chapter.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-accent hover:underline line-clamp-2"
                    >
                      {chapter.title}
                    </a>
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(
                        chapter.status
                      )}`}
                    >
                      {chapter.status}
                    </span>
                  </td>

                  {/* Author */}
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-ink">{chapter.authorName}</div>
                    <div className="text-xs text-ink-muted">{chapter.authorEmail}</div>
                  </td>

                  {/* Subject · Topic */}
                  <td className="px-4 py-3">
                    <div className="text-xs text-ink-muted">
                      <span className="font-medium text-ink">{chapter.subjectName}</span>
                      {' · '}
                      {chapter.topicName}
                    </div>
                  </td>

                  {/* Views */}
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {chapter.viewCount.toLocaleString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="relative inline-block">
                      <button
                        onClick={() =>
                          setActiveActionsId(
                            activeActionsId === chapter.id ? null : chapter.id
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-gray-100 text-ink"
                      >
                        Actions
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${
                            activeActionsId === chapter.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {activeActionsId === chapter.id && (
                        <ActionsPopover
                          chapter={chapter}
                          onClose={() => setActiveActionsId(null)}
                          onArchive={() => setArchivingChapter(chapter)}
                          onHardDelete={() => setDeletingChapter(chapter)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>
          Page {page} of {totalPages} · {total} chapters
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border border-border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Archive Modal */}
      {archivingChapter && (
        <ArchiveModal
          chapter={archivingChapter}
          onClose={() => setArchivingChapter(null)}
        />
      )}

      {/* Hard Delete Modal */}
      {deletingChapter && (
        <HardDeleteModal
          chapter={deletingChapter}
          onClose={() => setDeletingChapter(null)}
        />
      )}
    </AdminLayout>
  );
}
