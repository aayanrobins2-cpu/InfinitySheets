import React, { useMemo, useState } from 'react';
import { CalendarClock, Pencil } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { boardName } from '../../lib/subjects';
import { fmtDate, WEEKDAYS, mondayIndex } from '../../lib/dates';

// Every exam the student has registered, across all courses, in date order.
// Opened from the dashboard's "Days until exam" tile and "Upcoming exams".
function allExams(courses) {
  const out = [];
  (courses || []).forEach((c) => (Array.isArray(c.subjects) ? c.subjects : []).forEach((e) => {
    const entry = typeof e === 'string' ? { subject: e } : e;
    const list = Array.isArray(entry.exams) && entry.exams.length ? entry.exams : (entry.examDate ? [{ name: 'Exam', date: entry.examDate }] : []);
    list.forEach((x) => {
      if (!x?.date) return;
      out.push({ subject: entry.subject, level: entry.ibLevel || null, name: x.name || 'Exam', date: x.date, board: c.exam || c.track || c.board || '', course: c.name || '', status: c.status || 'Active' });
    });
  }));
  return out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

const daysUntil = (iso) => Math.ceil((new Date(`${iso}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
const monthLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

export default function ExamTimetable({ go }) {
  const { state } = useApp();
  const exams = useMemo(() => allExams(state.courses), [state.courses]);
  const [showPast, setShowPast] = useState(false);
  const upcoming = exams.filter((x) => daysUntil(x.date) >= 0);
  const past = exams.filter((x) => daysUntil(x.date) < 0).reverse();

  const byMonth = (list) => list.reduce((acc, x) => {
    const m = monthLabel(x.date);
    (acc[m] = acc[m] || []).push(x);
    return acc;
  }, {});

  const openEdit = () => { try { window.sessionStorage.setItem('open_exam_dates', '1'); } catch (_) { /* ignore */ } go('settings'); };

  return (
    <div className="max-w-[900px]" data-testid="exam-timetable">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-[14px] text-slate-500">Every exam you've added, soonest first.</p>
        <button type="button" onClick={openEdit} className="btn-outline-dark inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium" data-testid="exam-timetable-edit">
          <Pencil className="w-4 h-4" /> Add or edit exam dates
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] bg-white p-10 text-center">
          <CalendarClock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <div className="text-[15px] font-medium text-slate-700">No exam dates yet</div>
          <button type="button" onClick={openEdit} className="mt-2 text-[13px] text-blue-700 hover:underline">Add your exam dates →</button>
        </div>
      ) : (
        <>
          {upcoming.length === 0 && <div className="text-[13px] text-slate-500 mb-4">No upcoming exams, they're all behind you.</div>}
          {Object.entries(byMonth(upcoming)).map(([month, list]) => (
            <section key={month} className="mb-6">
              <h2 className="text-[11px] tracking-[0.14em] uppercase font-semibold text-slate-500 mb-2">{month}</h2>
              <div className="rounded-2xl border border-[color:var(--color-border)] bg-white overflow-hidden">
                {list.map((x, i) => <ExamRow key={`${x.subject}-${x.name}-${x.date}-${i}`} x={x} first={i === 0} />)}
              </div>
            </section>
          ))}
          {past.length > 0 && (
            <div className="mt-2">
              <button type="button" onClick={() => setShowPast((v) => !v)} className="text-[12.5px] text-slate-500 hover:text-slate-800">
                {showPast ? 'Hide' : 'Show'} {past.length} past exam{past.length === 1 ? '' : 's'}
              </button>
              {showPast && (
                <div className="mt-3 rounded-2xl border border-[color:var(--color-border)] bg-white overflow-hidden opacity-70">
                  {past.map((x, i) => <ExamRow key={`p-${x.subject}-${x.name}-${x.date}-${i}`} x={x} first={i === 0} past />)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExamRow({ x, first, past = false }) {
  const d = daysUntil(x.date);
  const soon = !past && d <= 7;
  return (
    <div className={`flex items-center gap-4 px-4 py-3 ${first ? '' : 'border-t border-[color:var(--color-border)]'}`} data-testid="exam-row">
      <div className="w-14 text-center shrink-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">{WEEKDAYS[mondayIndex(x.date)].slice(0, 3)}</div>
        <div className="text-[20px] font-semibold text-slate-900 tabular-nums leading-tight">{x.date.slice(8, 10)}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-slate-900 truncate">{x.subject}{x.level ? ` ${x.level}` : ''} <span className="font-normal text-slate-500">· {x.name}</span></div>
        <div className="text-[12px] text-slate-500 truncate">
          {fmtDate(x.date)}{x.board ? ` · ${boardName(x.board)}` : ''}{x.status !== 'Active' ? ` · ${x.status}` : ''}
        </div>
      </div>
      <div className="text-right shrink-0">
        {past ? (
          <div className="text-[12px] text-slate-500">Done</div>
        ) : (
          <>
            <div className={`text-[18px] font-semibold tabular-nums ${soon ? 'text-rose-600' : 'text-slate-900'}`}>{d === 0 ? 'Today' : d}</div>
            {d !== 0 && <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{d === 1 ? 'day' : 'days'}</div>}
          </>
        )}
      </div>
    </div>
  );
}
