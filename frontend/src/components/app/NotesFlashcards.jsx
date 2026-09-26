import React, { useMemo, useState } from 'react';
import { Layers, FileText, PenLine } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { enrolledSubjects, boardFor, resolvedTopics, subjectBoards, primaryTrack } from '../../lib/subjects';
import Flashcards from './Flashcards';
import Notes from './Notes';
import Blurting from './Blurting';

const TABS = [
  { key: 'notes', label: 'Notes', Icon: FileText },
  { key: 'flashcards', label: 'Flashcards', Icon: Layers },
  { key: 'blurting', label: 'Blurting', Icon: PenLine },
];

// Notes & Flashcards: one subject picker, three ways to revise it — your own
// PDF/audio notes, concept flashcards, and blurting (fill-the-blanks recall).
export default function NotesFlashcards({ go }) {
  const { state } = useApp();
  const subjects = useMemo(() => enrolledSubjects(state.courses, state.user?.subjects, state.user?.examTrack), [state.courses, state.user?.subjects, state.user?.examTrack]);
  const [subject, setSubject] = useState(subjects[0] || '');
  const activeSubject = subjects.includes(subject) ? subject : subjects[0] || '';
  const board = boardFor(activeSubject, state.courses, state.user?.examTrack);
  const ibLevel = board === 'IB' ? subjectBoards(state.courses, primaryTrack(state.courses, state.user?.examTrack))[activeSubject]?.ibLevel || null : null;
  const topics = useMemo(() => resolvedTopics(state.syllabusTopics, board, activeSubject), [state.syllabusTopics, board, activeSubject]);
  const [tab, setTab] = useState(() => { try { return sessionStorage.getItem('nf_tab') || 'flashcards'; } catch (_) { return 'flashcards'; } });
  const pick = (k) => { setTab(k); try { sessionStorage.setItem('nf_tab', k); } catch (_) { /* ignore */ } };

  if (!subjects.length) return <Flashcards go={go} />;

  return (
    <div className="max-w-[900px]" data-testid="notes-flashcards">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {subjects.map((s) => (
          <button key={s} type="button" onClick={() => setSubject(s)} data-testid={`fc-subject-${s.replace(/\s+/g, '-')}`} className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium border transition-colors ${activeSubject === s ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-zinc-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{s}</button>
        ))}
        <span className="text-[12px] text-slate-500 ml-auto">{board}{ibLevel ? ` · ${ibLevel}` : ''}</span>
      </div>
      <div className="inline-flex rounded-full border border-[color:var(--color-border)] bg-white p-1 mb-5" style={{ borderRadius: 9999 }} role="tablist" data-testid="nf-tabs">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => pick(key)} data-testid={`nf-tab-${key}`} className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${tab === key ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
      {tab === 'notes' && <Notes key={activeSubject} subject={activeSubject} topics={topics} board={board} />}
      {tab === 'flashcards' && <Flashcards key={activeSubject} go={go} subject={activeSubject} />}
      {tab === 'blurting' && <Blurting key={activeSubject} subject={activeSubject} topics={topics} board={board} ibLevel={ibLevel} />}
    </div>
  );
}
