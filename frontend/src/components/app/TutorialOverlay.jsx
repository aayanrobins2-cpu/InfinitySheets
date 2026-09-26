import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronLeft, ChevronRight, X, Sparkles, MousePointerClick, CheckCircle2 } from 'lucide-react';

// Each step navigates the real app to a route, then shows a floating tooltip
// describing what the user is seeing. Optionally highlights a sidebar nav item.
const STEPS = [
  {
    route: 'course-overview',
    target: 'courses',
    eyebrow: 'Welcome',
    title: 'Your course overview',
    body: 'Every topic in your course with a summary, exam dates per subject and a countdown. Come back anytime from My Courses.',
    bullets: ['Every topic, per subject', 'Exam date and days left per subject', 'Jump straight into a subject'],
  },
  {
    route: 'dashboard',
    task: { spot: '[data-testid="days-until-exam"]', text: 'Tap your exam countdown to open the full exam timetable.', on: 'click', stay: true },
    target: 'dashboard',
    eyebrow: 'Step 1',
    title: 'Your dashboard',
    body: 'Days to your exam (click the pencil to change it), predicted grade, your latest AI diagnosis, weekly goal, this-week summary, study streak and where that streak is taking you.',
    bullets: ['"Study next" topics under each subject', 'Spaced reviews that are due', 'Streak heatmap + grade projection'],
  },
  {
    route: 'courses',
    target: 'courses',
    eyebrow: 'Step 2',
    title: 'Add your courses',
    body: 'Courses group subjects under an exam board: CBSE, IB (with HL/SL), IGCSE, AP, SAT and more, or a custom course from your own material. Everything else is tailored to these.',
    bullets: ['Multiple courses and boards at once', 'Per-subject exam dates', 'Custom courses from your files'],
  },
  {
    route: 'study',
    task: { spot: '[data-testid="study-search-input"]', text: 'Type a subject into the search box.', on: 'input' },
    target: 'study',
    eyebrow: 'Step 3',
    title: 'Start Studying',
    body: 'Open a subject for its overview, then open any topic: an AI overview of exactly what the exam wants (with sources), official links, and a tutor you can ask doubts.',
    bullets: ['Topic overview cited to the syllabus', 'Ask a doubt about any topic', 'Add subjects to a course from here'],
  },
  {
    route: 'worksheets',
    task: { spot: '[data-testid="ws-subject"]', text: 'Choose the subject for your first worksheet.', on: 'change' },
    target: 'worksheets',
    eyebrow: 'Step 4',
    title: 'Build a worksheet',
    body: 'Pick subject, topics, answer type, difficulty and duration. AI writes original in-syllabus questions; tick past papers to mix in real ones. Exam mode locks the screen; Pace coach budgets your time per question.',
    bullets: ['Adaptive difficulty and full exam simulations', 'Tag why you missed a question (optional), get the worked solution', 'Missed questions come back as spaced reviews'],
  },
  {
    route: 'history',
    target: 'history',
    eyebrow: 'Step 5',
    title: 'Worksheet History',
    body: 'Every sheet you finish, with its score, AI diagnosis and a "How you worked" analysis: time per question, revisits, changed answers and what it says about your technique.',
    bullets: ['Resume an unfinished sheet', 'Time-per-question graph', 'Mistake history lives here too'],
  },
  {
    route: 'progress',
    target: 'progress',
    eyebrow: 'Step 6',
    title: 'Performance',
    body: 'Score trend per subject with the predicted grade in your board’s format. Click a subject to see it alone. Timing trends show which topics slow you down and whether speed costs accuracy.',
    bullets: ['Predicted grade per subject', 'Pace vs accuracy', 'Improvement over time'],
  },
  {
    route: 'strengths',
    target: 'strengths',
    eyebrow: 'Step 7',
    title: 'Strengths & Weaknesses',
    body: 'Topics sorted by accuracy with adaptive thresholds you can customise. Weak topics feed the recommendations and the "Study next" chips on your dashboard.',
    bullets: ['Filter by subject', 'Adaptive or custom thresholds', 'Weakest topics first'],
  },
  {
    route: 'recommendations',
    target: 'recommendations',
    eyebrow: 'Step 8',
    title: 'Smart Learning',
    body: 'Your AI study coach knows your boards, exam dates, weak topics and every diagnosis. Below it: all worksheet diagnoses and your next best actions.',
    bullets: ['A 7-day AI study plan you tick off', 'Re-run any diagnosis', 'Next best actions by weakest topic'],
  },
  {
    route: 'flashcards',
    target: 'flashcards',
    eyebrow: 'Step 9',
    title: 'Notes & Flashcards',
    body: 'Keep your PDF and audio notes per subject, work through concept flashcards, and blurt: your notes come back with the key facts blanked out for you to fill in from memory.',
    bullets: ['Upload PDF notes or record audio notes', 'Flashcards by subject and topic', 'Blurting: fill the blanks from memory'],
  },
  {
    route: 'groups',
    target: 'groups',
    eyebrow: 'Step 10',
    title: 'Study Groups',
    body: 'Create a group for your class and share the 8-character code. The weekly leaderboard shows first names, questions answered, accuracy and streak — never answers or emails.',
    bullets: ['Join with a code', 'This week in your group — no rankings', 'First names only'],
  },
  {
    route: 'settings',
    task: { spot: '[data-testid="header-theme-toggle"]', text: 'Try switching between light and dark mode.', on: 'click' },
    target: 'settings',
    eyebrow: 'Step 11',
    title: 'Settings',
    body: 'Goals, difficulty, keyboard shortcuts, light or dark mode, daily reminders, the weekly email digest, your privacy choices and a copy of your data, and one switch that turns every AI assistant off.',
    bullets: ['Reminders and weekly digest', 'Privacy & download my data', 'AI on / off, theme and shortcuts'],
  },
];

const MOBILE = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
const hashRoute = () => (window.location.hash || '#dashboard').slice(1).split('?')[0] || 'dashboard';

// Interactive tour. Each step has two parts:
//   1. "Go there" — the sidebar item glows and the student clicks it (on a
//      phone, where the sidebar is hidden, the tour navigates for them).
//   2. "Try it" — once on the page, a real control is spotlighted with a small
//      task (tap the countdown, search a subject, pick a subject…). Doing it
//      ticks the step off; Next / Skip are always there too.
// Arrow keys move between steps, Esc closes.
export default function TutorialOverlay() {
  const { finishTutorial, state } = useApp();
  const [i, setI] = useState(0);
  const wrapRef = useRef(null);
  // The course-overview step is meaningless before a course exists (it would
  // show "No course found"), so a fresh account starts at "Add your courses".
  // Decided once when the tour opens: if it reacted to courses changing, adding
  // a course mid-tour would insert a step and yank the student to another page.
  const [steps] = useState(() => ((state.courses || []).length ? STEPS : STEPS.filter((s) => s.route !== 'course-overview')));
  const step = steps[i];
  const isLast = i === steps.length - 1;
  const [route, setRoute] = useState(hashRoute);
  const [done, setDone] = useState({}); // step index → task completed
  const arrived = route === step.route;

  useEffect(() => {
    const onHash = () => setRoute(hashRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Steps with no sidebar item (course overview), and phones, navigate for the student.
  useEffect(() => {
    if (!step?.route || hashRoute() === step.route) return;
    const nav = document.querySelector(`[data-nav-key="${step.route}"]`);
    if (MOBILE() || !nav || step.route === 'course-overview' || i === 0) window.location.hash = `#${step.route}`;
  }, [i, step]);

  // What to spotlight: the sidebar item until they get there, then the task.
  const spotSel = !arrived ? `[data-nav-key="${step.target}"]` : (step.task && !done[i] ? step.task.spot : null);

  // Glow on the sidebar item (existing style).
  useEffect(() => {
    document.querySelectorAll('.tut-highlight').forEach((el) => el.classList.remove('tut-highlight'));
    if (arrived || !step?.target) return undefined;
    const el = document.querySelector(`[data-nav-key="${step.target}"]`);
    if (el) el.classList.add('tut-highlight');
    return () => { if (el) el.classList.remove('tut-highlight'); };
  }, [step, arrived]);

  // Track the spotlight target's box, and detect the task being done.
  const [box, setBox] = useState(null);
  useEffect(() => {
    let el = null;
    let off = () => {};
    const attach = () => {
      const found = spotSel ? document.querySelector(spotSel) : null;
      if (found === el) return;
      off();
      el = found;
      if (!el) { setBox(null); return; }
      if (arrived && step.task) {
        const ev = step.task.on || 'click';
        const hit = () => setDone((d) => ({ ...d, [i]: true }));
        el.addEventListener(ev, hit, true);
        off = () => el && el.removeEventListener(ev, hit, true);
      }
    };
    const measure = () => {
      attach();
      if (!el) { setBox(null); return; }
      const r = el.getBoundingClientRect();
      setBox(r.width ? { top: r.top, left: r.left, width: r.width, height: r.height } : null);
    };
    measure();
    if (el && arrived) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const id = setInterval(measure, 250); // pages render in after navigation
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { clearInterval(id); off(); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [spotSel, arrived, i, step]);

  const close = () => { document.querySelectorAll('.tut-highlight').forEach((el) => el.classList.remove('tut-highlight')); finishTutorial(); };
  const next = () => (isLast ? close() : setI((v) => v + 1));
  const back = () => setI((v) => Math.max(0, v - 1));

  // Doing the task moves the tour on by itself (unless the task itself
  // navigates somewhere worth a look — then the student presses Next).
  useEffect(() => {
    if (!done[i] || step.task?.stay) return undefined;
    const t = setTimeout(() => { if (!isLast) setI((v) => v + 1); }, 900);
    return () => clearTimeout(t);
  }, [done, i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
      else if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Card position: beside the spotlight when there is room, else bottom-right.
  const W = 380;
  let pos = { right: 24, bottom: 24 };
  if (box && !MOBILE()) {
    const vw = window.innerWidth; const vh = window.innerHeight;
    if (box.left + box.width + 18 + W < vw) pos = { left: box.left + box.width + 18, top: Math.max(16, Math.min(vh - 360, box.top - 10)) };
    else if (box.top + box.height + 16 + 300 < vh) pos = { left: Math.max(16, Math.min(vw - W - 16, box.left)), top: box.top + box.height + 14 };
    else pos = { left: Math.max(16, Math.min(vw - W - 16, box.left)), top: Math.max(16, box.top - 330) };
  }

  const stage = !arrived ? 'go' : step.task ? (done[i] ? 'done' : 'try') : 'look';

  return (
    <>
      {/* Spotlight: dims the page except the thing to click. Clicks pass through. */}
      {box ? (
        <div className="fixed z-40 pointer-events-none rounded-xl ring-2 ring-blue-400 transition-all duration-300"
          style={{ top: box.top - 6, left: box.left - 6, width: box.width + 12, height: box.height + 12, boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.35)' }} aria-hidden="true">
          <span className="absolute inset-0 rounded-xl ring-4 ring-blue-400/40 animate-ping" />
        </div>
      ) : (
        <div className="fixed inset-0 z-40 pointer-events-none bg-slate-900/15" aria-hidden="true" />
      )}

      <div ref={wrapRef} className="fixed z-50 max-w-[92vw] animate-tut-in" style={{ width: W, ...pos }} role="dialog" aria-label={`Tour: ${step.title}`} key={i}>
        <div className="relative bg-white border border-[color:var(--color-border)] rounded-2xl overflow-hidden shadow-2xl">
          <div className="h-1 w-full bg-slate-100">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${((i + (stage === 'done' || stage === 'look' ? 1 : 0.5)) / steps.length) * 100}%` }} />
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-[0.16em] uppercase font-semibold text-blue-600">{step.eyebrow}</div>
                <div className="text-[18px] font-semibold tracking-tight text-slate-900 mt-1">{step.title}</div>
              </div>
              <button onClick={close} className="w-7 h-7 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors" aria-label="Close tutorial">
                <X className="w-5 h-5" />
              </button>
            </div>

            {stage === 'go' ? (
              <div className="mt-3 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-3 text-[13.5px] text-blue-900 flex items-start gap-2" data-testid="tut-go">
                <MousePointerClick className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Click <b>{step.title.replace(/^Your /, '').replace(/^Add your /, '')}</b> in the sidebar to go there.</span>
              </div>
            ) : (
              <>
                <p className="text-[13.5px] text-slate-600 mt-2 leading-relaxed">{step.body}</p>
                <ul className="mt-3 flex flex-col gap-1">
                  {step.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[13px] text-slate-700">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                {step.task && (
                  <div className={`mt-3 rounded-xl px-3.5 py-3 text-[13px] flex items-start gap-2 border transition-colors ${done[i] ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-violet-50 border-violet-200 text-violet-900'}`} data-testid="tut-task">
                    {done[i] ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <MousePointerClick className="w-4 h-4 mt-0.5 shrink-0" />}
                    <span><b>{done[i] ? 'Nice — done!' : 'Try it:'}</b> {step.task.text}</span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="px-5 py-3 border-t border-[color:var(--color-border)] flex items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-1.5">
              {steps.map((s, idx) => (
                <button key={s.title} onClick={() => setI(idx)} aria-label={`Go to step ${idx + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === i ? 'bg-blue-600' : (done[idx] || idx < i ? 'bg-blue-300' : 'bg-slate-300')}`} />
              ))}
              <span className="ml-2 text-[11.5px] text-slate-500 tabular-nums">{i + 1} / {steps.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={close} className="text-[12.5px] text-slate-500 hover:text-slate-800 transition-colors">Skip</button>
              {i > 0 && (
                <button onClick={back} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12.5px] border border-[color:var(--color-border)] bg-white hover:bg-slate-100 text-slate-700 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              {!isLast ? (
                <button onClick={next} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12.5px] font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors" data-testid="tut-next">
                  {stage === 'go' || stage === 'try' ? 'Skip step' : 'Next'} <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={next} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12.5px] font-medium bg-blue-600 text-white hover:opacity-95 transition-opacity">
                  <Sparkles className="w-4 h-4" /> Finish tour
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
