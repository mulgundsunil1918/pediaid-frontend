// =============================================================================
// academics/trials/useTrials.ts — public Landmark Trials data
// =============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/academics.api';

export type Specialty = 'paediatrics' | 'neonatology';

export interface TrialSystem {
  slug: string;
  label: string;
}

export interface Trial {
  id: string;
  slug: string;
  /** PediAid ID no., e.g. PA-TRIAL-00001. Stable; the slug is not. */
  referenceCode: string | null;
  specialty: Specialty;
  system: string;
  title: string;
  subtitle: string | null;
  acronym: string | null;
  journal: string | null;
  year: number | null;
  doi: string | null;
  externalUrl: string | null;
  picot: {
    population: string | null;
    intervention: string | null;
    comparator: string | null;
    outcome: string | null;
    timeframe: string | null;
  };
  summary: string | null;
  results: string[];
  limitations: string[];
  takeaways: string[];
  furtherReading: string[];
  likeCount: number;
  likedByMe: boolean;
  publishedAt: string | null;
}

export const trialKeys = {
  systems: ['trials', 'systems'] as const,
  list: (specialty: Specialty, system: string, q: string) =>
    ['trials', 'list', specialty, system, q] as const,
  one: (slug: string) => ['trials', slug] as const,
};

export function useTrialSystems() {
  return useQuery<TrialSystem[], Error>({
    queryKey: trialKeys.systems,
    queryFn: async () =>
      (await apiFetch<{ systems: TrialSystem[] }>('/api/academics/trials/systems'))
        .systems,
    staleTime: 60 * 60 * 1000,
  });
}

export function useTrials(specialty: Specialty, system: string, q: string) {
  return useQuery<Trial[], Error>({
    queryKey: trialKeys.list(specialty, system, q),
    queryFn: async () => {
      const p = new URLSearchParams({ specialty });
      if (system && system !== 'all') p.set('system', system);
      if (q.trim()) p.set('q', q.trim());
      return (await apiFetch<{ trials: Trial[] }>(`/api/academics/trials?${p}`))
        .trials;
    },
  });
}

export function useTrial(slug: string) {
  return useQuery<Trial, Error>({
    queryKey: trialKeys.one(slug),
    queryFn: async () =>
      (await apiFetch<{ trial: Trial }>(`/api/academics/trials/${slug}`)).trial,
    enabled: !!slug,
  });
}

/**
 * Toggles a like.
 *
 * Optimistic: the heart has to answer the tap immediately, and the server is
 * the authority on the count either way. On failure the previous state is put
 * back, so a dropped request cannot leave the heart filled with nothing
 * recorded behind it.
 */
export function useToggleTrialLike(slug: string) {
  const qc = useQueryClient();
  return useMutation<
    { liked: boolean; likeCount: number },
    Error,
    string,
    { previous?: Trial }
  >({
    mutationFn: (id) =>
      apiFetch<{ liked: boolean; likeCount: number }>(
        `/api/academics/trials/${id}/like`,
        { method: 'POST' },
      ),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: trialKeys.one(slug) });
      const previous = qc.getQueryData<Trial>(trialKeys.one(slug));
      if (previous) {
        qc.setQueryData<Trial>(trialKeys.one(slug), {
          ...previous,
          likedByMe: !previous.likedByMe,
          likeCount: Math.max(0, previous.likeCount + (previous.likedByMe ? -1 : 1)),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(trialKeys.one(slug), ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: trialKeys.one(slug) });
      void qc.invalidateQueries({ queryKey: ['trials', 'list'] });
    },
  });
}
