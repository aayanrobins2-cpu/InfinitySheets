import React, { useEffect, useState } from 'react';
import { isOffensiveName, OFFENSIVE_NAME_MESSAGE } from '../../lib/nameFilter';
import { X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { EXAM_TRACKS } from '../../data/mock';
import GoogleAuthButton from './GoogleAuthButton';

/**
 * Real email/password + Google auth backed by Supabase. Opens from any of the
 * existing "Start Free" / "Sign Up" / "Log In" CTAs (all of which point at the
 * #signup anchor). Keeps the landing untouched; renders as an overlay.
 */
export default function AuthModal({ open, initialTab = 'signup', onClose }) {
  const { apiRegister, apiLogin, apiGoogleAuth } = useApp();
  const [tab, setTab] = useState(initialTab);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', track: 'AP', password: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [emailSentTo, setEmailSentTo] = useState(null); // password OK, waiting for the emailed link
  const [resendIn, setResendIn] = useState(0);
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => { if (open) setTab(initialTab); }, [open, initialTab]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;

  const goDashboard = () => { onClose?.(); window.location.hash = '#dashboard'; };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!form.email.trim() || (form.password || '').length < 6) {
      toast.error('Enter an email and a password of at least 6 characters.');
      return;
    }
    if (isOffensiveName(form.name)) { toast.error(OFFENSIVE_NAME_MESSAGE); return; }
    setBusy(true);
    try {
      await apiRegister({ email: form.email, password: form.password, name: form.name, examTrack: form.track, subjects: [] });
      toast.success('Welcome to InfinitySheets!');
      goDashboard();
    } catch (err) {
      if (err?.code === 'email_confirmation_required') toast.info(err.message);
      else toast.error(err?.message || 'Could not create your account.');
      setBusy(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!loginForm.email.trim() || !loginForm.password) {
      toast.error('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      const res = await apiLogin({ email: loginForm.email, password: loginForm.password });
      if (res?.emailSent) {
        // Step 2: they finish signing in from the link in their inbox.
        setEmailSentTo(res.email);
        setResendIn(60);
        setBusy(false);
        return;
      }
      toast.success('Welcome back!');
      goDashboard();
    } catch (err) {
      toast.error(err?.message || 'Invalid email or password.');
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    try { await apiGoogleAuth(); }
    catch (err) { toast.error(err?.message || 'Google sign-in is not available yet.'); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" data-testid="auth-modal">
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative w-full max-w-[420px] rounded-2xl bg-white border border-slate-200 shadow-2xl p-6" data-testid="auth-panel">
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-[20px] font-semibold tracking-tight text-slate-900 mb-1">
          {tab === 'signup' ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-[13px] text-slate-500 mb-5">Save your worksheets, streak and progress across devices.</p>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <button onClick={() => setTab('signup')} data-testid="tab-signup" className={`py-2.5 rounded-lg text-[14px] font-medium transition-colors ${tab === 'signup' ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-500 hover:text-slate-900 border border-slate-300'}`}>Sign Up</button>
          <button onClick={() => setTab('login')} data-testid="tab-login" className={`py-2.5 rounded-lg text-[14px] font-medium transition-colors ${tab === 'login' ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-500 hover:text-slate-900 border border-slate-300'}`}>Log In</button>
        </div>

        <div className="mb-4">
          <GoogleAuthButton
            onCredential={handleGoogle}
            onError={(m) => toast.error(m || 'Google sign-in failed.')}
            onUnavailable={handleGoogle}
            label={tab === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
          />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] uppercase tracking-wider text-slate-500">or with email</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        {tab === 'signup' ? (
          <form onSubmit={handleSignup} className="flex flex-col gap-3">
            <Field label="Name"><input data-testid="signup-name" className="input-base" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><input data-testid="signup-email" type="email" className="input-base" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Exam track">
              <select data-testid="signup-track" className="input-base" value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })}>
                {EXAM_TRACKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Password (min 6 characters)"><input data-testid="signup-password" type="password" className="input-base" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            <button type="submit" data-testid="signup-submit" disabled={busy} className="btn-violet mt-2 py-3 rounded-lg text-[14px] font-medium disabled:opacity-60">{busy ? 'Creating\u2026' : 'Create account'}</button>
          </form>
        ) : emailSentTo ? (
          <div className="text-center py-2" data-testid="login-check-email">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3"><Mail className="w-6 h-6" /></div>
            <div className="text-[16px] font-semibold text-slate-900">Check your email</div>
            <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">Your password was right. To confirm it's you, we've sent a sign-in link to <b className="text-slate-700">{emailSentTo}</b>. Open it on this device to finish signing in.</p>
            <p className="text-[12px] text-slate-400 mt-2">Not there? Check your spam folder.</p>
            <button type="button" disabled={busy || resendIn > 0} onClick={handleLogin} className="btn-outline-dark mt-4 w-full py-2.5 rounded-lg text-[13px] font-medium disabled:opacity-50" data-testid="login-resend">
              {resendIn > 0 ? `Resend the email in ${resendIn}s` : 'Resend the email'}
            </button>
            <button type="button" onClick={() => { setEmailSentTo(null); setLoginForm({ ...loginForm, password: '' }); }} className="mt-2 text-[12.5px] text-slate-500 hover:text-slate-800">Use a different account</button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <Field label="Email"><input data-testid="login-email" type="email" className="input-base" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} /></Field>
            <Field label="Password"><input data-testid="login-password" type="password" className="input-base" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} /></Field>
            <button type="submit" data-testid="login-submit" disabled={busy} className="btn-violet mt-2 py-3 rounded-lg text-[14px] font-medium disabled:opacity-60">{busy ? 'Logging in\u2026' : 'Log in'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] tracking-[0.14em] uppercase font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}
