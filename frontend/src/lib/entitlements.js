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
  'Spaced review reminders so nothing slips',
  'Save any worksheet as a PDF',
  'Custom requests — tell the AI how to tweak any worksheet',
  'Custom courses built from your own material',
  `More than ${FREE_SUBJECT_LIMIT} subjects`,
  'No ads, anywhere',
];

// Short labels used in the "InfinitySheets+ only" prompts.
export const PLUS_FEATURES = {
  reviewDue: 'Spaced review reminders',
  flashcards: 'Notes & Flashcards',
  aiPlan: 'AI study plan & coach',
  askDoubt: 'Ask a doubt',
  diagnosis: 'AI worksheet diagnosis',
  pdf: 'Saving a worksheet as PDF',
  customCourse: 'Custom courses',
  customRequest: 'Custom requests to tweak a worksheet',
  moreSubjects: `More than ${FREE_SUBJECT_LIMIT} subjects`,
};
