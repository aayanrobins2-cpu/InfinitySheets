// Ad-blocker detection.
//
// Two independent probes, because blockers work in two different ways:
//
//   1. Network — most blockers today (Brave Shields, uBlock Origin Lite, which
//      is what Chrome users now get, AdGuard, Adblock Plus) block requests to
//      ad networks. We ask for Google's ad script; a blocker kills that request
//      before it leaves the browser.
//   2. Cosmetic — blockers with element hiding (full uBlock Origin, Firefox
//      extensions) hide anything that looks like an ad slot. We drop a decoy
//      element with ad-like class names and see whether it disappears.
//
// Either one is enough. To avoid calling someone a blocker when they are
// simply offline or on a flaky network, a failed ad request only counts if a
// request to our own site succeeds at the same moment.

const AD_PROBES = [
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
  'https://securepubads.g.doubleclick.net/tag/js/gpt.js',
];

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

async function reachable(url, ms = 4000) {
  try {
    // no-cors: we never read the response, we only need to know the request
    // was allowed out. A blocked request rejects with a network error.
    await withTimeout(fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store', credentials: 'omit' }), ms);
    return true;
  } catch (_) {
    return false;
  }
}

async function networkBlocked() {
  // Control request first: if our own site is unreachable, we can't tell.
  const online = await reachable(`${window.location.origin}/manifest.json?probe=${Date.now()}`, 3000);
  if (!online) return false;
  const results = await Promise.all(AD_PROBES.map((u) => reachable(u)));
  // Blocked when every ad probe failed while our own site answered.
  return results.every((ok) => !ok);
}

function cosmeticBlocked() {
  return new Promise((resolve) => {
    try {
      const bait = document.createElement('div');
      bait.className = 'adsbox ad-banner ads adsbygoogle ad-placement pub_300x250 pub_300x250m text-ad textAd text_ad text_ads text-ads sponsor-ad';
      bait.id = 'ad-slot-bait';
      bait.innerHTML = '&nbsp;';
      bait.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;pointer-events:none;';
      bait.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bait);
      // Blockers apply element hiding asynchronously — check twice.
      const check = () => {
        if (!bait.isConnected) return true; // removed outright
        const cs = window.getComputedStyle(bait);
        return bait.offsetHeight === 0 || bait.clientHeight === 0 || cs.display === 'none' || cs.visibility === 'hidden';
      };
      setTimeout(() => {
        if (check()) { try { bait.remove(); } catch (_) { /* noop */ } resolve(true); return; }
        setTimeout(() => { const hit = check(); try { bait.remove(); } catch (_) { /* noop */ } resolve(hit); }, 900);
      }, 300);
    } catch (_) {
      resolve(false);
    }
  });
}

/** Resolves true when an ad blocker is active. Never throws. */
export async function detectAdblock() {
  try {
    const [net, cos] = await Promise.all([networkBlocked(), cosmeticBlocked()]);
    return net || cos;
  } catch (_) {
    return false;
  }
}

// "Continue without disabling" is remembered for a few days, not forever, so
// the ask comes back if the blocker is still on.
const ACK_KEY = 'infinitysheets_adblock_ack';
const ACK_DAYS = 3;

export function adblockAcked() {
  try {
    const v = localStorage.getItem(ACK_KEY);
    if (!v) return false;
    const at = Number(v);
    // Old versions stored '1' (forever) — treat those as expired.
    if (!at || at < 1e12) return false;
    return Date.now() - at < ACK_DAYS * 86400000;
  } catch (_) { return false; }
}

export function ackAdblock() {
  try { localStorage.setItem(ACK_KEY, String(Date.now())); } catch (_) { /* private mode */ }
}
