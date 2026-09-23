// "Probably on a VPN" — a deliberately conservative check.
//
// There is no way to detect a VPN from a browser with certainty, and a false
// accusation is much worse than a miss, so we compare only two things we can
// see honestly:
//
//   1. the timezone the device is set to, and
//   2. the UTC offset of the network edge the request came out of, from our
//      own `geo` Supabase function (it reads the Cloudflare data-centre code
//      already attached to the request — no IP is returned, nothing is
//      stored, and no third-party lookup happens).
//
// A three-hour-plus gap means the connection surfaces a long way from where
// the device thinks it is, which in practice is a VPN or proxy. Anything
// smaller, or anything unknown, says nothing at all.
import { SUPABASE_URL } from './supabase';

function offsetMinutes(timeZone, at = new Date()) {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const p = Object.fromEntries(dtf.formatToParts(at).filter((x) => x.type !== 'literal').map((x) => [x.type, x.value]));
    const asUTC = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour) % 24, Number(p.minute), Number(p.second));
    return Math.round((asUTC - at.getTime()) / 60000);
  } catch (_) { return null; }
}

/**
 * detectVpn() → { likely, hours, deviceZone, edgeZone, edge } or null when
 * anything at all is unknown. Never guesses.
 */
export async function detectVpn({ timeoutMs = 2500 } = {}) {
  try {
    if (!SUPABASE_URL) return null;
    const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const deviceOffset = deviceZone ? offsetMinutes(deviceZone) : null;
    if (deviceOffset === null) return null;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/geo`, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' });
    if (!res.ok) return null;
    const geo = await res.json();
    if (typeof geo?.offsetMinutes !== 'number') return null;
    const hours = Math.abs(deviceOffset - geo.offsetMinutes) / 60;
    return { likely: hours >= 3, hours, deviceZone, edgeZone: geo.timezone || null, edge: geo.edge || null };
  } catch (_) {
    return null; // offline, blocked, or the function is unavailable
  }
}
