import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Loader2, KeyRound, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { confirmDelete } from '../../lib/confirm';

// Two-step verification with an authenticator app (TOTP), using Supabase
// Auth's built-in MFA. Once a student turns it on, every sign-in — password
// or Google, and a reload of a half-verified session — has to be finished
// with the 6-digit code before the app opens.

const codeOk = (c) => /^\d{6}$/.test(c);

/** 'checking' | 'ok' | 'needs-code' */
export function useTwoStepGate(signedIn) {
  const [status, setStatus] = useState('checking');
  const check = useCallback(async () => {
    if (!signedIn || !isSupabaseConfigured || !supabase.auth.mfa) { setStatus('ok'); return; }
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) { setStatus('ok'); return; }
      setStatus(data.nextLevel === 'aal2' && data.currentLevel !== 'aal2' ? 'needs-code' : 'ok');
    } catch (_) { setStatus('ok'); }
  }, [signedIn]);
  useEffect(() => { check(); }, [check]);
  return { status, recheck: check };
}

/** Full-screen "enter your code" step shown after sign-in. */
export function TwoStepGate({ onVerified, onSignOut }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const verify = async (e) => {
    e?.preventDefault();
    if (!codeOk(code)) return;
    setBusy(true);
    try {
      const { data: f } = await supabase.auth.mfa.listFactors();
      const factor = (f?.totp || []).find((x) => x.status === 'verified');
      if (!factor) { onVerified(); return; }
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
      if (error) throw error;
      onVerified();
    } catch (err) {
      toast.error('That code didn’t work — check your authenticator app and try again.');
      setCode('');
    } finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Two-step verification" data-testid="twostep-gate">
      <form onSubmit={verify} className="w-full max-w-[400px] rounded-2xl bg-white border border-[color:var(--color-border)] p-6 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3"><ShieldCheck className="w-6 h-6" /></div>
        <h2 className="text-[17px] font-semibold text-slate-900">Two-step verification</h2>
        <p className="text-[13px] text-slate-500 mt-1.5">Enter the 6-digit code from your authenticator app.</p>
        <input
          autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6}
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="input-base mt-4 text-center text-[22px] tracking-[0.4em] font-semibold tabular-nums" placeholder="••••••" aria-label="6-digit code"
          data-testid="twostep-code"
        />
        <button type="submit" disabled={busy || !codeOk(code)} className="btn-violet mt-4 w-full py-2.5 rounded-lg text-[14px] font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2" data-testid="twostep-verify">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Verify
        </button>
        <button type="button" onClick={onSignOut} className="mt-3 text-[12.5px] text-slate-500 hover:text-slate-800">Sign out</button>
      </form>
    </div>
  );
}

/** Settings → Security: turn two-step verification on or off. */
export function TwoStepSettings() {
  const [factors, setFactors] = useState(null); // verified TOTP factors
  const [setup, setSetup] = useState(null);     // { id, qr, secret } while enrolling
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const available = isSupabaseConfigured && !!supabase.auth.mfa;

  const load = useCallback(async () => {
    if (!available) return;
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp || []).filter((f) => f.status === 'verified'));
  }, [available]);
  useEffect(() => { load(); }, [load]);

  const start = async () => {
    setBusy(true);
    try {
      // Clear any half-finished setup first (Supabase allows only a few).
      const { data: all } = await supabase.auth.mfa.listFactors();
      for (const f of (all?.all || []).filter((x) => x.status !== 'verified')) await supabase.auth.mfa.unenroll({ factorId: f.id });
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `InfinitySheets ${Date.now()}` });
      if (error) throw error;
      setSetup({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (err) {
      toast.error(err.message || 'Could not start two-step setup.');
    } finally { setBusy(false); }
  };

  const confirm = async (e) => {
    e?.preventDefault();
    if (!setup || !codeOk(code)) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: setup.id, code });
      if (error) throw error;
      toast.success('Two-step verification is on');
      setSetup(null); setCode('');
      load();
    } catch (err) {
      toast.error('That code didn’t work — scan the QR code again and use the newest code.');
    } finally { setBusy(false); }
  };

  const turnOff = async (f) => {
    if (!confirmDelete('two-step verification from your account')) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id });
      if (error) throw error;
      toast.success('Two-step verification is off');
      load();
    } catch (err) {
      toast.error(err.message?.includes('aal2') ? 'Sign out and back in with your code first, then turn it off.' : (err.message || 'Could not turn it off.'));
    } finally { setBusy(false); }
  };

  if (!available) return null;
  const on = (factors || []).length > 0;
  return (
    <section className="rounded-2xl border border-[color:var(--color-border)] bg-white p-5" data-testid="twostep-settings">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-100 text-blue-700"><ShieldCheck className="w-5 h-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-semibold text-slate-900">Two-step verification</div>
          <div className="text-[12.5px] text-slate-500 mt-0.5">
            {on ? 'On — signing in asks for a code from your authenticator app.' : 'Add a second step to sign-in: a 6-digit code from an authenticator app (Google Authenticator, Authy, 1Password…).'}
          </div>
        </div>
        {!on && !setup && (
          <button type="button" onClick={start} disabled={busy || factors === null} className="btn-violet inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold shrink-0 disabled:opacity-50" data-testid="twostep-start">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Turn on
          </button>
        )}
      </div>

      {setup && (
        <form onSubmit={confirm} className="mt-4 grid sm:grid-cols-[180px_1fr] gap-4 items-start" data-testid="twostep-setup">
          <img src={setup.qr} alt="QR code to add InfinitySheets to your authenticator app" className="w-[180px] h-[180px] rounded-lg bg-white p-2 border border-[color:var(--color-border)]" />
          <div className="text-[13px] text-slate-700">
            <ol className="list-decimal pl-4 space-y-1.5">
              <li>Open your authenticator app and scan this QR code.</li>
              <li>Can't scan? Enter this key instead: <code className="text-[12px] break-all bg-slate-100 rounded px-1.5 py-0.5">{setup.secret}</code></li>
              <li>Type the 6-digit code it shows:</li>
            </ol>
            <div className="flex gap-2 mt-2">
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="input-base w-[140px] text-center tracking-[0.3em] font-semibold tabular-nums" placeholder="123456" aria-label="6-digit code" data-testid="twostep-setup-code" />
              <button type="submit" disabled={busy || !codeOk(code)} className="btn-violet px-4 rounded-lg text-[13px] font-semibold disabled:opacity-50" data-testid="twostep-confirm">Confirm</button>
              <button type="button" onClick={() => { setSetup(null); setCode(''); }} className="text-[12.5px] text-slate-500 hover:text-slate-800 px-2">Cancel</button>
            </div>
          </div>
        </form>
      )}

      {on && (
        <ul className="mt-4 flex flex-col gap-2">
          {factors.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--color-border)] px-3 py-2">
              <span className="text-[13px] text-slate-700 inline-flex items-center gap-2"><KeyRound className="w-4 h-4 text-emerald-600" /> Authenticator app</span>
              <button type="button" onClick={() => turnOff(f)} disabled={busy} className="inline-flex items-center gap-1 text-[12.5px] text-rose-700 hover:text-rose-900" data-testid="twostep-off"><Trash2 className="w-4 h-4" /> Turn off</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
