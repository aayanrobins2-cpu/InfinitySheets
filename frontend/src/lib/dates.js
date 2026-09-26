// One date style everywhere in the app: dd/mm/yy (e.g. 24/09/26), and weeks
// that start on Monday.

const toDate = (d) => (d instanceof Date ? d : new Date(typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00` : d));
const pad = (n) => String(n).padStart(2, '0');

/** dd/mm/yy — '' for a missing or invalid date. */
export function fmtDate(d) {
  if (d === null || d === undefined || d === '') return '';
  const x = toDate(d);
  if (Number.isNaN(x.getTime())) return '';
  return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${String(x.getFullYear()).slice(-2)}`;
}

/** dd/mm/yy hh:mm */
export function fmtDateTime(d) {
  const x = toDate(d);
  if (Number.isNaN(x.getTime())) return '';
  return `${fmtDate(x)} ${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** 0 = Monday … 6 = Sunday. */
export function mondayIndex(d) { return (toDate(d).getDay() + 6) % 7; }

/** Midnight on the Monday of the week containing d. */
export function startOfWeek(d) {
  const x = toDate(d);
  const m = new Date(x.getFullYear(), x.getMonth(), x.getDate());
  m.setDate(m.getDate() - mondayIndex(m));
  return m;
}

/** yyyy-mm-dd in local time. */
export function isoDay(d) {
  const x = toDate(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}
