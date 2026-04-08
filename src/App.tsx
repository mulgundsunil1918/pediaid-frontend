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

// Academics browse pages
import { SubjectsPage } from './academics/browse/SubjectsPage';
import { SystemsPage } from './academics/browse/SystemsPage';
import { TopicsPage } from './academics/browse/TopicsPage';
import { ChapterListPage } from './academics/browse/ChapterListPage';

// Academics editor pages
import { EditorPage } from './academics/editor/EditorPage';

// Academics reader page
import { ChapterReaderPage } from './academics/reader/ChapterReaderPage';

// Academics moderation pages
import { ModerationQueuePage } from './academics/moderation/ModerationQueuePage';
import { ReviewPage } from './academics/moderation/ReviewPage';
import { HistoryPage } from './academics/moderation/HistoryPage';

// Academics auth pages
import { LoginPage, RegisterPage } from './academics/auth/index';

// Academics dashboard pages
import { DashboardPage } from './academics/dashboard/DashboardPage';
import { MyChaptersPage } from './academics/dashboard/MyChaptersPage';
import { ProfilePage } from './academics/dashboard/ProfilePage';

// CME events pages
import { CMEListPage } from './academics/cme/CMEListPage';
import { CMEDetailPage } from './academics/cme/CMEDetailPage';
import { CertificatePage } from './academics/cme/CertificatePage';

// Search page
import { SearchPage } from './academics/search/SearchPage';

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
  return (
    <div className="flex min-h-screen bg-bg">
      <NavSidebar />
      {/* pt-14 on mobile accounts for the fixed top bar height */}
      <div className={`flex-1 pt-14 sm:pt-0 ${SIDEBAR_WIDTH}`}>
        {children}
      </div>
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
// Root
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UnauthorizedListener />
        <AppLayout>
          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/academics" replace />} />

            {/* ── PediAid Academics auth routes ── */}
            <Route path="/academics/login" element={<LoginPage />} />
            <Route path="/academics/register" element={<RegisterPage />} />

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
        </AppLayout>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
