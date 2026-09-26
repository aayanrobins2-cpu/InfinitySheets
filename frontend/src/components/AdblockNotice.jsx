import React, { useEffect, useRef, useState } from 'react';
import { HeartHandshake, Globe2, Check, Sparkles, RotateCcw } from 'lucide-react';
import { isPlus, PLUS_PITCH } from '../lib/entitlements';
import { useApp } from '../context/AppContext';
import { detectVpn } from '../lib/vpn';
import { detectAdblock } from '../lib/adblock';
import { PlusMark, PlusName } from './app/PlusUpgradeBanner';

// The two things that stop ads paying for the site — an ad blocker, or a VPN
// that makes the traffic worthless to advertisers — put up a wall. It cannot
// be dismissed or clicked past: no close button, the backdrop and Escape do
// nothing, the page underneath can't scroll, and keyboard focus stays inside.
// The only ways on are turning the blocker / VPN off and reloading, or
// InfinitySheets+ — whose full feature list is shown right in the wall.
// Both checks run on every load; nothing is remembered.
// InfinitySheets+ members (and admins) never see it — they pay for the site.
export default function AdblockNotice() {
  const { state } = useApp();
  const plus = isPlus(state);
  const [kind, setKind] = useState(null); // 'adblock' | 'vpn' | null

  useEffect(() => {
    if (plus) { setKind(null); return undefined; }
    let alive = true;
    (async () => {
      // Both checks at once; a VPN takes precedence in the wording.
      const [vpn, blocked] = await Promise.all([detectVpn(), detectAdblock()]);
      if (!alive) return;
      if (vpn?.likely) setKind('vpn');
      else if (blocked) setKind('adblock');
    })();
    return () => { alive = false; };
  }, [plus]);

  return <Wall kind={kind} />;
}

function Wall({ kind }) {
  const cardRef = useRef(null);
  const [askedPlus, setAskedPlus] = useState(false);
  const isVpn = kind === 'vpn';

  // Lock the page behind it and keep focus inside.
  useEffect(() => {
    if (!kind) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const trap = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return; }
      if (e.key !== 'Tab' || !cardRef.current) return;
      const f = cardRef.current.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0]; const last = f[f.length - 1];
      if (!cardRef.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trap, true);
    setTimeout(() => cardRef.current?.querySelector('button')?.focus(), 0);
    return () => { document.body.style.overflow = prevOverflow; document.removeEventListener('keydown', trap, true); };
  }, [kind]);

  if (!kind) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-label={isVpn ? 'VPN detected' : 'Ad blocker detected'}
      data-testid={isVpn ? 'vpn-notice' : 'adblock-notice'}
    >
      <div ref={cardRef} className="w-full max-w-[480px] max-h-[92vh] overflow-auto rounded-3xl bg-[color:var(--color-card)] border border-[color:var(--color-border)] shadow-2xl p-6 sm:p-7">
        <div className="text-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${isVpn ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
            {isVpn ? <Globe2 className="w-6 h-6" /> : <HeartHandshake className="w-6 h-6" />}
          </div>
          <h2 className="text-[17px] font-semibold text-slate-900">
            {isVpn ? 'Whoops! Looks like you’re on a VPN.' : 'Whoops! Looks like you’re using an ad blocker.'}
          </h2>
          <p className="text-[13.5px] text-slate-500 mt-2 leading-relaxed">
            {isVpn ? (
              <>
                Ads help us fund our mission, and ads shown through a VPN are worth
                roughly nothing to us &mdash; because, as it turns out, putting a website on the
                internet is <span className="font-semibold text-slate-700">preetttttyyyyyyy</span> expensive.
                But it&rsquo;s fine if you love your VPN. Just get <PlusName />.
              </>
            ) : (
              <>
                Ads help us fund our mission, because, as it turns out, putting a website
                on the internet is <span className="font-semibold text-slate-700">preetttttyyyyyyy</span> expensive.
                But it&rsquo;s fine if you hate ads. Just get <PlusName />.
              </>
            )}
          </p>
        </div>

        {/* The InfinitySheets+ banner, right in the wall. */}
        <div className="mt-5 rounded-2xl border border-[color:var(--color-border)] p-5" data-testid="wall-plus-banner">
          <div className="text-[11px] tracking-[0.14em] uppercase font-semibold text-blue-600"><PlusName /></div>
          <div className="text-[24px] leading-tight font-semibold tracking-tight text-slate-900 mt-1">
            <PlusName />
          </div>
          <div className="text-[13px] text-slate-500 mt-1">No ads, and everything below unlocked.</div>
          <ul className="mt-4 flex flex-col gap-2">
            {PLUS_PITCH.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" strokeWidth={2.6} />
                <span className="text-[13px] text-slate-700">{f}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setAskedPlus(true)}
            className="btn-violet mt-5 w-full py-2.5 rounded-lg text-[14px] font-semibold inline-flex items-center justify-center gap-1.5"
            data-testid={isVpn ? 'vpn-plus' : 'adblock-plus'}
          >
            <Sparkles className="w-4 h-4" /> Get <PlusName />
          </button>
          {askedPlus && (
            <p className="text-[12px] text-slate-500 mt-2 text-center" data-testid="wall-plus-soon" role="status">
              InfinitySheets+ checkout is opening soon. Until then, turn {isVpn ? 'your VPN' : 'your ad blocker'} off to keep studying.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-outline-dark mt-3 w-full py-2.5 rounded-lg text-[13.5px] font-semibold inline-flex items-center justify-center gap-1.5"
          data-testid={isVpn ? 'vpn-reload' : 'adblock-reload'}
        >
          <RotateCcw className="w-4 h-4" /> {isVpn ? 'I’ve turned my VPN off — reload' : 'I’ve turned it off — reload'}
        </button>
      </div>
    </div>
  );
}
