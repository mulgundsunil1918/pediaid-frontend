// =============================================================================
// guidelines/notes/useGuidelineNotes.ts — public guideline notes & reviews
// =============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../api/academics.api';

export type NoteKind = 'note' | 'review';

export interface GuidelineNote {
  id: string;
  slug: string;
  /** PediAid ID no., e.g. PA-NOTE-00001. Stable; the slug is not. */
  referenceCode: string | null;
  kind: NoteKind;
  title: string;
  subtitle: string | null;
  society: string | null;
  guidelineYear: number | null;
  summary: string | null;
  body: string[];
  whatChanged: string[];
  takeaways: string[];
  externalUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export const noteKeys = {
  list: (kind: string, q: string) => ['guideline-notes', 'list', kind, q] as const,
  one: (slug: string) => ['guideline-notes', slug] as const,
};

export function useGuidelineNotes(kind = 'all', q = '') {
  return useQuery<GuidelineNote[], Error>({
    queryKey: noteKeys.list(kind, q),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (kind && kind !== 'all') p.set('kind', kind);
      if (q.trim()) p.set('q', q.trim());
      const qs = p.toString();
      return (
        await apiFetch<{ notes: GuidelineNote[] }>(
          `/api/academics/guideline-notes${qs ? `?${qs}` : ''}`,
        )
      ).notes;
    },
  });
}

export function useGuidelineNote(slug: string) {
  return useQuery<GuidelineNote, Error>({
    queryKey: noteKeys.one(slug),
    queryFn: async () =>
      (await apiFetch<{ note: GuidelineNote }>(
        `/api/academics/guideline-notes/${slug}`,
      )).note,
    enabled: !!slug,
  });
}

/**
 * Toggles a like. Optimistic, with rollback — same contract as trials: the
 * heart answers the tap immediately, and a failed request cannot leave it
 * filled with nothing recorded behind it.
 */
export function useToggleNoteLike(slug: string) {
  const qc = useQueryClient();
  return useMutation<
    { liked: boolean; likeCount: number },
    Error,
    string,
    { previous?: GuidelineNote }
  >({
    mutationFn: (id) =>
      apiFetch<{ liked: boolean; likeCount: number }>(
        `/api/academics/guideline-notes/${id}/like`,
        { method: 'POST' },
      ),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: noteKeys.one(slug) });
      const previous = qc.getQueryData<GuidelineNote>(noteKeys.one(slug));
      if (previous) {
        qc.setQueryData<GuidelineNote>(noteKeys.one(slug), {
          ...previous,
          likedByMe: !previous.likedByMe,
          likeCount: Math.max(
            0,
            previous.likeCount + (previous.likedByMe ? -1 : 1),
          ),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(noteKeys.one(slug), ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: noteKeys.one(slug) });
      void qc.invalidateQueries({ queryKey: ['guideline-notes', 'list'] });
    },
  });
}
