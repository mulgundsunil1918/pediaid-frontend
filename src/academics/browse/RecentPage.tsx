// =============================================================================
// browse/RecentPage.tsx — /academics/recent
// Standalone page for the Recent Guides module (extracted from the old
// SubjectsPage tab). Reuses RecentGuidesTab as-is.
// =============================================================================

import { Link } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';
import { RecentGuidesTab } from './SubjectsPage';

export function RecentPage() {
  return (
    <div
      className="min-h-screen bg-bg"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div className="border-b border-border" style={{ backgroundColor: '#1e3a5f' }}>
        <div className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Link
            to="/academics"
            className="inline-flex items-center gap-1.5 text-xs text-white/70
                       hover:text-white mb-4"
          >
            <ArrowLeft size={13} /> All modules
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 w-11 h-11 rounded-2xl flex items-center
                         justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #1e3a5f 100%)' }}
            >
              <Flame size={20} />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl sm:text-3xl
                             text-white leading-tight tracking-tight">
                Recent Guides
              </h1>
              <p className="text-white/70 text-xs sm:text-sm mt-0.5">
                Latest peer-reviewed chapters published by contributors
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecentGuidesTab />
      </main>
    </div>
  );
}
