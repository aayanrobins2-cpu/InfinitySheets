// "Probably on a VPN".
//
// We compare two things:
//   1. the timezone the visitor's device is set to, and
//   2. the timezone Netlify geolocates their connection to (/api/geo, a
//      Netlify function reading `context.geo` — the visitor's own IP location,
//      nothing stored, no third party).
// A VPN makes the connection appear somewhere else. When the two are three or
// more hours apart, the connection is surfacing far from where the device
// thinks it is — in practice a VPN or proxy.
//
// History: the first version (Sept 2026) used the Cloudflare data centre that
// served a Supabase request instead of the visitor's location. That is not
// where the visitor is (an Indian browser with no VPN was routed via Boston),
// so it walled genuine users and was switched off. This version uses real
// per-visitor geolocation.
//
// Limits: a VPN that exits in the same timezone band (e.g. an Indian VPN
// server for an Indian user) is not detected; a traveller whose device clock
// is still on home time can be flagged.

const GEO_URL = '/api/geo';

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
 * detectVpn() → { likely, hours, deviceZone, networkZone, country } or null
 * when anything is unknown (offline, local dev, lookup failed) — never guesses.
 */
export async function detectVpn({ timeoutMs = 3000 } = {}) {
  try {
    const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const deviceOffset = deviceZone ? offsetMinutes(deviceZone) : null;
    if (deviceOffset === null) return null;
    const res = await fetch(GEO_URL, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (!type.includes('json')) return null; // e.g. local dev serving index.html
    const geo = await res.json();
    if (!geo?.timezone) return null;
    const networkOffset = offsetMinutes(geo.timezone);
    if (networkOffset === null) return null;
    const hours = Math.abs(deviceOffset - networkOffset) / 60;
    return { likely: hours >= 3, hours, deviceZone, networkZone: geo.timezone, country: geo.country || null };
  } catch (_) {
    return null;
  }
}
