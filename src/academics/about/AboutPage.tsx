// =============================================================================
// academics/about/AboutPage.tsx — /academics/about
//
// Personal about page for Dr. Sunil Mulgund, the author and sole developer
// of PediAid Academics. Includes a "Support the Developer" button that
// opens the chai4me tip jar.
// =============================================================================

import { Link } from 'react-router-dom';
import {
  Heart,
  GraduationCap,
  Stethoscope,
  Code2,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';

const SUPPORT_URL = 'https://www.chai4.me/mulgundsunil';

export function AboutPage() {
  return (
    <div
      className="min-h-screen bg-bg"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Header bar */}
      <div className="border-b border-border bg-white">
        <div className="max-w-reading mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/academics"
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to Academics
          </Link>
        </div>
      </div>

      <main className="max-w-reading mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-sans font-bold text-3xl sm:text-4xl text-primary mb-3">
            About PediAid Academics
          </h1>
          <p className="text-base text-ink-muted leading-relaxed max-w-2xl">
            A clinical reference, calculator suite, and peer-reviewed teaching
            library — built by a paediatrician, for paediatricians and
            trainees.
          </p>
        </div>

        {/* Dr. Sunil card */}
        <section className="bg-card rounded-card shadow-card p-6 sm:p-8 mb-8">
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              <Stethoscope size={26} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-2xl text-ink leading-tight">
                Dr. Sunil Mulgund
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                Paediatrician &middot; Neonatologist &middot; Developer of PediAid
              </p>
            </div>
          </div>

          {/* Credentials */}
          <div className="rounded-xl bg-blue-50/60 border border-blue-100 px-4 py-3 mb-5">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <GraduationCap size={13} aria-hidden="true" />
              Credentials
            </p>
            <ul className="text-sm text-ink leading-relaxed space-y-1">
              <li>• MBBS</li>
              <li>• MD (Paediatrics)</li>
              <li>• DNB (Paediatrics)</li>
              <li>• NNF Fellowship in Neonatology</li>
            </ul>
          </div>

          {/* The story */}
          <div className="space-y-4 text-[15px] text-ink leading-relaxed">
            <p>
              I'm a practising paediatrician and neonatologist. Day to day on
              the wards I kept reaching for the same handful of things —
              weight-based drug doses, growth charts, jaundice curves, lab
              ranges, quick reference to the latest guidelines — and every
              time I was fishing them out of a different app, a textbook, a
              photocopy, or a saved PDF on my phone.
            </p>
            <p>
              I wanted to make life a little less miserable and a lot more
              organised for paediatricians and students: one place where the
              calculators, charts, formulary, and reference notes all live
              together, where the content is peer-reviewed by other clinicians,
              and where the next person on call can find what they need in
              seconds.
            </p>
            <p>
              That became <strong>PediAid</strong>. I built the whole thing
              myself — the Flutter app, the React web dashboard, the Fastify
              backend, the database schema, the moderation workflow — without
              help from any professional coders. It's very much a work in
              progress, and the peer-review side of Academics is the way
              forward: contributors writing structured chapters that are
              reviewed by senior clinicians before they go live.
            </p>
            <p>
              If it has been useful to you on a busy shift, I'd love to hear
              about it. And if you've spotted a bug or have a feature request,
              please do send it my way.
            </p>
          </div>

          {/* Built-with line */}
          <div className="mt-6 pt-5 border-t border-border flex items-center gap-2 text-xs text-ink-muted">
            <Code2 size={13} aria-hidden="true" />
            <span>Built with Flutter, React, Fastify, and Neon Postgres — by one doctor, in the gaps between shifts.</span>
          </div>
        </section>

        {/* Support the developer */}
        <section
          className="rounded-card shadow-card p-6 sm:p-8 border-2"
          style={{ borderColor: '#fde68a', backgroundColor: '#fffbeb' }}
        >
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#fef3c7' }}
            >
              <Heart size={22} className="text-amber-700" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-xl text-amber-900 leading-tight">
                Support the Developer
              </h2>
              <p className="text-sm text-amber-800/80 mt-0.5">
                PediAid is free and always will be. If it's made your shift a
                little easier, you can buy me a chai.
              </p>
            </div>
          </div>

          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center gap-2
              px-5 py-3 rounded-xl
              text-sm font-bold text-white
              transition-colors
            "
            style={{ backgroundColor: '#b45309' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#92400e')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#b45309')
            }
          >
            <Heart size={15} aria-hidden="true" />
            Buy me a chai
            <ExternalLink size={13} aria-hidden="true" />
          </a>

          <p className="text-[11px] text-amber-800/70 mt-3">
            Opens chai4me.com in a new tab. PediAid does not see or store any
            payment information.
          </p>
        </section>
      </main>
    </div>
  );
}
