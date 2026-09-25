import React, { useMemo } from 'react';
import { FileText, ExternalLink, Search, ListTree } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { syllabusLink } from '../../../data/syllabus';
import { boardName, topicGroups } from '../../../lib/subjects';
import { papersFor } from '../../../lib/paperTypes';

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
            <ul className="flex flex-col gap-1.5">
              {papers.map((p) => (
                <li key={p.id} className="text-[13px] text-slate-700 flex items-baseline gap-2">
                  <span className="font-semibold text-slate-900 shrink-0">{p.label}</span>
                  <span className="text-slate-500 text-[12.5px]">{p.hint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
