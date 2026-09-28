import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Zap, Check, Timer, Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { todaysChallenge, challengeDone, challengeStreak } from '../../lib/dailyChallenge';
import { track } from '../../lib/analytics';

// Today's 5: a tiny mixed sheet on the weakest topics, once a day.
export function DailyChallengeCard({ worksheets, subjects, topicsFor, go }) {
  const ch = useMemo(() => todaysChallenge({ worksheets, subjects, topicsFor }), [worksheets, subjects, topicsFor]);
  const done = useMemo(() => (ch ? challengeDone(worksheets, ch.key) : null), [worksheets, ch]);
  const streak = useMemo(() => challengeStreak(worksheets), [worksheets]);
  if (!ch) return null;
  const start = () => {
    try {
      sessionStorage.setItem('preselect_subject', ch.subject);
      sessionStorage.setItem('preselect_challenge', JSON.stringify(ch));
    } catch (e) { /* ignore */ }
    track('challenge_started');
    go('worksheets');
  };
  return (
    <div className={`rounded-xl border p-5 ${done ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`} data-testid="daily-challenge">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow-muted mb-1 inline-flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" /> Today's 5</div>
          <div className="text-[15px] font-semibold text-slate-900">{ch.subject} · {ch.topics.join(' & ')}</div>
          <div className="text-[12.5px] text-slate-600 mt-0.5">{done ? `Done, ${done.correct}/${done.total} right. Back tomorrow with new topics.` : 'Five quick questions on what needs the most work. Takes about 5 minutes.'}</div>
        </div>
        {streak > 0 && <span className="text-[12px] font-semibold text-amber-800 bg-amber-100 px-2 py-1 rounded-md whitespace-nowrap">{streak}-day run</span>}
      </div>
      {done ? (
        <div className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-emerald-800 font-medium"><Check className="w-4 h-4" /> Completed today</div>
      ) : (
        <button onClick={start} className="btn-violet mt-3 px-4 py-2 rounded-lg text-[13px] font-semibold" data-testid="daily-challenge-start">Start today's 5</button>
      )}
    </div>
  );
}

// Pomodoro timer (25/5 by default). Sessions are logged so the
// weekly summary can show focused minutes, not just questions.
const PRESETS = [[25, 5], [45, 10], [15, 3]];
// The timer runs off a saved end time, not a per-second countdown in memory,
// so it keeps going when you leave the dashboard, switch tabs (browsers slow
// background timers down), or reload — and finishes on time either way.
const POMO_KEY = 'infinitysheets_pomodoro';
const loadPomo = () => { try { return JSON.parse(window.localStorage.getItem(POMO_KEY) || 'null'); } catch (_) { return null; } };
const savePomo = (p) => { try { window.localStorage.setItem(POMO_KEY, JSON.stringify(p)); } catch (_) { /* ignore */ } };

export function PomodoroTimer() {
  const { state, logFocusSession } = useApp();
  const saved = useRef(loadPomo()).current;
  const [preset, setPresetRaw] = useState(saved?.preset ?? 0);
  const [phase, setPhase] = useState(saved?.phase || 'focus'); // focus | break
  const lengthOf = (pr, ph) => (ph === 'focus' ? PRESETS[pr][0] : PRESETS[pr][1]) * 60;
  // Running: endsAt is set. Paused / idle: pausedLeft holds the seconds left.
  const [endsAt, setEndsAt] = useState(saved?.endsAt || null);
  const [pausedLeft, setPausedLeft] = useState(saved?.pausedLeft ?? lengthOf(saved?.preset ?? 0, saved?.phase || 'focus'));
  const [, tick] = useState(0);
  const running = !!endsAt;
  const total = lengthOf(preset, phase);
  const left = running ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : pausedLeft;

  useEffect(() => { savePomo({ preset, phase, endsAt, pausedLeft }); }, [preset, phase, endsAt, pausedLeft]);
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => tick((n) => n + 1), 500);
    const wake = () => tick((n) => n + 1);
    document.addEventListener('visibilitychange', wake);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', wake); };
  }, [running]);
  useEffect(() => {
    if (!running || left > 0) return;
    const next = phase === 'focus' ? 'break' : 'focus';
    setEndsAt(null);
    setPhase(next);
    setPausedLeft(lengthOf(preset, next));
    if (phase === 'focus') {
      logFocusSession({ minutes: PRESETS[preset][0], at: new Date().toISOString() });
      track('focus_session', { minutes: PRESETS[preset][0] });
      toast.success(`Pomodoro done, ${PRESETS[preset][0]} min logged. Take ${PRESETS[preset][1]} minutes.`);
    } else {
      toast('Break over, ready for another block?');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, running]);

  const setPreset = (i) => { setPresetRaw(i); setEndsAt(null); setPhase('focus'); setPausedLeft(lengthOf(i, 'focus')); };
  const toggle = () => {
    if (running) { setPausedLeft(left); setEndsAt(null); }
    else setEndsAt(Date.now() + left * 1000);
  };
  const reset = () => { setEndsAt(null); setPausedLeft(total); };

  const today = new Date().toDateString();
  const todayMin = (state.focusSessions || []).filter((s) => new Date(s.at).toDateString() === today).reduce((a, s) => a + s.minutes, 0);
  const mm = String(Math.floor(left / 60)).padStart(2, '0'); const ss = String(left % 60).padStart(2, '0');
  const pct = Math.round(((total - left) / total) * 100);

  return (
    <div className="rounded-xl border border-[color:var(--color-border)] p-5 bg-white" data-testid="focus-timer">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="eyebrow-muted inline-flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" /> Pomodoro timer</div>
        <div className="flex gap-1">
          {PRESETS.map(([f, b], i) => <button key={f} onClick={() => setPreset(i)} className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${preset === i ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-zinc-200 text-slate-600'}`}>{f}/{b}</button>)}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-[72px] h-[72px] shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90"><circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" /><circle cx="18" cy="18" r="15.5" fill="none" stroke={phase === 'focus' ? '#7c3aed' : '#10b981'} strokeWidth="3" strokeDasharray={`${pct} 100`} pathLength="100" strokeLinecap="round" /></svg>
          <div className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold tabular-nums text-slate-900">{mm}:{ss}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-slate-800 inline-flex items-center gap-1.5">{phase === 'focus' ? 'Focus' : <><Coffee className="w-4 h-4" /> Break</>}</div>
          <div className="text-[12px] text-slate-500">{todayMin} focused min today</div>
          <div className="flex gap-1.5 mt-2">
            <button onClick={toggle} className="btn-violet inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" data-testid="focus-toggle">{running ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> {left === total ? 'Start' : 'Resume'}</>}</button>
            <button onClick={reset} className="btn-outline-dark inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12.5px]"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}
