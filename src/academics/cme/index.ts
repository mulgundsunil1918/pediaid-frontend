// =============================================================================
// academics/cme/index.ts — public surface for the CME Events module
// =============================================================================

// Pages
export { CMEListPage } from './CMEListPage';
export { CMEDetailPage } from './CMEDetailPage';
export { CertificatePage } from './CertificatePage';

// Components
export { CountdownTimer } from './components/CountdownTimer';
export { SpeakerCard } from './components/SpeakerCard';
export { AddToCalendar } from './components/AddToCalendar';
export { RegistrationCard } from './components/RegistrationCard';
export { EventCard } from './components/EventCard';

// Hooks & types
export {
  useCMEEvents,
  useCMEEvent,
  useMyCertificates,
  useRegisterForEvent,
  useCancelRegistration,
} from './hooks/useCME';

export type {
  CMEEvent,
  Speaker,
  Certificate,
  CMEFilters,
} from './hooks/useCME';
