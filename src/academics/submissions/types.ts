// =============================================================================
// academics/submissions/types.ts — mirrors backend/src/moderation/moderation.types.ts
// =============================================================================

export const MODERATION_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'needs_edit',
  'approved',
  'published',
  'rejected',
  'archived',
] as const;

export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const MODULE_TYPES = [
  'never_again',
  'conference',
  'webinar',
  'workshop',
  'course',
  'trial',
  'guide',
] as const;

export type ModuleType = (typeof MODULE_TYPES)[number];

export interface NormalizedSubmission {
  submissionId: string;
  moduleType: ModuleType;
  title: string;
  status: ModerationStatus;
  createdAt: string;
  updatedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  adminFeedback: string | null;
  slug: string | null;
  /** Human-usable reference, e.g. PA-CME-00042. Null for pre-0018 rows. */
  referenceCode: string | null;
}
