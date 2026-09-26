import React from 'react';
import { PlayCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { confirmDelete } from '../../lib/confirm';
import { fmtDateTime } from '../../lib/dates';

// Every unfinished worksheet, newest first, each with Continue / Discard.
export default function UnfinishedWorksheets({ go, className = '', testid = 'continue-worksheet' }) {
  const { state, clearDraftWorksheet } = useApp();
  const drafts = (state.draftWorksheets || []).filter((d) => (d.questions || []).length);
  if (!drafts.length) return null;
  const resume = (id) => {
    try { window.sessionStorage.setItem('resume_ws_draft', id); } catch (_) { /* ignore */ }
    if (go) go('worksheets'); else window.location.hash = '#worksheets';
  };
  return (
    <div className={`flex flex-col gap-2.5 ${className}`} data-testid={testid}>
      {drafts.length > 1 && <div className="text-[10px] tracking-[0.14em] uppercase font-semibold text-amber-700">{drafts.length} unfinished worksheets</div>}
      {drafts.map((d) => (
        <div key={d.id} className="rounded-xl border border-amber-300 bg-amber-50 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4" data-testid={`draft-${d.id}`}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><PlayCircle className="w-6 h-6" /></span>
            <div className="min-w-0">
              {drafts.length === 1 && <div className="text-[10px] tracking-[0.14em] uppercase font-semibold text-amber-700">Unfinished worksheet</div>}
              <div className="text-[15px] font-semibold text-slate-900 truncate">{d.subject}{d.topics && d.topics.length ? ` · ${d.topics.join(', ')}` : ''}</div>
              <div className="text-[12px] text-slate-500 mt-0.5">
                {d.answered || 0} of {d.total || (d.questions || []).length} answered
                {typeof d.timeLeft === 'number' ? ` · ${Math.max(0, Math.round(d.timeLeft / 60))} min left` : ''}
                {d.savedAt ? ` · saved ${fmtDateTime(d.savedAt)}` : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => { if (confirmDelete('this unfinished worksheet')) clearDraftWorksheet(d.id); }} className="px-3.5 py-2 rounded-lg text-[13px] font-medium border border-[color:var(--color-border)] bg-white hover:bg-slate-100 text-slate-700 transition-colors" data-testid={`draft-discard-${d.id}`}>Discard</button>
            <button type="button" onClick={() => resume(d.id)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-amber-600 hover:opacity-95 transition-opacity" data-testid={`draft-resume-${d.id}`}><PlayCircle className="w-5 h-5" /> Continue</button>
          </div>
        </div>
      ))}
    </div>
  );
}
