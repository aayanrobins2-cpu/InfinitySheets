import React, { useState } from 'react';
import { School, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { redeemSchoolCode } from '../../lib/dataStore';
import { confirmDelete } from '../../lib/confirm';

// "Use a School Code": a school hands its students a code; entering it links
// the account to that school so InfinitySheets (and every assistant) can
// tailor things to it. Free for everyone — it doesn't use the AI.
export default function SchoolCodeCard({ className = '' }) {
  const { state, updateSettings } = useApp();
  const school = state.settings?.school || null;
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const redeem = async (e) => {
    e?.preventDefault();
    const c = code.trim();
    if (!c) return;
    setBusy(true);
    try {
      const found = await redeemSchoolCode(c);
      if (!found) { toast.error('That school code wasn’t recognised. Check it with your school.'); return; }
      updateSettings({ school: { code: found.code, name: found.name, board: found.board || null, notes: found.notes || null, at: new Date().toISOString() } });
      toast.success(`Linked to ${found.name}`);
      setOpen(false); setCode('');
    } catch (err) {
      toast.error(err.message || 'Could not check the code right now.');
    } finally { setBusy(false); }
  };

  if (school) {
    return (
      <div className={`rounded-xl border border-emerald-300/60 bg-emerald-50/40 px-4 py-3 ${className}`} data-testid="school-linked">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold text-emerald-800 inline-flex items-center gap-1.5"><School className="w-4 h-4" /> {school.name}</div>
            <div className="text-[11.5px] text-slate-500 mt-0.5">School code {school.code} · tailored to your school.</div>
          </div>
          <button type="button" onClick={() => { if (confirmDelete('the link to your school')) { updateSettings({ school: null }); toast.success('School code removed'); } }} className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0" aria-label="Remove school code"><X className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-3 ${className}`} data-testid="school-code">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="w-full text-left" data-testid="school-code-open">
          <div className="text-[13.5px] font-semibold text-slate-900 inline-flex items-center gap-1.5"><School className="w-4 h-4 text-blue-600" /> Use a School Code</div>
          <div className="text-[11.5px] text-slate-500 mt-0.5">Got a code from your school? Enter it for information tailored to your school. Free.</div>
        </button>
      ) : (
        <form onSubmit={redeem} className="flex flex-col gap-2">
          <label className="text-[12.5px] font-semibold text-slate-900 inline-flex items-center gap-1.5" htmlFor="school-code-input"><School className="w-4 h-4 text-blue-600" /> School code</label>
          <div className="flex gap-1.5">
            <input id="school-code-input" autoFocus value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24))} placeholder="e.g. GREENFIELD-26" className="input-base flex-1 text-[13px] tracking-wide" data-testid="school-code-input" />
            <button type="submit" disabled={busy || !code.trim()} className="btn-violet px-3 rounded-lg disabled:opacity-40 inline-flex items-center" aria-label="Use code" data-testid="school-code-submit">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}</button>
          </div>
          <button type="button" onClick={() => { setOpen(false); setCode(''); }} className="text-[11.5px] text-slate-500 hover:text-slate-800 self-start">Cancel</button>
        </form>
      )}
    </div>
  );
}
