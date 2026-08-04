// =============================================================================
// academics/onboarding/WelcomePage.tsx
//
// The first thing a new visitor sees: a short tour of what PediAid Academics
// is, ending at the sign-in button.
//
// Deliberately four slides, not more. This sits between someone arriving and
// someone signing in, so every extra slide is a chance to lose them. Skip is
// available on every slide and is not hidden — a tutorial you cannot escape
// reads as an obstacle, and the people most likely to skip (returning users on
// a new device) are exactly the ones who least need it.
// =============================================================================

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Users,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { markTutorialSeen } from './onboardingStorage';

interface Slide {
  icon: LucideIcon;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: BookOpen,
    title: 'Paediatric knowledge, in one place',
    body:
      'Browse peer-reviewed chapters, national guidelines like IAP STG and NNF CPG, and a growing library of clinical references — organised by subject, system and topic.',
  },
  {
    icon: GraduationCap,
    title: 'CME that fits your schedule',
    body:
      'Find conferences, webinars, workshops and courses from across the paediatric community. Register in a tap and collect your certificates as you go.',
  },
  {
    icon: Users,
    title: 'Built by the people who use it',
    body:
      'Share a case, submit a study, or post a CME event of your own. Contributions are reviewed by our editors before they go live, so quality stays high.',
  },
  {
    icon: ShieldCheck,
    title: 'Learn from what went wrong',
    body:
      'Never Again collects real clinical mistakes, shared anonymously, so the same error need not be repeated. No names, no blame — just the lesson.',
  },
];

export function WelcomePage() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Replaying from the profile menu should return the user to the app, not
  // dump them at a sign-in page they are already past.
  const isReplay = params.get('replay') === '1';

  function finish() {
    markTutorialSeen();
    navigate(isReplay ? '/academics' : '/academics/login', { replace: true });
  }

  function next() {
    if (index < SLIDES.length - 1) setIndex(index + 1);
    else finish();
  }

  const slide = SLIDES[index]!;
  const Icon = slide.icon;
  const isLast = index === SLIDES.length - 1;

  return (
    <div
      className="min-h-screen bg-bg flex items-center justify-center px-4 py-10"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-card border border-border p-8 sm:p-10">
          {/* Icon */}
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-6"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            <Icon size={24} color="white" strokeWidth={1.8} aria-hidden="true" />
          </div>

          {/* Copy — min-height keeps the buttons from jumping between slides */}
          <div className="min-h-[170px]">
            <h1 className="text-2xl font-bold text-primary leading-snug">
              {slide.title}
            </h1>
            <p className="text-sm text-ink-muted mt-3 leading-relaxed">{slide.body}</p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mt-2 mb-7" role="presentation">
            {SLIDES.map((s, i) => (
              <span
                key={s.title}
                className="h-1.5 rounded-full transition-all duration-200"
                style={{
                  width: i === index ? 22 : 7,
                  backgroundColor: i === index ? '#1e3a5f' : '#e2e8f0',
                }}
              />
            ))}
          </div>

          {/* Actions */}
          <button
            type="button"
            onClick={next}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            {isLast ? (isReplay ? 'Done' : 'Get started') : 'Next'}
            <ArrowRight size={16} aria-hidden="true" />
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={finish}
              className="text-sm text-ink-muted hover:text-ink font-medium"
            >
              {isReplay ? 'Close' : 'Skip for now'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-ink-muted mt-5">
          Step {index + 1} of {SLIDES.length}
        </p>
      </div>
    </div>
  );
}
