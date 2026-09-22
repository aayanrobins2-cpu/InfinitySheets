// Single source of truth for "the subjects a student is actually taking".
//
// Every surface that shows the student's subjects — the Dashboard "My
// subjects" grid, Start Studying, the Create-a-Worksheet picker and the
// Question Bank — MUST derive its list from `enrolledSubjects` so the lists
// stay identical. The list comes from the student's own courses first, then
// any onboarding selection, and only falls back to the exam track's default
// subjects when nothing has been chosen yet. It is intentionally NOT filtered
// against a single exam track, so a student mixing boards (e.g. CBSE
// Mathematics + IB Mathematics AA HL) sees every subject they added.

import { SUBJECTS, EXAM_TRACKS, TOPICS } from '../data/mock';
import { BOARD_TOPICS, boardSubject } from '../data/syllabi';

export const boardName = (id) => EXAM_TRACKS.find((t) => t.id === id)?.name || id;

// Variants of one examining body share resources and examiner notes:
// CBSE Class 10 (CBSE10) sits under CBSE, ISC under CISCE alongside ICSE.
export const boardFamily = (id) => ({ CBSE10: 'CBSE', ISC: 'ICSE' }[id] || id);

// The ordered, de-duplicated list of subject names the student is taking.
export function enrolledSubjects(courses, userSubjects, track) {
  const trackSubs = SUBJECTS[track] || [];
  const fromCourses = [];
  (courses || []).forEach((c) => {
    const subs = Array.isArray(c.subjects) ? c.subjects : (c.subject ? [c.subject] : []);
    subs.forEach((entry) => {
      const name = typeof entry === 'string' ? entry : entry?.subject;
      if (name && !fromCourses.includes(name)) fromCourses.push(name);
    });
  });
  if (fromCourses.length) return fromCourses;
  // Onboarding picks, for accounts that have not built a course yet.
  const fromUser = (userSubjects || []).filter((s) => trackSubs.includes(s) || !trackSubs.length);
  return fromUser;
}

// Short board tag for labels: "IB HL", "A Level", "IGCSE", "CBSE 12".
export function boardTag(board, ibLevel) {
  const b = (board || '').toUpperCase();
  const short = { ASA: 'A Level', AS: 'AS Level', CBSE10: 'CBSE 10', CBSE: 'CBSE 12', ISC: 'ISC 12' }[b] || b;
  return b === 'IB' && ibLevel ? `IB ${ibLevel}` : short;
}

export const subjectKey = (subject, board, ibLevel) => `${subject}|${(board || '').toUpperCase()}|${ibLevel || ''}`;

// One entry per (subject, board, level) across the student's courses — the
// identity a predicted grade is computed for. "Physics" in an IGCSE course
// and "Physics" in an IB HL course are two different entries with two
// different grades. `label` is what the UI shows: "Physics · IB HL".
export function subjectEntries(courses, fallbackTrack) {
  const out = [];
  const seen = new Set();
  (courses || []).forEach((c) => {
    const board = c.exam || fallbackTrack;
    const subs = Array.isArray(c.subjects) ? c.subjects : (c.subject ? [c.subject] : []);
    subs.forEach((entry) => {
      const subject = typeof entry === 'string' ? entry : entry?.subject;
      if (!subject) return;
      const ibLevel = board === 'IB' && typeof entry === 'object' ? entry?.ibLevel || null : null;
      const key = subjectKey(subject, board, ibLevel);
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ key, subject, board, ibLevel, label: `${subject} · ${boardTag(board, ibLevel)}` });
    });
  });
  return out;
}

// Does this worksheet belong to this entry? Sheets carry board + ibLevel;
// older sheets without a board match on name only when the subject exists
// once in the student's courses.
export function sheetBelongs(w, entry, entries) {
  if (!w || w.subject !== entry.subject) return false;
  // A sheet that recorded an HL/SL level was an IB sitting, whatever else
  // it says — it must never count towards the same subject on another board.
  if (w.ibLevel && entry.board !== 'IB') return false;
  if (!w.board && w.ibLevel) return entry.board === 'IB' && (!entry.ibLevel || entry.ibLevel === w.ibLevel);
  if (!w.board) return !entries || entries.filter((e) => e.subject === entry.subject).length === 1;
  if ((w.board || '').toUpperCase() !== (entry.board || '').toUpperCase()) return false;
  if (entry.board === 'IB' && entry.ibLevel && w.ibLevel && w.ibLevel !== entry.ibLevel) return false;
  return true;
}

// Tag every sheet with the (subject, board, level) entry it belongs to, so
// pages can group by `_k` instead of by bare subject name. Sheets whose
// course is gone get a key of their own from what they recorded.
export function keyedWorksheets(worksheets, courses, fallbackTrack) {
  const entries = subjectEntries(courses, fallbackTrack);
  const labels = {};
  entries.forEach((e) => { labels[e.key] = e; });
  const list = (worksheets || []).map((w) => {
    const e = entries.find((x) => sheetBelongs(w, x, entries));
    const board = e ? e.board : (w.board || fallbackTrack);
    const ibLevel = e ? e.ibLevel : (board === 'IB' ? w.ibLevel || null : null);
    const key = e ? e.key : subjectKey(w.subject, board, ibLevel);
    if (!labels[key]) labels[key] = { key, subject: w.subject, board, ibLevel, label: `${w.subject} · ${boardTag(board, ibLevel)}` };
    return { ...w, _k: key };
  });
  return { list, entries: labels };
}

// The board that best describes the student right now: the most common
// board across their courses (first course wins a tie), else what they
// picked at onboarding. Used for every "fallback" so a student whose courses
// are all IB never sees the onboarding default (CBSE) anywhere.
export function primaryTrack(courses, fallback) {
  const counts = new Map();
  (courses || []).forEach((c) => { if (c?.exam) counts.set(c.exam, (counts.get(c.exam) || 0) + 1); });
  let best = null;
  for (const [board, n] of counts) if (!best || n > best.n) best = { board, n };
  return best ? best.board : (fallback || 'ASA');
}

// The board for one subject: its course's board, else the primary track.
export function boardFor(subject, courses, fallback) {
  return subjectBoards(courses, primaryTrack(courses, fallback))[subject]?.board || primaryTrack(courses, fallback);
}

// Map<subjectName, { board, ibLevel }> so each subject can show which board /
// IB level it belongs to. Courses carry their own `exam` board, so a student
// taking IGCSE Physics and IB Economics gets the right board on each subject.
export function subjectBoards(courses, fallbackTrack) {
  const map = {};
  (courses || []).forEach((c) => {
    const board = c.exam || fallbackTrack;
    const subs = Array.isArray(c.subjects) ? c.subjects : (c.subject ? [c.subject] : []);
    subs.forEach((entry) => {
      const name = typeof entry === 'string' ? entry : entry?.subject;
      if (!name) return;
      if (!map[name]) map[name] = { board, ibLevel: typeof entry === 'object' ? entry?.ibLevel : undefined };
    });
  });
  return map;
}

// ---------------------------------------------------------------------------
// The ONE definition of "the past-paper questions for this subject".
//
// The Question Bank and the worksheet builder must show the same questions, so
// both call this instead of filtering `state.pastPapers` themselves. A row
// qualifies when it is a real question (not a full-paper link), belongs to the
// subject, and either carries no board or matches the board of the course this
// subject belongs to. The builder then narrows by topic / answer type on top.
// ---------------------------------------------------------------------------
export function questionsForSubject(pastPapers, subject, courses, fallbackTrack, override) {
  if (!subject) return [];
  const info = override || subjectBoards(courses, fallbackTrack)[subject] || {};
  const board = info.board || fallbackTrack;
  const level = info.ibLevel; // IB: 'HL' | 'SL' when the student chose one
  return (pastPapers || []).filter((p) =>
    p && p.q && p.subject === subject
    && p.answerType !== 'Full paper'
    && (!p.board || p.board === board)
    // An IB paper tagged HL-only / SL-only is only served to that level;
    // untagged papers go to both.
    && (!p.ibLevel || !level || p.ibLevel === level));
}

// Which curricula actually teach a subject, in EXAM_TRACKS order. This is what
// keeps a subject filed under the right board: an IB-only subject can only be
// added to an IB course, and its card says "IB", never the account's default.
export function tracksOffering(subject) {
  return EXAM_TRACKS.map((t) => t.id).filter((id) => (SUBJECTS[id] || []).includes(subject));
}

// The board a subject should default to when the student adds it: their own
// track if that track teaches it, otherwise the first curriculum that does.
export function defaultBoardFor(subject, preferredTrack) {
  const offering = tracksOffering(subject);
  if (offering.length === 0) return preferredTrack;
  return offering.includes(preferredTrack) ? preferredTrack : offering[0];
}

/**
 * Worksheets that still belong to the student: only those in subjects
 * currently in their courses. When a subject is removed, its history stays
 * on disk (Worksheet History / Mistakes keep it) but it drops out of the
 * dashboard, predicted grades, performance, strengths and recommendations,
 * instead of lingering under the fallback exam board.
 */
export function activeWorksheets(worksheets, courses, userSubjects, track) {
  const enrolled = new Set(enrolledSubjects(courses, userSubjects, track));
  return (worksheets || []).filter((w) => enrolled.has(w.subject));
}

// Topics for a subject: an admin-imported syllabus (public.syllabus_topics)
// for the student's board wins over the built-in TOPICS map.
export function syllabusTopicNames(syllabusTopics, board, subject) {
  const rows = syllabusTopics || [];
  const row = rows.find((r) => r.subject === subject && r.board === board);
  return row ? (row.topics || []).map((t) => t.name).filter(Boolean) : null;
}

// The topics for a subject ON A GIVEN BOARD: the board's own syllabus file
// first (IGCSE Physics ≠ A Level Physics ≠ CBSE Physics), then the legacy
// name-keyed map, then nothing. Every topic list in the app comes through
// here or through syllabusTopicNames (admin-imported override).
export function topicsFor(board, subject) {
  const own = BOARD_TOPICS[board]?.[subject];
  if (own && own.length) return own;
  if (!board) {
    // No board known: first board that teaches the subject.
    for (const id of EXAM_TRACKS.map((t) => t.id)) {
      const t = BOARD_TOPICS[id]?.[subject];
      if (t && t.length) return t;
    }
  }
  return TOPICS[subject] || [];
}

// Admin override → board syllabus → legacy.
export function resolvedTopics(syllabusTopics, board, subject) {
  return syllabusTopicNames(syllabusTopics, board, subject) || topicsFor(board, subject);
}

// Topics grouped into chapters for the worksheet picker's collapsible
// dropdowns. Shape: [{ chapter, units: [topic name, ...] }].
//   1. An admin-imported syllabus can carry chapters on its rows.
//   2. A board syllabus file can define `chapters: [{ name, units }]` on a
//      subject; when present those become the dropdowns.
//   3. Otherwise every topic is a unit under a single "All topics" group, so
//      the picker still gives one collapsible list with select-all.
export function topicGroups(syllabusTopics, board, subject) {
  const rows = syllabusTopics || [];
  const imported = rows.find((r) => r.subject === subject && r.board === board);
  if (imported && Array.isArray(imported.chapters) && imported.chapters.length) {
    return imported.chapters
      .map((c) => ({ chapter: c.name || 'Topics', units: (c.units || []).map((u) => (typeof u === 'string' ? u : u?.name)).filter(Boolean) }))
      .filter((g) => g.units.length);
  }
  const subj = boardSubject(board, subject);
  if (subj && Array.isArray(subj.chapters) && subj.chapters.length) {
    return subj.chapters
      .map((c) => ({ chapter: c.name || 'Topics', units: (c.units || []).filter(Boolean) }))
      .filter((g) => g.units.length);
  }
  const flat = resolvedTopics(syllabusTopics, board, subject);
  return flat.length ? [{ chapter: 'All topics', units: flat }] : [];
}

// Short letter tag for a subject tile when no hand-picked one exists —
// initials of the meaningful words ("Sports, Exercise & Health Science" →
// "SEH", "Spanish B" → "SB", "Mandarin ab initio" → "MA"), 1-3 letters.
const MARK_STOP = new Set(['and', 'of', 'the', 'in', 'a', 'an', 'to', 'for', 'with']);
export function subjectMark(name) {
  const words = String(name || '').replace(/[&/,:()]/g, ' ').split(/\s+/).filter((w) => w && !MARK_STOP.has(w.toLowerCase()));
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 3).map((w) => w[0].toUpperCase()).join('');
}

// Subjects ranked by how commonly they are taken worldwide, so pickers show
// Mathematics / Physics / Chemistry first and "Latin" last. Matching is by
// prefix on the family name, so "Physics C: Mechanics" ranks with Physics
// and "Mathematics: Analysis & Approaches" with Mathematics; anything
// unmatched keeps its original order after the ranked ones.
const POPULARITY = ['Mathematics', 'Maths', 'Math', 'Calculus', 'Physics', 'Chemistry', 'Biology', 'English', 'Economics', 'Computer Science', 'Business', 'Psychology', 'History', 'Geography', 'Science', 'Accounting', 'Statistics', 'Calculus', 'Further Math', 'Additional Math', 'Environmental', 'Sociology', 'Political', 'Government', 'Philosophy', 'Design', 'Art', 'Music', 'Physical Education', 'Sports', 'Spanish', 'French', 'German', 'Hindi', 'Chinese', 'Mandarin', 'Japanese', 'Arabic', 'Italian'];
export function rankByPopularity(list) {
  const rank = (name) => {
    const n = String(name || '').toLowerCase();
    const i = POPULARITY.findIndex((k) => n.startsWith(k.toLowerCase()) || (k.length > 3 && n.includes(k.toLowerCase())));
    return i < 0 ? POPULARITY.length : i;
  };
  return (list || []).map((name, i) => ({ name, i, r: rank(name) }))
    .sort((a, b) => a.r - b.r || a.name.length - b.name.length || a.i - b.i)
    .map((x) => x.name);
}
