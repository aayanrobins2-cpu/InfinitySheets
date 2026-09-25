// Study streak — consecutive days with a finished worksheet.
//
// The stored streak is only ever written when a sheet is submitted, so on its
// own it is a lie the moment a day is missed: a student who last studied five
// days ago would still be shown "12 🔥". `effectiveStreak` is what the UI
// must read — it expires the stored number against today's date.
//
// Day comparison is done on the local calendar date (not 24-hour spans), so
// a sheet at 23:50 and one at 00:10 are two different days, and DST does not
// gain or lose anyone a day.

export function dayKey(d) {
  // A stored key ("2026-09-25") is already a local date. new Date() would
  // parse it as UTC midnight, which west of UTC is the previous local day —
  // that made a second sheet on the same day reset the streak to 1.
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function fromKey(k) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(k || ''));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(k);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole calendar days from `from` to `to` (both any date-ish value). */
export function daysBetween(from, to) {
  const a = fromKey(from);
  const b = fromKey(to);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/**
 * The streak the student actually has right now.
 *   studied today or yesterday → the stored streak (yesterday still counts:
 *   the day is not over, so it is not broken yet)
 *   anything older, or never   → 0
 */
export function effectiveStreak({ streak, lastStudyDate } = {}, now = new Date()) {
  const n = Number(streak) || 0;
  if (!n || !lastStudyDate) return 0;
  const gap = daysBetween(lastStudyDate, now);
  if (gap === null || gap < 0) return n;   // clock skew — do not punish
  return gap <= 1 ? n : 0;
}

/** The streak after finishing a sheet today. */
export function advanceStreak({ streak, lastStudyDate } = {}, now = new Date()) {
  const today = dayKey(now);
  if (lastStudyDate && dayKey(lastStudyDate) === today) return Math.max(1, Number(streak) || 0);
  const gap = lastStudyDate ? daysBetween(lastStudyDate, now) : null;
  if (gap === 1) return (Number(streak) || 0) + 1;
  return 1; // first ever, or the run was broken
}
