// The real papers a student sits, per board (and per kind of subject), each
// mapped to the answer format the worksheet builder understands. The builder
// shows these instead of the generic "Multiple choice / Typed / Exam style",
// so a student picks "Paper 2" the way their exam does.
//
// answerType values: 'Multiple choice' | 'Typed response' | 'Exam style'.
const MCQ = 'Multiple choice';
const TYPED = 'Typed response';
const EXAM = 'Exam style';

const P = (id, label, answerType, hint) => ({ id, label, answerType, hint });

// Rough subject families — the paper structure differs by kind, not by name.
export function subjectFamily(subject) {
  const s = String(subject || '').toLowerCase();
  if (/physic|chem|biolog|science|environment|marine|agricult/.test(s)) return 'science';
  if (/math|calculus|statistic|precalc|further/.test(s)) return 'maths';
  if (/english|french|spanish|german|hindi|chinese|mandarin|japanese|arabic|italian|korean|urdu|sanskrit|latin|language|literature|ab initio|\b[a-z]+ [ab]\b/.test(s)) return 'language';
  if (/econom|business|account|commerce|enterprise|management/.test(s)) return 'business';
  if (/computer|ict|information tech|informatics|digital|programming/.test(s)) return 'computing';
  return 'humanities';
}

const GENERIC = [P('mcq', 'Multiple choice', MCQ, 'Pick the correct option'), P('typed', 'Typed response', TYPED, 'Short typed answers'), P('exam', 'Exam style', EXAM, 'Structured / extended answers marked to a scheme')];

const CATALOGUE = {
  IGCSE: {
    science: [
      P('p1', 'Paper 1', MCQ, 'Multiple choice (Core)'),
      P('p2', 'Paper 2', MCQ, 'Multiple choice (Extended)'),
      P('p3', 'Paper 3', EXAM, 'Theory (Core) — structured questions'),
      P('p4', 'Paper 4', EXAM, 'Theory (Extended) — structured questions'),
      P('p5', 'Paper 5', EXAM, 'Practical test'),
      P('p6', 'Paper 6', EXAM, 'Alternative to practical'),
    ],
    maths: [
      P('p1', 'Paper 1', TYPED, 'Core — short answers, non-calculator'),
      P('p2', 'Paper 2', TYPED, 'Extended — short answers, non-calculator'),
      P('p3', 'Paper 3', EXAM, 'Core — structured, calculator'),
      P('p4', 'Paper 4', EXAM, 'Extended — structured, calculator'),
    ],
    business: [P('p1', 'Paper 1', MCQ, 'Multiple choice'), P('p2', 'Paper 2', EXAM, 'Structured / data response')],
    computing: [P('p1', 'Paper 1', EXAM, 'Computer systems — theory'), P('p2', 'Paper 2', EXAM, 'Algorithms, programming and logic')],
    language: [P('reading', 'Reading', EXAM, 'Reading comprehension'), P('writing', 'Writing', EXAM, 'Directed and extended writing'), P('listening', 'Listening', TYPED, 'Listening comprehension'), P('speaking', 'Speaking', EXAM, 'Speaking test')],
    humanities: [P('p1', 'Paper 1', EXAM, 'Structured questions'), P('p2', 'Paper 2', EXAM, 'Source / extended questions')],
  },
  ASA: {
    science: [
      P('p1', 'Paper 1', MCQ, 'AS multiple choice'),
      P('p2', 'Paper 2', EXAM, 'AS structured questions'),
      P('p3', 'Paper 3', EXAM, 'Advanced practical skills'),
      P('p4', 'Paper 4', EXAM, 'A Level structured questions'),
      P('p5', 'Paper 5', EXAM, 'Planning, analysis and evaluation'),
    ],
    maths: [
      P('p1', 'Paper 1', EXAM, 'Pure Mathematics 1'),
      P('p2', 'Paper 2', EXAM, 'Pure Mathematics 2'),
      P('p3', 'Paper 3', EXAM, 'Pure Mathematics 3'),
      P('p4', 'Paper 4', EXAM, 'Mechanics'),
      P('p5', 'Paper 5', EXAM, 'Probability & Statistics 1'),
      P('p6', 'Paper 6', EXAM, 'Probability & Statistics 2'),
    ],
    business: [P('p1', 'Paper 1', MCQ, 'AS multiple choice'), P('p2', 'Paper 2', EXAM, 'AS data response / essay'), P('p3', 'Paper 3', MCQ, 'A Level multiple choice'), P('p4', 'Paper 4', EXAM, 'A Level data response / essay')],
    computing: [P('p1', 'Paper 1', EXAM, 'Theory fundamentals'), P('p2', 'Paper 2', EXAM, 'Fundamental problem-solving and programming'), P('p3', 'Paper 3', EXAM, 'Advanced theory'), P('p4', 'Paper 4', EXAM, 'Practical')],
    language: [P('p1', 'Paper 1', EXAM, 'Reading and writing'), P('p2', 'Paper 2', EXAM, 'Essay / extended writing'), P('p3', 'Paper 3', TYPED, 'Listening'), P('p4', 'Paper 4', EXAM, 'Speaking')],
    humanities: [P('p1', 'Paper 1', EXAM, 'AS paper — structured / source questions'), P('p2', 'Paper 2', EXAM, 'AS paper — essays'), P('p3', 'Paper 3', EXAM, 'A Level paper — structured'), P('p4', 'Paper 4', EXAM, 'A Level paper — essays')],
  },
  AS: {
    science: [P('p1', 'Paper 1', MCQ, 'AS multiple choice'), P('p2', 'Paper 2', EXAM, 'AS structured questions'), P('p3', 'Paper 3', EXAM, 'Advanced practical skills')],
    maths: [P('p1', 'Paper 1', EXAM, 'Pure Mathematics 1'), P('p2', 'Paper 2', EXAM, 'Pure Mathematics 2'), P('p4', 'Paper 4', EXAM, 'Mechanics'), P('p5', 'Paper 5', EXAM, 'Probability & Statistics 1')],
    business: [P('p1', 'Paper 1', MCQ, 'AS multiple choice'), P('p2', 'Paper 2', EXAM, 'AS data response / essay')],
    computing: [P('p1', 'Paper 1', EXAM, 'Theory fundamentals'), P('p2', 'Paper 2', EXAM, 'Fundamental problem-solving and programming')],
    language: [P('p1', 'Paper 1', EXAM, 'Reading and writing'), P('p2', 'Paper 2', EXAM, 'Essay / extended writing'), P('p3', 'Paper 3', TYPED, 'Listening'), P('p4', 'Paper 4', EXAM, 'Speaking')],
    humanities: [P('p1', 'Paper 1', EXAM, 'AS paper — structured / source questions'), P('p2', 'Paper 2', EXAM, 'AS paper — essays')],
  },
  IB: {
    science: [
      P('p1a', 'Paper 1A', MCQ, 'Multiple choice'),
      P('p1b', 'Paper 1B', EXAM, 'Data-based questions'),
      P('p2', 'Paper 2', EXAM, 'Short-answer and extended-response'),
    ],
    maths: [
      P('p1', 'Paper 1', EXAM, 'Non-calculator (AA) / calculator (AI)'),
      P('p2', 'Paper 2', EXAM, 'Calculator'),
      P('p3', 'Paper 3', EXAM, 'HL only — extended problem-solving'),
    ],
    business: [P('p1', 'Paper 1', EXAM, 'Pre-released case / data response'), P('p2', 'Paper 2', EXAM, 'Quantitative / structured'), P('p3', 'Paper 3', EXAM, 'HL only — extended response')],
    computing: [P('p1', 'Paper 1', EXAM, 'Core topics'), P('p2', 'Paper 2', EXAM, 'Option'), P('p3', 'Paper 3', EXAM, 'HL only — case study')],
    language: [P('p1', 'Paper 1', EXAM, 'Productive skills — writing'), P('p2', 'Paper 2', EXAM, 'Receptive skills — listening & reading')],
    humanities: [P('p1', 'Paper 1', EXAM, 'Source-based'), P('p2', 'Paper 2', EXAM, 'Essays'), P('p3', 'Paper 3', EXAM, 'HL only — extended')],
  },
  AP: {
    science: [P('s1', 'Section I', MCQ, 'Multiple choice'), P('s2', 'Section II', EXAM, 'Free response')],
    maths: [P('s1a', 'Section I Part A', MCQ, 'Multiple choice — no calculator'), P('s1b', 'Section I Part B', MCQ, 'Multiple choice — calculator'), P('s2a', 'Section II Part A', EXAM, 'Free response — calculator'), P('s2b', 'Section II Part B', EXAM, 'Free response — no calculator')],
    business: [P('s1', 'Section I', MCQ, 'Multiple choice'), P('s2', 'Section II', EXAM, 'Free response')],
    computing: [P('s1', 'Section I', MCQ, 'Multiple choice'), P('s2', 'Section II', EXAM, 'Free response')],
    language: [P('s1', 'Section I', MCQ, 'Multiple choice'), P('s2', 'Section II', EXAM, 'Free response / essays')],
    humanities: [P('s1a', 'Section I Part A', MCQ, 'Multiple choice'), P('s1b', 'Section I Part B', TYPED, 'Short answer'), P('s2', 'Section II', EXAM, 'DBQ / long essay')],
  },
  // Indian boards: one paper split into sections.
  CBSE10: { any: [P('a', 'Section A', MCQ, 'Objective / MCQ, 1 mark'), P('b', 'Section B', TYPED, 'Very short answer, 2 marks'), P('c', 'Section C', EXAM, 'Short answer, 3 marks'), P('d', 'Section D', EXAM, 'Long answer, 5 marks'), P('e', 'Section E', EXAM, 'Case / source based')] },
  CBSE: { any: [P('a', 'Section A', MCQ, 'Objective / MCQ, 1 mark'), P('b', 'Section B', TYPED, 'Very short answer, 2 marks'), P('c', 'Section C', EXAM, 'Short answer, 3 marks'), P('d', 'Section D', EXAM, 'Long answer, 5 marks'), P('e', 'Section E', EXAM, 'Case / source based')] },
  ICSE: { any: [P('a', 'Section A', MCQ, 'Compulsory — objective / short'), P('b', 'Section B', EXAM, 'Structured questions (choice)')] },
  ISC: { any: [P('a', 'Section A', TYPED, 'Short answer'), P('b', 'Section B', EXAM, 'Structured'), P('c', 'Section C', EXAM, 'Long answer')] },
  SAT: { any: [P('rw', 'Reading & Writing', MCQ, 'Two adaptive modules'), P('math', 'Math', MCQ, 'Two adaptive modules (MCQ + student-produced)')] },
  JEE: { any: [P('mcq', 'MCQ', MCQ, '+4 / −1, single correct'), P('num', 'Numerical value', TYPED, 'Integer / numerical answers')] },
  NEET: { any: [P('mcq', 'MCQ', MCQ, '+4 / −1, single correct')] },
  LSAT: { any: [P('lr', 'Logical Reasoning', MCQ, 'Argument questions'), P('rc', 'Reading Comprehension', MCQ, 'Passage questions')] },
};

// The papers a student can build a sheet for, given their subject's board.
export function papersFor(board, subject) {
  const b = CATALOGUE[String(board || '').toUpperCase()];
  if (!b) return GENERIC;
  if (b.any) return b.any;
  return b[subjectFamily(subject)] || b.humanities || GENERIC;
}

export const GENERIC_PAPERS = GENERIC;
