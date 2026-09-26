// Blocks slurs and offensive language in names (profile names, group names).
// The same rules run in the database (public.is_offensive_name), so nothing
// gets past by calling the API directly — this copy just gives the student a
// clear message before they save.
//
// Names are normalised first so disguises don't work: lower case, accents
// stripped, look-alike digits/symbols mapped to letters (sh1t, $h!t, @ss),
// separators removed (s.h.i.t, s h i t) and repeated letters collapsed
// (shiiiit). Two lists:
//   STEMS — long, unambiguous roots matched anywhere in the squashed name.
//   WORDS — short words that only count as a whole word, so ordinary names
//           that happen to contain them (Dickens, Cassandra, Scunthorpe
//           spelled out) are not blocked.

const LEET = { 0: 'o', 1: 'i', 2: 'z', 3: 'e', 4: 'a', 5: 's', 6: 'g', 7: 't', 8: 'b', 9: 'g', '@': 'a', $: 's', '!': 'i', '|': 'i', '+': 't', '€': 'e', '£': 'l' };

// Kept deliberately compact; add to both this list and the SQL function.
const STEMS = [
  'nigger', 'nigga', 'faggot', 'fagot', 'retard', 'tranny', 'spastic', 'wetback',
  'beaner', 'raghead', 'towelhead', 'shemale',
  'fuck', 'fck', 'cunt', 'bitch', 'whore', 'slut', 'bastard', 'asshole', 'arsehole', 'dickhead',
  'motherf', 'wanker', 'twat', 'bollock', 'penis', 'vagina', 'pussy', 'porn', 'hitler', 'kkk',
];
const WORDS = ['shit', 'shitty', 'shithead', 'bullshit', 'chink', 'kike', 'coon', 'gook', 'paki', 'nazi', 'rapist', 'fuk', 'fag', 'ass', 'arse', 'dick', 'cock', 'tits', 'boob', 'rape', 'sex', 'cum', 'jew', 'homo', 'nig', 'spic', 'hoe'];

function normalise(s) {
  return String(s || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split('').map((c) => LEET[c] ?? c).join('');
}
// Stretched letters are undone two ways — down to one ("shiiiit" → "shit")
// and down to two ("niggger" → "nigger") — and the lists are matched as
// written, so real doubles like "kkk" or "ass" still count and "Niger" does not.
const toOne = (s) => s.replace(/(.)\1+/g, '$1');
const toTwo = (s) => s.replace(/(.)\1{2,}/g, '$1$1');
const variants = (s) => [s, toOne(s), toTwo(s)];

/** True when the name contains a slur or offensive word. */
export function isOffensiveName(name) {
  const n = normalise(name);
  const squashed = n.replace(/[^a-z]/g, '');
  if (variants(squashed).some((v) => STEMS.some((w) => v.includes(w)))) return true;
  const parts = n.split(/[^a-z]+/).filter(Boolean);
  // A short word spelled out with separators ("f.a.g", "a s s") is one word.
  const words = parts.every((p) => p.length === 1) ? [...parts, parts.join('')] : parts;
  return words.some((w) => variants(w).some((v) => WORDS.some((bad) => v === bad || v === `${bad}s`)));
}

export const OFFENSIVE_NAME_MESSAGE = 'That name isn’t allowed. Please choose a name without offensive language.';
