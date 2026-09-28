import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { isPlus } from '../../../lib/entitlements';
import { getCredits, subscribeCredits } from '../../../lib/credits';
import { fetchCredits } from '../../../lib/ai';
import { openPlusBanner } from '../PlusUpgradeBanner';

// "⚡ 18 / 30" — today's free AI credits. Hidden for InfinitySheets+ / admins.
export default function CreditsBadge() {
  const { state } = useApp();
  const plus = isPlus(state);
  const signedIn = !!state.user?.id;
  const [c, setC] = useState(getCredits());
  useEffect(() => subscribeCredits(setC), []);
  useEffect(() => { if (signedIn && !plus) fetchCredits(); }, [signedIn, plus]);
  if (plus || !signedIn || !c || c.limit == null) return null;
  const low = c.left <= Math.ceil(c.limit * 0.2);
  const resets = new Date(c.resetsAt);
  const hrs = Math.max(0, Math.round((resets.getTime() - Date.now()) / 3600000));
  return (
    <button
      type="button"
      onClick={() => openPlusBanner('aiCredits')}
      title={`${c.left} of ${c.limit} free AI credits left today — refills in about ${hrs} h. Unlimited with InfinitySheets+.`}
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[12px] font-semibold tabular-nums transition-colors ${c.left === 0 ? 'border-rose-300 text-rose-700 bg-rose-50' : low ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-[color:var(--color-border)] text-slate-600 hover:bg-slate-50'}`}
      data-testid="credits-badge"
    >
      <Zap className="w-3.5 h-3.5" /> {c.left}<span className="font-normal text-slate-400">/{c.limit}</span>
    </button>
  );
}
