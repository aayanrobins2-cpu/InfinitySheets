// Pure helpers used to derive a difficulty-adjusted, heavily-latest-biased
// predicted grade from a student's worksheet history.
//
// Design notes (per product requirement):
//  - Predicted grade is PER SUBJECT — never averaged across subjects.
//  - Difficulty of the worksheet shifts the predicted score:
//        Easy   → predicted lower than raw accuracy (0.85×)
//        Medium → mostly matches (0.92×)
//        Exam level → matches raw accuracy (1.00×)
//        Hard   → predicted higher than raw accuracy (1.15×)
//  - Recency weighting is very heavy on the LATEST worksheet.
//        weight = 0.5^k, where k is the number of worksheets AFTER this one
//        (0 for the newest). Convergent sum ≈ 2, so the latest attempt
//        contributes ~50% of the prediction, the previous ~25%, the one
//        before that ~12.5%, etc.
//  - Format of the label depends on the student's exam track (syllabus):
//        IB              → "6/7"          (1-7 scale, per-subject IB grade)
//        IGCSE / AS-A    → "A*", "A", ... (letter grade)
//        CBSE / ICSE /   → "82%"          (percentage)
//        SSLC / SAT /
//        JEE / NEET

// Difficulty adjustment applied to a single worksheet's raw score.
export const DIFF_ADJUST = {
  'Easy': 0.85,
  'Medium': 0.92,
  'Exam level': 1.0,
  'Hard': 1.15,
};

// How "exam-like" a difficulty is, 0-1. Used for the fidelity weight below.
const DIFF_RANK = { 'Easy': 0.3, 'Medium': 0.6, 'Exam level': 1, 'Hard': 1 };

// Recency weighting: latest worksheet weight = 1, decays by RECENCY_DECAY
// each step back. 0.5 → latest ≈ 50%, prev ≈ 25%, ...
export const RECENCY_DECAY = 0.5;

// Improvement bias — when the latest attempt's *adjusted* score beats the
// weighted historical baseline the prediction gets a modest upward nudge.
// The bias is intentionally one-way (never dampens) because it models
// "student is trending up → give them the benefit of the doubt".
export const IMPROVEMENT_BONUS_CAP = 8;   // never more than +8 pts
export const IMPROVEMENT_BONUS_RATE = 0.4; // 40% of (latest - baseline)

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Real-exam reference per board: how long the paper is (minutes). A sheet
// at least this long, at exam-level difficulty or harder, counts as a real
// sitting and unlocks the predicted grade.
export const EXAM_MINUTES = { AP: 180, ASA: 90, AS: 75, CBSE10: 180, CBSE: 180, IB: 90, ICSE: 150, IGCSE: 120, ISC: 180, JEE: 180, LSAT: 140, NEET: 200, SAT: 134, SSLC: 150 };
export function examMinutesFor(board) { return EXAM_MINUTES[(board || '').toUpperCase()] || 90; }

/**
 * Fidelity: how close one worksheet was to the real exam, 0-1. Time and
 * difficulty both matter; a full-length exam-level (or hard) sheet is 1.
 */
export function sheetFidelity(w, examMinutes) {
  const mins = Number(w?.duration) || 0;
  const time = examMinutes > 0 ? clamp(mins / examMinutes, 0, 1) : 0;
  const diff = DIFF_RANK[w?.difficulty] ?? DIFF_RANK.Medium;
  return clamp(0.4 * time + 0.6 * diff, 0, 1);
}

/**
 * How far the real result could sit from the prediction, in percentage points.
 * It only tightens with evidence that looks like the real exam: each sheet
 * counts by its fidelity squared, so a full-length exam-level sitting counts
 * as 1 while a short Easy sheet barely counts at all. Consistent scores on
 * those sheets tighten it further; scattered ones widen it.
 *   no realistic sheets → ±30 · 1 full sitting → ≈±18 · 4 → ≈±10 · 10 → ≈±7 · 25 → ≈±4
 */
export function predictionMargin(worksheets, { board } = {}) {
  const examMinutes = examMinutesFor(board);
  const rows = (worksheets || []).filter((w) => followsExamFormat(w, examMinutes)).map((w) => ({ f: sheetFidelity(w, examMinutes), s: Number(w?.score) || 0 }));
  const evidence = rows.reduce((t, r) => t + r.f * r.f, 0);
  const base = 30 / Math.sqrt(1 + 1.8 * evidence);
  let scatter = 0;
  const wsum = rows.reduce((t, r) => t + r.f, 0);
  if (rows.length >= 2 && wsum > 0) {
    const mean = rows.reduce((t, r) => t + r.f * r.s, 0) / wsum;
    const sd = Math.sqrt(rows.reduce((t, r) => t + r.f * (r.s - mean) ** 2, 0) / wsum);
    scatter = sd / Math.sqrt(Math.max(1, evidence));
  }
  return Math.round(clamp(Math.sqrt(base * base + scatter * scatter), 3, 30));
}

// A sheet that was as hard AND as long as the real exam.
export function isExamSitting(w, examMinutes) {
  return (DIFF_RANK[w?.difficulty] ?? 0) >= 1 && (Number(w?.duration) || 0) >= examMinutes;
}

/**
 * Compute the predicted score (0-100) for a single subject's worksheet list.
 * Accepts worksheets in any order — internally sorts by date descending so
 * that `worksheets[0]` is the newest attempt (and gets the highest weight).
 *
 * @param {Array<{score:number, correct?:number, total?:number, difficulty?:string, date?:string, duration?:number}>} worksheets
 * @param {{ board?: string }} [opts]  board decides the real exam length
 * @returns {number} 0-100, or 0 when list is empty
 */
export function predictedScore(worksheets, opts) {
  return predictedBreakdown(worksheets, opts).score;
}

/**
 * Same computation as {@link predictedScore} but exposes each step so the UI
 * can explain how the number was arrived at.
 *
 * Weighting (per product requirement): every sheet pulls the prediction, but
 * by how much depends on how close it was to the real exam. The weight of a
 * sheet is recency × (0.05 + 0.95 × fidelity³), so a full-length exam-level
 * paper counts ~10-20× a short easy drill, and the grade scored on a real-exam
 * sitting is what the prediction converges to. The prediction is only
 * `ready` once at least one sheet was at least as hard AND as long as the
 * real exam; before that `score` is still computed (for trends) but the UI
 * shows what is missing instead.
 */
/**
 * A sheet counts towards the predicted grade only when it follows the real
 * exam's format: an exam simulation (the paper's sections, counts and marks),
 * or a sheet at least as hard and as long as the real paper. Short drills and
 * easy practice never move the grade.
 */
export function followsExamFormat(w, examMinutes) {
  return !!w?.simulation || isExamSitting(w, examMinutes);
}

export function predictedBreakdown(allWorksheets, { board } = {}) {
  const examMinutes = examMinutesFor(board);
  const practised = (allWorksheets || []).length;
  const worksheets = (allWorksheets || []).filter((w) => followsExamFormat(w, examMinutes));
  // `count` = exam-format sheets; `practised` = every sheet in the subject.
  const empty = { score: 0, baseScore: 0, improvementBonus: 0, latestAdj: 0, hasImprovement: false, count: 0, practised, ready: false, sittings: 0, examMinutes, bestFidelity: 0 };
  if (worksheets.length === 0) return empty;

  // Sort by date desc (newest first). Fall back to insertion order if no date.
  const sorted = [...worksheets].sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return tb - ta;
  });

  let num = 0;
  let den = 0;
  let latestAdj = 0;
  let latestFidelity = 0;
  let sittings = 0;
  let bestFidelity = 0;
  sorted.forEach((w, i) => {
    const raw = typeof w.score === 'number'
      ? w.score
      : (w.total ? (w.correct / w.total) * 100 : 0);
    const adj = clamp(raw * (DIFF_ADJUST[w.difficulty] ?? DIFF_ADJUST.Medium), 0, 100);
    const fidelity = sheetFidelity(w, examMinutes);
    if (i === 0) { latestAdj = adj; latestFidelity = fidelity; }
    if (fidelity > bestFidelity) bestFidelity = fidelity;
    if (isExamSitting(w, examMinutes)) sittings += 1;
    const weight = Math.pow(RECENCY_DECAY, i) * (0.05 + 0.95 * fidelity * fidelity * fidelity);
    num += adj * weight;
    den += weight;
  });

  const baseScore = den === 0 ? 0 : num / den;

  // Improvement bonus: only when the latest attempt beats the baseline, and
  // only as much as that attempt resembled the real exam — acing a 10-minute
  // easy drill after a weak exam sitting barely moves the grade.
  const gap = latestAdj - baseScore;
  const improvementBonus = gap > 0
    ? Math.min(IMPROVEMENT_BONUS_CAP, gap * IMPROVEMENT_BONUS_RATE) * latestFidelity
    : 0;

  const score = clamp(Math.round(baseScore + improvementBonus), 0, 100);
  return {
    score,
    baseScore: Math.round(baseScore),
    improvementBonus: Math.round(improvementBonus * 10) / 10,
    latestAdj: Math.round(latestAdj),
    hasImprovement: improvementBonus > 0,
    count: sorted.length,
    practised,
    ready: sorted.length > 0,
    sittings,
    examMinutes,
    bestFidelity: Math.round(bestFidelity * 100) / 100,
  };
}

// Short copy for the "not ready yet" state.
export function readinessHint(bd) {
  const mins = bd?.examMinutes || 90;
  return `Not enough data yet — sit an exam simulation, or an exam-level sheet of ${mins} min or more`;
}

// -----------------------------------------------------------------------------
// Grade formatting
// -----------------------------------------------------------------------------

// Percentage → IB grade (1-7). Per-subject only.
export function scoreToIBGrade(score) {
  if (score >= 85) return 7;
  if (score >= 75) return 6;
  if (score >= 65) return 5;
  if (score >= 55) return 4;
  if (score >= 45) return 3;
  if (score >= 30) return 2;
  return 1;
}

// Percentage → IGCSE / AS-A letter. Per-subject only.
export function scoreToLetterGrade(score) {
  if (score >= 90) return 'A*';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  if (score >= 40) return 'E';
  if (score >= 30) return 'F';
  if (score >= 20) return 'G';
  return 'U';
}

// Percentage → AS Level grade (a-e, no A*).
export function scoreToASGrade(score) {
  if (score >= 80) return 'a';
  if (score >= 70) return 'b';
  if (score >= 60) return 'c';
  if (score >= 50) return 'd';
  if (score >= 40) return 'e';
  return 'U';
}

/**
 * Format a per-subject predicted score for display based on the student's
 * exam track. Returns { label, sub, tone } where:
 *   label — the primary text ("6/7", "A", "82%")
 *   sub   — small helper text under the label
 *   tone  — 'good' | 'ok' | 'weak' — driving colour of the pill
 *
 * @param {number} score      0-100 predicted score
 * @param {string} examTrack  e.g. 'IB', 'IGCSE', 'ASA', 'CBSE', ...
 */
/** Percentage → SAT total (400-1600, steps of 10). */
export function satScore(pct) {
  return Math.round((400 + (clamp(Number(pct) || 0, 0, 100) / 100) * 1200) / 10) * 10;
}

export function formatGrade(score, examTrack) {
  const s = Math.round(score);
  let tone = 'weak';
  if (s >= 70) tone = 'good';
  else if (s >= 45) tone = 'ok';

  const track = (examTrack || '').toUpperCase();
  if (track === 'IB') {
    const g = scoreToIBGrade(s);
    return { label: `${g}/7`, sub: `Predicted IB grade`, tone };
  }
  if (track === 'AS') {
    return { label: scoreToASGrade(s), sub: 'Predicted AS Level grade', tone };
  }
  if (track === 'IGCSE' || track === 'ASA') {
    const g = scoreToLetterGrade(s);
    const trackLabel = track === 'ASA' ? 'A Level' : 'IGCSE';
    return { label: g, sub: `Predicted ${trackLabel} grade`, tone };
  }
  if (track === 'SAT') {
    // The SAT is scored 400-1600 in steps of 10, not as a percentage.
    return { label: `${satScore(s)}`, sub: 'Predicted SAT score (400–1600)', tone };
  }
  // CBSE, ICSE, SSLC, JEE, NEET → percentage
  return { label: `${s}%`, sub: 'Predicted score', tone };
}

// Tailwind classes for the tone (kept in one place so the whole app stays consistent).
export const TONE_CLASSES = {
  good: {
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  ok: {
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  weak: {
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
};

// True if the predicted grade for this track should be shown as a "grade"
// (IB/IGCSE/ASA) rather than a percentage. Handy for UI copy.
export function isGradedTrack(examTrack) {
  const t = (examTrack || '').toUpperCase();
  return t === 'IB' || t === 'IGCSE' || t === 'ASA' || t === 'AS';
}
