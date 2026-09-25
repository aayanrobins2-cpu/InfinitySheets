import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Mic, Square, Upload, Trash2, Loader2, Play, Pause, ExternalLink, Music } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { track } from '../../lib/analytics';
import { uploadNoteFile, noteFileUrl, deleteNoteFile } from '../../lib/dataStore';
import { isSupabaseConfigured } from '../../lib/supabase';

const PDF_MAX = 25 * 1024 * 1024;
const AUDIO_MAX = 25 * 1024 * 1024;

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const fmtSize = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const fmtDur = (s) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : '');

function extFor(file) {
  const m = /\.([a-z0-9]+)$/i.exec(file.name || '');
  if (m) return m[1].toLowerCase();
  if (file.type === 'application/pdf') return 'pdf';
  if (/webm/.test(file.type)) return 'webm';
  if (/ogg/.test(file.type)) return 'ogg';
  if (/mp4|m4a/.test(file.type)) return 'm4a';
  if (/wav/.test(file.type)) return 'wav';
  return 'mp3';
}

// Notes per subject: PDF notes you upload, audio notes you record here or
// upload. Files sit in the private `notes` bucket; only you can read them.
export default function Notes({ subject, topics, board }) {
  const { state, addNote, removeNote } = useApp();
  const userId = state.user?.id;
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const pdfInput = useRef(null);
  const audioInput = useRef(null);

  const mine = useMemo(() => (state.notes || []).filter((n) => n.subject === subject), [state.notes, subject]);
  const pdfs = mine.filter((n) => n.kind === 'pdf');
  const audios = mine.filter((n) => n.kind === 'audio');

  const save = async (file, kind, extra = {}) => {
    if (!isSupabaseConfigured || !userId) { toast.error('Sign in to save notes'); return; }
    const limit = kind === 'pdf' ? PDF_MAX : AUDIO_MAX;
    if (file.size > limit) { toast.error(`${file.name || 'That file'} is over ${fmtSize(limit)}`); return; }
    setBusy(true);
    try {
      const id = uid();
      const path = await uploadNoteFile(userId, id, file, extFor(file));
      addNote({ id, subject, topic: topic || null, kind, name: file.name || (kind === 'audio' ? `Audio note ${new Date().toLocaleString()}` : 'Notes.pdf'), path, size: file.size, mime: file.type || null, createdAt: new Date().toISOString(), ...extra });
      track('note_added', { kind, subject });
      toast.success(kind === 'pdf' ? 'Notes saved' : 'Audio note saved');
    } catch (e) {
      toast.error(e?.message || 'Could not upload that file');
    } finally { setBusy(false); }
  };

  const onPdf = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) { toast.error('Notes must be a PDF'); return; }
    await save(f, 'pdf');
  };
  const onAudioFile = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (!/^audio\//.test(f.type)) { toast.error('Pick an audio file (mp3, m4a, wav, ogg…)'); return; }
    await save(f, 'audio');
  };
  const remove = async (n) => {
    try { await deleteNoteFile(n.path); } catch (_) { /* metadata still goes */ }
    removeNote(n.id);
    toast.success('Removed');
  };

  return (
    <div className="max-w-[900px]" data-testid="notes-page">
      <p className="text-[14px] text-zinc-500 mb-4">Your own notes for {subject}: upload PDFs, record audio notes on the go. Blurting can use any PDF here as its source.</p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select className="input-base !w-auto max-w-[260px]" value={topic} onChange={(e) => setTopic(e.target.value)} data-testid="notes-topic">
          <option value="">Whole subject</option>
          {topics.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input ref={pdfInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onPdf} data-testid="notes-pdf-input" />
        <input ref={audioInput} type="file" accept="audio/*" className="hidden" onChange={onAudioFile} data-testid="notes-audio-input" />
        <button type="button" onClick={() => pdfInput.current?.click()} disabled={busy} className="btn-violet inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold disabled:opacity-60" data-testid="notes-add-pdf">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Add PDF notes</button>
        <button type="button" onClick={() => audioInput.current?.click()} disabled={busy} className="btn-outline-dark inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] disabled:opacity-60" data-testid="notes-add-audio"><Upload className="w-4 h-4" /> Upload audio</button>
        <Recorder disabled={busy} onDone={(blob, seconds) => save(new File([blob], `Audio note ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.${/ogg/.test(blob.type) ? 'ogg' : /mp4/.test(blob.type) ? 'm4a' : 'webm'}`, { type: blob.type }), 'audio', { durationSec: seconds })} />
      </div>

      {mine.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] p-10 text-center bg-slate-50/50" data-testid="notes-empty">
          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <div className="text-[15px] font-semibold text-slate-800">No notes for {subject} yet</div>
          <div className="text-[13px] text-slate-500 mt-1">Add a PDF of your class notes, or tap Record and talk through a topic.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <section>
            <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-violet-700 mb-2 inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> PDF notes · {pdfs.length}</div>
            <div className="flex flex-col gap-2" data-testid="notes-pdf-list">
              {pdfs.length === 0 && <div className="text-[12.5px] text-slate-500">None yet.</div>}
              {pdfs.map((n) => <PdfRow key={n.id} n={n} onRemove={() => remove(n)} />)}
            </div>
          </section>
          <section>
            <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-blue-700 mb-2 inline-flex items-center gap-1.5"><Music className="w-3.5 h-3.5" /> Audio notes · {audios.length}</div>
            <div className="flex flex-col gap-2" data-testid="notes-audio-list">
              {audios.length === 0 && <div className="text-[12.5px] text-slate-500">None yet.</div>}
              {audios.map((n) => <AudioRow key={n.id} n={n} onRemove={() => remove(n)} />)}
            </div>
          </section>
        </div>
      )}
      <div className="text-[11.5px] text-slate-400 mt-5">{board} · Files are private to your account. Up to 25 MB each.</div>
    </div>
  );
}

function Meta({ n }) {
  return <div className="text-[11.5px] text-slate-500 mt-0.5">{n.topic || 'Whole subject'} · {fmtSize(n.size || 0)}{n.durationSec ? ` · ${fmtDur(n.durationSec)}` : ''} · {new Date(n.createdAt).toLocaleDateString()}</div>;
}

function PdfRow({ n, onRemove }) {
  const [opening, setOpening] = useState(false);
  const open = async () => {
    setOpening(true);
    try { const url = await noteFileUrl(n.path); window.open(url, '_blank', 'noopener'); }
    catch (e) { toast.error(e?.message || 'Could not open that file'); }
    finally { setOpening(false); }
  };
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-white px-3.5 py-3 flex items-center gap-3" data-testid="notes-pdf-row">
      <div className="w-9 h-9 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium text-slate-900 truncate">{n.name}</div>
        <Meta n={n} />
      </div>
      <button type="button" onClick={open} disabled={opening} className="w-8 h-8 rounded-md text-slate-500 hover:text-violet-700 hover:bg-violet-50 flex items-center justify-center" aria-label="Open">{opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}</button>
      <button type="button" onClick={onRemove} className="w-8 h-8 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
    </div>
  );
}

function AudioRow({ n, onRemove }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const ref = useRef(null);
  const toggle = async () => {
    if (!url) {
      setLoading(true);
      try { setUrl(await noteFileUrl(n.path)); setPlaying(true); }
      catch (e) { toast.error(e?.message || 'Could not load that note'); }
      finally { setLoading(false); }
      return;
    }
    const a = ref.current; if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  };
  useEffect(() => { if (url && ref.current) ref.current.play().catch(() => setPlaying(false)); }, [url]);
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-white px-3.5 py-3" data-testid="notes-audio-row">
      <div className="flex items-center gap-3">
        <button type="button" onClick={toggle} className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 hover:bg-blue-700" aria-label={playing ? 'Pause' : 'Play'}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}</button>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium text-slate-900 truncate">{n.name}</div>
          <Meta n={n} />
        </div>
        <button type="button" onClick={onRemove} className="w-8 h-8 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
      </div>
      {url && <audio ref={ref} src={url} controls className="w-full mt-2 h-9" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />}
    </div>
  );
}

// In-browser voice recorder (MediaRecorder). Shows elapsed time while
// recording; hands back the blob + duration when stopped.
function Recorder({ onDone, disabled }) {
  const [rec, setRec] = useState(null);
  const [secs, setSecs] = useState(0);
  const chunks = useRef([]);
  const timer = useRef(null);
  const secsRef = useRef(0);
  const supported = typeof window !== 'undefined' && !!(navigator.mediaDevices && window.MediaRecorder);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => window.MediaRecorder.isTypeSupported(m)) || '';
      const r = new window.MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => { if (e.data && e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timer.current);
        const blob = new Blob(chunks.current, { type: r.mimeType || 'audio/webm' });
        setRec(null);
        if (blob.size > 0) onDone(blob, secsRef.current);
        setSecs(0);
      };
      r.start(1000);
      setRec(r);
      setSecs(0);
      secsRef.current = 0;
      timer.current = setInterval(() => { secsRef.current += 1; setSecs(secsRef.current); }, 1000);
    } catch (e) {
      toast.error(e?.name === 'NotAllowedError' ? 'Microphone access was blocked' : 'Could not start recording');
    }
  };
  const stop = () => { try { rec?.stop(); } catch (_) { /* ignore */ } };
  useEffect(() => () => { clearInterval(timer.current); try { rec?.stream?.getTracks().forEach((t) => t.stop()); } catch (_) { /* ignore */ } }, [rec]);

  if (!supported) return null;
  return rec ? (
    <button type="button" onClick={stop} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold bg-rose-600 text-white hover:bg-rose-700" data-testid="notes-record-stop">
      <Square className="w-3.5 h-3.5" /> Stop · {fmtDur(secs) || '0:00'}
      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
    </button>
  ) : (
    <button type="button" onClick={start} disabled={disabled} className="btn-outline-dark inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] disabled:opacity-60" data-testid="notes-record"><Mic className="w-4 h-4" /> Record</button>
  );
}
