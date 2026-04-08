// =============================================================================
// academics/admin/pages/TaxonomyPage.tsx — Three-panel taxonomy management
// Route: /academics/admin/taxonomy
// =============================================================================

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Edit2, X, ChevronUp, ChevronDown, Check, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import {
  useTaxonomyTree,
  useCreateSubject,
  useUpdateSubject,
  useDeactivateSubject,
  useCreateSystem,
  useUpdateSystem,
  useDeactivateSystem,
  useCreateTopic,
  useUpdateTopic,
  useDeactivateTopic,
  type AdminSubject,
  type AdminSystem,
  type AdminTopic,
} from '../hooks/useAdmin';

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function useToast() {
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  function show(text: string, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  }
  return { msg, show };
}

function Toast({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-card shadow-card text-sm font-medium text-white animate-fadeSlideIn
        ${msg.ok ? 'bg-success' : 'bg-danger'}`}
    >
      {msg.text}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm deactivate modal
// ---------------------------------------------------------------------------

interface ConfirmModalProps {
  label: string;
  chapterCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmDeactivateModal({ label, chapterCount, onConfirm, onCancel, loading }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-card shadow-card p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={22} className="text-warning flex-shrink-0" />
          <h3 className="font-bold text-ink">Deactivate "{label}"?</h3>
        </div>
        {chapterCount > 0 && (
          <p className="text-sm text-ink-muted mb-4">
            This will affect <strong>{chapterCount}</strong> chapter{chapterCount !== 1 ? 's' : ''} linked to this item.
          </p>
        )}
        <p className="text-sm text-ink-muted mb-5">This item will be hidden from authors but data is preserved.</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-ink hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline form (shared for subject / system / topic)
// ---------------------------------------------------------------------------

interface InlineFormProps {
  fields: Array<{ key: string; label: string; type?: 'text' | 'number' | 'textarea' }>;
  initial: Record<string, string>;
  onSave: (values: Record<string, string>) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  title: string;
}

function InlineForm({ fields, initial, onSave, onCancel, loading, title }: InlineFormProps) {
  const [vals, setVals] = useState<Record<string, string>>(initial);

  function set(key: string, val: string) {
    setVals((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <div className="bg-blue-50 border border-accent/30 rounded-lg p-4 mb-3">
      <p className="text-xs font-semibold text-primary mb-3">{title}</p>
      <div className="grid grid-cols-1 gap-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs text-ink-muted mb-1">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea
                rows={2}
                value={vals[f.key] ?? ''}
                onChange={(e) => set(f.key, e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
              />
            ) : (
              <input
                type={f.type ?? 'text'}
                value={vals[f.key] ?? ''}
                onChange={(e) => set(f.key, e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onSave(vals)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-60"
        >
          <Check size={13} /> {loading ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 border border-border text-xs font-medium text-ink rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subject fields
// ---------------------------------------------------------------------------

const SUBJECT_FIELDS = [
  { key: 'name', label: 'Name *' },
  { key: 'code', label: 'Code *' },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'displayOrder', label: 'Display Order', type: 'number' as const },
];

const SYSTEM_FIELDS = [
  { key: 'name', label: 'Name *' },
  { key: 'code', label: 'Code' },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'displayOrder', label: 'Display Order', type: 'number' as const },
];

const TOPIC_FIELDS = [
  { key: 'name', label: 'Name *' },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'displayOrder', label: 'Display Order', type: 'number' as const },
];

// ---------------------------------------------------------------------------
// Subjects panel
// ---------------------------------------------------------------------------

function SubjectsPanel({
  subjects,
  selectedId,
  onSelect,
  toast,
}: {
  subjects: AdminSubject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminSubject | null>(null);

  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deactivateSubject = useDeactivateSubject();

  async function handleCreate(vals: Record<string, string>) {
    try {
      await createSubject.mutateAsync({
        name: vals.name!,
        code: vals.code!,
        description: vals.description || undefined,
        displayOrder: vals.displayOrder ? Number(vals.displayOrder) : undefined,
      });
      setShowAdd(false);
      toast.show('Subject created');
    } catch (e) {
      toast.show((e as Error).message, false);
    }
  }

  async function handleUpdate(id: string, vals: Record<string, string>) {
    try {
      await updateSubject.mutateAsync({
        id,
        name: vals.name!,
        code: vals.code!,
        description: vals.description || undefined,
        displayOrder: vals.displayOrder ? Number(vals.displayOrder) : undefined,
      });
      setEditId(null);
      toast.show('Subject updated');
    } catch (e) {
      toast.show((e as Error).message, false);
    }
  }

  async function handleDeactivate(subject: AdminSubject) {
    try {
      await deactivateSubject.mutateAsync(subject.id);
      setDeactivateTarget(null);
      toast.show('Subject deactivated');
    } catch (e) {
      toast.show((e as Error).message, false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm text-primary">Subjects</h3>
        <button
          onClick={() => { setShowAdd(true); setEditId(null); }}
          className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-blue-700"
        >
          <Plus size={14} /> Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {showAdd && (
          <InlineForm
            title="New Subject"
            fields={SUBJECT_FIELDS}
            initial={{ name: '', code: '', description: '', displayOrder: String(subjects.length + 1) }}
            onSave={handleCreate}
            onCancel={() => setShowAdd(false)}
            loading={createSubject.isPending}
          />
        )}
        {subjects.map((subj) => (
          <div key={subj.id}>
            {editId === subj.id ? (
              <InlineForm
                title="Edit Subject"
                fields={SUBJECT_FIELDS}
                initial={{
                  name: subj.name,
                  code: subj.code,
                  description: subj.description ?? '',
                  displayOrder: String(subj.displayOrder),
                }}
                onSave={(vals) => handleUpdate(subj.id, vals)}
                onCancel={() => setEditId(null)}
                loading={updateSubject.isPending}
              />
            ) : (
              <div
                className={[
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg mb-1 cursor-pointer group',
                  'transition-colors',
                  selectedId === subj.id ? 'bg-primary/10' : 'hover:bg-gray-50',
                  !subj.isActive ? 'opacity-50' : '',
                ].join(' ')}
                onClick={() => onSelect(subj.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink truncate">{subj.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-accent/10 text-accent rounded font-mono">
                      {subj.code}
                    </span>
                    {!subj.isActive && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Inactive</span>
                    )}
                  </div>
                  <span className="text-xs text-ink-muted">{subj.chapterCount} chapters</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditId(subj.id); setShowAdd(false); }}
                    className="p-1 rounded hover:bg-gray-200 text-ink-muted hover:text-ink"
                    title="Edit"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeactivateTarget(subj); }}
                    className="p-1 rounded hover:bg-red-50 text-ink-muted hover:text-danger"
                    title="Deactivate"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {deactivateTarget && (
        <ConfirmDeactivateModal
          label={deactivateTarget.name}
          chapterCount={deactivateTarget.chapterCount}
          onConfirm={() => handleDeactivate(deactivateTarget)}
          onCancel={() => setDeactivateTarget(null)}
          loading={deactivateSubject.isPending}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Systems panel
// ---------------------------------------------------------------------------

function SystemsPanel({
  subject,
  selectedSystemId,
  onSelect,
  toast,
}: {
  subject: AdminSubject | null;
  selectedSystemId: string | null;
  onSelect: (id: string) => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminSystem | null>(null);

  const createSystem = useCreateSystem();
  const updateSystem = useUpdateSystem();
  const deactivateSystem = useDeactivateSystem();

  if (!subject) {
    return (
      <div className="flex items-center justify-center h-full text-ink-muted text-sm">
        Select a subject
      </div>
    );
  }

  async function handleCreate(vals: Record<string, string>) {
    try {
      await createSystem.mutateAsync({
        subjectId: subject!.id,
        name: vals.name!,
        code: (vals.code ?? "") || undefined,
        description: vals.description || undefined,
        displayOrder: vals.displayOrder ? Number(vals.displayOrder) : undefined,
      });
      setShowAdd(false);
      toast.show('System created');
    } catch (e) {
      toast.show((e as Error).message, false);
    }
  }

  async function handleUpdate(id: string, vals: Record<string, string>) {
    try {
      await updateSystem.mutateAsync({
        id,
        name: vals.name!,
        code: (vals.code ?? "") || undefined,
        description: vals.description || undefined,
        displayOrder: vals.displayOrder ? Number(vals.displayOrder) : undefined,
      });
      setEditId(null);
      toast.show('System updated');
    } catch (e) {
      toast.show((e as Error).message, false);
    }
  }

  async function handleDeactivate(sys: AdminSystem) {
    try {
      await deactivateSystem.mutateAsync(sys.id);
      setDeactivateTarget(null);
      toast.show('System deactivated');
    } catch (e) {
      toast.show((e as Error).message, false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm text-primary truncate">
          Systems — <span className="text-ink-muted font-normal">{subject.name}</span>
        </h3>
        <button
          onClick={() => { setShowAdd(true); setEditId(null); }}
          className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-blue-700 flex-shrink-0"
        >
          <Plus size={14} /> Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {showAdd && (
          <InlineForm
            title="New System"
            fields={SYSTEM_FIELDS}
            initial={{ name: '', code: '', description: '', displayOrder: String(subject.systems.length + 1) }}
            onSave={handleCreate}
            onCancel={() => setShowAdd(false)}
            loading={createSystem.isPending}
          />
        )}
        {subject.systems.map((sys) => (
          <div key={sys.id}>
            {editId === sys.id ? (
              <InlineForm
                title="Edit System"
                fields={SYSTEM_FIELDS}
                initial={{
                  name: sys.name,
                  code: sys.code ?? '',
                  description: sys.description ?? '',
                  displayOrder: String(sys.displayOrder),
                }}
                onSave={(vals) => handleUpdate(sys.id, vals)}
                onCancel={() => setEditId(null)}
                loading={updateSystem.isPending}
              />
            ) : (
              <div
                className={[
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg mb-1 cursor-pointer group',
                  'transition-colors',
                  selectedSystemId === sys.id ? 'bg-primary/10' : 'hover:bg-gray-50',
                  !sys.isActive ? 'opacity-50' : '',
                ].join(' ')}
                onClick={() => onSelect(sys.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink truncate">{sys.name}</span>
                    {sys.code && (
                      <span className="text-xs px-1.5 py-0.5 bg-accent/10 text-accent rounded font-mono">
                        {sys.code}
                      </span>
                    )}
                    {!sys.isActive && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Inactive</span>
                    )}
                  </div>
                  <span className="text-xs text-ink-muted">{sys.topics.length} topics</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditId(sys.id); setShowAdd(false); }}
                    className="p-1 rounded hover:bg-gray-200 text-ink-muted hover:text-ink"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeactivateTarget(sys); }}
                    className="p-1 rounded hover:bg-red-50 text-ink-muted hover:text-danger"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {deactivateTarget && (
        <ConfirmDeactivateModal
          label={deactivateTarget.name}
          chapterCount={deactivateTarget.topics.reduce((a, t) => a + t.chapterCount, 0)}
          onConfirm={() => handleDeactivate(deactivateTarget)}
          onCancel={() => setDeactivateTarget(null)}
          loading={deactivateSystem.isPending}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Topics panel
// ---------------------------------------------------------------------------

function TopicsPanel({
  system,
  toast,
}: {
  system: AdminSystem | null;
  toast: ReturnType<typeof useToast>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminTopic | null>(null);

  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deactivateTopic = useDeactivateTopic();

  if (!system) {
    return (
      <div className="flex items-center justify-center h-full text-ink-muted text-sm">
        Select a system
      </div>
    );
  }

  async function handleCreate(vals: Record<string, string>) {
    try {
      await createTopic.mutateAsync({
        systemId: system!.id,
        name: vals.name!,
        description: vals.description || undefined,
        displayOrder: vals.displayOrder ? Number(vals.displayOrder) : undefined,
      });
      setShowAdd(false);
      toast.show('Topic created');
    } catch (e) {
      toast.show((e as Error).message, false);
    }
  }

  async function handleUpdate(id: string, vals: Record<string, string>) {
    try {
      await updateTopic.mutateAsync({
        id,
        name: vals.name!,
        description: vals.description || undefined,
        displayOrder: vals.displayOrder ? Number(vals.displayOrder) : undefined,
      });
      setEditId(null);
      toast.show('Topic updated');
    } catch (e) {
      toast.show((e as Error).message, false);
    }
  }

  async function handleDeactivate(topic: AdminTopic) {
    try {
      await deactivateTopic.mutateAsync(topic.id);
      setDeactivateTarget(null);
      toast.show('Topic deactivated');
    } catch (e) {
      toast.show((e as Error).message, false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm text-primary truncate">
          Topics — <span className="text-ink-muted font-normal">{system.name}</span>
        </h3>
        <button
          onClick={() => { setShowAdd(true); setEditId(null); }}
          className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-blue-700 flex-shrink-0"
        >
          <Plus size={14} /> Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {showAdd && (
          <InlineForm
            title="New Topic"
            fields={TOPIC_FIELDS}
            initial={{ name: '', description: '', displayOrder: String(system.topics.length + 1) }}
            onSave={handleCreate}
            onCancel={() => setShowAdd(false)}
            loading={createTopic.isPending}
          />
        )}
        {system.topics.map((topic) => (
          <div key={topic.id}>
            {editId === topic.id ? (
              <InlineForm
                title="Edit Topic"
                fields={TOPIC_FIELDS}
                initial={{
                  name: topic.name,
                  description: topic.description ?? '',
                  displayOrder: String(topic.displayOrder),
                }}
                onSave={(vals) => handleUpdate(topic.id, vals)}
                onCancel={() => setEditId(null)}
                loading={updateTopic.isPending}
              />
            ) : (
              <div
                className={[
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg mb-1 group',
                  !topic.isActive ? 'opacity-50' : '',
                ].join(' ')}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink truncate">{topic.name}</span>
                    {!topic.isActive && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Inactive</span>
                    )}
                  </div>
                  <span className="text-xs text-ink-muted">{topic.chapterCount} chapters</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditId(topic.id); setShowAdd(false); }}
                    className="p-1 rounded hover:bg-gray-200 text-ink-muted hover:text-ink"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => setDeactivateTarget(topic)}
                    className="p-1 rounded hover:bg-red-50 text-ink-muted hover:text-danger"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {deactivateTarget && (
        <ConfirmDeactivateModal
          label={deactivateTarget.name}
          chapterCount={deactivateTarget.chapterCount}
          onConfirm={() => handleDeactivate(deactivateTarget)}
          onCancel={() => setDeactivateTarget(null)}
          loading={deactivateTopic.isPending}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TaxonomyPage
// ---------------------------------------------------------------------------

export function TaxonomyPage() {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!hasRole('admin')) return <Navigate to="/academics" replace />;

  const { data, isLoading } = useTaxonomyTree();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const toast = useToast();

  const subjects = data?.subjects ?? [];
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null;
  const selectedSystem =
    selectedSubject?.systems.find((s) => s.id === selectedSystemId) ?? null;

  function handleSelectSubject(id: string) {
    setSelectedSubjectId(id);
    setSelectedSystemId(null);
  }

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse text-ink-muted text-sm">Loading taxonomy…</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeSlideIn">
      <h2 className="text-xl font-bold text-primary mb-4">Taxonomy</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-180px)] min-h-[480px]">
        {/* Panel 1: Subjects */}
        <div className="bg-white rounded-card shadow-card overflow-hidden flex flex-col">
          <SubjectsPanel
            subjects={subjects}
            selectedId={selectedSubjectId}
            onSelect={handleSelectSubject}
            toast={toast}
          />
        </div>

        {/* Panel 2: Systems */}
        <div className="bg-white rounded-card shadow-card overflow-hidden flex flex-col">
          <SystemsPanel
            subject={selectedSubject}
            selectedSystemId={selectedSystemId}
            onSelect={setSelectedSystemId}
            toast={toast}
          />
        </div>

        {/* Panel 3: Topics */}
        <div className="bg-white rounded-card shadow-card overflow-hidden flex flex-col">
          <TopicsPanel system={selectedSystem} toast={toast} />
        </div>
      </div>

      <Toast msg={toast.msg} />
    </div>
  );
}

// Suppress unused import warnings
const _unused = [ChevronUp, ChevronDown];
void _unused;
