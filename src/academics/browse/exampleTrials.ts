// =============================================================================
// browse/exampleTrials.ts — illustrative landmark-trial content for the
// example social-post previews (Recent Guides). Not backed by real data —
// author, likes, and comments are all fake/illustrative, clearly labelled
// "in development" wherever shown.
// =============================================================================

export type ExampleCategory = 'Neonatology' | 'Pediatrics';

export interface ExampleStat {
  value: string;
  label: string;
}

export interface ExampleComment {
  id: string;
  name: string;
  initials: string;
  color: string;
  text: string;
  time: string;
  likes: number;
}

export interface ExamplePicotLine {
  label: string;
  text: string;
}

export interface ExampleTrial {
  slug: string;
  category: ExampleCategory;
  authorHandle: string;
  authorSubtitle: string;
  title: string;
  subtitle: string;
  badge: string;
  gradient: [string, string, string];
  stats: ExampleStat[];
  intro: string;
  picot: ExamplePicotLine[];
  results: string[];
  limitations: string[];
  takeaways: string[];
  furtherStudies: string[];
  hashtags: string;
  postedAgo: string;
  likeCount: number;
  comments: ExampleComment[];
}

export const EXAMPLE_TRIALS: ExampleTrial[] = [
  {
    slug: 'cap-caffeine-trial',
    category: 'Neonatology',
    authorHandle: 'xyz_neonatology',
    authorSubtitle: 'Neonatology · Educational Post',
    title: 'The CAP Trial',
    subtitle: 'Caffeine for Apnea of Prematurity',
    badge: 'Landmark RCT · NEJM',
    gradient: ['#0d1b3e', '#1e3a5f', '#7c3aed'],
    stats: [
      { value: '2,006', label: 'infants' },
      { value: '500–1250g', label: 'birth weight' },
      { value: 'RCT', label: 'double-blind' },
      { value: 'PICOT', label: 'breakdown ↓' },
    ],
    intro:
      'Landmark trial breakdown 🍼☕ — one of the most practice-changing NICU trials of the 2000s.',
    picot: [
      { label: 'P', text: 'Preterm infants, birth weight 500–1,250 g (ELBW)' },
      { label: 'I', text: 'Caffeine citrate, started in the first 10 days of life' },
      { label: 'C', text: 'Placebo' },
      {
        label: 'O',
        text: 'Survival without neurodevelopmental disability at 18–21 months corrected age (primary); BPD, extubation timing, PDA ligation (secondary)',
      },
      { label: 'T', text: 'Enrolled early 2000s; followed up at 18–21 months, 5 years, and 11 years' },
    ],
    results: [
      'Lower rates of bronchopulmonary dysplasia (36.3% vs 46.9%)',
      'Fewer PDA ligations and earlier extubation',
      'Higher rate of survival without neurodevelopmental disability at 18–21 months',
      'By 5 years, the difference in the primary composite outcome was no longer significant',
    ],
    limitations: [
      'Early neurodevelopmental benefit not sustained at 5-year follow-up',
      'Single dosing regimen tested — may not generalise to other protocols',
      'Predates several advances in modern NICU respiratory care',
      'Follow-up attrition by the 11-year assessment',
    ],
    takeaways: [
      'Caffeine citrate is now standard of care for apnea of prematurity',
      'Clear short-term respiratory benefit; long-term neurodevelopmental effect less certain',
      'Secondary analyses suggest earlier initiation (≤3 days) may add further benefit',
    ],
    furtherStudies: [
      'Early vs late caffeine initiation analyses (same cohort)',
      'Dose-finding trials: high-dose vs standard-dose caffeine citrate',
      'International guidelines now recommend routine caffeine in at-risk preterm infants',
    ],
    hashtags: '#Neonatology #EBM #CaffeineTrial #Prematurity #NICU',
    postedAgo: '2 hours ago',
    likeCount: 1248,
    comments: [
      {
        id: 'c1',
        name: 'Dr. Amara Okafor',
        initials: 'AO',
        color: '#ef6c6c',
        text: 'Great summary! We moved to starting caffeine within the first 24h at our unit after this data came out 👏',
        time: '2h',
        likes: 24,
      },
      {
        id: 'c2',
        name: 'Rahul Mehta',
        initials: 'RM',
        color: '#5b9bd5',
        text: 'Wish the 11-year follow-up numbers were more reassuring, but still practice-changing for BPD reduction.',
        time: '4h',
        likes: 15,
      },
      {
        id: 'c3',
        name: 'Dr. Lucia Fernandes',
        initials: 'LF',
        color: '#9c6ade',
        text: 'Anyone else loading at 20 mg/kg now instead of 10? Curious what the norm is elsewhere.',
        time: '6h',
        likes: 9,
      },
      {
        id: 'c4',
        name: 'Priya Nair',
        initials: 'PN',
        color: '#38a169',
        text: 'Explaining this trial to parents always reassures them about why we start caffeine so early!',
        time: '9h',
        likes: 18,
      },
      {
        id: 'c5',
        name: 'Dr. Tomás Alvarez',
        initials: 'TA',
        color: '#dd8a3e',
        text: 'Would love a follow-up post on the dosing trials mentioned here 🙌',
        time: '1d',
        likes: 6,
      },
    ],
  },
  {
    slug: 'neoprom-trial',
    category: 'Neonatology',
    authorHandle: 'xyz_neonatology',
    authorSubtitle: 'Neonatology · Educational Post',
    title: 'The NeOProM Collaboration',
    subtitle: 'Oxygen Saturation Targets in Extreme Preterm Infants',
    badge: 'Meta-Analysis · NeOProM',
    gradient: ['#042f2e', '#0f766e', '#22d3ee'],
    stats: [
      { value: '~5,000', label: 'infants pooled' },
      { value: '<28 wks', label: 'gestation' },
      { value: '5 RCTs', label: 'meta-analysis' },
      { value: '2018', label: 'NEJM' },
    ],
    intro:
      'A prospective meta-analysis pooling 5 major oximetry RCTs to settle the SpO2 target debate 🫁📉',
    picot: [
      {
        label: 'P',
        text: 'Extremely preterm infants (<28 weeks gestation) requiring supplemental oxygen, pooled individual patient data from 5 RCTs (COT, SUPPORT, BOOST-II Australia/UK/NZ)',
      },
      { label: 'I', text: 'Lower target SpO2 range (85–89%)' },
      { label: 'C', text: 'Higher target SpO2 range (91–95%)' },
      {
        label: 'O',
        text: 'Composite of death or major disability by 18–24 months corrected age (primary); severe retinopathy of prematurity (ROP), necrotising enterocolitis (secondary)',
      },
      { label: 'T', text: 'Component trials conducted mid-2000s–2013; prospective meta-analysis published 2018' },
    ],
    results: [
      'Lower SpO2 target (85–89%) associated with significantly higher mortality before discharge',
      'Lower target associated with reduced rates of severe ROP requiring treatment',
      'No significant difference in the composite outcome of death or major disability',
      'A clear survival-vs-eye-disease trade-off emerged depending on the target chosen',
    ],
    limitations: [
      'Component trials used different oximeter calibration algorithms, complicating direct comparison',
      'Long-term neurodevelopmental follow-up incomplete in some component trials',
      'Meta-analysis of separately-designed trials, not one unified protocol',
      'Optimal target still debated — findings pushed practice toward a narrower 90–95% range rather than either extreme',
    ],
    takeaways: [
      'Very low SpO2 targets (85–89%) are not appropriate for routine use — increased mortality risk',
      'Current consensus favours a target range around 90–95% rather than either extreme',
      'Illustrates how oximeter calibration differences can materially affect trial comparability',
      'Prompted revision of oxygen-targeting guidelines in NICUs worldwide',
    ],
    furtherStudies: [
      'Ongoing work on automated closed-loop FiO2 titration algorithms',
      'Studies standardising oximeter algorithms across manufacturers',
      'Long-term follow-up into school-age neurodevelopmental and respiratory outcomes',
    ],
    hashtags: '#Neonatology #EBM #OxygenTherapy #Prematurity #NICU',
    postedAgo: '5 hours ago',
    likeCount: 892,
    comments: [
      {
        id: 'n1',
        name: 'Dr. Meera Iyer',
        initials: 'MI',
        color: '#0891b2',
        text: "This is why we're so strict about pulse-ox calibration on rounds now!",
        time: '3h',
        likes: 19,
      },
      {
        id: 'n2',
        name: 'Dr. Chen Wei',
        initials: 'CW',
        color: '#5b9bd5',
        text: 'The mortality vs ROP trade-off is such a tough one to explain to parents.',
        time: '4h',
        likes: 22,
      },
      {
        id: 'n3',
        name: 'Sarah Thompson',
        initials: 'ST',
        color: '#38a169',
        text: 'We target 90–95% at our unit now based on this — makes sense with the data.',
        time: '5h',
        likes: 11,
      },
      {
        id: 'n4',
        name: 'Dr. Ben Osei',
        initials: 'BO',
        color: '#dd8a3e',
        text: 'Would be great to see closed-loop O2 control become standard given this data.',
        time: '8h',
        likes: 14,
      },
      {
        id: 'n5',
        name: 'Ravi Patel',
        initials: 'RP',
        color: '#9c6ade',
        text: 'TIL different trials used different SpO2 algorithms — makes meta-analysis so much harder.',
        time: '1d',
        likes: 7,
      },
    ],
  },
  {
    slug: 'adept-trial',
    category: 'Neonatology',
    authorHandle: 'xyz_neonatology',
    authorSubtitle: 'Neonatology · Educational Post',
    title: 'The ADEPT Trial',
    subtitle: 'Early vs Late Feeding in Growth-Restricted Preterm Infants',
    badge: 'Landmark RCT · UK Multicentre',
    gradient: ['#1c1917', '#78350f', '#f59e0b'],
    stats: [
      { value: '404', label: 'infants' },
      { value: 'Abnormal', label: 'UA Doppler' },
      { value: 'UK', label: 'multicentre' },
      { value: '2013', label: 'RCT' },
    ],
    intro:
      'Does delaying feeds protect growth-restricted preemies from NEC? ADEPT put that assumption to the test 🍼📈',
    picot: [
      {
        label: 'P',
        text: 'Preterm infants (<35 weeks) who were growth-restricted with abnormal antenatal umbilical artery Doppler (absent/reversed end-diastolic flow)',
      },
      { label: 'I', text: 'Early introduction of enteral feeds (day 2 of life)' },
      { label: 'C', text: 'Late introduction of enteral feeds (day 6 of life)' },
      {
        label: 'O',
        text: 'Time to reach full enteral feeding (primary); necrotising enterocolitis (NEC), late-onset sepsis (secondary)',
      },
      { label: 'T', text: 'UK multicentre RCT, enrolled early 2010s, published 2013' },
    ],
    results: [
      'No significant difference in time to reach full enteral feeding between early and late groups',
      'No significant difference in NEC rates between early and late feeding',
      'Early feeding did not increase feed intolerance or late-onset sepsis',
      'A trend toward earlier full feeds in the early-feeding group, though not the main driver of practice change',
    ],
    limitations: [
      'Underpowered to detect small-to-moderate differences in NEC given its relatively low incidence',
      'Single population (UK, specific Doppler-abnormality criteria) — may not generalise to all growth-restricted infants',
      'Clinicians not blinded to feeding group, so practice variation was possible',
      'Longer-term growth and neurodevelopmental outcomes were not the primary focus',
    ],
    takeaways: [
      'Early enteral feeding appears safe in growth-restricted preterm infants with abnormal Doppler, challenging prior cautious "nil-by-mouth" practice',
      'Prolonged delay in starting feeds is not clearly protective against NEC in this population',
      'Supports individualised, less conservative feeding advancement in appropriately monitored infants',
      'Reinforces the need for careful clinical judgement in the highest-risk growth-restricted infants',
    ],
    furtherStudies: [
      'Larger trials/meta-analyses pooling growth-restricted infant feeding data to better power NEC as an outcome',
      'Research on optimal feed advancement rates (not just start day) in this population',
      'Biomarker studies (e.g., abdominal NIRS, Doppler resolution) to individualise feeding readiness',
    ],
    hashtags: '#Neonatology #EBM #NEC #GrowthRestriction #NICU',
    postedAgo: '1 day ago',
    likeCount: 654,
    comments: [
      {
        id: 'a1',
        name: 'Dr. Farah Siddiqui',
        initials: 'FS',
        color: '#ec4899',
        text: 'This changed how cautious we used to be with IUGR babies and abnormal Dopplers.',
        time: '6h',
        likes: 13,
      },
      {
        id: 'a2',
        name: 'James Okonkwo',
        initials: 'JO',
        color: '#5b9bd5',
        text: 'Still feels counterintuitive starting feeds early in these babies, but the data is reassuring.',
        time: '10h',
        likes: 9,
      },
      {
        id: 'a3',
        name: 'Dr. Anya Petrova',
        initials: 'AP',
        color: '#9c6ade',
        text: 'Would love to see this replicated with a bigger cohort powered for NEC specifically.',
        time: '14h',
        likes: 17,
      },
      {
        id: 'a4',
        name: 'Nurse Kavita Reddy',
        initials: 'KR',
        color: '#38a169',
        text: 'Parents always ask why we feed early despite the doppler findings — good to have this to reference.',
        time: '20h',
        likes: 8,
      },
      {
        id: 'a5',
        name: 'Dr. Liam O’Sullivan',
        initials: 'LO',
        color: '#dd8a3e',
        text: 'Interesting that delay didn’t protect against NEC — assumption busted!',
        time: '1d',
        likes: 5,
      },
    ],
  },
  {
    slug: 'feast-trial',
    category: 'Pediatrics',
    authorHandle: 'xyz_pediatrics',
    authorSubtitle: 'Paediatrics · Educational Post',
    title: 'The FEAST Trial',
    subtitle: 'Fluid Boluses in Children with Severe Febrile Illness',
    badge: 'Landmark RCT · NEJM',
    gradient: ['#450a0a', '#b91c1c', '#f97316'],
    stats: [
      { value: '3,141', label: 'children' },
      { value: 'E. Africa', label: '3 countries' },
      { value: 'NEJM', label: '2011' },
      { value: 'RCT', label: 'multicentre' },
    ],
    intro:
      'One of the most paradigm-shifting paediatric critical-care trials ever run — and the answer surprised everyone 💧⚠️',
    picot: [
      {
        label: 'P',
        text: 'Children aged 60 days–12 years in sub-Saharan Africa (Kenya, Uganda, Tanzania) with severe febrile illness and impaired perfusion',
      },
      { label: 'I', text: 'Fluid bolus resuscitation (20–40 mL/kg of 0.9% saline or 5% albumin)' },
      { label: 'C', text: 'No bolus (maintenance fluids only)' },
      { label: 'O', text: 'Mortality at 48 hours (primary); neurological sequelae at 4 weeks (secondary)' },
      { label: 'T', text: 'Multicentre RCT across 3 African countries, published 2011' },
    ],
    results: [
      'Both bolus arms (saline and albumin) had significantly higher 48-hour mortality than the no-bolus group',
      'Absolute mortality increase of roughly 3–4% with bolus therapy',
      'No difference in outcome between saline vs albumin bolus — the harm came from the bolus itself',
      'Findings held across pre-specified subgroups including different severity levels',
    ],
    limitations: [
      'Conducted in resource-limited settings without ICU-level monitoring, ventilation, or inotropic support — limits generalisability to well-resourced PICUs',
      'Excluded children with severe hypotension (who received boluses per standard of care outside the trial)',
      'Mechanism of harm not fully elucidated (proposed: cardiovascular strain, dilutional effects)',
      'Ongoing debate on applicability outside malaria/sepsis-endemic, low-resource settings',
    ],
    takeaways: [
      'Aggressive fluid bolus therapy is not universally safe — context and resource setting matter',
      'Overturned a long-standing assumption that "more fluid resuscitation is always better" in shocked children',
      'Directly informed revisions to WHO Emergency Triage, Assessment and Treatment (ETAT) guidelines',
      'A powerful reminder that an intervention proven beneficial in one setting can harm in another',
    ],
    furtherStudies: [
      'Mechanistic sub-studies examining cardiovascular and neurological effects of bolus therapy',
      'Guideline revision processes across WHO and regional paediatric societies',
      'Continued debate on fluid strategy in high-resource PICU settings, where practice differs',
    ],
    hashtags: '#Paediatrics #EBM #GlobalHealth #CriticalCare #FEASTTrial',
    postedAgo: '3 hours ago',
    likeCount: 2103,
    comments: [
      {
        id: 'f1',
        name: 'Dr. Grace Mwangi',
        initials: 'GM',
        color: '#38a169',
        text: 'This trial completely changed our resuscitation protocols across East Africa.',
        time: '1h',
        likes: 41,
      },
      {
        id: 'f2',
        name: 'Dr. Marcus Webb',
        initials: 'MW',
        color: '#5b9bd5',
        text: 'Always cite this when teaching residents about context-dependent evidence.',
        time: '2h',
        likes: 33,
      },
      {
        id: 'f3',
        name: 'Fatima Al-Rashid',
        initials: 'FA',
        color: '#ec4899',
        text: 'The WHO guideline change after this was huge — still discussed in every EM teaching session.',
        time: '3h',
        likes: 28,
      },
      {
        id: 'f4',
        name: 'Dr. Oliver Bennett',
        initials: 'OB',
        color: '#dd8a3e',
        text: "Humbling reminder that 'more is better' isn't always true in medicine.",
        time: '5h',
        likes: 25,
      },
      {
        id: 'f5',
        name: 'Priya Chandran',
        initials: 'PC',
        color: '#9c6ade',
        text: "Wow, didn't realise something so basic as fluid boluses could increase mortality like this.",
        time: '7h',
        likes: 16,
      },
    ],
  },
  {
    slug: 'pecarn-head-trauma',
    category: 'Pediatrics',
    authorHandle: 'xyz_pediatrics',
    authorSubtitle: 'Paediatrics · Educational Post',
    title: 'PECARN Head Trauma Rule',
    subtitle: 'Predicting Clinically Important TBI in Children',
    badge: 'Prospective Cohort · PECARN',
    gradient: ['#1e1b4b', '#4338ca', '#818cf8'],
    stats: [
      { value: '~42,000', label: 'children' },
      { value: '25 EDs', label: 'North America' },
      { value: 'Lancet', label: '2009' },
      { value: 'Cohort', label: 'derivation + validation' },
    ],
    intro:
      'The rule behind why so many kids with minor head bumps no longer need a CT scan 🧠📉',
    picot: [
      { label: 'P', text: 'Children <18 years presenting to the ED with minor blunt head trauma (GCS 14–15)' },
      {
        label: 'I',
        text: 'Application of the derived PECARN clinical prediction rule (age-stratified <2 years and ≥2 years)',
      },
      { label: 'C', text: 'Standard clinician judgement / CT ordering practice' },
      {
        label: 'O',
        text: 'Identification of children at very low risk of clinically important traumatic brain injury (ciTBI) who could safely avoid CT (primary)',
      },
      { label: 'T', text: 'Prospective cohort across 25 North American EDs, derivation + validation, published 2009' },
    ],
    results: [
      'Derived two age-specific prediction rules (<2 years and ≥2 years) using history and exam findings',
      'Rules achieved >99% negative predictive value for ciTBI in the very-low-risk group',
      'A large proportion of children could be safely identified as not needing CT imaging',
      'Validated in a separate cohort with consistent performance',
    ],
    limitations: [
      "Derivation/validation cohort design, not an RCT — doesn't prospectively confirm outcomes of withholding CT",
      'Rare but serious injuries could still occasionally be missed despite high sensitivity',
      'Requires accurate clinical assessment to apply correctly (inter-observer variability possible)',
      'External validation needed across different healthcare systems and populations outside North America',
    ],
    takeaways: [
      'Became the foundation for clinical decision-support tools now embedded in many EHRs',
      'Substantially reduced unnecessary CT radiation exposure in children while preserving safety',
      'A model for how large paediatric emergency medicine networks can generate practice-changing decision rules',
      'Reinforces shared decision-making with families when a child falls into an intermediate-risk category',
    ],
    furtherStudies: [
      'External validation studies in other countries and health systems',
      'Comparative studies against other rules (CATCH, CHALICE)',
      'Implementation and impact studies tracking real-world CT ordering rates after rule adoption',
    ],
    hashtags: '#Paediatrics #EBM #EmergencyMedicine #PECARN #HeadTrauma',
    postedAgo: '6 hours ago',
    likeCount: 1567,
    comments: [
      {
        id: 'p1',
        name: 'Dr. Sofia Marchetti',
        initials: 'SM',
        color: '#6366f1',
        text: 'We have this built into our EHR order set now — makes decision-making so much faster.',
        time: '2h',
        likes: 30,
      },
      {
        id: 'p2',
        name: 'Tom Reilly',
        initials: 'TR',
        color: '#5b9bd5',
        text: 'Still one of the best teaching examples for clinical decision rules in med school.',
        time: '3h',
        likes: 21,
      },
      {
        id: 'p3',
        name: 'Dr. Aisha Bello',
        initials: 'AB',
        color: '#38a169',
        text: 'Cuts down unnecessary radiation in kids massively — great use of big data in EM.',
        time: '4h',
        likes: 26,
      },
      {
        id: 'p4',
        name: 'Wendy Zhou, NP',
        initials: 'WZ',
        color: '#ec4899',
        text: 'Parents feel so much more reassured when we can explain the risk stratification clearly.',
        time: '5h',
        likes: 14,
      },
      {
        id: 'p5',
        name: 'Dr. Kenji Watanabe',
        initials: 'KW',
        color: '#dd8a3e',
        text: 'Would be curious how well this performs outside North America — any validation studies in Asia?',
        time: '6h',
        likes: 12,
      },
    ],
  },
];

export function getExampleTrial(slug: string | undefined): ExampleTrial | undefined {
  return EXAMPLE_TRIALS.find((t) => t.slug === slug);
}
