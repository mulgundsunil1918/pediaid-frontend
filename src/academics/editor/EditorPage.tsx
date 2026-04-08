// =============================================================================
// editor/EditorPage.tsx — Chapter editor main page
// Routes: /academics/editor/new?topic=:topicId
//         /academics/editor/:chapterId
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, XCircle, History, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useEditorStore, buildPayload } from './store/editorStore';
import {
  useChapterDraft,
  useCreateChapter,
  useSaveDraft,
} from './hooks/useChapterEditor';
import { ReviewHistoryModal } from '../dashboard/components/ReviewHistoryModal';

// Layout components
import { TopBar } from './components/TopBar';
import { BlockToolbar } from './components/BlockToolbar';
import { ReferencesSection } from './components/ReferencesSection';
import { SubmitModal } from './components/SubmitModal';
import { PreviewPane } from './components/PreviewPane';

// Block components
import { BlockWrapper } from './components/BlockWrapper';
import { HeadingBlock } from './components/blocks/HeadingBlock';
import { ParagraphBlock } from './components/blocks/ParagraphBlock';
import { ListBlock } from './components/blocks/ListBlock';
import { ImageBlock } from './components/blocks/ImageBlock';
import { ReferenceBlock } from './components/blocks/ReferenceBlock';

import type { ContentBlock } from './types/editor.types';

const AUTO_SAVE_MS = 30_000;

// ---------------------------------------------------------------------------
// Block renderer — switch on block type
// ---------------------------------------------------------------------------

function BlockRenderer({ block, index }: { block: ContentBlock; index: number }) {
  const store = useEditorStore();
  const { draft, updateBlock, deleteBlock, moveBlock } = store;
  const isFirst = index === 0;
  const isLast = index === draft.blocks.length - 1;

  const common = {
    isFirst,
    isLast,
    onMoveUp: () => moveBlock(block.id, 'up'),
    onMoveDown: () => moveBlock(block.id, 'down'),
    onDelete: () => deleteBlock(block.id),
  };

  function upd<T extends ContentBlock>(updates: Partial<T>) {
    updateBlock(block.id, updates as Partial<ContentBlock>);
  }

  switch (block.type) {
    case 'heading':
      return (
        <BlockWrapper {...common}>
          <HeadingBlock block={block} onUpdate={upd} />
        </BlockWrapper>
      );

    case 'paragraph':
      return (
        <BlockWrapper {...common}>
          <ParagraphBlock block={block} onUpdate={upd} />
        </BlockWrapper>
      );

    case 'list':
      return (
        <BlockWrapper {...common}>
          <ListBlock block={block} onUpdate={upd} />
        </BlockWrapper>
      );

    case 'image':
      return (
        <BlockWrapper {...common}>
          <ImageBlock block={block} onUpdate={upd} />
        </BlockWrapper>
      );

    case 'reference_block':
      return (
        <BlockWrapper {...common} deleteOnly>
          <ReferenceBlock
            block={block}
            onUpdate={upd}
            allReferences={draft.references}
          />
        </BlockWrapper>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Loading / error states
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="max-w-reading mx-auto px-6 py-16 flex flex-col gap-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded-lg w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-4/6 mt-2" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-reading mx-auto px-6 py-16 text-center">
      <p className="text-danger font-semibold mb-4">{message}</p>
      <button
        type="button"
        onClick={() => navigate('/academics')}
        className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        Back to Academics
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditorPage
// ---------------------------------------------------------------------------

export function EditorPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [searchParams] = useSearchParams();
  const topicIdFromQuery = searchParams.get('topic') ?? '';

  const isNew = !chapterId;
  const navigate = useNavigate();

  // When editing an existing chapter the user came from the dashboard's
  // "My Chapters" list, so Back should return there. For a brand-new chapter
  // they came from the topic browser, so Back goes to the Academics root.
  const backHref = isNew ? '/academics' : '/academics/dashboard';

  // Auth guard
  const { isAuthenticated, canAuthor, user } = useAuthStore();
  if (!isAuthenticated() || !canAuthor()) {
    return <Navigate to="/academics/login" replace />;
  }

  const store = useEditorStore();
  const {
    draft,
    isDirty,
    isSaving,
    lastSavedAt,
    setTitle,
    setTopic,
    loadDraft,
    markSaved,
    setIsSaving,
    resetEditor,
  } = store;

  const [savedChapterId, setSavedChapterId] = useState<string | null>(
    isNew ? null : (chapterId ?? null),
  );
  const [chapterStatus, setChapterStatus] = useState<
    'draft' | 'pending' | 'approved' | 'rejected' | 'changes_requested' | 'archived'
  >('draft');
  const [moderatorNotes, setModeratorNotes] = useState<string | null>(null);
  const [feedbackBannerDismissed, setFeedbackBannerDismissed] = useState(false);
  const [showReviewHistory, setShowReviewHistory] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveError, setSaveError] = useState('');

  const createMutation = useCreateChapter();
  const saveMutation = useSaveDraft();

  // ---------------------------------------------------------------------------
  // Load existing chapter (edit mode)
  // ---------------------------------------------------------------------------
  const {
    data: chapterData,
    isLoading,
    isError,
    error,
  } = useChapterDraft(isNew ? undefined : chapterId);

  useEffect(() => {
    if (isNew) {
      resetEditor();
      if (topicIdFromQuery) setTopic(topicIdFromQuery);
    }
  }, [isNew, topicIdFromQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (chapterData) {
      // Ownership check: redirect if not author and not admin/moderator
      const isOwner = chapterData.authorId === user?.id;
      const isElevated = user?.role === 'moderator' || user?.role === 'admin';
      if (!isOwner && !isElevated) {
        navigate('/academics', { replace: true });
        return;
      }
      loadDraft(chapterData);
      setChapterStatus(chapterData.status);
      setModeratorNotes(chapterData.moderatorNotes ?? null);
      setFeedbackBannerDismissed(false);
    }
  }, [chapterData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // beforeunload warning
  // ---------------------------------------------------------------------------
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // ---------------------------------------------------------------------------
  // Auto-save every 30 seconds when dirty
  // ---------------------------------------------------------------------------
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (isDirty && savedChapterId) {
        void handleSave();
      }
    }, AUTO_SAVE_MS);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }); // no deps — always uses latest isDirty / savedChapterId

  // ---------------------------------------------------------------------------
  // Save handler
  // ---------------------------------------------------------------------------
  async function handleSave() {
    setSaveError('');
    setIsSaving(true);
    const payload = buildPayload(store);

    try {
      if (!savedChapterId) {
        // Create new
        const result = await createMutation.mutateAsync(payload);
        setSavedChapterId(result.id);
        // Replace URL so refresh goes to edit mode, not new
        navigate(`/academics/editor/${result.id}`, { replace: true });
      } else {
        await saveMutation.mutateAsync({ id: savedChapterId, payload });
      }
      markSaved();
    } catch (err) {
      setIsSaving(false);
      const msg =
        err instanceof Error ? err.message : 'Save failed. Please retry.';
      setSaveError(msg);
    }
  }

  // ---------------------------------------------------------------------------
  // Breadcrumb string from loaded chapter data
  // ---------------------------------------------------------------------------
  const breadcrumb = chapterData
    ? `${chapterData.subject.code} › ${chapterData.system.name} › ${chapterData.topic.name}`
    : topicIdFromQuery
      ? `Topic: ${topicIdFromQuery}`
      : '';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!isNew && isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <TopBar
          status="draft"
          isDirty={false}
          isSaving={false}
          lastSavedAt={null}
          backHref={backHref}
        />
        <LoadingState />
      </div>
    );
  }

  if (!isNew && isError) {
    return (
      <div className="min-h-screen bg-bg">
        <TopBar
          status="draft"
          isDirty={false}
          isSaving={false}
          lastSavedAt={null}
          backHref={backHref}
        />
        <ErrorState
          message={
            error instanceof Error ? error.message : 'Chapter not found.'
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* -------------------------------------------------------------------- */}
      {/* Top bar                                                               */}
      {/* -------------------------------------------------------------------- */}
      <TopBar
        status={chapterStatus}
        isDirty={isDirty}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        backHref={backHref}
        breadcrumb={breadcrumb}
      />

      {/* -------------------------------------------------------------------- */}
      {/* Block toolbar (sticky below TopBar)                                  */}
      {/* -------------------------------------------------------------------- */}
      <BlockToolbar />

      {/* -------------------------------------------------------------------- */}
      {/* Editor canvas                                                         */}
      {/* -------------------------------------------------------------------- */}
      <main className="max-w-reading mx-auto px-4 sm:px-6 py-8">
        {/* ------------------------------------------------------------------ */}
        {/* Reviewer feedback banner                                             */}
        {/*                                                                      */}
        {/* Shows the latest moderator notes when the author reopens a chapter  */}
        {/* that was rejected or sent back with "Request Changes". The banner   */}
        {/* is dismissible for the current session but re-appears on reload.    */}
        {/* ------------------------------------------------------------------ */}
        {!feedbackBannerDismissed &&
          moderatorNotes &&
          (chapterStatus === 'rejected' || chapterStatus === 'changes_requested') && (
            <div
              className={[
                'mb-6 rounded-xl border-l-4 p-4 flex gap-3',
                chapterStatus === 'rejected'
                  ? 'border-danger bg-red-50'
                  : 'border-orange-500 bg-orange-50',
              ].join(' ')}
              role="alert"
            >
              <div className="shrink-0 pt-0.5">
                {chapterStatus === 'rejected' ? (
                  <XCircle size={18} className="text-danger" aria-hidden="true" />
                ) : (
                  <AlertCircle size={18} className="text-orange-600" aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={[
                    'text-sm font-semibold mb-1',
                    chapterStatus === 'rejected' ? 'text-danger' : 'text-orange-700',
                  ].join(' ')}
                >
                  {chapterStatus === 'rejected'
                    ? 'Chapter rejected'
                    : 'Changes requested by reviewer'}
                </p>
                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                  {moderatorNotes}
                </p>
                <button
                  type="button"
                  onClick={() => setShowReviewHistory(true)}
                  className="
                    mt-2 inline-flex items-center gap-1 text-xs font-medium
                    text-ink-muted hover:text-ink transition-colors
                  "
                >
                  <History size={12} />
                  View full review history
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackBannerDismissed(true)}
                className="
                  shrink-0 p-1 rounded-md text-ink-muted hover:text-ink
                  hover:bg-white/60 transition-colors
                "
                aria-label="Dismiss reviewer feedback"
              >
                <X size={16} />
              </button>
            </div>
          )}

        {/* Title input */}
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chapter title…"
          className="w-full bg-transparent border-0 outline-none p-0 mb-6
                     font-sans font-bold text-primary placeholder-gray-300
                     leading-tight"
          style={{ fontSize: '2rem', caretColor: '#3182ce' }}
          aria-label="Chapter title"
        />

        {/* Topic selector (new mode only) */}
        {isNew && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-ink-muted mb-1">
              Topic ID{' '}
              <span className="font-normal text-gray-400">
                (auto-filled from URL; editable in new mode)
              </span>
            </label>
            <input
              type="text"
              value={draft.topicId}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Paste topic UUID…"
              className="w-full text-sm border border-border rounded-xl px-4 py-2.5
                         outline-none focus:border-accent transition-colors"
            />
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-red-200
                          bg-red-50 text-sm text-danger">
            {saveError}
          </div>
        )}

        {/* Blocks */}
        <div className="space-y-0.5">
          {draft.blocks.map((block, index) => (
            <BlockRenderer key={block.id} block={block} index={index} />
          ))}
        </div>

        {/* References section */}
        <ReferencesSection />
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* Bottom action bar                                                     */}
      {/* -------------------------------------------------------------------- */}
      <div
        className="sticky bottom-0 z-20 bg-white border-t border-border
                   px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3
                   sm:flex-nowrap sm:justify-between"
      >
        {/* Left: Save + Preview */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl border-2
                       transition-colors disabled:opacity-50"
            style={{
              borderColor: '#1e3a5f',
              color: '#1e3a5f',
              backgroundColor: 'transparent',
            }}
          >
            {isSaving ? 'Saving…' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl border
                       border-border text-ink-muted hover:bg-gray-50
                       transition-colors"
          >
            Preview
          </button>
        </div>

        {/* Right: Submit */}
        <button
          type="button"
          onClick={async () => {
            // Ensure saved before submitting
            if (!savedChapterId || isDirty) {
              await handleSave();
            }
            if (savedChapterId || createMutation.data?.id) {
              setShowSubmitModal(true);
            }
          }}
          disabled={
            chapterStatus !== 'draft' &&
            chapterStatus !== 'rejected' &&
            chapterStatus !== 'changes_requested'
          }
          className="px-6 py-2.5 text-sm font-bold text-white rounded-xl
                     transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                     whitespace-nowrap"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          Submit for Review →
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Modals & panels                                                       */}
      {/* -------------------------------------------------------------------- */}
      {showSubmitModal && savedChapterId && (
        <SubmitModal
          chapterId={savedChapterId}
          onClose={() => setShowSubmitModal(false)}
        />
      )}

      {showPreview && <PreviewPane onClose={() => setShowPreview(false)} />}

      {showReviewHistory && savedChapterId && (
        <ReviewHistoryModal
          chapterId={savedChapterId}
          chapterTitle={draft.title || undefined}
          onClose={() => setShowReviewHistory(false)}
        />
      )}
    </div>
  );
}
