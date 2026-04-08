// =============================================================================
// academics/dashboard/index.ts — public API for the dashboard module
// =============================================================================

// Pages
export { DashboardPage } from './DashboardPage';
export { MyChaptersPage } from './MyChaptersPage';
export { ProfilePage } from './ProfilePage';

// Components
export { StatsRow } from './components/StatsRow';
export { PendingAlert } from './components/PendingAlert';
export { RejectionFeedbackModal } from './components/RejectionFeedbackModal';
export { QuickActions } from './components/QuickActions';
export { UpgradePrompt } from './components/UpgradePrompt';
export { NewChapterTopicSelector } from './components/NewChapterTopicSelector';
export { MyChaptersList } from './components/MyChaptersList';

// Hooks & types
export {
  useDashboardStats,
  useMyChapters,
  useMyProfile,
  useUpdateProfile,
  useUpgradeToAuthor,
  dashboardKeys,
} from './hooks/useDashboard';

export type {
  DashboardStats,
  MyChapter,
  DashboardProfile,
  UpdateProfileInput,
} from './hooks/useDashboard';
