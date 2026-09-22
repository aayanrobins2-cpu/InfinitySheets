import { primaryTrack, topicsFor, rankByPopularity, resolvedTopics } from '../../lib/subjects';
import { papersFor } from '../../lib/paperTypes';
import { findDuplicates } from '../../lib/duplicates';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Plus, Trash2, FileText, Sparkles, Filter, Upload, Link2, X, Loader2, Check, FlaskConical, ClipboardCheck, PenTool, Copy, Layers, Pencil, ImagePlus, Save } from 'lucide-react';
import { SUBJECTS, EXAM_TRACKS } from '../../data/mock';
import { subjectDemand, formatDemand } from '../../data/subjectDemand';
import { FULL_PAPER_TYPE } from '../../data/pastPapers';
import { toast } from 'sonner';
import { extractFromPdf, multiplyQuestions, isAiEnabled } from '../../lib/ai';
import { filesToAiParts } from '../../lib/images';
import { uploadDiagram, subjectPopularity } from '../../lib/dataStore';
import { SyllabusImport, FlagQueue } from './AdminNextWave';

const ANSWER_TYPES = ['Multiple choice', 'Typed response', 'Exam style', 'Drawing', FULL_PAPER_TYPE];
const DIFFICULTIES = ['Easy', 'Medium', 'Exam level', 'Hard'];

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function emptyForm({ syllabus, subject }) {
  const topics = topicsFor(syllabus, subject);
  return {
    subject: subject || '',
    topic: topics[0] || '',
    year: '',
    ibLevel: '',      // IB only: 'HL' | 'SL' | '' (both)
    board: syllabus || '',
    difficulty: 'Medium',
    answerType: 'Multiple choice',
    link: '',
    q: '',
    options: ['', '', '', ''],
    a: 0,
    typedAnswer: '',
    typedAliases: '',
    examAnswer: '',
    examKeywords: '',
    marks: '',
    markScheme: [],   // [{ point, marks }] — the examiner's scheme, any answer type
  };
}

// Sum of the scheme's marks; falls back to the question's marks field.
export function schemeTotal(scheme, fallback) {
  const t = (Array.isArray(scheme) ? scheme : []).reduce((s, p) => s + (Number(p.marks) || 0), 0);
  return t || (fallback ? Number(fallback) : 0) || 0;
}

const cleanScheme = (scheme) => (Array.isArray(scheme) ? scheme : [])
  .map((p) => ({ point: (p.point || '').trim(), marks: Math.max(1, parseInt(p.marks, 10) || 1) }))
  .filter((p) => p.point);

// --------------------------------------------------------------------------
// Root component
// --------------------------------------------------------------------------

export default function AdminPlaceholder() {
  const { state, addPastPaper, updatePastPaper, removePastPaper, seedTestPerformance } = useApp();
  const defaultSyllabus = primaryTrack(state.courses, state.user?.examTrack);
  const [syllabus, setSyllabus] = useState(defaultSyllabus);
  // A science subject by default, never whatever happens to be first in the list.
  const [subject, setSubject] = useState(() => { const l = SUBJECTS[defaultSyllabus] || []; return l.find((x) => x === 'Physics') || l[0] || ''; });

  // If syllabus changes, reset subject to first available.
  useEffect(() => {
    const subs = SUBJECTS[syllabus] || [];
    if (!subs.includes(subject)) setSubject(subs.find((x) => x === 'Physics') || subs[0] || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syllabus]);

  // Ordered by how many candidates sit each subject's exam worldwide each
  // year (data/subjectDemand.js) — so the most-taken subjects get content
  // first — with our own enrolment count shown beside each as a badge.
  const [enrol, setEnrol] = useState({});
  useEffect(() => {
    let live = true;
    subjectPopularity().then((rows) => {
      if (!live) return;
      const m = {};
      rows.forEach((r) => { m[`${r.board}|${r.subject}`] = Number(r.students) || 0; });
      setEnrol(m);
    }).catch(() => { /* counts are a nicety */ });
    return () => { live = false; };
  }, []);
  const countFor = (s) => enrol[`${syllabus}|${s}`] || 0;
  const subjectsForSyllabus = useMemo(() => {
    const base = rankByPopularity(SUBJECTS[syllabus] || []);
    return base.map((name, i) => ({ name, i, d: subjectDemand(syllabus, name) })).sort((a, b) => b.d - a.d || a.i - b.i).map((x) => x.name);
  }, [syllabus]);

  const handleSeed = () => {
    if (!window.confirm('Replace your worksheet history with 9 randomized attempts per subject? This overwrites current progress.')) return;
    seedTestPerformance();
    toast.success('Test performance seeded — check Dashboard, Performance and history.');
  };

  return (
    <div className="max-w-[1200px]" data-testid="admin-placeholder">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6" />
        </span>
        <div className="flex-1 min-w-[200px]">
          <div className="text-[11px] tracking-[0.16em] uppercase font-semibold text-blue-600">Admin</div>
          <h2 className="text-[20px] sm:text-[24px] font-semibold tracking-tight text-slate-900">Past paper question bank</h2>
        </div>
        <button
          onClick={handleSeed}
          data-testid="admin-seed-performance"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13.5px] font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-sm shrink-0"
        >
          <FlaskConical className="w-5 h-5" />
          Create test performance
        </button>
      </div>

      {/* Category picker */}
      <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-5 mb-5">
        <div className="text-[10px] tracking-[0.16em] uppercase font-semibold text-blue-700 mb-3">Category</div>
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 mb-4" data-testid="admin-syllabus-grid">
          {EXAM_TRACKS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSyllabus(t.id)}
              data-testid={`admin-syllabus-${t.id}`}
              className={`px-3 py-2.5 rounded-lg border text-[13px] font-semibold transition-colors ${syllabus === t.id ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="text-[10px] tracking-[0.16em] uppercase font-semibold text-blue-700 mb-2">Subject</div>
        <div className="flex flex-wrap gap-2" data-testid="admin-subject-grid">
          {subjectsForSyllabus.length === 0 ? (
            <div className="text-[12.5px] text-slate-500">No subjects for this syllabus yet.</div>
          ) : subjectsForSyllabus.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              data-testid={`admin-subject-${s.replace(/\s+/g, '-')}`}
              title={subjectDemand(syllabus, s) ? `≈${formatDemand(subjectDemand(syllabus, s))} candidates sit this exam each year${countFor(s) ? ` · ${countFor(s)} on InfinitySheets` : ''}` : undefined}
              className={`px-3 py-1.5 rounded-md border text-[12.5px] font-semibold transition-colors ${subject === s ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {s}{countFor(s) > 0 && <span className="ml-1.5 rounded-full bg-blue-600 text-white px-1.5 text-[10px] tabular-nums" title={`${countFor(s)} student${countFor(s) === 1 ? '' : 's'} take this`}>{countFor(s)}</span>}
            </button>
          ))}
        </div>
      </div>

      {subject && <div className="mb-5"><SyllabusImport board={syllabus} subject={subject} /></div>}

      {/* Category-scoped content */}
      {subject && (
        <CategoryPanel
          key={`${syllabus}::${subject}`}
          syllabus={syllabus}
          subject={subject}
          pastPapers={state.pastPapers || []}
          addPastPaper={addPastPaper}
          updatePastPaper={updatePastPaper}
          removePastPaper={removePastPaper}
        />
      )}

      <div className="mt-5"><FlagQueue /></div>
    </div>
  );
}

// --------------------------------------------------------------------------
// CategoryPanel — everything scoped to (syllabus, subject)
// --------------------------------------------------------------------------

function CategoryPanel({ syllabus, subject, pastPapers, addPastPaper, updatePastPaper, removePastPaper }) {
  const { state } = useApp();
  const addedBy = state.user?.email || 'unknown';
  const [form, setForm] = useState(() => emptyForm({ syllabus, subject }));
  const [filterTopic, setFilterTopic] = useState('');
  const [busy, setBusy] = useState(false);

  // Reset form whenever the parent category changes (component is keyed, but
  // keep this for safety).
  useEffect(() => { setForm(emptyForm({ syllabus, subject })); setFilterTopic(''); }, [syllabus, subject]);

  const setF = (patch) => setForm((f) => ({ ...f, ...patch }));

  const topicsList = topicsFor(syllabus, subject);

  const scopedPastPapers = useMemo(() => {
    return pastPapers.filter((p) => p.subject === subject && (!syllabus || !p.board || p.board === syllabus));
  }, [pastPapers, subject, syllabus]);

  const filteredPastPapers = useMemo(() => {
    if (!filterTopic) return scopedPastPapers;
    return scopedPastPapers.filter((p) => p.topic === filterTopic);
  }, [scopedPastPapers, filterTopic]);
  // Duplicate detector: exact + near-duplicate questions in this category.
  const dupGroups = useMemo(() => findDuplicates(scopedPastPapers), [scopedPastPapers]);
  const dupExtras = dupGroups.reduce((n, g) => n + g.items.length - 1, 0);
  const [showDups, setShowDups] = useState(false);
  const [showMultiply, setShowMultiply] = useState(false);

  const validate = () => {
    const isPaper = form.answerType === FULL_PAPER_TYPE;
    if (!isPaper && !form.topic) return 'Pick a topic';
    if (!form.q.trim()) return isPaper ? 'Enter the paper title' : 'Enter a question';
    if (isPaper && !form.link.trim()) return 'A full paper needs a link to the official source';
    if (form.answerType === 'Multiple choice') {
      if (form.options.filter((o) => o.trim()).length < 2) return 'Add at least two options';
      if (!form.options[form.a] || !form.options[form.a].trim()) return 'Pick a correct option that has text';
    }
    if (form.answerType === 'Typed response' && !form.typedAnswer.trim()) return 'Enter the expected typed answer';
    if (form.answerType === 'Exam style' && !form.examAnswer.trim()) return 'Enter the model exam-style answer';
    if (form.answerType === 'Drawing' && !cleanScheme(form.markScheme).length && !form.examAnswer.trim()) return 'A drawing question needs a marking scheme or a description of the expected drawing';
    if (form.link && !/^https?:\/\//i.test(form.link.trim())) return 'Link must start with http:// or https://';
    return null;
  };

  const buildPayload = () => {
    const base = {
      subject,
      topic: form.answerType === FULL_PAPER_TYPE ? '' : form.topic,
      year: form.year ? parseInt(form.year, 10) : null,
      ibLevel: syllabus === 'IB' && form.ibLevel ? form.ibLevel : null,
      board: syllabus,
      difficulty: form.difficulty,
      answerType: form.answerType,
      marks: form.marks ? parseInt(form.marks, 10) : null,
      link: form.link.trim() || null,
      addedBy,
      q: form.q.trim(),
      source: 'past-paper',
    };
    if (form.answerType === 'Multiple choice') {
      base.options = form.options.map((o) => o.trim());
      base.a = form.a;
    } else if (form.answerType === 'Typed response') {
      base.typedAnswer = form.typedAnswer.trim();
      base.typedAliases = form.typedAliases.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (form.answerType === 'Exam style') {
      base.examAnswer = form.examAnswer.trim();
      base.examKeywords = form.examKeywords.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (form.answerType === 'Drawing') {
      base.examAnswer = form.examAnswer.trim();
    }
    const scheme = cleanScheme(form.markScheme);
    if (scheme.length) {
      base.markScheme = scheme;
      if (!base.marks) base.marks = schemeTotal(scheme);
    }
    return base;
  };

  const submit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      await addPastPaper(buildPayload());
      toast.success('Past paper question saved');
      setForm(emptyForm({ syllabus, subject }));
    } catch (e) {
      toast.error(e?.message || 'Could not save question');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_1.1fr] gap-5">
      {/* Left column: add form + bulk PDF upload */}
      <div className="flex flex-col gap-5 min-w-0">
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[12px] tracking-[0.16em] uppercase font-semibold text-blue-700">Add a past-paper question</div>
            <span className="text-[11px] font-semibold text-slate-500">{syllabus} · {subject}</span>
          </div>
          <p className="text-[12.5px] text-slate-500 mb-4">These questions feed the worksheet builder when learners tick <span className="font-semibold">Past paper questions</span>.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Topic">
              <select className="input-base" value={form.topic} onChange={(e) => setF({ topic: e.target.value })} data-testid="admin-topic">
                <option value="">Pick a topic</option>
                {topicsList.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Difficulty">
              <select className="input-base" value={form.difficulty} onChange={(e) => setF({ difficulty: e.target.value })}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Answer type">
              <select className="input-base" value={form.answerType} onChange={(e) => setF({ answerType: e.target.value })} data-testid="admin-answer-type">
                {ANSWER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Year (optional)">
              <input className="input-base" type="number" min="1990" max="2099" value={form.year} onChange={(e) => setF({ year: e.target.value })} placeholder="e.g., 2023" />
            </Field>
            {syllabus === 'IB' && (
              <Field label="IB level">
                <select className="input-base" value={form.ibLevel} onChange={(e) => setF({ ibLevel: e.target.value })} data-testid="admin-ib-level">
                  <option value="">Both HL & SL</option>
                  <option value="HL">HL only</option>
                  <option value="SL">SL only</option>
                </select>
              </Field>
            )}
            <Field label="Marks (optional)">
              <input className="input-base" type="number" min="1" max="30" value={form.marks} onChange={(e) => setF({ marks: e.target.value })} placeholder="e.g., 5" />
            </Field>
            <Field label="Reference link (optional)">
              <input className="input-base" type="url" value={form.link} onChange={(e) => setF({ link: e.target.value })} placeholder="https://example.com/paper.pdf" data-testid="admin-link" />
            </Field>
          </div>

          <div className="mt-3">
            <Field label="Question">
              <textarea className="input-base" rows={3} value={form.q} onChange={(e) => setF({ q: e.target.value })} placeholder={form.answerType === FULL_PAPER_TYPE ? 'Paper title, e.g. CBSE Class XII Physics 2025' : 'Type the past-paper question exactly as it appeared.'} data-testid="admin-question" />
            </Field>
          </div>

          {form.answerType === 'Multiple choice' && (
            <div className="mt-3">
              <div className="text-[10px] tracking-[0.14em] uppercase font-semibold text-slate-500 mb-2">Options · click the radio to mark the correct one</div>
              <div className="flex flex-col gap-2">
                {form.options.map((opt, i) => (
                  <label key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${form.a === i ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                    <input type="radio" name={`admin-correct-${syllabus}-${subject}`} checked={form.a === i} onChange={() => setF({ a: i })} />
                    <span className="text-[12px] font-semibold text-slate-500 w-5">{String.fromCharCode(65 + i)}.</span>
                    <input
                      className="flex-1 bg-transparent outline-none text-[13.5px] text-slate-900"
                      value={opt}
                      onChange={(e) => {
                        const opts = [...form.options];
                        opts[i] = e.target.value;
                        setF({ options: opts });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {form.answerType === 'Typed response' && (
            <div className="mt-3 flex flex-col gap-3">
              <Field label="Expected answer">
                <input className="input-base" value={form.typedAnswer} onChange={(e) => setF({ typedAnswer: e.target.value })} placeholder="e.g., 9.8 m/s²" />
              </Field>
              <Field label="Accepted aliases (comma separated)">
                <input className="input-base" value={form.typedAliases} onChange={(e) => setF({ typedAliases: e.target.value })} placeholder="9.8, 9.81, 9.8 m/s^2" />
              </Field>
            </div>
          )}

          {form.answerType === 'Exam style' && (
            <div className="mt-3 flex flex-col gap-3">
              <Field label="Model answer / mark scheme">
                <textarea className="input-base" rows={3} value={form.examAnswer} onChange={(e) => setF({ examAnswer: e.target.value })} placeholder="Model examiner answer describing what a full-mark response looks like." />
              </Field>
              <Field label="Required keywords (comma separated)">
                <input className="input-base" value={form.examKeywords} onChange={(e) => setF({ examKeywords: e.target.value })} placeholder="e.g., photosynthesis, chloroplast, sunlight, glucose" />
              </Field>
            </div>
          )}

          {form.answerType === 'Drawing' && (
            <div className="mt-3">
              <Field label="What the drawing must show">
                <textarea className="input-base" rows={2} value={form.examAnswer} onChange={(e) => setF({ examAnswer: e.target.value })} placeholder="e.g. Labelled ray diagram for a convex lens with the object beyond 2F: two rays, image position, arrows on rays." />
              </Field>
              <div className="text-[11.5px] text-slate-500 mt-1 inline-flex items-center gap-1"><PenTool className="w-3.5 h-3.5" /> Students can only answer this with a photo of their drawing — no typed answer.</div>
            </div>
          )}

          {form.answerType !== FULL_PAPER_TYPE && (
            <div className="mt-4">
              <MarkSchemeEditor value={form.markScheme} onChange={(v) => setF({ markScheme: v })} marks={form.marks} />
            </div>
          )}

          <button
            onClick={submit}
            disabled={busy}
            data-testid="admin-add-question"
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[14px] font-semibold text-white bg-blue-600 hover:opacity-95 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {busy ? 'Saving\u2026' : 'Add question'}
          </button>
        </div>

        <BulkPdfUpload syllabus={syllabus} subject={subject} addPastPaper={addPastPaper} />
      </div>

      {/* Right column: library */}
      <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-5 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-[12px] tracking-[0.16em] uppercase font-semibold text-blue-700">Past-paper library</div>
            <div className="text-[12.5px] text-slate-500">{syllabus} · {subject} · {scopedPastPapers.length} total{filterTopic ? ` · ${filteredPastPapers.length} shown` : ''}</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowDups((v) => !v)} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors ${dupExtras ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-[color:var(--color-border)] text-slate-500 hover:bg-slate-50'}`} data-testid="admin-dup-toggle" title="Find duplicate questions">
              <Copy className="w-3.5 h-3.5" /> Duplicates{dupExtras ? <span className="ml-0.5 rounded-full bg-amber-600 text-white px-1.5 text-[10.5px]">{dupExtras}</span> : null}
            </button>
            <button type="button" onClick={() => setShowMultiply((v) => !v)} disabled={scopedPastPapers.length === 0} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors disabled:opacity-40 ${showMultiply ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-[color:var(--color-border)] text-slate-600 hover:bg-slate-50'}`} data-testid="admin-multiply-toggle" title="Write new questions on the same concepts">
              <Layers className="w-3.5 h-3.5" /> Multiply
            </button>
            <Filter className="w-5 h-5 text-slate-400" />
          </div>
        </div>
        {showMultiply && (
          <MultiplyPanel syllabus={syllabus} subject={subject} questions={filteredPastPapers} topicsList={topicsList} filterTopic={filterTopic} addPastPaper={addPastPaper} onClose={() => setShowMultiply(false)} />
        )}
        {showDups && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/40 p-3" data-testid="admin-dup-panel">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-[12.5px] font-semibold text-amber-900">{dupGroups.length ? `${dupGroups.length} group${dupGroups.length === 1 ? '' : 's'} of duplicates · ${dupExtras} extra question${dupExtras === 1 ? '' : 's'}` : 'No duplicates found in this category'}</div>
              {dupExtras > 0 && (
                <button type="button" onClick={() => { dupGroups.forEach((g) => g.items.slice(1).forEach((q) => removePastPaper(q.id))); toast.success(`Removed ${dupExtras} duplicate question${dupExtras === 1 ? '' : 's'}`); }} className="text-[12px] font-semibold text-rose-700 hover:text-rose-900" data-testid="admin-dup-remove-all">Remove all extras (keep first of each)</button>
              )}
            </div>
            <div className="flex flex-col gap-2 max-h-[360px] overflow-auto pr-1">
              {dupGroups.map((g) => (
                <div key={g.key} className="rounded-lg border border-[color:var(--color-border)] bg-white p-2.5">
                  <div className="text-[10.5px] uppercase tracking-wide font-semibold mb-1.5 text-slate-500">{g.exact ? 'Identical' : 'Near-identical'} · {g.items.length} copies</div>
                  {g.items.map((q, i) => (
                    <div key={q.id} className="flex items-start gap-2 py-1 border-t border-[color:var(--color-border)] first:border-t-0">
                      <div className="min-w-0 flex-1 text-[12.5px] text-slate-800">
                        <span className="text-slate-900">{q.q}</span>
                        <div className="text-[11px] text-slate-500 mt-0.5">{q.topic || '—'}{q.year ? ` · ${q.year}` : ''}{q.paper ? ` · ${q.paper}` : ''}{q.answerType ? ` · ${q.answerType}` : ''}{i === 0 ? ' · kept' : ''}</div>
                      </div>
                      {i > 0 && <button type="button" onClick={() => removePastPaper(q.id)} className="text-[11.5px] font-semibold text-rose-700 hover:text-rose-900 shrink-0" data-testid={`admin-dup-remove-${q.id}`}>Remove</button>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <select className="input-base mb-4" value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)}>
          <option value="">All topics</option>
          {topicsList.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {filteredPastPapers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[color:var(--color-border)] p-8 text-center text-[13px] text-slate-500 bg-slate-50/50">
            <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            {scopedPastPapers.length === 0 ? 'No past-paper questions in this category yet. Add one on the left, or bulk-import a PDF below.' : 'No questions match this filter.'}
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[640px] overflow-auto pr-1">
            {(() => {
              // Two shelves: the seed questions typed or scanned in from real
              // papers (with their diagram-based ones — a figure to read or a
              // drawing to make — nested in a sub-section on top), then the
              // ones the Multiply AI generated.
              const isDiagram = (p) => !!p.hasDiagram || p.answerType === 'Drawing';
              const seed = filteredPastPapers.filter((p) => !p.multiplied);
              const generated = filteredPastPapers.filter((p) => !!p.multiplied);
              const seedDiagram = seed.filter(isDiagram);
              const seedRest = seed.filter((p) => !isDiagram(p));
              const rows = (items) => items.map((p) => <LibraryRow key={p.id} p={p} onRemove={removePastPaper} onSave={updatePastPaper} topicsList={topicsList} syllabus={syllabus} />);
              const Head = ({ title, tone, count, top, sub }) => (
                <div className={`sticky top-0 z-[1] bg-white/95 backdrop-blur ${sub ? 'text-[10px] tracking-[0.12em] pl-2 border-l-2 border-violet-300' : 'text-[10.5px] tracking-[0.14em] border-b border-[color:var(--color-border)]'} uppercase font-semibold ${tone} py-1.5 ${top ? '' : 'mt-3'} mb-1`}>{title} · {count}</div>
              );
              return (
                <>
                  {seed.length > 0 && (
                    <div data-testid="library-seed-section">
                      <Head title="Seed questions" tone="text-slate-600" count={seed.length} top />
                      {seedDiagram.length > 0 && (
                        <div className="ml-2" data-testid="library-diagram-section">
                          <Head title="Diagram-based" tone="text-violet-700" count={seedDiagram.length} top sub />
                          <div className="flex flex-col gap-2">{rows(seedDiagram)}</div>
                        </div>
                      )}
                      {seedRest.length > 0 && (
                        <div className={seedDiagram.length ? 'ml-2 mt-3' : ''}>
                          {seedDiagram.length > 0 && <Head title="Other seed questions" tone="text-slate-500" count={seedRest.length} top sub />}
                          <div className="flex flex-col gap-2">{rows(seedRest)}</div>
                        </div>
                      )}
                    </div>
                  )}
                  {generated.length > 0 && (
                    <div data-testid="library-generated-section">
                      <Head title="Generated by Multiply" tone="text-blue-700" count={generated.length} top={seed.length === 0} />
                      <div className="flex flex-col gap-2">{rows(generated)}</div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Multiply: new questions on the same concepts as the ones in the library
// --------------------------------------------------------------------------

function MultiplyPanel({ syllabus, subject, questions, topicsList, filterTopic, addPastPaper, onClose }) {
  const { state } = useApp();
  const addedBy = state.user?.email || 'unknown';
  const [count, setCount] = useState(6);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [saving, setSaving] = useState(false);
  const pool = questions.filter((q) => q.answerType !== FULL_PAPER_TYPE && q.q);

  const run = async () => {
    if (!isAiEnabled(state)) { toast.error('AI is turned off in Settings'); return; }
    if (!pool.length) { toast.error('No questions to multiply in this view'); return; }
    setBusy(true);
    try {
      // Seed with a random sample so repeated presses explore the library.
      const seeds = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
      const ibLevel = seeds.every((q) => q.ibLevel === seeds[0].ibLevel) ? seeds[0].ibLevel : null;
      const list = await multiplyQuestions({ board: syllabus, ibLevel, subject, questions: seeds, count, topics: filterTopic ? [filterTopic] : topicsList, syllabus: resolvedTopics(state.syllabusTopics, syllabus, subject) });
      setDrafts((d) => [...list.map((q) => ({ ...q, _key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ibLevel })), ...d]);
      toast.success(`${list.length} new question${list.length === 1 ? '' : 's'} drafted`);
    } catch (e) {
      toast.error(e?.message || 'Could not multiply questions');
    } finally { setBusy(false); }
  };

  const payloadFor = (d) => ({
    subject, board: syllabus, topic: d.topic || filterTopic || topicsList[0] || '',
    ibLevel: syllabus === 'IB' && d.ibLevel ? d.ibLevel : null,
    year: null, difficulty: d.difficulty || 'Exam level', answerType: d.answerType, marks: d.marks || null, link: null, addedBy,
    q: d.q, source: 'multiplied',
    options: d.options, a: d.a, typedAnswer: d.typedAnswer, typedAliases: d.typedAliases,
    examAnswer: d.examAnswer, examKeywords: d.examKeywords, markScheme: d.markScheme,
    hasDiagram: d.hasDiagram, diagramNote: d.diagramNote,
  });

  const saveOne = async (d) => {
    try { await addPastPaper(payloadFor(d)); setDrafts((x) => x.filter((y) => y._key !== d._key)); toast.success('Added to the library'); }
    catch (e) { toast.error(e?.message || 'Could not save'); }
  };
  const saveAll = async () => {
    setSaving(true);
    let ok = 0;
    for (const d of drafts) { try { await addPastPaper(payloadFor(d)); ok += 1; } catch (_) { /* counted */ } }
    setDrafts([]); setSaving(false);
    toast.success(`Added ${ok} of ${drafts.length} question${drafts.length === 1 ? '' : 's'}`);
  };

  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/40 p-3" data-testid="admin-multiply-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold text-blue-900 inline-flex items-center gap-1.5"><Layers className="w-4 h-4" /> Multiply</div>
          <div className="text-[11.5px] text-slate-600">Reads the {pool.length} question{pool.length === 1 ? '' : 's'} {filterTopic ? `in ${filterTopic}` : 'in this category'} together with the {syllabus} {subject} syllabus and writes new ones on the same concepts — changed values, a different quantity asked for, or two concepts combined.</div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11.5px] text-slate-600 inline-flex items-center gap-1.5">Make
            <select className="input-base !py-1 !px-2 !w-auto text-[12px]" value={count} onChange={(e) => setCount(parseInt(e.target.value, 10))} data-testid="admin-multiply-count">
              {[3, 6, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button type="button" onClick={run} disabled={busy || !pool.length} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" data-testid="admin-multiply-run">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} {busy ? 'Writing…' : 'Multiply'}
          </button>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white flex items-center justify-center" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
      </div>
      {drafts.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="text-[11.5px] font-semibold text-slate-700">{drafts.length} draft{drafts.length === 1 ? '' : 's'} — review, then add</div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setDrafts([])} className="text-[11.5px] font-semibold text-slate-500 hover:text-slate-800">Discard all</button>
              <button type="button" onClick={saveAll} disabled={saving} className="text-[11.5px] font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 disabled:opacity-50" data-testid="admin-multiply-save-all">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Add all to library</button>
            </div>
          </div>
          <div className="flex flex-col gap-2 max-h-[420px] overflow-auto pr-1">
            {drafts.map((d) => (
              <div key={d._key} className="rounded-lg border border-[color:var(--color-border)] bg-white p-2.5" data-testid="admin-multiply-draft">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1 mb-1">
                      {d.topic && <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-semibold">{d.topic}</span>}
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">{d.answerType}</span>
                      {d.marks ? <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-semibold">{d.marks} marks</span> : null}
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold">Multiplied</span>
                    </div>
                    <div className="text-[12.5px] text-slate-900">{d.q}</div>
                    <div className="text-[11.5px] text-slate-600 mt-0.5">
                      {d.answerType === 'Multiple choice' ? <>Options: {(d.options || []).join(' · ')} — correct: <span className="font-medium text-emerald-700">{(d.options || [])[d.a]}</span></>
                        : d.answerType === 'Typed response' ? <>Expected: <span className="font-medium text-emerald-700">{d.typedAnswer}</span></>
                        : <>Answer: <span className="font-medium text-slate-800">{d.examAnswer || '\u2014'}</span></>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button type="button" onClick={() => saveOne(d)} className="px-2 py-1 rounded-md text-[11.5px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700" data-testid="admin-multiply-add">Add</button>
                    <button type="button" onClick={() => setDrafts((x) => x.filter((y) => y._key !== d._key))} className="px-2 py-1 rounded-md text-[11.5px] font-semibold text-slate-500 hover:bg-slate-100">Drop</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Library row
// --------------------------------------------------------------------------

function LibraryRow({ p, onRemove, onSave, topicsList = [], syllabus }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <QuestionEditor p={p} topicsList={topicsList} syllabus={syllabus} onSave={onSave} onClose={() => setEditing(false)} />;
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] p-3.5 bg-white" data-testid={`library-row-${p.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {p.topic && <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10.5px] font-semibold">{p.topic}</span>}
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10.5px] font-semibold">{p.answerType}</span>
            {p.difficulty && <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10.5px] font-semibold">{p.difficulty}</span>}
            {p.year && <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10.5px] font-semibold">{p.year}</span>}
            {p.paper && <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10.5px] font-semibold">{p.paper}</span>}
            {p.ibLevel && <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-800 text-[10.5px] font-semibold">{p.ibLevel}</span>}
            {(p.hasDiagram || p.answerType === 'Drawing') && <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10.5px] font-semibold">Diagram</span>}
            {p.multiplied && <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10.5px] font-semibold">Multiplied</span>}
            {p.marks && <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10.5px] font-semibold">{p.marks} marks</span>}
          </div>
          <div className="text-[13.5px] font-medium text-slate-900 leading-snug">{p.q}</div>
          {p.answerType === 'Multiple choice' && Array.isArray(p.options) && (
            <div className="text-[12.5px] text-slate-600 mt-1">Correct: <span className="font-medium text-emerald-700">{p.options[p.a]}</span></div>
          )}
          {p.answerType === 'Typed response' && (
            <div className="text-[12.5px] text-slate-600 mt-1">Expected: <span className="font-medium text-emerald-700">{p.typedAnswer}</span></div>
          )}
          {p.answerType === 'Exam style' && (
            <div className="text-[12.5px] text-slate-600 mt-1 flex items-start gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>Keywords: <span className="font-medium text-slate-800">{(p.examKeywords || []).join(', ') || '\u2014'}</span></span>
            </div>
          )}
          {p.answerType === 'Drawing' && (
            <div className="text-[12.5px] text-slate-600 mt-1 flex items-start gap-1.5">
              <PenTool className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <span>Photo answer only{p.examAnswer ? <> · <span className="font-medium text-slate-800">{p.examAnswer}</span></> : null}</span>
            </div>
          )}
          {Array.isArray(p.markScheme) && p.markScheme.length > 0 && (
            <div className="text-[12px] text-slate-600 mt-1.5 rounded-md bg-slate-50 border border-[color:var(--color-border)] px-2.5 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5 inline-flex items-center gap-1"><ClipboardCheck className="w-3.5 h-3.5" /> Marking scheme · {schemeTotal(p.markScheme, p.marks)} marks</div>
              <ul className="list-disc pl-4 space-y-0.5">{p.markScheme.map((pt, k) => <li key={k}><span className="font-semibold">{pt.marks}</span> — {pt.point}</li>)}</ul>
            </div>
          )}
          {p.diagramUrl && (
            <a href={p.diagramUrl} target="_blank" rel="noopener noreferrer" className="block mt-2"><img src={p.diagramUrl} alt={p.diagramNote || 'Diagram'} className="max-h-40 rounded-lg border border-[color:var(--color-border)] object-contain bg-slate-50" /></a>
          )}
          {!p.diagramUrl && p.diagramNote && <div className="text-[12px] text-slate-500 mt-1 italic">Figure: {p.diagramNote}</div>}
          {p.link && (
            <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-[12px] text-blue-700 hover:text-blue-900 mt-1.5 inline-flex items-center gap-1 max-w-full">
              <Link2 className="w-4 h-4 shrink-0" />
              <span className="truncate">{p.link}</span>
            </a>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {onSave && (
            <button type="button" onClick={() => setEditing(true)} className="w-8 h-8 rounded-md text-slate-400 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-center" aria-label="Edit" data-testid={`library-edit-${p.id}`}>
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={async () => {
              try { await onRemove(p.id); toast.success('Question removed'); }
              catch (e) { toast.error(e?.message || 'Could not remove question'); }
            }}
            className="w-8 h-8 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center"
            aria-label="Remove"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// In-place editor for one library question (any answer type), with a
// diagram image that can be uploaded, dropped or pasted from the clipboard.
// --------------------------------------------------------------------------

function QuestionEditor({ p, topicsList, syllabus, onSave, onClose }) {
  const [f, setF] = useState(() => ({
    q: p.q || '', topic: p.topic || '', answerType: p.answerType || 'Exam style', difficulty: p.difficulty || 'Medium',
    marks: p.marks || '', year: p.year || '', paper: p.paper || '', ibLevel: p.ibLevel || '', link: p.link || '',
    options: Array.isArray(p.options) && p.options.length ? [...p.options] : ['', '', '', ''], a: Number.isInteger(p.a) ? p.a : 0,
    typedAnswer: p.typedAnswer || '', typedAliases: (p.typedAliases || []).join(', '),
    examAnswer: p.examAnswer || '', examKeywords: (p.examKeywords || []).join(', '),
    markScheme: Array.isArray(p.markScheme) ? p.markScheme.map((x) => ({ ...x })) : [],
    hasDiagram: !!p.hasDiagram, diagramNote: p.diagramNote || '', diagramUrl: p.diagramUrl || '',
  }));
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  const putImage = async (file) => {
    if (!file || !/^image\//.test(file.type)) { toast.error('Drop or paste an image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image is over 5 MB'); return; }
    setUploading(true);
    try { const url = await uploadDiagram(p.id, file); set({ diagramUrl: url, hasDiagram: true }); toast.success('Diagram attached'); }
    catch (e) { toast.error(e?.message || 'Could not upload the image'); }
    finally { setUploading(false); }
  };
  const onPaste = (e) => {
    const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith('image/'));
    if (item) { e.preventDefault(); putImage(item.getAsFile()); }
  };
  const onDrop = (e) => { e.preventDefault(); putImage(e.dataTransfer?.files?.[0]); };

  const save = async () => {
    if (!f.q.trim()) { toast.error('The question cannot be empty'); return; }
    const patch = {
      q: f.q.trim(), topic: f.topic, answerType: f.answerType, difficulty: f.difficulty,
      marks: f.marks ? parseInt(f.marks, 10) : null, year: f.year ? parseInt(f.year, 10) : null, paper: f.paper || null,
      ibLevel: syllabus === 'IB' && f.ibLevel ? f.ibLevel : null, link: f.link.trim() || null,
      hasDiagram: f.hasDiagram || !!f.diagramUrl || f.answerType === 'Drawing' ? true : undefined,
      diagramNote: f.diagramNote.trim() || undefined, diagramUrl: f.diagramUrl || undefined,
      options: undefined, a: undefined, typedAnswer: undefined, typedAliases: undefined, examAnswer: undefined, examKeywords: undefined,
    };
    if (f.answerType === 'Multiple choice') {
      const opts = f.options.map((o) => o.trim());
      if (opts.filter(Boolean).length < 2) { toast.error('Add at least two options'); return; }
      patch.options = opts; patch.a = f.a;
    } else if (f.answerType === 'Typed response') {
      if (!f.typedAnswer.trim()) { toast.error('Enter the expected answer'); return; }
      patch.typedAnswer = f.typedAnswer.trim(); patch.typedAliases = f.typedAliases.split(',').map((x) => x.trim()).filter(Boolean);
    } else {
      patch.examAnswer = f.examAnswer.trim(); patch.examKeywords = f.examKeywords.split(',').map((x) => x.trim()).filter(Boolean);
    }
    const scheme = cleanScheme(f.markScheme);
    patch.markScheme = scheme.length ? scheme : undefined;
    if (!patch.marks && scheme.length) patch.marks = schemeTotal(scheme);
    setBusy(true);
    try { await onSave(p.id, patch); toast.success('Question updated'); onClose(); }
    catch (e) { toast.error(e?.message || 'Could not save'); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-xl border border-blue-300 p-3.5 bg-blue-50/30" onPaste={onPaste} onDrop={onDrop} onDragOver={(e) => e.preventDefault()} data-testid={`library-editor-${p.id}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[11px] tracking-[0.14em] uppercase font-semibold text-blue-700 inline-flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Edit question</div>
        <button type="button" onClick={onClose} className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white flex items-center justify-center" aria-label="Cancel"><X className="w-4 h-4" /></button>
      </div>
      <textarea className="input-base min-h-[80px] text-[13px]" value={f.q} onChange={(e) => set({ q: e.target.value })} data-testid="editor-q" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
        <select className="input-base !py-1.5 text-[12.5px]" value={f.topic} onChange={(e) => set({ topic: e.target.value })} data-testid="editor-topic">
          <option value="">Topic…</option>
          {(topicsList.includes(f.topic) || !f.topic ? topicsList : [f.topic, ...topicsList]).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input-base !py-1.5 text-[12.5px]" value={f.answerType} onChange={(e) => set({ answerType: e.target.value })} data-testid="editor-type">
          {['Multiple choice', 'Typed response', 'Exam style', 'Drawing'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input-base !py-1.5 text-[12.5px]" value={f.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input className="input-base !py-1.5 text-[12.5px]" type="number" min="1" max="30" placeholder="Marks" value={f.marks} onChange={(e) => set({ marks: e.target.value })} />
        <input className="input-base !py-1.5 text-[12.5px]" type="number" min="1990" max="2099" placeholder="Year" value={f.year} onChange={(e) => set({ year: e.target.value })} />
        <input className="input-base !py-1.5 text-[12.5px]" placeholder="Paper (e.g. Paper 2)" value={f.paper} onChange={(e) => set({ paper: e.target.value })} />
        {syllabus === 'IB' && (
          <select className="input-base !py-1.5 text-[12.5px]" value={f.ibLevel} onChange={(e) => set({ ibLevel: e.target.value })}>
            <option value="">Both HL & SL</option><option value="HL">HL only</option><option value="SL">SL only</option>
          </select>
        )}
        <input className="input-base !py-1.5 text-[12.5px] md:col-span-2" type="url" placeholder="Reference link" value={f.link} onChange={(e) => set({ link: e.target.value })} />
      </div>

      {f.answerType === 'Multiple choice' && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {f.options.map((o, i) => (
            <label key={i} className="flex items-center gap-2 text-[12.5px]">
              <input type="radio" name={`ed-a-${p.id}`} checked={f.a === i} onChange={() => set({ a: i })} />
              <input className="input-base !py-1.5 text-[12.5px] flex-1" value={o} placeholder={`Option ${String.fromCharCode(65 + i)}`} onChange={(e) => { const options = [...f.options]; options[i] = e.target.value; set({ options }); }} />
            </label>
          ))}
        </div>
      )}
      {f.answerType === 'Typed response' && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <input className="input-base !py-1.5 text-[12.5px]" placeholder="Expected answer" value={f.typedAnswer} onChange={(e) => set({ typedAnswer: e.target.value })} data-testid="editor-typed" />
          <input className="input-base !py-1.5 text-[12.5px]" placeholder="Accepted alternatives, comma-separated" value={f.typedAliases} onChange={(e) => set({ typedAliases: e.target.value })} />
        </div>
      )}
      {(f.answerType === 'Exam style' || f.answerType === 'Drawing') && (
        <div className="mt-2 flex flex-col gap-1.5">
          <textarea className="input-base min-h-[60px] text-[12.5px]" placeholder={f.answerType === 'Drawing' ? 'What the drawing must show' : 'Model answer'} value={f.examAnswer} onChange={(e) => set({ examAnswer: e.target.value })} />
          {f.answerType === 'Exam style' && <input className="input-base !py-1.5 text-[12.5px]" placeholder="Key ideas, comma-separated" value={f.examKeywords} onChange={(e) => set({ examKeywords: e.target.value })} />}
        </div>
      )}

      <div className="mt-2">
        <div className="flex items-center justify-between">
          <div className="text-[10.5px] uppercase tracking-wide text-slate-500 font-semibold">Marking scheme</div>
          <button type="button" onClick={() => set({ markScheme: [...f.markScheme, { point: '', marks: 1 }] })} className="text-[11.5px] font-semibold text-blue-700 hover:text-blue-900">+ point</button>
        </div>
        {f.markScheme.map((pt, i) => (
          <div key={i} className="flex items-center gap-1.5 mt-1">
            <input className="input-base !py-1 text-[12px] flex-1" value={pt.point} placeholder="Mark point" onChange={(e) => { const markScheme = f.markScheme.map((x, k) => (k === i ? { ...x, point: e.target.value } : x)); set({ markScheme }); }} />
            <input className="input-base !py-1 text-[12px] !w-16" type="number" min="1" value={pt.marks} onChange={(e) => { const markScheme = f.markScheme.map((x, k) => (k === i ? { ...x, marks: e.target.value } : x)); set({ markScheme }); }} />
            <button type="button" onClick={() => set({ markScheme: f.markScheme.filter((_, k) => k !== i) })} className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 flex items-center justify-center" aria-label="Remove point"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>

      <div className="mt-2 rounded-lg border border-dashed border-violet-300 bg-white p-2.5" data-testid="editor-diagram">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex items-center gap-1.5 text-[12px] text-slate-700"><input type="checkbox" checked={f.hasDiagram || !!f.diagramUrl} onChange={(e) => set({ hasDiagram: e.target.checked })} /> Diagram-based question</label>
          <div className="flex items-center gap-2">
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { putImage(e.target.files?.[0]); e.target.value = ''; }} data-testid="editor-diagram-input" />
            <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold border border-violet-300 text-violet-800 bg-violet-50 hover:bg-violet-100 disabled:opacity-50">{uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />} {f.diagramUrl ? 'Replace image' : 'Add image'}</button>
            {f.diagramUrl && <button type="button" onClick={() => set({ diagramUrl: '' })} className="text-[12px] font-semibold text-rose-700 hover:text-rose-900">Remove image</button>}
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Click Add image, or paste a screenshot (Ctrl/⌘+V) or drop a file anywhere on this card.</div>
        {f.diagramUrl && <img src={f.diagramUrl} alt="Diagram" className="mt-2 max-h-48 rounded-lg border border-[color:var(--color-border)] object-contain bg-slate-50" />}
        <input className="input-base !py-1.5 text-[12.5px] mt-2" placeholder="What the figure shows (shown to the student)" value={f.diagramNote} onChange={(e) => set({ diagramNote: e.target.value })} />
      </div>

      <div className="flex items-center justify-end gap-2 mt-3">
        <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-slate-600 hover:bg-white">Cancel</button>
        <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" data-testid="editor-save">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save</button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Bulk PDF upload → LLM extraction
// --------------------------------------------------------------------------

function BulkPdfUpload({ syllabus, subject, addPastPaper }) {
  const { state, refreshPastPapers } = useApp();
  const addedBy = state.user?.email || 'unknown';
  const [file, setFile] = useState(null);
  const [schemeFile, setSchemeFile] = useState(null);   // optional mark-scheme PDF
  const aiOn = isAiEnabled(state);
  const [year, setYear] = useState('');
  const [paperId, setPaperId] = useState(''); // which paper this PDF is — required
  const papers = papersFor(syllabus, subject);
  const paperMeta = papers.find((x) => x.id === paperId) || null;
  const [link, setLink] = useState('');
  const [autosave, setAutosave] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracted, setExtracted] = useState([]); // list of question drafts
  const [savingAll, setSavingAll] = useState(false);

  const clear = () => { setFile(null); setSchemeFile(null); setExtracted([]); setYear(''); setLink(''); };

  // The AI reads the paper (and the mark scheme, when given) straight from
  // the PDF and returns question drafts with answers + marking schemes.
  const extract = async () => {
    if (!file) { toast.error('Choose a PDF first'); return; }
    if (!paperMeta) { toast.error('Pick which paper this PDF is (Paper 1, Paper 2 …) before scanning'); return; }
    if (!aiOn) { toast.error('AI is switched off in Settings — turn it on to scan the PDF.'); return; }
    if (state.user?.role !== 'admin') { toast.error('Admin access is required to add to the question bank.'); return; }
    setUploading(true);
    try {
      const [paper] = await filesToAiParts([file]);
      const [scheme] = schemeFile ? await filesToAiParts([schemeFile]) : [null];
      const topics = topicsFor(syllabus, subject);
      const drafts = await extractFromPdf({ paper, scheme, board: syllabus, subject, topics });
      const list = drafts.map((q, i) => ({
        ...q,
        subject,
        board: syllabus,
        paper: paperMeta.label,
        paperId: paperMeta.id,
        year: year ? parseInt(year, 10) : q.year || null,
        link: link.trim() || null,
        addedBy,
        source: 'past-paper',
        _draftId: `d_${Date.now()}_${i}`,
      }));
      if (!list.length) throw new Error('No complete questions were found in that PDF (MCQs without a known correct option are skipped — attach the mark scheme).');
      if (autosave) {
        let ok = 0;
        for (const d of list) {
          const { _draftId, ...payload } = d;
          try { await addPastPaper(payload); ok += 1; } catch (_) { /* counted below */ }
        }
        toast.success(`Scanned ${file.name}: ${list.length} question${list.length === 1 ? '' : 's'} · ${ok} saved to the ${subject} bank`);
        setExtracted([]);
        if (refreshPastPapers) await refreshPastPapers();
      } else {
        setExtracted(list);
        toast.success(`Scanned ${file.name}: ${list.length} question${list.length === 1 ? '' : 's'} found${scheme ? ' with marking schemes' : ''}. Review and save below.`);
      }
    } catch (e) {
      toast.error(e?.message || 'Extraction failed');
    } finally {
      setUploading(false);
    }
  };

  const patchDraft = (id, patch) => setExtracted((prev) => prev.map((d) => (d._draftId === id ? { ...d, ...patch } : d)));
  const dropDraft = (id) => setExtracted((prev) => prev.filter((d) => d._draftId !== id));

  const saveAll = async () => {
    if (extracted.length === 0) return;
    setSavingAll(true);
    let ok = 0, fail = 0;
    for (const draft of extracted) {
      // Strip internal fields.
      const { _draftId, ...payload } = draft;
      payload.addedBy = payload.addedBy || addedBy;
      // Ensure required fields per answer type.
      if (payload.answerType === 'Multiple choice' && (!payload.options || !payload.options.length)) continue;
      if (payload.answerType === 'Typed response' && !payload.typedAnswer) continue;
      if (payload.answerType === 'Exam style' && !payload.examAnswer) continue;
      try {
        await addPastPaper(payload);
        ok += 1;
      } catch (e) {
        fail += 1;
      }
    }
    setSavingAll(false);
    if (ok) toast.success(`Saved ${ok} question${ok === 1 ? '' : 's'}`);
    if (fail) toast.error(`${fail} question${fail === 1 ? '' : 's'} failed to save`);
    if (ok && !fail) setExtracted([]);
  };

  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-5" data-testid="admin-bulk-pdf">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[12px] tracking-[0.16em] uppercase font-semibold text-blue-700 inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Scan a PDF into the question bank</div>
        <span className="text-[11px] font-semibold text-slate-500">{syllabus} · {subject}</span>
      </div>
      <p className="text-[12.5px] text-slate-500 mb-4">Upload a past-paper PDF and the AI scans every complete question out of it into <span className="font-semibold">{subject}</span>, snapping each to a canonical topic. Add the official mark scheme too and each question gets its accepted answer and mark points from it. Review and save the ones you want, or flip on autosave.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Field label="Question paper (PDF)">
          <label className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors">
            <Upload className="w-5 h-5 text-slate-500" />
            <span className="text-[12.5px] text-slate-700 truncate flex-1">{file ? file.name : 'Choose a PDF\u2026'}</span>
            <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" data-testid="admin-pdf-file" />
          </label>
        </Field>
        <Field label="Mark scheme (PDF, optional)">
          <label className="flex items-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 px-3 py-2 cursor-pointer hover:bg-emerald-50 transition-colors">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-[12.5px] text-slate-700 truncate flex-1">{schemeFile ? schemeFile.name : 'Add the marking scheme\u2026'}</span>
            {schemeFile && <button type="button" onClick={(e) => { e.preventDefault(); setSchemeFile(null); }} className="text-slate-400 hover:text-rose-600"><X className="w-4 h-4" /></button>}
            <input type="file" accept="application/pdf,image/*" onChange={(e) => setSchemeFile(e.target.files?.[0] || null)} className="hidden" data-testid="admin-scheme-file" />
          </label>
        </Field>
        <Field label="Year (optional)">
          <input className="input-base" type="number" min="1990" max="2099" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g., 2023" />
        </Field>
        <Field label="Which paper is this? (required)">
          <select className="input-base" value={paperId} onChange={(e) => setPaperId(e.target.value)} data-testid="admin-bulk-paper" required>
            <option value="">Select the paper…</option>
            {papers.map((x) => <option key={x.id} value={x.id}>{x.label} — {x.hint}</option>)}
          </select>
        </Field>
        <Field label="Reference link (optional, attached to every question)">
          <input className="input-base" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com/paper.pdf" />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <span
            className={`w-9 h-5 rounded-full transition-colors relative ${autosave ? 'bg-blue-600' : 'bg-slate-300'}`}
            onClick={(e) => { e.preventDefault(); setAutosave(!autosave); }}
            role="button"
            aria-pressed={autosave}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${autosave ? 'left-4' : 'left-0.5'}`} />
          </span>
          <input type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} className="sr-only" data-testid="admin-autosave" />
          <span className="text-[12.5px] font-medium text-slate-700">Save automatically <span className="text-slate-500 font-normal">(skip the review step)</span></span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={extract}
          disabled={!file || uploading}
          data-testid="admin-extract-btn"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13.5px] font-semibold text-white bg-blue-600 hover:opacity-95 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {uploading ? (autosave ? 'Extracting & saving\u2026' : 'Extracting\u2026') : (autosave ? 'Extract & save all' : 'Extract questions')}
        </button>
        {(file || extracted.length > 0) && (
          <button onClick={clear} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-slate-500 hover:text-slate-800">
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {extracted.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[12.5px] font-semibold text-slate-700">{extracted.length} extracted draft{extracted.length === 1 ? '' : 's'} · review before saving</div>
            <button
              onClick={saveAll}
              disabled={savingAll}
              data-testid="admin-save-all"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-semibold text-white bg-emerald-600 hover:opacity-95 disabled:opacity-50"
            >
              {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {savingAll ? 'Saving\u2026' : 'Save all'}
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-[420px] overflow-auto pr-1">
            {extracted.map((d) => (
              <DraftRow syllabus={syllabus} key={d._draftId} draft={d} onChange={(patch) => patchDraft(d._draftId, patch)} onRemove={() => dropDraft(d._draftId)} subject={subject} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DraftRow({ draft, onChange, onRemove, subject, syllabus }) {
  const topicsList = topicsFor(syllabus, subject);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10.5px] font-semibold">{draft.answerType}</span>
          {draft.difficulty && <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10.5px] font-semibold">{draft.difficulty}</span>}
          {draft.marks && <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10.5px] font-semibold">{draft.marks} marks</span>}
        </div>
        <button onClick={onRemove} className="w-6 h-6 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0" aria-label="Discard">
          <X className="w-4 h-4" />
        </button>
      </div>
      <textarea
        rows={2}
        value={draft.q || ''}
        onChange={(e) => onChange({ q: e.target.value })}
        className="input-base w-full text-[13px] mb-2"
      />
      <div className="grid grid-cols-2 gap-2 mb-2">
        <select className="input-base text-[12.5px]" value={draft.topic || ''} onChange={(e) => onChange({ topic: e.target.value })}>
          <option value="">Pick a topic</option>
          {topicsList.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input-base text-[12.5px]" value={draft.difficulty || 'Medium'} onChange={(e) => onChange({ difficulty: e.target.value })}>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {draft.answerType === 'Multiple choice' && Array.isArray(draft.options) && (
        <div className="flex flex-col gap-1">
          {draft.options.map((opt, i) => (
            <div key={i} className={`flex items-center gap-1.5 rounded border px-2 py-1 ${draft.a === i ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
              <input type="radio" name={`draft-${draft._draftId}`} checked={draft.a === i} onChange={() => onChange({ a: i })} />
              <span className="text-[11px] font-semibold text-slate-500 w-4">{String.fromCharCode(65 + i)}.</span>
              <input
                className="flex-1 bg-transparent outline-none text-[12.5px] text-slate-900"
                value={opt}
                onChange={(e) => {
                  const opts = [...draft.options];
                  opts[i] = e.target.value;
                  onChange({ options: opts });
                }}
              />
            </div>
          ))}
        </div>
      )}
      {draft.answerType === 'Typed response' && (
        <input
          className="input-base w-full text-[12.5px]"
          value={draft.typedAnswer || ''}
          onChange={(e) => onChange({ typedAnswer: e.target.value })}
          placeholder="Expected typed answer"
        />
      )}
      {draft.answerType === 'Exam style' && (
        <div className="flex flex-col gap-1.5">
          <textarea
            rows={2}
            className="input-base w-full text-[12.5px]"
            value={draft.examAnswer || ''}
            onChange={(e) => onChange({ examAnswer: e.target.value })}
            placeholder="Model answer"
          />
          <input
            className="input-base w-full text-[12.5px]"
            value={(draft.examKeywords || []).join(', ')}
            onChange={(e) => onChange({ examKeywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            placeholder="Required keywords, comma separated"
          />
        </div>
      )}
      {draft.answerType === 'Drawing' && (
        <textarea rows={2} className="input-base w-full text-[12.5px]" value={draft.examAnswer || ''} onChange={(e) => onChange({ examAnswer: e.target.value })} placeholder="What the drawing must show" />
      )}
      <div className="mt-2">
        <MarkSchemeEditor value={draft.markScheme || []} onChange={(v) => onChange({ markScheme: v })} marks={draft.marks} compact />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Field wrapper
// --------------------------------------------------------------------------

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] tracking-[0.14em] uppercase font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}


// Examiner-style marking scheme: one line per mark point with its marks.
// Used by the single-question form and the bulk-import drafts.
export function MarkSchemeEditor({ value = [], onChange, marks, compact = false }) {
  const rows = Array.isArray(value) ? value : [];
  const total = schemeTotal(rows, 0);
  const set = (i, patch) => onChange(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const add = () => onChange([...rows, { point: '', marks: 1 }]);
  const remove = (i) => onChange(rows.filter((_, k) => k !== i));
  return (
    <div className={`rounded-lg border border-[color:var(--color-border)] ${compact ? 'bg-white p-2.5' : 'bg-slate-50/60 p-3'}`} data-testid="mark-scheme-editor">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[11px] tracking-[0.14em] uppercase font-semibold text-slate-600 inline-flex items-center gap-1.5">
          <ClipboardCheck className="w-4 h-4 text-blue-600" /> Marking scheme
          <span className="font-normal normal-case tracking-normal text-slate-500">· {total} mark{total === 1 ? '' : 's'}{marks && Number(marks) !== total && total > 0 ? ` (question says ${marks})` : ''}</span>
        </div>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-700 hover:text-blue-900" data-testid="mark-scheme-add">
          <Plus className="w-4 h-4" /> Add mark point
        </button>
      </div>
      {rows.length === 0 ? (
        <div className="text-[12px] text-slate-500">Optional but recommended: list what earns each mark (e.g. "1 — correct formula", "2 — substitution and answer with units"). The AI examiner marks student answers against these points.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input type="number" min="1" max="20" value={r.marks ?? 1} onChange={(e) => set(i, { marks: e.target.value })} className="input-base w-16 text-[12.5px] text-center" aria-label="Marks" />
              <input value={r.point || ''} onChange={(e) => set(i, { point: e.target.value })} placeholder={`Mark point ${i + 1} — what the student must show`} className="input-base flex-1 text-[12.5px]" />
              <button type="button" onClick={() => remove(i)} className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0" aria-label="Remove mark point"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
