import React, { useEffect, useState } from 'react';
import { HeartHandshake, X, Globe2, Sparkles } from 'lucide-react';
import { isPlus } from '../lib/entitlements';
import { useApp } from '../context/AppContext';
import { detectVpn } from '../lib/vpn';

// A gentle nudge for the two things that stop ads paying for the site: an ad
// blocker, and a VPN that makes the traffic worthless to advertisers. Neither
// ever blocks the app — there is always a "continue anyway" out, we ask once,
// and InfinitySheets+ members are never asked at all (they already pay for it).
const ACK_KEY = 'infinitysheets_adblock_ack';
const VPN_ACK_KEY = 'infinitysheets_vpn_ack';

// Bait-element detection: ad blockers hide elements whose class names look like
// ad slots. We drop one off-screen, then check whether it was hidden/removed.
function detectAdblock() {
  return new Promise((resolve) => {
    try {
      const bait = document.createElement('div');
      bait.className = 'adsbox ad-banner ads pub_300x250 pub_300x250m text-ad textAd text_ad text_ads text-ads';
      bait.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;';
      bait.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bait);
      // Give an extension a tick to act on it.
      setTimeout(() => {
        const blocked = bait.offsetParent === null || bait.offsetHeight === 0 || bait.clientHeight === 0
          || window.getComputedStyle(bait).display === 'none';
        try { bait.remove(); } catch (_) { /* noop */ }
        resolve(blocked);
      }, 150);
    } catch (_) {
      resolve(false);
    }
  });
}

const read = (k) => { try { return localStorage.getItem(k) === '1'; } catch (_) { return false; } };
const ack = (k) => { try { localStorage.setItem(k, '1'); } catch (_) { /* ignore */ } };

export default function AdblockNotice() {
  const { state } = useApp();
  const plus = isPlus(state);
  const [kind, setKind] = useState(null); // 'adblock' | 'vpn' | null

  useEffect(() => {
    // Paying members see no ads, so there is nothing to ask them for.
    if (plus) { setKind(null); return undefined; }
    let alive = true;
    (async () => {
      if (!read(ACK_KEY)) {
        const blocked = await detectAdblock();
        if (!alive) return;
        if (blocked) { setKind('adblock'); return; }
      }
      if (!read(VPN_ACK_KEY)) {
        const vpn = await detectVpn();
        if (alive && vpn?.likely) setKind('vpn');
      }
    })();
    return () => { alive = false; };
  }, [plus]);

  if (!kind) return null;

  const isVpn = kind === 'vpn';
  const dismiss = () => { ack(isVpn ? VPN_ACK_KEY : ACK_KEY); setKind(null); };
  const goPlus = () => { ack(isVpn ? VPN_ACK_KEY : ACK_KEY); setKind(null); window.location.hash = '#settings'; };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true" data-testid={isVpn ? 'vpn-notice' : 'adblock-notice'}>
      <div className="w-full max-w-[440px] rounded-2xl bg-[color:var(--color-card)] border border-[color:var(--color-border)] shadow-2xl p-6 text-center">
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
              But it&rsquo;s fine if you love your VPN. Just get InfinitySheets+.
            </>
          ) : (
            <>
              Ads help us fund our mission, because, as it turns out, putting a website
              on the internet is <span className="font-semibold text-slate-700">preetttttyyyyyyy</span> expensive.
              But it&rsquo;s fine if you hate ads. Just get InfinitySheets+.
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
            <Sparkles className="w-4 h-4" /> Get InfinitySheets+
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-outline-dark w-full py-2.5 rounded-lg text-[13.5px] font-semibold"
            data-testid={isVpn ? 'vpn-reload' : 'adblock-reload'}
          >
            {isVpn ? 'I’ve turned my VPN off — reload' : 'I’ve turned it off — reload'}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="text-[12px] text-slate-500 hover:text-slate-700 inline-flex items-center justify-center gap-1"
            data-testid={isVpn ? 'vpn-continue' : 'adblock-continue'}
          >
            <X className="w-3.5 h-3.5" /> {isVpn ? 'Continue with my VPN on' : 'Continue without disabling'}
          </button>
        </div>
      </div>
    </div>
  );
}
