// Marks-based pacing: how many marks a sheet should carry for the time it
// gives, at the pace of the real exam.
//
// Each board's rate is (minutes ÷ marks) of a representative real paper, so a
// sheet is paced exactly as the exam is: 30 minutes of IGCSE is worth more
// marks than 30 minutes of CBSE, because IGCSE papers move faster.
//
//   board    representative paper                       minutes  marks  min/mark
//   IGCSE    Extended theory paper (e.g. Physics P4)         75      80    0.94
//   ASA      A Level structured paper (e.g. Physics P4)     120     100    1.20
//   AS       AS structured paper (e.g. Physics P2)            75      60    1.25
//   IB       Paper 2, sciences / maths (HL)                 150     100    1.50
//   AP       Full exam (e.g. Calculus AB)                   195     108    1.81
//   CBSE     Class 12 board paper                           180      80    2.25
//   CBSE10   Class 10 board paper                           180      80    2.25
//   ICSE     Class 10 paper                                 120      80    1.50
//   ISC      Class 12 paper                                 180      70    2.57
//   SAT      Full test, 98 questions × 1                    134      98    1.37
//   JEE      JEE Main, 75 questions × 4                     180     300    0.60
//   NEET     NEET-UG, 180 questions × 4                     200     720    0.28
//   LSAT     4 sections, ~100 questions × 1                 140     100    1.40
export const EXAM_PACE = {
  IGCSE: { minutes: 75, marks: 80 },
  ASA: { minutes: 120, marks: 100 },
  AS: { minutes: 75, marks: 60 },
  IB: { minutes: 150, marks: 100 },
  AP: { minutes: 195, marks: 108 },
  CBSE: { minutes: 180, marks: 80 },
  CBSE10: { minutes: 180, marks: 80 },
  ICSE: { minutes: 120, marks: 80 },
  ISC: { minutes: 180, marks: 70 },
  SAT: { minutes: 134, marks: 98 },
  JEE: { minutes: 180, marks: 300 },
  NEET: { minutes: 200, marks: 720 },
  LSAT: { minutes: 140, marks: 100 },
};

const DEFAULT_PACE = { minutes: 90, marks: 75 }; // 1.2 min/mark — a typical written paper

/** Minutes the real exam gives per mark, for a board. */
export function minutesPerMark(board) {
  const p = EXAM_PACE[String(board || '').toUpperCase()] || DEFAULT_PACE;
  return p.minutes / p.marks;
}

// Boards whose objective questions are worth 4 marks each (+4 / −1).
const FOUR_MARK_MCQ = new Set(['JEE', 'NEET']);

/** Marks one question is worth: its own, its scheme's total, or a board default. */
export function questionMarks(q, board) {
  const own = Number(q?.marks);
  if (own > 0) return own;
  const scheme = (Array.isArray(q?.markScheme) ? q.markScheme : []).reduce((s, p) => s + (Number(p.marks) || 0), 0);
  if (scheme > 0) return scheme;
  return typicalMarks(q?.answerType, board);
}

/** Typical marks for a question of this type on this board (for sizing a sheet). */
export function typicalMarks(answerType, board) {
  const b = String(board || '').toUpperCase();
  if (answerType === 'Multiple choice') return FOUR_MARK_MCQ.has(b) ? 4 : 1;
  if (answerType === 'Typed response') return FOUR_MARK_MCQ.has(b) ? 4 : 2;
  if (answerType === 'Drawing') return 3;
  return 4; // Exam style / structured
}

/** Marks a sheet of `minutes` should carry on `board`. */
export function targetMarks(minutes, board) {
  return Math.max(1, Math.round((Number(minutes) || 0) / minutesPerMark(board)));
}

/** Total marks on a list of questions. */
export function sheetMarks(questions, board) {
  return (questions || []).reduce((s, q) => s + questionMarks(q, board), 0);
}

// A sheet is "right" within this band of its target: exact marks are rarely
// reachable with whole questions, and a question is never split.
export const PACE_TOLERANCE = { low: 0.9, high: 1.15 };
