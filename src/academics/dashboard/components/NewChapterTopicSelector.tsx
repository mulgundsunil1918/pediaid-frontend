// =============================================================================
// academics/dashboard/components/NewChapterTopicSelector.tsx
// Multi-step modal: Subject → System → Topic → navigate to editor
// =============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import {
  useSubjects,
  useSystems,
  useTopics,
} from '../../browse/hooks/useBrowse';
import type { Subject, AcadSystem, Topic } from '../../types';

interface NewChapterTopicSelectorProps {
  onClose: () => void;
}

type Step = 'subject' | 'system' | 'topic';

export function NewChapterTopicSelector({ onClose }: NewChapterTopicSelectorProps) {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('subject');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<AcadSystem | null>(null);

  const { data: subjects, isLoading: loadingSubjects } = useSubjects();
  const { data: systems, isLoading: loadingSystems } = useSystems(
    selectedSubject?.id,
  );
  const { data: topics, isLoading: loadingTopics } = useTopics(
    selectedSystem?.id,
  );

  function handleSelectSubject(subject: Subject) {
    setSelectedSubject(subject);
    setSelectedSystem(null);
    setStep('system');
  }

  function handleSelectSystem(system: AcadSystem) {
    setSelectedSystem(system);
    setStep('topic');
  }

  function handleSelectTopic(topic: Topic) {
    onClose();
    navigate(`/academics/editor/new?topicId=${topic.id}`);
  }

  function handleBack() {
    if (step === 'topic') {
      setStep('system');
    } else if (step === 'system') {
      setStep('subject');
      setSelectedSubject(null);
    }
  }

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') onClose();
  }

  const stepLabels: Record<Step, string> = {
    subject: 'Select a Subject',
    system: 'Select a System',
    topic: 'Select a Topic',
  };

  const stepNumber: Record<Step, number> = { subject: 1, system: 2, topic: 3 };

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/50 backdrop-blur-sm
        flex items-center justify-center
        px-4 animate-fadeIn
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="topic-selector-title"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="
          bg-card rounded-card shadow-card-hover
          w-full max-w-lg
          flex flex-col
          max-h-[85vh]
          animate-fadeSlideIn
        "
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          {step !== 'subject' && (
            <button
              onClick={handleBack}
              className="
                p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100
                transition-colors shrink-0
              "
              aria-label="Go back"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="flex-1">
            <h2
              id="topic-selector-title"
              className="text-base font-semibold text-ink"
            >
              New Chapter
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Step {stepNumber[step]} of 3 — {stepLabels[step]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="
              p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100
              transition-colors
            "
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Breadcrumb trail */}
        {(selectedSubject || selectedSystem) && (
          <div className="flex items-center gap-1.5 px-5 pt-3 text-xs text-ink-muted flex-wrap">
            {selectedSubject && (
              <>
                <span className="font-medium text-ink">{selectedSubject.name}</span>
                {selectedSystem && (
                  <>
                    <ChevronRight size={12} />
                    <span className="font-medium text-ink">{selectedSystem.name}</span>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Step 1: Subjects */}
          {step === 'subject' && (
            <>
              {loadingSubjects ? (
                <LoadingSpinner />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(subjects ?? []).map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => handleSelectSubject(subject)}
                      className="
                        flex items-center gap-1.5
                        px-3 py-2 rounded-xl
                        border border-border bg-bg
                        text-sm font-medium text-ink
                        hover:border-accent hover:text-accent hover:bg-blue-50
                        transition-all duration-150
                      "
                    >
                      {subject.name}
                      {subject.systemCount !== undefined && (
                        <span className="text-xs text-ink-muted">
                          ({subject.systemCount})
                        </span>
                      )}
                      <ChevronRight size={13} className="text-ink-muted" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 2: Systems */}
          {step === 'system' && (
            <>
              {loadingSystems ? (
                <LoadingSpinner />
              ) : (
                <ul className="space-y-1.5">
                  {(systems ?? []).map((system) => (
                    <li key={system.id}>
                      <button
                        onClick={() => handleSelectSystem(system)}
                        className="
                          w-full flex items-center justify-between
                          px-4 py-3 rounded-xl
                          border border-border bg-bg
                          text-sm font-medium text-ink text-left
                          hover:border-accent hover:text-accent hover:bg-blue-50
                          transition-all duration-150
                        "
                      >
                        <span>{system.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {system.topicCount !== undefined && (
                            <span className="text-xs text-ink-muted">
                              {system.topicCount} topics
                            </span>
                          )}
                          <ChevronRight size={15} className="text-ink-muted" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* Step 3: Topics */}
          {step === 'topic' && (
            <>
              {loadingTopics ? (
                <LoadingSpinner />
              ) : (
                <ul className="space-y-1.5">
                  {(topics ?? []).map((topic) => (
                    <li key={topic.id}>
                      <button
                        onClick={() => handleSelectTopic(topic)}
                        className="
                          w-full flex items-center justify-between
                          px-4 py-3 rounded-xl
                          border border-border bg-bg
                          text-sm font-medium text-ink text-left
                          hover:border-accent hover:text-accent hover:bg-blue-50
                          transition-all duration-150
                        "
                      >
                        <span>{topic.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {topic.chapterCount !== undefined && (
                            <span className="text-xs text-ink-muted">
                              {topic.chapterCount} chapters
                            </span>
                          )}
                          <ChevronRight size={15} className="text-ink-muted" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal spinner
// ---------------------------------------------------------------------------

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <Loader2 size={24} className="animate-spin text-accent" aria-label="Loading" />
    </div>
  );
}
