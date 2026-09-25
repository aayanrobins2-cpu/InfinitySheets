import React, { useEffect, useRef, useState } from 'react';
import { HeartHandshake, X, Globe2, Sparkles } from 'lucide-react';
import { isPlus } from '../lib/entitlements';
import { useApp } from '../context/AppContext';
import { detectVpn } from '../lib/vpn';
import { detectAdblock, adblockAcked, ackAdblock } from '../lib/adblock';
import { openPlusBanner, PlusMark } from './app/PlusUpgradeBanner';

// The two things that stop ads paying for the site: an ad blocker, and a VPN
// that makes the traffic worthless to advertisers.
//   - Ad blocker: a nudge with a "continue anyway" out, re-asked every few days
//     while the blocker stays on (detection: lib/adblock.js).
//   - VPN: a wall. It cannot be dismissed or clicked past — the only ways on
//     are turning the VPN off (then reload) or InfinitySheets+. It is checked
//     on every load and nothing about it is remembered, so an old "continue"
//     from before the wall existed does not let anyone skip it.
// InfinitySheets+ members (and admins) never see either — they pay for the site.

export default function AdblockNotice() {
  const { state } = useApp();
  const plus = isPlus(state);
  const [kind, setKind] = useState(null); // 'adblock' | 'vpn' | null

  useEffect(() => {
    // Paying members see no ads, so there is nothing to ask them for.
    if (plus) { setKind(null); return undefined; }
    let alive = true;
    (async () => {
      // The VPN wall first: it is the one that cannot be dismissed.
      const vpn = await detectVpn();
      if (!alive) return;
      if (vpn?.likely) { setKind('vpn'); return; }
      if (!adblockAcked()) {
        const blocked = await detectAdblock();
        if (alive && blocked) setKind('adblock');
      }
    })();
    return () => { alive = false; };
  }, [plus]);

  const isVpn = kind === 'vpn';
  const dismiss = () => { ackAdblock(); setKind(null); };
  // Show them exactly what + includes. The ad-blocker nudge closes; the VPN
  // wall stays underneath the banner, so closing the banner lands them back
  // on the wall, not in the app.
  const goPlus = () => {
    if (!isVpn) { ackAdblock(); setKind(null); }
    openPlusBanner();
  };

  return <NoticeCard kind={kind} isVpn={isVpn} dismiss={dismiss} goPlus={goPlus} />;
}

function NoticeCard({ kind, isVpn, dismiss, goPlus }) {
  const cardRef = useRef(null);

  // The VPN wall: no scrolling the page behind it, and keyboard focus stays
  // inside it, so there is no way to reach the app underneath.
  useEffect(() => {
    if (!kind || !isVpn) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const trap = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return; }
      if (e.key !== 'Tab' || !cardRef.current) return;
      // The + banner opens on top of the wall; leave its own focus alone.
      if (document.querySelector('[data-testid="plus-banner"]')) return;
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
  }, [kind, isVpn]);

  if (!kind) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role={isVpn ? 'alertdialog' : 'dialog'} aria-modal="true" data-testid={isVpn ? 'vpn-notice' : 'adblock-notice'}>
      <div ref={cardRef} className="w-full max-w-[440px] rounded-2xl bg-[color:var(--color-card)] border border-[color:var(--color-border)] shadow-2xl p-6 text-center">
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
              But it&rsquo;s fine if you love your VPN. Just get InfinitySheets<PlusMark />.
            </>
          ) : (
            <>
              Ads help us fund our mission, because, as it turns out, putting a website
              on the internet is <span className="font-semibold text-slate-700">preetttttyyyyyyy</span> expensive.
              But it&rsquo;s fine if you hate ads. Just get InfinitySheets<PlusMark />.
            </>
          )}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={goPlus}
            className="btn-violet w-full py-2.5 rounded-lg text-[14px] font-semibold inline-flex items-center justify-center gap-1.5"
            data-testid={isVpn ? 'vpn-plus' : 'adblock-plus'}
          >
            <Sparkles className="w-4 h-4" /> Get InfinitySheets<PlusMark className="text-[15px]" />
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-outline-dark w-full py-2.5 rounded-lg text-[13.5px] font-semibold"
            data-testid={isVpn ? 'vpn-reload' : 'adblock-reload'}
          >
            {isVpn ? 'I’ve turned my VPN off — reload' : 'I’ve turned it off — reload'}
          </button>
          {!isVpn && (
            <button
              type="button"
              onClick={dismiss}
              className="text-[12px] text-slate-500 hover:text-slate-700 inline-flex items-center justify-center gap-1"
              data-testid="adblock-continue"
            >
              <X className="w-3.5 h-3.5" /> Continue without disabling
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
