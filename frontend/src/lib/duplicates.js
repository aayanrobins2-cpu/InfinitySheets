// Duplicate detector for the past-paper library. Two questions are a
// duplicate when their normalised text is identical, or when they share
// most of their word bigrams (near-duplicates: an OCR slip, a changed
// symbol, trailing spaces from a second PDF scan…). Measured on real scans:
// a genuine re-scan scores ~0.7, different questions with the same shape
// ('Sketch, on the axes, a graph…') score under 0.2, so 0.6 is safe.

const norm = (s) => String(s || '')
  .toLowerCase()
  .replace(/[‘’“”]/g, "'")
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
  const sh = new Map(rest.map((q) => [q.id, shingles(norm(q.q))]));
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (used.has(a.id)) continue;
    const items = [a];
    for (let j = i + 1; j < rest.length; j += 1) {
      const b = rest[j];
      if (used.has(b.id) || b.subject !== a.subject) continue;
      if (jaccard(sh.get(a.id), sh.get(b.id)) >= threshold) items.push(b);
    }
    if (items.length > 1) {
      items.forEach((q) => used.add(q.id));
      groups.push({ key: `near|${a.id}`, exact: false, items });
    }
  }
  return groups;
}
