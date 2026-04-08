// =============================================================================
// academics/types.ts — shared domain types for the PediAid Academics module
// Mirrors the backend's DB/API shape exactly.
// =============================================================================

export type AcadUserRole =
  | 'reader'
  | 'author'
  | 'moderator'
  | 'admin'
  // Intermediate states: visitor registered as Author or Moderator on the
  // landing page. They cannot write or moderate until an admin approves.
  | 'pending_author'
  | 'pending_moderator';
export type ChapterStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'archived';

// ---------------------------------------------------------------------------
// Review history (moderation log timeline)
// ---------------------------------------------------------------------------

export type ReviewAction = 'approved' | 'rejected' | 'request_changes' | 'archived';

export interface ChapterReviewLogEntry {
  id: string;
  action: ReviewAction;
  notes: string | null;
  /** ISO timestamp */
  performedAt: string;
  moderatorId: string;
  moderatorName: string;
  moderatorRole: AcadUserRole | null;
}

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  displayOrder: number;
  /** Populated by the API via JOIN — not in the raw DB row */
  systemCount?: number;
}

export interface AcadSystem {
  id: string;
  subjectId: string;
  name: string;
  code: string | null;
  description: string | null;
  displayOrder: number;
  /** Populated by API */
  topicCount?: number;
}

export interface Topic {
  id: string;
  systemId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  /** Populated by API */
  chapterCount?: number;
}

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------

export interface ChapterAuthor {
  id: string;
  fullName: string;
  qualification: string | null;
  institution: string | null;
  credentialsVerified: boolean;
}

export interface ChapterListItem {
  id: string;
  title: string;
  slug: string;
  status: ChapterStatus;
  readingTimeMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  author: ChapterAuthor;
}

export interface PaginatedChapters {
  data: ChapterListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Auth / User
// ---------------------------------------------------------------------------

export interface UserProfile {
  fullName: string;
  qualification: string | null;
  specialty: string | null;
  institution: string | null;
  credentialsVerified: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role: AcadUserRole;
  isVerified: boolean;
  profile: UserProfile | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ---------------------------------------------------------------------------
// API error shape (matches backend error handler)
// ---------------------------------------------------------------------------

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
