// Approximate number of candidates who sit each subject's exam per year,
// worldwide, per board — from the boards' published entry / results
// statistics (College Board AP program summary, IBO statistical bulletin,
// Cambridge International entry figures, CBSE / CISCE results releases),
// rounded. These are estimates for prioritising which subjects to build
// content for first; they are not shown as exact figures.
//
// Keys are matched to a board's subject names by exact name first, then by
// prefix ("Physics C: Mechanics" → "Physics C: Mechanics", "Mathematics:
// Analysis & Approaches" → "Mathematics"), so small naming differences in
// the syllabus files still rank correctly.

const AP = {
  'English Language': 560000, 'US History': 460000, 'English Literature': 350000, 'World History': 340000,
  'US Government': 330000, 'Psychology': 320000, 'Calculus AB': 270000, 'Human Geography': 240000,
  'Biology': 240000, 'Statistics': 240000, 'Environmental Science': 200000, 'Physics 1': 160000,
  'Computer Science Principles': 160000, 'Spanish': 150000, 'Chemistry': 150000, 'Macroeconomics': 140000,
  'Calculus BC': 135000, 'Computer Science': 95000, 'Microeconomics': 90000, 'European History': 80000,
  'Precalculus': 60000, 'Seminar': 55000, 'Physics C: Mechanics': 55000, 'Physics C: Electricity & Magnetism': 30000,
  '2-D Art & Design': 30000, 'Research': 25000, 'Physics 2': 25000, 'Spanish Literature': 25000, 'Art History': 24000,
  'Drawing': 20000, 'Comparative Government': 20000, 'French': 20000, 'Music Theory': 16000, 'Chinese': 15000,
  'African American Studies': 13000, '3-D Art & Design': 6000, 'Latin': 5000, 'German': 5000, 'Italian': 2500,
  'Japanese': 2500, 'English': 350000, 'Economics': 140000, 'History': 460000, 'Physics': 160000,
};

const IB = {
  'English Language & Literature': 90000, 'English A': 90000, 'Mathematics AA': 80000, 'Mathematics: Analysis': 80000,
  'Biology': 60000, 'Mathematics AI': 50000, 'Mathematics: Applications': 50000, 'Chemistry': 50000,
  'Economics': 42000, 'History': 40000, 'Physics': 40000, 'Psychology': 36000, 'Business Management': 35000,
  'Spanish B': 32000, 'English Literature': 26000, 'French B': 25000, 'Environmental Systems': 25000,
  'Geography': 18000, 'Visual Arts': 15000, 'Spanish ab initio': 12000, 'Computer Science': 12000,
  'Global Politics': 10000, 'Theatre': 6000, 'Sports, Exercise': 8000, 'Design Technology': 6000, 'Philosophy': 6000,
  'Chinese B': 8000, 'Mandarin ab initio': 5000, 'French ab initio': 6000, 'German B': 5000, 'Music': 5000,
  'Film': 4000, 'Social & Cultural Anthropology': 3000, 'Information Technology': 3000, 'Digital Society': 3000,
  'Spanish A': 7000, 'Chinese A': 8000, 'Mathematics': 80000, 'English': 90000, 'Spanish': 32000, 'French': 25000,
};

const IGCSE = {
  'Mathematics': 420000, 'English as a Second Language': 260000, 'First Language English': 250000, 'English': 250000,
  'Physics': 210000, 'Chemistry': 210000, 'Biology': 200000, 'Economics': 95000, 'Computer Science': 95000,
  'ICT': 90000, 'Information and Communication Technology': 90000, 'Business Studies': 85000, 'Business': 85000,
  'Combined Science': 80000, 'Co-ordinated Sciences': 80000, 'Additional Mathematics': 70000, 'Geography': 65000,
  'History': 60000, 'English Literature': 60000, 'Literature in English': 60000, 'Accounting': 45000,
  'French': 35000, 'Spanish': 28000, 'Art & Design': 25000, 'Physical Education': 20000, 'Environmental Management': 15000,
  'Global Perspectives': 25000, 'Sociology': 12000, 'German': 10000, 'Chinese': 15000, 'Hindi': 8000, 'Music': 5000,
  'Drama': 8000, 'Design & Technology': 8000, 'Travel & Tourism': 6000, 'Enterprise': 5000, 'Religious Studies': 5000,
  'Food & Nutrition': 4000, 'Agriculture': 2000, 'Arabic': 8000, 'Malay': 5000, 'Urdu': 4000, 'Bangladesh Studies': 3000,
  'Pakistan Studies': 20000, 'Islamiyat': 20000, 'India Studies': 1000, 'Latin': 2000, 'Italian': 2000, 'Japanese': 2000,
};

const ASA = {
  'Mathematics': 110000, 'Physics': 75000, 'Chemistry': 75000, 'Biology': 65000, 'Economics': 55000,
  'English General Paper': 45000, 'General Paper': 45000, 'Business': 35000, 'Computer Science': 22000,
  'Accounting': 22000, 'Psychology': 20000, 'English Language': 18000, 'Further Mathematics': 12000,
  'History': 12000, 'Law': 10000, 'Sociology': 10000, 'Geography': 9000, 'Literature in English': 9000, 'English Literature': 9000,
  'Information Technology': 8000, 'Art & Design': 7000, 'Global Perspectives': 8000, 'Thinking Skills': 6000,
  'Physical Education': 4000, 'Spanish': 4000, 'French': 4000, 'Chinese': 5000, 'German': 1500, 'Marine Science': 1500,
  'Environmental Management': 3000, 'Travel & Tourism': 2000, 'Media Studies': 3000, 'Music': 1500, 'Drama': 2000,
  'Design & Technology': 2000, 'Hindi': 1500, 'Urdu': 2000, 'Arabic': 2000, 'Tamil': 500, 'Divinity': 300, 'Classical Studies': 300,
};

const CBSE = {
  'English Core': 1600000, 'English': 1600000, 'Physics': 780000, 'Chemistry': 780000, 'Mathematics': 720000,
  'Physical Education': 620000, 'Economics': 520000, 'Biology': 470000, 'Accountancy': 420000, 'Business Studies': 420000,
  'Political Science': 320000, 'Hindi': 300000, 'History': 260000, 'Computer Science': 210000, 'Geography': 200000,
  'Applied Mathematics': 110000, 'Psychology': 110000, 'Informatics Practices': 100000, 'Sociology': 60000,
  'Home Science': 30000, 'Painting': 40000, 'Legal Studies': 20000, 'Entrepreneurship': 20000, 'Sanskrit': 20000,
  'Biotechnology': 10000, 'Engineering Graphics': 10000, 'Music': 10000, 'French': 5000, 'German': 3000,
};

const CBSE10 = {
  'Mathematics': 2200000, 'Science': 2200000, 'Social Science': 2200000, 'English': 2200000, 'Hindi': 1600000,
  'Information Technology': 900000, 'Sanskrit': 320000, 'Computer Applications': 200000, 'Artificial Intelligence': 300000,
  'French': 50000, 'German': 25000, 'Home Science': 20000, 'Painting': 40000, 'Music': 20000, 'Physical Education': 100000,
};

const ICSE = {
  'English': 260000, 'Mathematics': 260000, 'Science': 250000, 'Physics': 250000, 'Chemistry': 250000, 'Biology': 250000,
  'History': 250000, 'History, Civics & Geography': 250000, 'Geography': 250000, 'Hindi': 220000, 'Computer Applications': 180000,
  'Economics': 60000, 'Commercial Studies': 40000, 'Economic Applications': 30000, 'Physical Education': 40000,
  'Environmental Science': 10000, 'French': 15000, 'Art': 20000, 'Home Science': 5000, 'Sanskrit': 5000,
};

const ISC = {
  'English': 100000, 'Mathematics': 55000, 'Physics': 50000, 'Chemistry': 50000, 'Biology': 25000,
  'Commerce': 35000, 'Accounts': 35000, 'Accountancy': 35000, 'Economics': 35000, 'Computer Science': 25000,
  'Business Studies': 20000, 'Political Science': 10000, 'History': 10000, 'Psychology': 12000, 'Sociology': 8000,
  'Physical Education': 15000, 'Hindi': 20000, 'Geography': 6000, 'Environmental Science': 3000, 'Art': 3000,
};

// One-paper exams: everyone sits everything.
const SAT = { 'Reading & Writing': 1900000, 'Math': 1900000, 'SAT': 1900000 };
const JEE = { 'Physics': 1200000, 'Chemistry': 1200000, 'Mathematics': 1200000 };
const NEET = { 'Biology': 2300000, 'Chemistry': 2300000, 'Physics': 2300000 };
const LSAT = { 'Logical Reasoning': 130000, 'Reading Comprehension': 130000, 'LSAT': 130000 };

export const SUBJECT_DEMAND = { AP, IB, IGCSE, ASA, AS: ASA, CBSE, CBSE10, ICSE, ISC, SAT, JEE, NEET, LSAT };

const norm = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();

/** Estimated candidates per year for a subject on a board (0 = unknown). */
export function subjectDemand(board, subject) {
  const table = SUBJECT_DEMAND[(board || '').toUpperCase()];
  if (!table) return 0;
  const n = norm(subject);
  if (!n) return 0;
  // Exact, then the longest key that is a prefix of the name (or vice
  // versa), so "Mathematics AA" beats "Mathematics".
  let best = 0; let bestLen = 0;
  Object.entries(table).forEach(([k, v]) => {
    const kn = norm(k);
    if (kn === n) { best = v; bestLen = Infinity; return; }
    if (bestLen === Infinity) return;
    if ((n.startsWith(kn) || kn.startsWith(n)) && kn.length > bestLen) { best = v; bestLen = kn.length; }
  });
  return best;
}

export function formatDemand(n) {
  if (!n) return '';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}
