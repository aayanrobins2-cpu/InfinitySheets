// Context chains: questions that only make sense after an earlier one.
//
// A real paper is full of them — "3(a) Calculate the current." then
// "3(b) Hence find the power dissipated.", or a shared stem ("The graph
// shows…") that several parts hang off. Serving 3(b) on its own is
// unanswerable, so questions carry:
//
//   chainId    — the group they belong to (all parts of one printed question)
//   chainOrder — 1-based position inside that group
//   chainNeeds — true when this part cannot stand alone (it refers back)
//
// Chains are detected automatically while a paper is extracted, and can be
// re-detected over the library at any time (the admin "Chains" panel).

// "3(b)(ii)" → { root: '3', parts: ['b', 'ii'] }; "12" → { root: '12', parts: [] }
export function parseNumber(label) {
  const s = String(label || '').trim();
  const m = /^\s*(\d+)\s*(.*)$/.exec(s);
  if (!m) return { root: '', parts: [] };
  const parts = (m[2].match(/[a-z]+|[ivx]+|\d+/gi) || []).map((p) => p.toLowerCase());
  return { root: m[1], parts };
}

// Wording that only makes sense with an earlier part in front of it.
const BACKREF = [
  /\bpart\s*\(?\s*[a-z]\s*\)?/i,
  /\byour answer (to|from)\b/i,
  /\banswer (to|from) (part|question)\b/i,
  /\b(hence|therefore|using this|using these|using your)\b/i,
  /\bthe (graph|diagram|figure|table|circuit|reaction|experiment|passage|extract|data|equation|function|curve|sample|solution|text) (above|shown|described|in the)\b/i,
  /\bthis (graph|diagram|figure|table|circuit|reaction|experiment|compound|function|value|result)\b/i,
  /\bin (part|question)\s*\(?[a-z0-9]/i,
  /\bas (calculated|found|described) above\b/i,
  /\brepeat (the|this)\b/i,
  /\bthe same (circuit|reaction|graph|data|experiment|sample)\b/i,
];

/** True when a question's wording refers back to something before it. */
export function refersBack(text) {
  const t = String(text || '');
  return BACKREF.some((re) => re.test(t));
}

const sameSource = (a, b) =>
  a.subject === b.subject
  && (a.board || '') === (b.board || '')
  && (a.year || null) === (b.year || null)
  && (a.paper || '') === (b.paper || '')
  && (a.ibLevel || '') === (b.ibLevel || '');

/**
 * detectChains(questions, { keyOf })
 *   → Map<questionId, { chainId, chainOrder, chainNeeds, chainSize }>
 *
 * Questions from the same paper that share a printed root number ("3(a)",
 * "3(b)") form a chain in printed order. A part whose wording refers back
 * ("hence…", "your answer to part (a)") is marked chainNeeds, meaning the
 * parts before it must be served with it.
 *
 * `numberOf` reads the printed label; questions without one can still be
 * chained when they sit consecutively in the same paper and refer back.
 */
export function detectChains(questions, { numberOf = (q) => q.number || q._number } = {}) {
  const list = (questions || []).filter(Boolean);
  const out = new Map();
  const groups = new Map();

  list.forEach((q, i) => {
    const label = numberOf(q);
    const { root, parts } = parseNumber(label);
    // Group key: same paper + same printed root number. Without a label we
    // fall back to the previous question's group so a back-referring
    // question still attaches to what came before it.
    let key = null;
    if (root) {
      key = `${q.subject}|${q.board || ''}|${q.year || ''}|${q.paper || ''}|${q.ibLevel || ''}|${root}`;
    } else if (i > 0 && refersBack(q.q) && sameSource(q, list[i - 1])) {
      key = out.get(list[i - 1].id)?.chainId || `seq|${list[i - 1].id}`;
    }
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ q, parts, i });
  });

  groups.forEach((items, key) => {
    if (items.length < 2) return; // a single part is not a chain
    items.sort((a, b) => {
      const n = Math.min(a.parts.length, b.parts.length);
      for (let k = 0; k < n; k += 1) {
        if (a.parts[k] !== b.parts[k]) return a.parts[k] < b.parts[k] ? -1 : 1;
      }
      return a.parts.length - b.parts.length || a.i - b.i;
    });
    items.forEach(({ q }, idx) => {
      out.set(q.id, {
        chainId: key,
        chainOrder: idx + 1,
        chainSize: items.length,
        // The first part always stands alone; later parts need what came
        // before when they refer back to it.
        chainNeeds: idx > 0 && refersBack(q.q),
      });
    });
  });
  return out;
}

/** Apply detectChains to a list, returning new objects with the fields set. */
export function withChains(questions, opts) {
  const map = detectChains(questions, opts);
  return (questions || []).map((q) => {
    const c = map.get(q.id);
    return c ? { ...q, ...c } : q;
  });
}

/**
 * Chains as groups for the UI:
 *   [{ chainId, items: [q, …], needs: n }]  (printed order, 2+ items)
 */
export function chainGroups(questions) {
  const by = new Map();
  (questions || []).forEach((q) => {
    if (!q?.chainId) return;
    if (!by.has(q.chainId)) by.set(q.chainId, []);
    by.get(q.chainId).push(q);
  });
  const out = [];
  by.forEach((items, chainId) => {
    if (items.length < 2) return;
    items.sort((a, b) => (a.chainOrder || 0) - (b.chainOrder || 0));
    out.push({ chainId, items, needs: items.filter((q) => q.chainNeeds).length });
  });
  return out;
}

/**
 * Pull every question a chosen one depends on into the sheet, in order.
 * `picked` is what the builder selected; `pool` is everything available.
 * A question with chainNeeds drags in the earlier parts of its chain, and
 * chained questions always appear together, in printed order.
 */
export function expandChains(picked, pool) {
  const byId = new Map((pool || []).map((q) => [q.id, q]));
  const chains = new Map();
  (pool || []).forEach((q) => {
    if (!q?.chainId) return;
    if (!chains.has(q.chainId)) chains.set(q.chainId, []);
    chains.get(q.chainId).push(q);
  });
  chains.forEach((items) => items.sort((a, b) => (a.chainOrder || 0) - (b.chainOrder || 0)));

  const out = [];
  const used = new Set();
  const push = (q) => { if (q && !used.has(q.id)) { used.add(q.id); out.push(q); } };
  (picked || []).forEach((q) => {
    if (!q) return;
    if (q.chainNeeds && q.chainId && chains.has(q.chainId)) {
      chains.get(q.chainId)
        .filter((x) => (x.chainOrder || 0) <= (q.chainOrder || 0))
        .forEach((x) => push(byId.get(x.id) || x));
      return;
    }
    push(q);
  });
  return out;
}
