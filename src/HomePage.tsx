// =============================================================================
// HomePage.tsx — PediAid web app hub
//
// Shown at pediaid.bridgr.co.in/ — the entry point for iOS users redirected
// from the Flutter app, and for any web visitor. Links out to every major
// feature: drug formulary (Flutter web), calculators, growth charts, and the
// Academics section (React).
//
// iOS feature gate redirects here so Apple reviewers can see that all
// features are accessible on the web (satisfies App Store guideline 1.4.2).
// =============================================================================

import { Link } from 'react-router-dom';

interface FeatureCardProps {
  icon: string;
  title: string;
  subtitle: string;
  href: string;
  external?: boolean;
  color: string;
  badge?: string;
}

function FeatureCard({ icon, title, subtitle, href, external, color, badge }: FeatureCardProps) {
  const content = (
    <div
      className="group flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5
                 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: color + '18' }}
        >
          {icon}
        </div>
        {badge && (
          <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: color + '20', color }}>
            {badge}
          </span>
        )}
        {external && (
          <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 mt-0.5" fill="none"
               viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-[15px]">{title}</p>
        <p className="text-gray-500 text-sm mt-0.5 leading-snug">{subtitle}</p>
      </div>
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="no-underline">
        {content}
      </a>
    );
  }
  return <Link to={href} className="no-underline">{content}</Link>;
}

export function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1A5276] flex items-center justify-center">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-tight">PediAid</p>
              <p className="text-xs text-gray-500 leading-tight">Paediatric &amp; Neonatal Reference</p>
            </div>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=com.pediaid.pediaid"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#1A5276] px-4 py-2
                       text-white text-sm font-medium hover:bg-[#154360] transition-colors no-underline"
          >
            <span>📱</span> Get the app
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-10 pb-6">
        <div className="bg-gradient-to-br from-[#1A5276] to-[#2980B9] rounded-2xl p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-2">
            PAEDIATRIC &amp; NEONATAL CLINICAL REFERENCE
          </p>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-2">
            Bedside-ready tools for<br />
            paediatric &amp; neonatal care
          </h1>
          <p className="text-sm opacity-80 leading-relaxed max-w-lg">
            Drug dosing, emergency protocols, calculators, growth charts and peer-reviewed
            guidelines — all in one place. Free for every healthcare professional.
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <main className="max-w-4xl mx-auto px-4 pb-12">

        {/* Drug & Emergency */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Drug Reference &amp; Emergency Protocols
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureCard
              icon="💊"
              title="Drug Formulary"
              subtitle="676 drugs — Neofax (neonatal) + Harriet Lane (paediatric). Weight-based dosing."
              href="https://mulgundsunil1918.github.io/pediaid-flutter/"
              external
              color="#C0392B"
              badge="200 + 476 drugs"
            />
            <FeatureCard
              icon="🚨"
              title="Emergency NICU Drugs"
              subtitle="14 weight-based emergency drug preparations and infusion rates."
              href="https://mulgundsunil1918.github.io/pediaid-flutter/"
              external
              color="#E74C3C"
            />
            <FeatureCard
              icon="⚡"
              title="Emergency PICU Drugs"
              subtitle="STAT bolus doses + infusions for PICU emergencies."
              href="https://mulgundsunil1918.github.io/pediaid-flutter/"
              external
              color="#8E44AD"
            />
            <FeatureCard
              icon="📊"
              title="Drug Formulary 2.0"
              subtitle="199 NICU drugs · India brands · GA-band dosing · Cross-checked."
              href="https://mulgundsunil1918.github.io/pediaid-flutter/"
              external
              color="#1A5276"
              badge="NEW"
            />
          </div>
        </section>

        {/* Calculators */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Calculators &amp; Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureCard
              icon="🧮"
              title="Clinical Calculators"
              subtitle="18 calculators — GIR, eGFR, BSA, bilirubin risk, BP centiles, and more."
              href="https://mulgundsunil1918.github.io/pediaid-flutter/"
              external
              color="#27AE60"
            />
            <FeatureCard
              icon="📈"
              title="Growth Charts"
              subtitle="WHO (0–5 &amp; 5–19), IAP 2015, Fenton preterm, INTERGROWTH-21st."
              href="https://mulgundsunil1918.github.io/pediaid-flutter/"
              external
              color="#16A085"
            />
          </div>
        </section>

        {/* Guidelines & Academics */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Guidelines &amp; Academics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureCard
              icon="📚"
              title="IAP STG Guidelines"
              subtitle="149 paediatric topics — IAP Standard Treatment Guidelines 2022."
              href="/academics/guidelines/iap-stg"
              color="#2471A3"
            />
            <FeatureCard
              icon="🎓"
              title="PediAid Academics"
              subtitle="Peer-reviewed chapters, CME events, and structured medical knowledge."
              href="/academics"
              color="#5D6D7E"
            />
          </div>
        </section>

        {/* Footer note */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-center">
          <p className="text-xs text-blue-700 leading-relaxed">
            All clinical content is sourced from peer-reviewed references including Neofax®,
            Harriet Lane Handbook®, IAP STG 2022, NNF CPG, AAP CPG, and WHO standards.{' '}
            <a href="/academics/guidelines" className="font-semibold underline">View all references →</a>
          </p>
        </div>
      </main>
    </div>
  );
}
