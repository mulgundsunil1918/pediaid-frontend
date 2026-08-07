// =============================================================================
// browse/ModulesHub.tsx — module-tile grid for the /academics landing page
// Replaces the old 3-tab Recent / Browse / CME widget. Each tile is a
// distinct PediAid Academics module with its own dedicated route.
// =============================================================================

import { Link } from 'react-router-dom';
import {
  Flame,
  Library,
  ChevronRight,
  Lock,
  Stethoscope,
  FlaskConical,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface ModuleDef {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: ReactNode;
  /** CSS gradient for the icon bubble. */
  gradient: string;
  /** Where the tile navigates to (omit for coming-soon). */
  href?: string;
  /** Small badge near the title (e.g., year, "NEW", "COMING SOON"). */
  badge?: string;
  /** Badge bg/text colour. */
  badgeBg?: string;
  status: 'live' | 'coming-soon';
  /** Optional "last checked against source" date, e.g. "Jul 28, 2026". Rendered as its own highlighted pill. */
  lastUpdated?: string;
  /** Optional — gives the tile an accent border + tint. */
  highlight?: boolean;
}

const MODULES: ModuleDef[] = [
  {
    id: 'recent',
    title: 'Recent Guides',
    subtitle: "What's new",
    description:
      'Latest peer-reviewed chapters published by PediAid contributors.',
    icon: <Flame size={22} />,
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #1e3a5f 100%)',
    href: '/academics/recent',
    status: 'live',
  },
  {
    id: 'trials',
    title: 'Landmark Trials',
    subtitle: 'Paediatrics & Neonatology',
    description:
      'The studies that changed practice — what they asked, what they found, '
      + 'and where they are weak. Filter by system.',
    icon: <FlaskConical size={22} />,
    gradient: 'linear-gradient(135deg, #0f766e 0%, #1e3a5f 100%)',
    href: '/academics/trials',
    status: 'live',
  },
  // Browse by System / CME Events / Nelson Pediatrics tiles intentionally
  // hidden — the dedicated routes (/academics/browse, /academics/cme,
  // /academics/nelson) still work and the underlying page components are
  // kept in the codebase. Re-add tiles here when you want them surfaced.
  {
    id: 'iap-action-plan-2026',
    title: 'IAP Action Plan 2026',
    subtitle: 'Latest IAP guidelines',
    description:
      "IAP's flagship 2026 action-plan practice guidelines — 198 chapters across 20 categories, from Allergy and Adolescent care to Genetics, Vaccinology and Quick-Reference Neonatology.",
    icon: <Stethoscope size={22} />,
    gradient: 'linear-gradient(135deg, #ea580c 0%, #b45309 100%)',
    href: '/academics/guidelines/iap-action-plan-2026',
    badge: '2026',
    badgeBg: '#ea580c',
    status: 'live',
    lastUpdated: 'Updated Jul 28, 2026',
    highlight: true,
  },
  {
    id: 'iap-stg',
    title: 'IAP STG 2022',
    subtitle: 'Standard guidelines',
    description:
      "Indian Academy of Pediatrics standard treatment guidelines — 148 chapters across paediatric and neonatal practice.",
    icon: <Stethoscope size={22} />,
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
    href: '/academics/guidelines/iap-stg-2022',
    badge: '2022',
    badgeBg: '#1e3a5f',
    status: 'live',
  },
  {
    id: 'nnf-cpg',
    title: 'NNF CPG',
    subtitle: 'Neonatal guidelines',
    description:
      "National Neonatology Forum's clinical practice guidelines for neonatal care — 26 topics including the MAGICapp interactive set.",
    icon: <Library size={22} />,
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
    href: '/academics/guidelines/nnf-cpg',
    badge: '2021',
    badgeBg: '#7c3aed',
    status: 'live',
  },
];

function ModuleTile({ m }: { m: ModuleDef }) {
  const isLive = m.status === 'live';
  const accent = m.badgeBg ?? '#1e3a5f';
  const inner = (
    <div
      className={[
        'group relative h-full rounded-2xl bg-card p-5 sm:p-6 shadow-card',
        'transition-all duration-200',
        m.highlight ? 'border-2' : 'border border-border',
        isLive
          ? 'hover:shadow-card-hover hover:-translate-y-0.5 hover:border-accent/40 cursor-pointer'
          : 'opacity-65 cursor-not-allowed',
      ].join(' ')}
      style={
        m.highlight
          ? {
              borderColor: `${accent}55`,
              boxShadow: `0 0 0 1px ${accent}22`,
              background: `linear-gradient(135deg, ${accent}0d, transparent 60%)`,
            }
          : undefined
      }
    >
      <div className="flex items-start gap-4 h-full">
        <div
          className="shrink-0 w-12 h-12 rounded-2xl flex items-center
                     justify-center text-white"
          style={{ background: m.gradient }}
        >
          {m.icon}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            <h3 className="text-base sm:text-lg font-bold text-primary
                           leading-snug">
              {m.title}
            </h3>
            {m.badge && (
              <span
                className="text-[9.5px] font-bold tracking-wider uppercase
                           px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: m.badgeBg ?? '#1e3a5f' }}
              >
                {m.badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-ink-muted font-semibold uppercase
                        tracking-wider mb-2">
            {m.subtitle}
          </p>
          {/* Name and kicker only on a phone. These paragraphs run to four or
              five lines each on a narrow screen, so a five-module grid became
              a wall of prose you had to scroll past to reach the modules —
              the descriptions cost more than they explained. Kept from sm up,
              where the space is free. */}
          <p className="hidden sm:block text-sm text-ink leading-relaxed">
            {m.description}
          </p>
          {m.lastUpdated && (
            <span
              className="inline-flex items-center gap-1.5 mt-2.5 w-fit
                         px-2.5 py-1 rounded-full text-[10.5px] font-bold
                         text-white"
              style={{ backgroundColor: accent }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
              {m.lastUpdated}
            </span>
          )}
        </div>

        <div className="shrink-0 self-center">
          {isLive ? (
            <ChevronRight
              size={18}
              className="text-ink-muted group-hover:text-primary
                         transition-colors"
            />
          ) : (
            <Lock size={16} className="text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );

  return isLive && m.href ? (
    <Link to={m.href} className="block h-full">
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}

export function ModulesHub() {
  return (
    <section aria-labelledby="modules-heading">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2
            id="modules-heading"
            className="font-sans font-bold text-xl sm:text-2xl text-primary
                       tracking-tight"
          >
            All modules
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
            Pick a module to start exploring.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((m) => (
          <ModuleTile key={m.id} m={m} />
        ))}
      </div>
    </section>
  );
}
