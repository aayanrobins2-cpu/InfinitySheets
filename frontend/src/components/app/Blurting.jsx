import React, { useMemo, useState } from 'react';
import { PenLine, Sparkles, Loader2, Check, X, RotateCcw, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { buildBlurt, isAiEnabled } from '../../lib/ai';
import { downloadNoteFile } from '../../lib/dataStore';
import { fileToParts } from '../../lib/images';
import { track } from '../../lib/analytics';

// Loose answer match: case/punctuation-insensitive, ignores articles and
// trailing plurals, accepts any listed alias.
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\s.\-]/g, ' ').replace(/\b(the|a|an)\b/g, ' ').replace(/\s+/g, ' ').trim();
function matches(given, blank) {
  const g = norm(given);
  if (!g) return false;
  const cands = [blank.answer, ...(blank.aliases || [])].map(norm).filter(Boolean);
  return cands.some((c) => c === g || c.replace(/s$/, '') === g.replace(/s$/, '') || (c.length > 6 && (g.includes(c) || c.includes(g)) && Math.abs(c.length - g.length) <= 3));
}

// Blurting: the study technique where you write out everything you know on
// a topic from memory. Here the AI turns your notes (or the syllabus) into a
// passage with the key facts blanked out; you fill the blanks, then check.
export default function Blurting({ subject, topics, board, ibLevel }) {
  const { state } = useApp();
  const aiOn = isAiEnabled(state);
  const [topic, setTopic] = useState(topics[0] || '');
  const activeTopic = topics.includes(topic) ? topic : topics[0] || '';
  const [noteId, setNoteId] = useState('');
  const [building, setBuilding] = useState(false);
  const [ex, setEx] = useState(null);       // { title, passage, blanks }
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const pdfNotes = useMemo(() => (state.notes || []).filter((n) => n.subject === subject && n.kind === 'pdf'), [state.notes, subject]);

  const build = async () => {
    if (!aiOn) { toast.error('Turn the AI on in Settings first'); return; }
    if (!activeTopic) { toast.error('Pick a topic'); return; }
    setBuilding(true);
    try {
      let files = [];
      if (noteId) {
        const n = pdfNotes.find((x) => x.id === noteId);
        if (n) {
          if ((n.size || 0) > 8 * 1024 * 1024) throw new Error('That PDF is over 8 MB — the AI can only read smaller notes. Pick another or go from the syllabus.');
          const blob = await downloadNoteFile(n.path);
          const parts = await fileToParts(blob);
          files = [{ mimeType: 'application/pdf', data: parts.data, label: `NOTES: ${n.name}` }];
        }
      }
      const result = await buildBlurt({ board, ibLevel, subject, topic: activeTopic, files });
      setEx(result); setAnswers({}); setChecked(false); setRevealed(false);
      track('blurt_built', { subject, fromNotes: !!noteId, blanks: result.blanks.length });
    } catch (e) { toast.error(e.message || 'Could not build the exercise'); }
    finally { setBuilding(false); }
  };

  const segments = useMemo(() => {
    if (!ex) return [];
    const out = [];
    const re = /\[\[(\d+)\]\]/g;
    let last = 0, m;
    while ((m = re.exec(ex.passage))) {
      if (m.index > last) out.push({ text: ex.passage.slice(last, m.index) });
      out.push({ n: parseInt(m[1], 10) });
      last = m.index + m[0].length;
    }
    if (last < ex.passage.length) out.push({ text: ex.passage.slice(last) });
    return out;
  }, [ex]);
  const blankByN = useMemo(() => new Map((ex?.blanks || []).map((b) => [b.n, b])), [ex]);
  const score = useMemo(() => {
    if (!ex) return { right: 0, total: 0 };
    const total = ex.blanks.length;
    const right = ex.blanks.filter((b) => matches(answers[b.n], b)).length;
    return { right, total };
  }, [ex, answers]);

  const check = () => {
    setChecked(true);
    track('blurt_checked', { right: score.right, total: score.total });
  };
  const retry = () => { setAnswers({}); setChecked(false); setRevealed(false); };

  return (
    <div className="max-w-[900px]" data-testid="blurt-page">
      <p className="text-[14px] text-zinc-500 mb-4">Blurting: get the notes back with the key facts missing and fill them in from memory. Use your own PDF notes as the source, or let the AI write them from the syllabus.</p>

      <div className="flex flex-wrap items-end gap-2 mb-4">
        <label className="flex flex-col gap-1 text-[11.5px] font-medium text-slate-600">Topic
          <select className="input-base !w-auto max-w-[280px]" value={activeTopic} onChange={(e) => setTopic(e.target.value)} data-testid="blurt-topic">
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11.5px] font-medium text-slate-600">Source
          <select className="input-base !w-auto max-w-[280px]" value={noteId} onChange={(e) => setNoteId(e.target.value)} data-testid="blurt-source">
            <option value="">Syllabus (AI writes the notes)</option>
            {pdfNotes.map((n) => <option key={n.id} value={n.id}>{n.name}{n.topic ? ` · ${n.topic}` : ''}</option>)}
          </select>
        </label>
        <button type="button" onClick={build} disabled={building || !aiOn} className="btn-violet inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13.5px] font-semibold disabled:opacity-60" data-testid="blurt-build">{building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {ex ? 'New passage' : 'Start blurting'}</button>
      </div>
      {pdfNotes.length === 0 && <div className="text-[12px] text-slate-500 mb-4 inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Add PDF notes in the Notes tab to blurt from your own material.</div>}

      {!ex ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] p-10 text-center bg-slate-50/50" data-testid="blurt-empty">
          <PenLine className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <div className="text-[15px] font-semibold text-slate-800">Nothing to fill in yet</div>
          <div className="text-[13px] text-slate-500 mt-1">{aiOn ? 'Pick a topic and a source, then start.' : 'Turn the AI on in Settings to build a passage.'}</div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-5 shadow-sm" data-testid="blurt-passage">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="text-[17px] font-semibold text-slate-900">{ex.title}</div>
            <div className="text-[12.5px] text-slate-500">{ex.blanks.length} blanks{checked ? ` · ${score.right}/${score.total} right` : ''}</div>
          </div>
          <div className="text-[15px] leading-[2.1] text-slate-800 whitespace-pre-wrap">
            {segments.map((seg, i) => {
              if (seg.text !== undefined) return <span key={i}>{seg.text}</span>;
              const b = blankByN.get(seg.n);
              if (!b) return <span key={i}>____</span>;
              const val = answers[seg.n] || '';
              const ok = checked && matches(val, b);
              const bad = checked && !ok;
              return (
                <span key={i} className="inline-flex items-center align-baseline mx-0.5">
                  <input
                    type="text"
                    value={val}
                    disabled={checked}
                    onChange={(e) => setAnswers((a) => ({ ...a, [seg.n]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const inputs = Array.from(e.currentTarget.form?.querySelectorAll('input[data-blank]') || document.querySelectorAll('input[data-blank]')); const idx = inputs.indexOf(e.currentTarget); (inputs[idx + 1] || inputs[0])?.focus(); } }}
                    data-blank={seg.n}
                    data-testid={`blurt-blank-${seg.n}`}
                    placeholder={`${seg.n}`}
                    style={{ width: `${Math.max(6, Math.min(28, (b.answer.length || 6) + 2))}ch` }}
                    className={`px-1.5 py-0 h-7 rounded-md border-b-2 bg-transparent text-[14px] font-medium outline-none text-center leading-none ${ok ? 'border-emerald-500 text-emerald-800 bg-emerald-50' : bad ? 'border-rose-400 text-rose-800 bg-rose-50 line-through decoration-rose-400' : 'border-violet-300 focus:border-violet-600 bg-violet-50/40'}`}
                  />
                  {bad && revealed && <span className="ml-1 text-[13px] font-semibold text-emerald-700" data-testid="blurt-reveal">{b.answer}</span>}
                </span>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-5">
            {!checked ? (
              <button type="button" onClick={check} className="btn-violet inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13.5px] font-semibold" data-testid="blurt-check"><Check className="w-4 h-4" /> Check my answers</button>
            ) : (
              <>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold ${score.right === score.total ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`} data-testid="blurt-score">
                  {score.right === score.total ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} {score.right} of {score.total} from memory
                </div>
                {score.right < score.total && !revealed && <button type="button" onClick={() => setRevealed(true)} className="btn-outline-dark inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px]" data-testid="blurt-show"><Eye className="w-4 h-4" /> Show the ones I missed</button>}
                <button type="button" onClick={retry} className="btn-outline-dark inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px]" data-testid="blurt-retry"><RotateCcw className="w-4 h-4" /> Blurt it again</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
