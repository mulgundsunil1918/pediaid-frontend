// =============================================================================
// App.tsx — root router and layout shell
// =============================================================================

import { useEffect, lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NavSidebar, SIDEBAR_WIDTH } from './components/NavSidebar';
import { useAuthStore } from './store/authStore';
import { initSessionRefresh } from './academics/auth/sessionRefresh';

// All route-level pages are lazy-loaded so the initial bundle stays small
// and the splash screen hands off as quickly as possible. Each group below
// maps module-named exports to default exports for React.lazy.

const SubjectsPage     = lazy(() => import('./academics/browse/SubjectsPage').then(m => ({ default: m.SubjectsPage })));
const SystemsPage      = lazy(() => import('./academics/browse/SystemsPage').then(m => ({ default: m.SystemsPage })));
const TopicsPage       = lazy(() => import('./academics/browse/TopicsPage').then(m => ({ default: m.TopicsPage })));
const ChapterListPage  = lazy(() => import('./academics/browse/ChapterListPage').then(m => ({ default: m.ChapterListPage })));

const EditorPage       = lazy(() => import('./academics/editor/EditorPage').then(m => ({ default: m.EditorPage })));
const ChapterReaderPage= lazy(() => import('./academics/reader/ChapterReaderPage').then(m => ({ default: m.ChapterReaderPage })));

const ModerationQueuePage = lazy(() => import('./academics/moderation/ModerationQueuePage').then(m => ({ default: m.ModerationQueuePage })));
const ReviewPage       = lazy(() => import('./academics/moderation/ReviewPage').then(m => ({ default: m.ReviewPage })));
const HistoryPage      = lazy(() => import('./academics/moderation/HistoryPage').then(m => ({ default: m.HistoryPage })));

const LoginPage        = lazy(() => import('./academics/auth/index').then(m => ({ default: m.LoginPage })));
const RegisterPage     = lazy(() => import('./academics/auth/index').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./academics/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage  = lazy(() => import('./academics/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));

const DashboardPage    = lazy(() => import('./academics/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const MyChaptersPage   = lazy(() => import('./academics/dashboard/MyChaptersPage').then(m => ({ default: m.MyChaptersPage })));
const ProfilePage      = lazy(() => import('./academics/dashboard/ProfilePage').then(m => ({ default: m.ProfilePage })));

const CMEListPage      = lazy(() => import('./academics/cme/CMEListPage').then(m => ({ default: m.CMEListPage })));
const CMEDetailPage    = lazy(() => import('./academics/cme/CMEDetailPage').then(m => ({ default: m.CMEDetailPage })));
const CertificatePage  = lazy(() => import('./academics/cme/CertificatePage').then(m => ({ default: m.CertificatePage })));

const SearchPage       = lazy(() => import('./academics/search/SearchPage').then(m => ({ default: m.SearchPage })));

// Nelson TOC browser
const NelsonBrowser = lazy(() => import('./academics/nelson/NelsonBrowser').then(m => ({ default: m.NelsonBrowser })));

// Admin pages
const AdminOverviewPage = lazy(() => import('./academics/admin/pages/AdminOverviewPage').then(m => ({ default: m.AdminOverviewPage })));
const TaxonomyPage = lazy(() => import('./academics/admin/pages/TaxonomyPage').then(m => ({ default: m.TaxonomyPage })));
const UsersPage = lazy(() => import('./academics/admin/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const CredentialsPage = lazy(() => import('./academics/admin/pages/CredentialsPage').then(m => ({ default: m.CredentialsPage })));
const ContentOversightPage = lazy(() => import('./academics/admin/pages/ContentOversightPage').then(m => ({ default: m.ContentOversightPage })));
const CMEAdminPage = lazy(() => import('./academics/admin/pages/CMEAdminPage').then(m => ({ default: m.CMEAdminPage })));
const RoleRequestsPage = lazy(() => import('./academics/admin/pages/RoleRequestsPage').then(m => ({ default: m.RoleRequestsPage })));
const PendingApplicationsPage = lazy(() => import('./academics/admin/pages/PendingApplicationsPage').then(m => ({ default: m.PendingApplicationsPage })));
const PendingCmeEventsPage = lazy(() => import('./academics/admin/pages/PendingCmeEventsPage').then(m => ({ default: m.PendingCmeEventsPage })));

// ---------------------------------------------------------------------------
// React Query client
// ---------------------------------------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ---------------------------------------------------------------------------
// Layout wrapper — adds sidebar offset on desktop
// ---------------------------------------------------------------------------

function AppLayout({ children }: { children: React.ReactNode }) {
  // NavSidebar renders null — kept here as a no-op in case we bring it back.
  return (
    <div className="flex min-h-screen bg-bg">
      <NavSidebar />
      <div className={`flex-1 ${SIDEBAR_WIDTH}`}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 401 listener — clears auth and could show a toast
// ---------------------------------------------------------------------------

function UnauthorizedListener() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  useEffect(() => {
    const handler = () => clearAuth();
    window.addEventListener('acad:unauthorized', handler);
    return () => window.removeEventListener('acad:unauthorized', handler);
  }, [clearAuth]);
  return null;
}

// ---------------------------------------------------------------------------
// Silent refresh boot — kicks off the session refresh loop on app load so
// a stale access token gets rotated before any API call, and schedules
// periodic rotation every 50 minutes. The loop only runs while there is
// actually a refresh token in storage.
// ---------------------------------------------------------------------------

function SessionRefreshBoot() {
  useEffect(() => {
    initSessionRefresh();
  }, []);
  return null;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <UnauthorizedListener />
        <SessionRefreshBoot />
        <AppLayout>
          <Suspense
            fallback={
              <div className="p-8 text-ink-muted text-sm">Loading…</div>
            }
          >
          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/academics" replace />} />

            {/* ── PediAid Academics auth routes ── */}
            <Route path="/academics/login" element={<LoginPage />} />
            <Route path="/academics/register" element={<RegisterPage />} />
            <Route path="/academics/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/academics/reset-password" element={<ResetPasswordPage />} />


            {/* ── PediAid Academics browse routes ── */}
            <Route path="/academics" element={<SubjectsPage />} />
            <Route
              path="/academics/subjects/:subjectId"
              element={<SystemsPage />}
            />
            <Route
              path="/academics/subjects/:subjectId/systems/:systemId"
              element={<TopicsPage />}
            />
            <Route
              path="/academics/subjects/:subjectId/systems/:systemId/topics/:topicId"
              element={<ChapterListPage />}
            />

            {/* ── PediAid Academics reader route ── */}
            <Route path="/academics/c/:slug" element={<ChapterReaderPage />} />

            {/* ── PediAid Academics editor routes ── */}
            <Route path="/academics/editor/new" element={<EditorPage />} />
            <Route
              path="/academics/editor/:chapterId"
              element={<EditorPage />}
            />

            {/* ── PediAid Academics moderation routes ── */}
            <Route path="/academics/moderator/queue" element={<ModerationQueuePage />} />
            <Route path="/academics/moderator/review/:id" element={<ReviewPage />} />
            <Route path="/academics/moderator/history" element={<HistoryPage />} />

            {/* ── PediAid Academics dashboard routes ── */}
            <Route path="/academics/dashboard" element={<DashboardPage />} />
            <Route path="/academics/dashboard/chapters" element={<MyChaptersPage />} />
            <Route path="/academics/dashboard/profile" element={<ProfilePage />} />

            {/* ── PediAid Academics CME routes ── */}
            <Route path="/academics/cme" element={<CMEListPage />} />
            <Route path="/academics/cme/certificates" element={<CertificatePage />} />
            <Route path="/academics/cme/:slug" element={<CMEDetailPage />} />

            {/* ── PediAid Academics search ── */}
            <Route path="/academics/search" element={<SearchPage />} />

            {/* ── Nelson TOC browser ── */}
            <Route path="/academics/nelson" element={<Suspense fallback={<div className="p-8 text-ink-muted text-sm">Loading…</div>}><NelsonBrowser /></Suspense>} />

            {/* ── PediAid Academics admin routes ── */}
            <Route path="/academics/admin" element={<Suspense fallback={<div className="p-8 text-ink-muted text-sm">Loading…</div>}><AdminOverviewPage /></Suspense>} />
            <Route path="/academics/admin/taxonomy" element={<Suspense fallback={<div className="p-8 text-ink-muted text-sm">Loading…</div>}><TaxonomyPage /></Suspense>} />
            <Route path="/academics/admin/users" element={<Suspense fallback={<div className="p-8 text-ink-muted text-sm">Loading…</div>}><UsersPage /></Suspense>} />
            <Route path="/academics/admin/pending-applications" element={<Suspense fallback={<div className="p-8 text-ink-muted text-sm">Loading…</div>}><PendingApplicationsPage /></Suspense>} />
            <Route path="/academics/admin/cme/pending" element={<Suspense fallback={<div className="p-8 text-ink-muted text-sm">Loading…</div>}><PendingCmeEventsPage /></Suspense>} />
            <Route path="/academics/admin/credentials" element={<Suspense fallback={<div className="p-8 text-ink-muted text-sm">Loading…</div>}><CredentialsPage /></Suspense>} />
            <Route path="/academics/admin/content" element={<Suspense fallback={<div className="p-8 text-ink-muted text-sm">Loading…</div>}><ContentOversightPage /></Suspense>} />
            <Route path="/academics/admin/cme" element={<Suspense fallback={<div className="p-8 text-ink-muted text-sm">Loading…</div>}><CMEAdminPage /></Suspense>} />
            <Route path="/academics/admin/role-requests" element={<Suspense fallback={<div className="p-8 text-ink-muted text-sm">Loading…</div>}><RoleRequestsPage /></Suspense>} />

            {/* Placeholder routes for other PediAid sections */}
            <Route
              path="/calculators"
              element={
                <div className="p-8 text-ink-muted">
                  Calculators — existing Flutter app
                </div>
              }
            />
            <Route
              path="/charts"
              element={
                <div className="p-8 text-ink-muted">
                  Growth Charts — existing Flutter app
                </div>
              }
            />
            <Route
              path="/formulary"
              element={
                <div className="p-8 text-ink-muted">
                  Formulary — existing Flutter app
                </div>
              }
            />

            {/* Catch-all */}
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center
                                min-h-screen gap-3">
                  <p className="text-5xl font-bold text-border">404</p>
                  <p className="text-ink-muted">Page not found</p>
                </div>
              }
            />
          </Routes>
          </Suspense>
        </AppLayout>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
