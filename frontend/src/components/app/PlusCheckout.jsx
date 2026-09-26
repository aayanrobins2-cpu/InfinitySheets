import React, { useState } from 'react';
import { Check, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isPlus, PLUS_PITCH, PLUS_PRICING, PLUS_CHECKOUT_URLS } from '../../lib/entitlements';
import { PlusMark } from './PlusUpgradeBanner';

// The InfinitySheets+ payment page (#plus). The student picks monthly or
// yearly and is sent to the hosted checkout for that plan. Card details are
// only ever entered on the payment provider's own page — never here. Until a
// checkout link is configured (REACT_APP_PLUS_CHECKOUT_MONTHLY / _YEARLY),
// the button says checkout is opening soon instead of taking payment.
export default function PlusCheckout() {
  const { state } = useApp();
  const [plan, setPlan] = useState('yearly');
  const already = isPlus(state);
  const price = PLUS_PRICING[plan];
  const url = PLUS_CHECKOUT_URLS[plan];
  const [notice, setNotice] = useState('');

  const checkout = () => {
    if (!url) { setNotice('Secure checkout is opening soon — we will let you know the moment you can upgrade.'); return; }
    // The account id travels with the checkout so the payment is matched to
    // this account when it completes.
    const u = new URL(url);
    if (state.user?.id) u.searchParams.set('client_reference_id', state.user.id);
    if (state.user?.email) u.searchParams.set('prefilled_email', state.user.email);
    window.location.href = u.toString();
  };

  return (
    <div className="max-w-[980px]" data-testid="plus-checkout">
      <p className="text-[14px] text-slate-500 mb-6">Everything in the free plan, no ads, and every AI tool without limits.</p>
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 items-start">
        <div className="rounded-2xl border border-violet-300/50 bg-white p-6">
          <div className="text-[11px] tracking-[0.14em] uppercase font-semibold text-violet-600">What you get</div>
          <div className="mt-2 text-[30px] font-semibold tracking-tight text-slate-900">InfinitySheets<PlusMark className="text-[30px]" /></div>
          <ul className="mt-5 flex flex-col gap-2.5">
            {PLUS_PITCH.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 mt-0.5 text-violet-600 shrink-0" strokeWidth={2.6} />
                <span className="text-[14px] text-slate-700">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-6">
          {already ? (
            <div className="text-center py-6" data-testid="plus-already">
              <div className="text-[18px] font-semibold text-slate-900">You already have InfinitySheets<PlusMark className="text-[18px]" /></div>
              <p className="text-[13px] text-slate-500 mt-2">Every feature is unlocked on this account.</p>
            </div>
          ) : (
            <>
              <div className="text-[11px] tracking-[0.14em] uppercase font-semibold text-slate-500">Choose a plan</div>
              <div className="mt-3 flex flex-col gap-2.5" role="radiogroup" aria-label="Billing period">
                {['monthly', 'yearly'].map((k) => {
                  const p = PLUS_PRICING[k];
                  const on = plan === k;
                  return (
                    <button key={k} type="button" role="radio" aria-checked={on} onClick={() => { setPlan(k); setNotice(''); }} className={`text-left rounded-xl border px-4 py-3.5 transition-colors ${on ? 'border-violet-500 bg-violet-50/60 ring-1 ring-violet-400/40' : 'border-[color:var(--color-border)] hover:bg-slate-50'}`} data-testid={`plus-plan-${k}`}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[14.5px] font-semibold text-slate-900">{p.label}</span>
                        <span className="text-[16px] font-semibold text-slate-900 tabular-nums">{p.price}<span className="text-[12px] font-normal text-slate-500"> / {p.per}</span></span>
                      </div>
                      {p.note && <div className="text-[12px] text-emerald-700 mt-0.5">{p.note}</div>}
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={checkout} className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg text-[15px] font-semibold btn-violet" data-testid="plus-checkout-go">
                <Lock className="w-4 h-4" /> Continue to secure checkout · {price.price} <ArrowRight className="w-4 h-4" />
              </button>
              {notice && <p className="text-[12.5px] text-slate-600 mt-3 text-center" role="status" data-testid="plus-checkout-soon">{notice}</p>}
              <div className="mt-4 text-[12px] text-slate-500 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Payment is handled by our payment provider on their secure page — your card details never touch InfinitySheets. Cancel anytime; you keep + until the end of the period you paid for.</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
