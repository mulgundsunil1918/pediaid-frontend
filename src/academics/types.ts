// =============================================================================
// academics/types.ts — shared domain types for the PediAid Academics module
// Mirrors the backend's DB/API shape exactly.
// =============================================================================

export type AcadUserRole = 'reader' | 'author' | 'moderator' | 'admin';
export type ChapterStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';

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
