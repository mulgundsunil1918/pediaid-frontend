// =============================================================================
// browse/BrowsePage.tsx — /academics/browse
// Standalone page for the Browse-by-System module (extracted from the old
// SubjectsPage tab). Reuses BrowseBySystemTab as-is.
// =============================================================================

import { Link } from 'react-router-dom';
import { ArrowLeft, TreePine } from 'lucide-react';
import { BrowseBySystemTab } from './SubjectsPage';

export function BrowsePage() {
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
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' }}
            >
              <TreePine size={20} />
            </div>
            <div>
              <h1 className="font-sans font-bold text-2xl sm:text-3xl
                             text-white leading-tight tracking-tight">
                Browse by System
              </h1>
              <p className="text-white/70 text-xs sm:text-sm mt-0.5">
                Explore guides organised by clinical specialty
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BrowseBySystemTab />
      </main>
    </div>
  );
}
