// =============================================================================
// academics/submissions/hooks/useMySubmissions.ts
//
// Hybrid fetch per the anonymous/authenticated split: sends the device's
// stored Never Again device_id (if one exists) and relies on apiFetch to
// attach the auth bearer token when the user is logged in. The backend
// (GET /api/me/submissions) merges results from whichever identity is
// present — either, both, or neither (empty array).
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../api/academics.api';
import { getOrCreateDeviceId } from '../../never-again/hooks/useNeverAgain';
import type { NormalizedSubmission } from '../types';

export function useMySubmissions() {
  const [submissions, setSubmissions] = useState<NormalizedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const deviceId = getOrCreateDeviceId();
      const body = await apiFetch<{ submissions: NormalizedSubmission[] }>(
        `/api/me/submissions?device_id=${encodeURIComponent(deviceId)}`,
      );
      setSubmissions(body.submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your submissions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { submissions, isLoading, error, refresh: load };
}
