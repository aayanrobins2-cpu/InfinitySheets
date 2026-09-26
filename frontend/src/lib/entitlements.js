// InfinitySheets+ (premium) entitlements.
//
// The + tier gates the features that cost us the most — mostly the AI ones —
// so free users see them but locked. Rules:
//   - Admins always get InfinitySheets+.
//   - In test mode an admin can flip between free and + (state.testPlan) to
//     preview both experiences.
//   - Everyone else is free unless their settings carry plan === 'plus'
//     (there is no in-app billing yet, so this is set by us).

export const FREE_SUBJECT_LIMIT = 6;

export function isPlus(state) {
  const u = state && state.user;
  if (!u) return false;
  if (u.isDemo) return state.testPlan === 'plus';   // test-mode toggle
  if (u.role === 'admin') return true;               // admins get +
  return u.plan === 'plus' || (state.settings && state.settings.plan === 'plus');
}

// Everything InfinitySheets+ unlocks, in the words a student would use.
// One list, shown in full by the upgrade banner so nobody has to guess what
// they are paying for.
export const PLUS_PITCH = [
  'Notes & Flashcards — PDF and audio notes, decks, and blurting',
  'AI study plan & coach, rebuilt around every exam date',
  'AI diagnosis after every worksheet — what went wrong and why',
  'Ask a doubt on any question, any topic',
  'Save any worksheet as a PDF',
  'Custom requests — tell the AI how to tweak any worksheet',
  'Worksheets that draw on the notes you upload',
  'Custom courses built from your own material',
  `More than ${FREE_SUBJECT_LIMIT} subjects`,
  'No ads, anywhere',
];

// Short labels used in the "InfinitySheets+ only" prompts.
export const PLUS_FEATURES = {
  flashcards: 'Notes & Flashcards',
  aiPlan: 'AI study plan & coach',
  askDoubt: 'Ask a doubt',
  diagnosis: 'AI worksheet diagnosis',
  pdf: 'Saving a worksheet as PDF',
  customCourse: 'Custom courses',
  customRequest: 'Custom requests to tweak a worksheet',
  notesInWorksheets: 'Worksheets built from your own notes',
  moreSubjects: `More than ${FREE_SUBJECT_LIMIT} subjects`,
};

// Free users can still try InfinitySheets+ features, under strict limits:
//   'once'  - long-term features (a custom course, the AI study plan): one
//             use, ever.
//   'daily' - short-term features: a small allowance that resets each day.
// Features not listed here (more subjects) stay + only.
export const FREE_ALLOWANCE = {
  customCourse: { kind: 'once', n: 1 },
  aiPlan: { kind: 'once', n: 1 },
  flashcards: { kind: 'daily', n: 1 },
  askDoubt: { kind: 'daily', n: 2 },
  diagnosis: { kind: 'daily', n: 1 },
  pdf: { kind: 'daily', n: 1 },
  customRequest: { kind: 'daily', n: 1 },
  notesInWorksheets: { kind: 'daily', n: 1 },
};

const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

/** How many free uses of `feature` are left right now (Infinity for +). */
export function freeUsesLeft(state, feature) {
  if (isPlus(state)) return Infinity;
  const rule = FREE_ALLOWANCE[feature];
  if (!rule) return 0;
  const u = (state?.settings?.plusUsage || {})[feature] || {};
  if (rule.kind === 'once') return Math.max(0, rule.n - (u.total || 0));
  return Math.max(0, rule.n - (u.day === todayKey() ? u.today || 0 : 0));
}

/** The usage record after one more use of `feature`. */
export function recordUse(usage, feature) {
  const u = (usage || {})[feature] || {};
  const day = todayKey();
  return { ...(usage || {}), [feature]: { total: (u.total || 0) + 1, day, today: (u.day === day ? u.today || 0 : 0) + 1 } };
}

/** Human wording of a feature's free allowance. */
export function allowanceText(feature) {
  const rule = FREE_ALLOWANCE[feature];
  if (!rule) return 'Only with InfinitySheets+.';
  return rule.kind === 'once' ? `Free accounts can use this ${rule.n === 1 ? 'once' : `${rule.n} times`}.` : `Free accounts get ${rule.n} a day.`;
}

// InfinitySheets+ prices shown on the payment page (#plus). Placeholders until
// pricing is final — change them here and they update everywhere.
export const PLUS_PRICING = {
  monthly: { label: 'Monthly', price: '$4.99', per: 'month', note: '' },
  yearly: { label: 'Yearly', price: '$39.99', per: 'year', note: 'Save 33% — about $3.33 a month' },
};

// Hosted checkout links (e.g. Stripe Payment Links), set as build env vars.
// Empty = checkout not connected yet; the page says it is opening soon.
export const PLUS_CHECKOUT_URLS = {
  monthly: process.env.REACT_APP_PLUS_CHECKOUT_MONTHLY || '',
  yearly: process.env.REACT_APP_PLUS_CHECKOUT_YEARLY || '',
};
