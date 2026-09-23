import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { isPlus, PLUS_FEATURES } from '../../lib/entitlements';

// One place to show and enforce InfinitySheets+ locks.
export function usePlus() {
  const { state } = useApp();
  const plus = isPlus(state);
  // Returns true when allowed; otherwise shows the upgrade prompt and returns false.
  const requirePlus = (featureKey) => {
    if (plus) return true;
    const label = PLUS_FEATURES[featureKey] || 'This feature';
    toast(`${label} is an InfinitySheets+ feature`, { description: 'Upgrade to InfinitySheets+ to unlock it.', icon: '🔒' });
    return false;
  };
  return { isPlus: plus, requirePlus };
}

// Small "InfinitySheets+" lock chip shown next to a locked control. It
// renders nothing for a + member, so no caller can leave a lock on a
// feature the student already has.
export function PlusBadge({ className = '' }) {
  const { isPlus: plus } = usePlus();
  if (plus) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-violet-100 text-violet-700 px-1.5 py-0.5 text-[10px] font-semibold ${className}`} title="InfinitySheets+ only">
      <Lock className="w-3 h-3" /> +
    </span>
  );
}

// Wraps a control so free users see it greyed with a lock; clicking shows the
// upgrade prompt instead of doing the action. Plus users get the children as-is.
export function PlusLock({ feature, children, className = '' }) {
  const { isPlus: plus, requirePlus } = usePlus();
  if (plus) return children;
  return (
    <div className={`relative ${className}`}>
      <div className="opacity-45 pointer-events-none select-none" aria-hidden="true">{children}</div>
      <button
        type="button"
        onClick={() => requirePlus(feature)}
        className="absolute inset-0 flex items-center justify-center rounded-[inherit]"
        aria-label={`${PLUS_FEATURES[feature] || 'Feature'} — InfinitySheets+ only`}
        data-testid={`plus-lock-${feature}`}
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 text-white px-2 py-1 text-[11px] font-semibold shadow">
          <Lock className="w-3.5 h-3.5" /> InfinitySheets+
        </span>
      </button>
    </div>
  );
}

// A full-page upgrade screen for a locked route (Flashcards / Smart Learning).
export function PlusUpgradeScreen({ feature }) {
  const label = PLUS_FEATURES[feature] || 'This feature';
  return (
    <div className="max-w-[560px] mx-auto mt-10 rounded-2xl border border-violet-200 bg-violet-50/50 p-8 text-center" data-testid="plus-upgrade">
      <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white flex items-center justify-center mx-auto mb-4"><Sparkles className="w-7 h-7" /></div>
      <h2 className="text-[20px] font-semibold text-slate-900">{label} is part of InfinitySheets+</h2>
      <p className="text-[13.5px] text-slate-600 mt-2 leading-snug">InfinitySheets+ unlocks the AI-powered tools — study plans, the coach, flashcards, worksheet diagnosis, ask-a-doubt, PDF export, custom courses and more than {6} subjects.</p>
      <div className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 text-white px-4 py-2 text-[13px] font-semibold"><Lock className="w-4 h-4" /> InfinitySheets+ only</div>
    </div>
  );
}

// A locked page a free user can still look at: the real page renders greyed
// out and non-interactive under a click-catching overlay, with a sticky lock
// banner. Scrolling works, so they can see everything the tier offers.
export function PlusPreview({ feature, children }) {
  const { requirePlus } = usePlus();
  const label = PLUS_FEATURES[feature] || 'This feature';
  return (
    <div className="relative" data-testid={`plus-preview-${feature}`}>
      <div className="sticky top-2 z-20 mb-4 rounded-xl border border-violet-200 bg-violet-50/95 backdrop-blur px-4 py-2.5 flex items-center gap-2 text-[13px] text-violet-900 shadow-sm">
        <Lock className="w-4 h-4 text-violet-600 shrink-0" />
        <span><b>{label}</b> is part of InfinitySheets+. Have a look around — upgrade to use it.</span>
      </div>
      <div className="opacity-50 grayscale-[0.35] select-none pointer-events-none" aria-hidden="true">{children}</div>
      <button type="button" aria-label={`${label} — InfinitySheets+ only`} onClick={() => requirePlus(feature)} className="absolute inset-0 z-10 cursor-not-allowed bg-transparent" />
    </div>
  );
}
