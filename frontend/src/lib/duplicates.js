// Duplicate detector for the past-paper library. Two questions are a
// duplicate when their normalised text is identical, or when they share
// most of their word bigrams (near-duplicates: an OCR slip, a changed
// symbol, trailing spaces from a second PDF scan…). Measured on real scans:
// a genuine re-scan scores ~0.7, different questions with the same shape
// ('Sketch, on the axes, a graph…') score under 0.2, so 0.6 is safe.

const norm = (s) => String(s || '')
  .toLowerCase()
  .replace(/[‘’“”]/g, "'")
  // Possessives and contractions first, so "Newton's" and "Newtons" match.
  .replace(/'/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function shingles(text, n = 2) {
  const w = text.split(' ').filter(Boolean);
  const out = new Set();
  if (w.length < n) { if (w.length) out.add(w.join(' ')); return out; }
  for (let i = 0; i + n <= w.length; i += 1) out.add(w.slice(i, i + n).join(' '));
  return out;
}

// Character trigrams — used for short questions ("State Newton's first
// law."), where word bigrams are too few for a stable score.
function charGrams(text, n = 3) {
  const t = text.replace(/\s+/g, ' ');
  const out = new Set();
  if (t.length <= n) { if (t) out.add(t); return out; }
  for (let i = 0; i + n <= t.length; i += 1) out.add(t.slice(i, i + n));
  return out;
}

// Words that carry no meaning for "is this the same question?".
const STOP = new Set(['the','a','an','of','in','on','at','to','for','and','or','is','are','was','were','be','by','with','from','that','this','these','those','it','its','as','your','you','which','what','when','how','why','give','state','write','show','using','use','one','two','some','any','all','into','out','up','down','between','per','each','also','their','there','has','have','had','do','does','not','no','if','then','than','so','such','may','can','will','shall','would','could','should','about','after','before','during','above','below','over','under']);

const contentWords = (t) => t.split(' ').filter((w) => w && !STOP.has(w)).map((w) => w.replace(/(ies)$/, 'y').replace(/s$/, ''));

// Two words that differ only by an OCR slip / typo (one edit, or a long
// shared prefix) — "resistance" vs "reslstance".
function nearWord(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 2 || Math.min(a.length, b.length) < 4) return false;
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  let j = 0; while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j += 1;
  // Everything but a short middle section matches.
  return (a.length - i - j) <= 1 && (b.length - i - j) <= 1;
}

/**
 * The same question asked about a DIFFERENT thing is not a duplicate, however
 * much wording they share: "the SI unit of force" vs "of power", "a graph of
 * velocity against time" vs "of displacement against time". So every content
 * word one has and the other lacks must be explainable as a typo.
 */
function sameSubjectMatter(ta, tb) {
  const a = contentWords(ta);
  const b = contentWords(tb);
  const setB = new Set(b);
  const setA = new Set(a);
  const onlyA = a.filter((w) => !setB.has(w));
  const onlyB = b.filter((w) => !setA.has(w));
  const pool = [...onlyB];
  return onlyA.every((w) => {
    const k = pool.findIndex((x) => nearWord(w, x));
    if (k < 0) return false;
    pool.splice(k, 1);
    return true;
  }) && pool.length === 0;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  a.forEach((x) => { if (b.has(x)) inter += 1; });
  return inter / (a.size + b.size - inter);
}

/**
 * findDuplicates(questions, { threshold })
 *   → [{ key, exact, items: [q, q, …] }]  groups of 2+ questions.
 * Exact groups come first, then near-duplicates (similarity ≥ threshold).
 * Only questions in the same subject are compared.
 */
export function findDuplicates(questions, { threshold = 0.6 } = {}) {
  const list = (questions || []).filter((q) => q && q.q);
  const groups = [];
  const used = new Set();

  // 1) exact matches on normalised text
  const byText = new Map();
  list.forEach((q) => {
    const k = `${q.subject}|${norm(q.q)}`;
    if (!byText.has(k)) byText.set(k, []);
    byText.get(k).push(q);
  });
  byText.forEach((items, k) => {
    if (items.length > 1) { groups.push({ key: k, exact: true, items }); items.forEach((q) => used.add(q.id)); }
  });

  // 2) near matches among what is left (per subject, O(n²) but n is small)
  const rest = list.filter((q) => !used.has(q.id));
  const txt = new Map(rest.map((q) => [q.id, norm(q.q)]));
  const sh = new Map(rest.map((q) => [q.id, shingles(txt.get(q.id))]));
  const cg = new Map(rest.map((q) => [q.id, charGrams(txt.get(q.id))]));
  const words = (id) => txt.get(id).split(' ').filter(Boolean).length;
  // Short questions are compared on character trigrams at a stricter
  // threshold; long ones on word bigrams.
  // Same subject matter (no swapped keyword) AND near-identical wording,
  // measured on character trigrams as well as word bigrams — short questions
  // and single-typo re-scans have too few bigrams to score on their own.
  const similar = (a, b) => sameSubjectMatter(txt.get(a), txt.get(b))
    && (jaccard(cg.get(a), cg.get(b)) >= 0.72
      || (words(a) >= 7 && words(b) >= 7 && jaccard(sh.get(a), sh.get(b)) >= threshold));
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (used.has(a.id)) continue;
    const items = [a];
    for (let j = i + 1; j < rest.length; j += 1) {
      const b = rest[j];
      if (used.has(b.id) || b.subject !== a.subject) continue;
      if (similar(a.id, b.id)) items.push(b);
    }
    if (items.length > 1) {
      items.forEach((q) => used.add(q.id));
      groups.push({ key: `near|${a.id}`, exact: false, items });
    }
  }
  return groups;
}
