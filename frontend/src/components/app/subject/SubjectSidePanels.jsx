import React, { useEffect, useMemo, useState } from 'react';
import { FileText, ExternalLink, Search, ListTree } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { syllabusLink } from '../../../data/syllabus';
import { boardName, topicGroups } from '../../../lib/subjects';
import { papersFor } from '../../../lib/paperTypes';
import { askAi, isAiEnabled } from '../../../lib/ai';
import { presetFor, presetMarks, examFormatText } from '../../../lib/examPresets';

/**
 * Right-hand sidebar on the SubjectOverview page.
 *   1. Syllabus — the official syllabus for this subject on this board.
 *   2. Syllabus overview — what the syllabus covers (its chapters and how
 *      many topics each holds) and how the subject is examined (its papers),
 *      all taken from the board's own syllabus data, never invented.
 */
export default function SubjectSidePanels({ subject, board, ibLevel }) {
  const { state } = useApp();
  const syl = syllabusLink(board, subject);
  const groups = useMemo(() => topicGroups(state.syllabusTopics, board, subject), [state.syllabusTopics, board, subject]);
  const papers = useMemo(() => papersFor(board, subject), [board, subject]);
  const topicCount = groups.reduce((n, g) => n + g.units.length, 0);
  // A single "All topics" group means the syllabus has no chapter structure:
  // show its topics instead of one chapter called "All topics".
  const flat = groups.length === 1;

  return (
    <div className="flex flex-col gap-4" data-testid="subject-side-panels">
      <div className="card-soft p-6" data-testid="subject-syllabus-link">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </span>
          <h3 className="text-[15px] font-semibold text-slate-900">Syllabus</h3>
        </div>
        <div className="text-[13.5px] font-medium text-slate-900">
          {subject}{board ? ` · ${boardName(board)}` : ''}{ibLevel ? ` ${ibLevel}` : ''}
        </div>
        <p className="text-[12.5px] text-slate-500 mt-1 leading-relaxed">
          {syl.exact
            ? 'The official subject page — the full syllabus, how it is assessed, and specimen papers.'
            : `${syl.boardName}. The board publishes each subject’s syllabus from this page.`}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <a href={syl.url} target="_blank" rel="noopener noreferrer" className="btn-violet inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold" data-testid="subject-syllabus-open">
            Open syllabus <ExternalLink className="w-4 h-4" />
          </a>
          {!syl.exact && (
            <a href={syl.searchUrl} target="_blank" rel="noopener noreferrer" className="btn-outline-dark inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium" title="Search the board's site for this subject">
              <Search className="w-4 h-4" /> Find {subject}
            </a>
          )}
        </div>
      </div>

      <div className="card-soft p-6" data-testid="subject-syllabus-overview">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <ListTree className="w-5 h-5" />
          </span>
          <h3 className="text-[15px] font-semibold text-slate-900">Syllabus overview</h3>
        </div>

        {topicCount === 0 ? (
          <p className="text-[13px] text-slate-500">This syllabus hasn’t been added yet — open the official syllabus above for the full content.</p>
        ) : (
          <>
            <p className="text-[12.5px] text-slate-500 mb-3">
              {topicCount} topic{topicCount === 1 ? '' : 's'}{flat ? '' : ` across ${groups.length} chapter${groups.length === 1 ? '' : 's'}`}.
            </p>
            <ul className="flex flex-col gap-1.5">
              {(flat ? groups[0].units.map((u) => ({ chapter: u, units: null })) : groups).slice(0, 12).map((g) => (
                <li key={g.chapter} className="text-[13.5px] text-slate-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                  <span className="min-w-0 flex-1">{g.chapter}</span>
                  {g.units && <span className="text-[11.5px] text-slate-400 tabular-nums shrink-0 mt-0.5">{g.units.length}</span>}
                </li>
              ))}
            </ul>
            {(flat ? groups[0].units.length : groups.length) > 12 && (
              <div className="text-[12px] text-slate-400 mt-2">+ {(flat ? groups[0].units.length : groups.length) - 12} more — all are in the topic list.</div>
            )}
          </>
        )}

        {papers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[color:var(--color-border)]">
            <div className="text-[10.5px] tracking-[0.14em] uppercase font-semibold text-slate-500 mb-2">How it’s examined</div>
            <ExamFormat subject={subject} board={board} ibLevel={ibLevel} papers={papers} />
          </div>
        )}
      </div>
    </div>
  );
}

// "How it's examined", in detail: for each paper, its length, marks and share
// of the grade, the kinds of questions it asks and what examiners reward.
// Written once by the AI per board + subject and cached on this device; the
// short paper list shows while it loads, and stays if AI is off.
function ExamFormat({ subject, board, ibLevel, papers }) {
  const { state } = useApp();
  const key = `exam_format:v2:${board}:${subject}:${ibLevel || ''}`;
  const preset = presetFor(board);
  const [detail, setDetail] = useState(() => { try { return JSON.parse(window.localStorage.getItem(key) || 'null'); } catch (_) { return null; } });
  const [loading, setLoading] = useState(false);
  const aiOn = isAiEnabled(state);

  useEffect(() => {
    if (detail || !aiOn) return undefined;
    let alive = true;
    setLoading(true);
    const content = [
      `Explain how ${subject} (${boardName(board)}${ibLevel ? ` ${ibLevel}` : ''}) is examined, for a student preparing for it.`,
      `Its papers/sections are: ${papers.map((p) => `${p.label} (${p.hint})`).join('; ')}.`,
      `InfinitySheets' model of the paper (use it as a starting point, correct it where the official specification differs): ${examFormatText(board)}.`,
      'For EACH paper give: duration, total marks, % of the final grade, the question types and how many, what the questions test, and one tip on what examiners reward. Only state facts you are confident are in the current official specification; say "varies" rather than guess.',
      'Then give 2-3 overall points (e.g. calculators, command words, how grades are set).',
      'Reply with JSON only: {"papers": [{"label": string, "facts": [short strings like "2 hr 15 min", "80 marks", "50% of grade"], "about": "2-3 sentences", "tip": "1 sentence"}], "overall": [strings]}',
    ].join('\n');
    askAi({ mode: 'examformat', context: { board, subject, ibLevel }, messages: [{ role: 'user', content }] })
      .then((text) => {
        const m = /\{[\s\S]*\}/.exec(text || '');
        const parsed = m ? JSON.parse(m[0]) : null;
        if (!alive || !Array.isArray(parsed?.papers)) return;
        setDetail(parsed);
        try { window.localStorage.setItem(key, JSON.stringify(parsed)); } catch (_) { /* ignore */ }
      })
      .catch(() => { /* keep the short list */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [key, detail, aiOn]); // eslint-disable-line react-hooks/exhaustive-deps

  // The paper's shape, always shown (no AI needed): sections, counts, marks, time.
  const formatBlock = preset && (
    <div className="rounded-xl bg-slate-50 border border-[color:var(--color-border)] p-3.5 mb-3" data-testid="exam-format-structure">
      <div className="text-[12.5px] font-semibold text-slate-900">{preset.name}</div>
      <div className="text-[11.5px] text-slate-500 mt-0.5">{preset.minutes} min · {presetMarks(preset)} marks</div>
      <ul className="mt-2 flex flex-col gap-1">
        {preset.sections.map((s) => (
          <li key={s.name} className="text-[12px] text-slate-700 flex items-baseline justify-between gap-3">
            <span>{s.name}</span>
            <span className="text-slate-500 tabular-nums shrink-0">{s.count} × {s.marksEach} mark{s.marksEach === 1 ? '' : 's'}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  if (!detail) {
    return (
      <>
        {formatBlock}
        <ul className="flex flex-col gap-1.5">
          {papers.map((p) => (
            <li key={p.id} className="text-[13px] text-slate-700 flex items-baseline gap-2">
              <span className="font-semibold text-slate-900 shrink-0">{p.label}</span>
              <span className="text-slate-500 text-[12.5px]">{p.hint}</span>
            </li>
          ))}
        </ul>
        {loading && <div className="text-[12px] text-slate-400 mt-2">Getting the full exam breakdown…</div>}
      </>
    );
  }
  return (
    <div className="flex flex-col gap-3" data-testid="exam-format-detail">
      {formatBlock}
      {detail.papers.map((p, i) => (
        <div key={`${p.label}-${i}`} className="rounded-xl border border-[color:var(--color-border)] p-3.5">
          <div className="text-[13.5px] font-semibold text-slate-900">{p.label}</div>
          {Array.isArray(p.facts) && p.facts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {p.facts.map((f) => <span key={f} className="text-[11.5px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">{f}</span>)}
            </div>
          )}
          {p.about && <p className="text-[12.5px] text-slate-600 mt-2 leading-relaxed">{p.about}</p>}
          {p.tip && <p className="text-[12.5px] text-slate-700 mt-1.5 leading-relaxed"><span className="font-semibold">Tip:</span> {p.tip}</p>}
        </div>
      ))}
      {Array.isArray(detail.overall) && detail.overall.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {detail.overall.map((o) => (
            <li key={o} className="text-[12.5px] text-slate-600 flex items-start gap-2 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-[7px]" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="text-[11px] text-slate-400">AI summary — check the official syllabus above for the final word.</div>
    </div>
  );
}
