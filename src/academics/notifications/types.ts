// =============================================================================
// academics/notifications/types.ts
// =============================================================================

export type NotificationType =
  | 'chapter_approved'
  | 'chapter_rejected'
  | 'chapter_changes_requested'
  | 'role_approved'
  | 'role_rejected'
  | 'chapter_submitted_author_ack'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  linkPath: string | null;
  isRead: boolean;
  /** ISO timestamp from the backend */
  createdAt: string;
}

export interface NotificationListResponse {
  data: Notification[];
  unreadCount: number;
}
