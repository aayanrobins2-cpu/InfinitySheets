import React, { useEffect, useState } from 'react';
import { Check, ArrowRight, X } from 'lucide-react';
import { PLUS_FEATURES, PLUS_PITCH } from '../../lib/entitlements';

// The upgrade banner every locked control opens. It is a plain module-level
// pub/sub rather than context, so `requirePlus()` can raise it from anywhere
// (including code that is not inside a component tree).
let listener = null;
let queued = null;

/** Open the banner for a feature key (e.g. 'flashcards'). */
export function openPlusBanner(feature) {
  if (listener) listener(feature || null);
  else queued = feature || null; // raised before the banner mounted
}

// The shiny "+" used everywhere a padlock used to be.
export function PlusMark({ className = '' }) {
  return <span className={`brand-plus-text font-extrabold ${className}`} aria-hidden="true">+</span>;
}

export default function PlusUpgradeBanner() {
  const [feature, setFeature] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listener = (f) => { setFeature(f); setOpen(true); };
    if (queued !== null) { listener(queued); queued = null; }
    return () => { listener = null; };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  const label = feature ? PLUS_FEATURES[feature] : null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="InfinitySheets+"
      data-testid="plus-banner"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="w-full max-w-[460px] max-h-[88vh] overflow-auto rounded-3xl bg-[color:var(--color-card)] border border-[color:var(--color-border)] shadow-2xl p-7 relative">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
          aria-label="Close"
          data-testid="plus-banner-close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-[11px] tracking-[0.14em] uppercase font-semibold text-blue-600">
          {label ? `${label} is InfinitySheets` : 'InfinitySheets'}<PlusMark className="text-[13px] align-middle ml-0.5" />
        </div>

        <div className="flex items-baseline gap-3 mt-2">
          <span className="text-[44px] leading-none font-semibold tracking-tight text-slate-900">InfinitySheets<PlusMark className="text-[44px]" /></span>
        </div>
        <div className="text-[14px] text-slate-500 mt-1.5">Everything below, unlocked.</div>

        <ul className="mt-5 flex flex-col gap-2.5">
          {PLUS_PITCH.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" strokeWidth={2.6} />
              <span className="text-[14px] text-slate-700">{f}</span>
            </li>
          ))}
        </ul>

        <a
          href="#plus"
          onClick={() => setOpen(false)}
          className="mt-7 inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg text-[15px] font-medium bg-blue-500 hover:bg-blue-400 text-white transition-colors"
          data-testid="plus-banner-cta"
        >
          Get InfinitySheets<PlusMark className="text-[15px]" /> <ArrowRight className="w-4 h-4" />
        </a>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-3 w-full text-[12.5px] text-slate-500 hover:text-slate-700"
          data-testid="plus-banner-dismiss"
        >
          Keep using the free plan
        </button>
        <p className="mt-3 text-[11.5px] text-slate-400 text-center">The free plan keeps every core feature &mdash; worksheets, weakness analysis, predicted grades and streaks.</p>
      </div>
    </div>
  );
}
