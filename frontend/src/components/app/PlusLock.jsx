import React from 'react';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';
import { isPlus, PLUS_FEATURES, FREE_ALLOWANCE, freeUsesLeft, recordUse, allowanceText } from '../../lib/entitlements';
import { openPlusBanner, PlusMark, PlusName } from './PlusUpgradeBanner';

// One place to show and enforce InfinitySheets+ locks.
export function usePlus() {
  const { state } = useApp();
  const plus = isPlus(state);
  // Nothing is locked for free accounts any more: every feature is usable and
  // the AI ones are rationed by daily credits, enforced by the ai-chat
  // function (the upgrade banner opens when they run out). `isPlus` here
  // therefore means "can use it" — true for everyone. The only hard limit
  // left is the number of subjects (FREE_SUBJECT_LIMIT, in the course wizard).
  const requirePlus = (featureKey) => {
    if (plus || featureKey !== 'moreSubjects') return true;
    openPlusBanner(featureKey);
    return false;
  };
  const usesLeft = () => Infinity;
  return { isPlus: true, requirePlus, usesLeft, reallyPlus: plus };
}

// Small "InfinitySheets+" lock chip shown next to a locked control. It
// renders nothing for a + member, so no caller can leave a lock on a
// feature the student already has.
export function PlusBadge({ className = '' }) {
  const { isPlus: plus } = usePlus();
  if (plus) return null;
  return (
    <span className={`inline-flex items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[11px] leading-none ${className}`} title="InfinitySheets+ only">
      <PlusMark />
    </span>
  );
}

// Wraps a control so free users see it greyed with a lock; clicking shows the
// upgrade prompt instead of doing the action. Plus users get the children as-is.
export function PlusLock({ children }) {
  return children;
}

// A full-page upgrade screen for a locked route (Flashcards / Smart Learning).
export function PlusUpgradeScreen({ feature }) {
  const label = PLUS_FEATURES[feature] || 'This feature';
  return (
    <div className="max-w-[560px] mx-auto mt-10 rounded-2xl border border-violet-200 bg-violet-50/50 p-8 text-center" data-testid="plus-upgrade">
      <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white flex items-center justify-center mx-auto mb-4"><Sparkles className="w-7 h-7" /></div>
      <h2 className="text-[20px] font-semibold text-slate-900">{label} is part of <PlusName /></h2>
      <p className="text-[13.5px] text-slate-600 mt-2 leading-snug">InfinitySheets+ unlocks the AI-powered tools — study plans, the coach, flashcards, worksheet diagnosis, ask-a-doubt, custom courses and more than {6} subjects.</p>
      <button type="button" onClick={() => openPlusBanner(feature)} className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 text-white px-4 py-2 text-[13px] font-semibold hover:bg-violet-700" data-testid="plus-upgrade-cta">See what <PlusName /> includes</button>
    </div>
  );
}

// A locked page a free user can still look at: the real page renders greyed
// out and non-interactive under a click-catching overlay, with a sticky lock
// banner. Scrolling works, so they can see everything the tier offers.
const PASS_KEY = 'infinitysheets_plus_pass';
const passDay = () => new Date().toDateString();
function hasPass(feature) { try { return JSON.parse(window.localStorage.getItem(PASS_KEY) || '{}')[feature] === passDay(); } catch (_) { return false; } }
function givePass(feature) { try { const p = JSON.parse(window.localStorage.getItem(PASS_KEY) || '{}'); p[feature] = passDay(); window.localStorage.setItem(PASS_KEY, JSON.stringify(p)); } catch (_) { /* ignore */ } }

export function PlusPreview({ children }) {
  return children;
}
