import React, { useMemo, useState } from 'react';
import { CalendarDays, Loader2, RefreshCw, Check, Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { buildStudyPlan, tweakStudyPlan, isAiEnabled } from '../../lib/ai';
import { enrolledSubjects, primaryTrack, subjectBoards, activeSubjectsOnly } from '../../lib/subjects';
import { track } from '../../lib/analytics';
import { fmtDate, isoDay, startOfWeek, WEEKDAYS } from '../../lib/dates';

// AI study plan for the week: weakest topics first, spaced reviews later,
// tasks tick off and persist with the student's settings.
export default function StudyPlan({ weaknesses = [], go }) {
  const { state, setStudyPlan, togglePlanTask } = useApp();
  const [busy, setBusy] = useState(false);
  const plan = state.studyPlan;
  const aiOn = isAiEnabled(state);
  // Only subjects in active courses — on-hold and completed ones are left out of the plan.
  const subjects = useMemo(() => activeSubjectsOnly(enrolledSubjects(state.courses, state.user?.subjects, state.user?.examTrack), state.courses), [state.courses, state.user?.subjects, state.user?.examTrack]);
  const daysToExam = state.settings?.examDate ? Math.ceil((new Date(state.settings.examDate).getTime() - Date.now()) / 86400000) : null;
  const stale = plan?.createdAt && Date.now() - new Date(plan.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000;

  // Every exam the student registered, across all courses (each subject may
  // have several: Paper 1, Paper 2, a mock).
  const allExams = () => {
    const exams = [];
    (state.courses || []).filter((c) => (c.status || 'Active') === 'Active').forEach((c) => (Array.isArray(c.subjects) ? c.subjects : []).forEach((e) => {
      const entry = typeof e === 'string' ? { subject: e } : e;
      const list = Array.isArray(entry.exams) && entry.exams.length ? entry.exams : (entry.examDate ? [{ name: 'Exam', date: entry.examDate }] : []);
      list.forEach((x) => { if (x.date) exams.push({ subject: entry.subject, name: x.name || 'Exam', date: x.date }); });
    }));
    return exams;
  };

  // "Tweak it further": a small chat that rewrites the plan on request.
  const [tweak, setTweak] = useState('');
  const [tweaking, setTweaking] = useState(false);
  const [chat, setChat] = useState([]); // [{ role, content }]
  const sendTweak = async () => {
    const instruction = tweak.trim();
    if (!instruction || !plan || tweaking) return;
    setTweaking(true);
    setChat((c) => [...c, { role: 'user', content: instruction }]);
    setTweak('');
    try {
      const p = await tweakStudyPlan({
        plan, instruction, history: chat.slice(-6),
        board: primaryTrack(state.courses, state.user?.examTrack),
        boards: subjectBoards(state.courses, primaryTrack(state.courses, state.user?.examTrack)),
        exams: allExams(), subjects, startDate: new Date().toISOString().slice(0, 10),
      });
      setStudyPlan({ summary: p.summary, days: p.days, createdAt: plan.createdAt || new Date().toISOString(), tweakedAt: new Date().toISOString() });
      setChat((c) => [...c, { role: 'assistant', content: p.reply }]);
      track('study_plan_tweaked');
    } catch (e) {
      setChat((c) => [...c, { role: 'assistant', content: `Sorry, ${e.message || 'could not change the plan'}.` }]);
    } finally { setTweaking(false); }
  };

  const generate = async () => {
    setBusy(true);
    try {
      const weak = [...weaknesses].sort((a, b) => a.acc - b.acc).slice(0, 6).map((t) => ({ subject: t.subject, topic: t.topic, accuracy: t.acc }));
      const exams = allExams();
      const p = await buildStudyPlan({
        board: primaryTrack(state.courses, state.user?.examTrack),
        boards: subjectBoards(state.courses, primaryTrack(state.courses, state.user?.examTrack)),
        examDate: state.settings?.examDate,
        exams,
        frequency: state.settings?.frequency,
        weeklyGoal: state.settings?.weeklyGoal,
        weakTopics: weak,
        subjects,
        startDate: new Date().toISOString().slice(0, 10),
      });
      setStudyPlan({ ...p, createdAt: new Date().toISOString() });
      setChat([]);
      track('study_plan_generated', { tasks: p.days.reduce((s, d) => s + d.tasks.length, 0) });
      toast.success('Your plan for the week is ready');
    } catch (e) { toast.error(e.message || 'Could not build a plan'); }
    finally { setBusy(false); }
  };

  // Lay the plan onto real Monday-first weeks. Days the AI dated are placed by
  // date; undated ones by their weekday name, from the plan's first week.
  const planWeeks = useMemo(() => {
    if (!plan?.days?.length) return [];
    const byIso = {};
    const firstDated = plan.days.find((d) => d.date)?.date;
    const base = startOfWeek(firstDated || plan.createdAt || new Date());
    plan.days.forEach((d, di) => {
      let iso = d.date ? isoDay(d.date) : null;
      if (!iso) {
        const w = WEEKDAYS.findIndex((n) => String(d.day || '').toLowerCase().startsWith(n.slice(0, 3).toLowerCase()));
        if (w >= 0) { const x = new Date(base); x.setDate(x.getDate() + w); iso = isoDay(x); }
      }
      if (iso && byIso[iso] === undefined) byIso[iso] = di;
    });
    const isos = Object.keys(byIso).sort();
    if (!isos.length) return [];
    const todayIso = isoDay(new Date());
    const weeks = [];
    for (let wk = startOfWeek(isos[0]); isoDay(wk) <= isos[isos.length - 1]; wk.setDate(wk.getDate() + 7)) {
      weeks.push(WEEKDAYS.map((name, n) => {
        const x = new Date(wk); x.setDate(x.getDate() + n);
        const iso = isoDay(x);
        return { name, iso, di: byIso[iso] ?? null, today: iso === todayIso };
      }));
    }
    return weeks;
  }, [plan]);

  const done = plan ? plan.days.reduce((s, d) => s + d.tasks.filter((t) => t.done).length, 0) : 0;
  const total = plan ? plan.days.reduce((s, d) => s + d.tasks.length, 0) : 0;

  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-5" data-testid="study-plan">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="eyebrow-muted mb-0.5">This week's plan</div>
          <div className="text-[15px] font-semibold text-slate-900 inline-flex items-center gap-2"><CalendarDays className="w-4 h-4 text-violet-600" /> {plan ? `${done}/${total} tasks done` : 'Let the AI plan your week'}</div>
          {plan?.summary && <div className="text-[12.5px] text-slate-600 mt-1">{plan.summary}</div>}
          {daysToExam != null && daysToExam >= 0 && <div className="text-[12px] text-violet-700 mt-1">{daysToExam} day{daysToExam === 1 ? '' : 's'} to your exam, the plan works back from that date.</div>}
          {stale && <div className="text-[11.5px] text-amber-700 mt-1">This plan is over a week old, regenerate it for the coming week.</div>}
        </div>
        {aiOn ? (
          <button onClick={generate} disabled={busy} className={`${plan ? 'btn-outline-dark' : 'btn-violet'} inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium disabled:opacity-60`} data-testid="study-plan-generate">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {plan ? 'Regenerate' : 'Build my plan'}
          </button>
        ) : <div className="text-[12px] text-slate-500">Turn on the AI in Settings to build a plan.</div>}
      </div>
      {plan && (
        <>
        {/* A fixed Monday-to-Sunday week: every day has its column, with its
            date, whether or not the plan put anything on it. */}
        <div className="overflow-x-auto -mx-1 px-1 pb-1">
          {planWeeks.map((week) => (
            <div key={week[0].iso} className="grid grid-cols-7 gap-2 min-w-[840px] mb-2" data-testid="plan-week">
              {week.map((cell) => (
                <div key={cell.iso} className={`rounded-xl border p-2.5 min-h-[120px] ${cell.di === null ? 'border-dashed border-[color:var(--color-border)] opacity-70' : 'border-[color:var(--color-border)] bg-slate-50/60'} ${cell.today ? 'ring-2 ring-violet-400/60' : ''}`}>
                  <div className="text-[12px] font-semibold text-slate-800">{cell.name}</div>
                  <div className="text-[11px] text-slate-500 mb-1.5 tabular-nums">{fmtDate(cell.iso)}</div>
                  {cell.di === null || !plan.days[cell.di].tasks.length ? (
                    <div className="text-[11px] text-slate-400">{cell.di === null ? '-' : 'Rest'}</div>
                  ) : (
                    <ul className="space-y-1.5">
                      {plan.days[cell.di].tasks.map((t, ti) => {
                        const di = cell.di;
                        return (
                          <li key={ti} className="flex items-start gap-1.5">
                            <button type="button" onClick={() => togglePlanTask(di, ti)} className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${t.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`} data-testid={`plan-task-${di}-${ti}`}>{t.done && <Check className="w-3 h-3" />}</button>
                            <button type="button" onClick={() => { try { window.sessionStorage.setItem('preselect_subject', t.subject); window.sessionStorage.setItem('preselect_topic', t.topic); } catch (e) { /* ignore */ } go('worksheets'); }} className={`text-left text-[11.5px] leading-snug min-w-0 ${t.done ? 'line-through text-slate-400' : 'text-slate-700 hover:text-violet-800'}`}>
                              <span className="font-medium">{t.topic}</span>
                              <span className="block text-slate-500">{t.subject} · {t.minutes} min</span>
                              <span className="block text-slate-500 mt-0.5">{t.what}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        {aiOn && (
          <aside className="mt-5 pt-5 border-t border-[color:var(--color-border)] flex flex-col gap-2 max-w-[640px]" data-testid="plan-tweak">
            <div className="text-[12.5px] font-semibold text-violet-900 inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-violet-600" /> Tweak it further</div>
            <div className="text-[11.5px] text-slate-600">Tell the AI how to change the timetable, e.g. “only my midterm topics”, “nothing on Sundays”, “more chemistry, shorter sessions”.</div>
            {chat.length > 0 && (
              <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-0.5" data-testid="plan-tweak-chat">
                {chat.map((m, i) => (
                  <div key={i} className={`text-[12px] leading-snug rounded-lg px-2.5 py-1.5 ${m.role === 'user' ? 'bg-white border border-[color:var(--color-border)] text-slate-800 self-end' : 'bg-violet-100/70 text-violet-900 self-start'}`}>{m.content}</div>
                ))}
                {tweaking && <div className="text-[12px] text-violet-700 inline-flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Rewriting the plan…</div>}
              </div>
            )}
            <div className="flex gap-1.5">
              <input value={tweak} onChange={(e) => setTweak(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendTweak(); } }} placeholder="Change the plan…" className="input-base flex-1 text-[12.5px]" disabled={tweaking} data-testid="plan-tweak-input" />
              <button type="button" onClick={sendTweak} disabled={tweaking || !tweak.trim()} className="btn-violet px-3 rounded-lg disabled:opacity-40" aria-label="Send" data-testid="plan-tweak-send"><Send className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-1">
              {['Only my midterm topics', 'Nothing on weekends', 'Shorter sessions', 'Focus on my weakest subject'].map((q) => (
                <button key={q} type="button" onClick={() => setTweak(q)} className="text-[11px] rounded-full border border-violet-200 bg-white px-2 py-0.5 text-violet-800 hover:bg-violet-100">{q}</button>
              ))}
            </div>
          </aside>
        )}
        </>
      )}
    </div>
  );
}
