// "Probably on a VPN" — a deliberately conservative check.
//
// There is no way to detect a VPN from a browser with certainty, and a false
// accusation is much worse than a miss. So we only compare two things we can
// see honestly: the timezone the device is set to, and the timezone Netlify's
// edge reports for the request's IP (/api/geo — first-party, nothing sent to
// anyone else). A three-hour-plus gap between them means the connection is
// coming out somewhere the device does not think it is, which in practice is
// a VPN, a proxy, or a very confused clock. Anything smaller is ignored.

const GEO_URL = '/api/geo';

function offsetMinutes(timeZone, at = new Date()) {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const p = Object.fromEntries(dtf.formatToParts(at).filter((x) => x.type !== 'literal').map((x) => [x.type, x.value]));
    const asUTC = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour % 24), Number(p.minute), Number(p.second));
    return Math.round((asUTC - at.getTime()) / 60000);
  } catch (_) { return null; }
}

/**
 * detectVpn() → { likely, hours, deviceZone, edgeZone, country } | null
 * Resolves to null whenever anything is unknown — no guessing.
 */
export async function detectVpn({ timeoutMs = 2500 } = {}) {
  try {
    const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!deviceZone) return null;
    const res = await fetch(GEO_URL, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' });
    if (!res.ok) return null;
    const geo = await res.json();
    if (!geo?.timezone) return null;
    const a = offsetMinutes(deviceZone);
    const b = offsetMinutes(geo.timezone);
    if (a === null || b === null) return null;
    const hours = Math.abs(a - b) / 60;
    return { likely: hours >= 3, hours, deviceZone, edgeZone: geo.timezone, country: geo.country || null };
  } catch (_) {
    return null; // offline, blocked, or the edge function is not deployed
  }
}
