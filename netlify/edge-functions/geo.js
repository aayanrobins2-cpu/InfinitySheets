// Where Netlify thinks this request came from — country and timezone, taken
// from the edge context (no third-party service, no IP ever sent anywhere).
//
// The browser compares it with its own timezone: a laptop set to Asia/Kolkata
// arriving from a Dutch IP is almost certainly on a VPN or proxy. Nothing is
// stored, and the answer is per-request.
export default async (request, context) => {
  const geo = context.geo || {};
  return new Response(JSON.stringify({
    country: geo.country?.code || null,
    timezone: geo.timezone || null,
    city: geo.city || null,
  }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      // Same-origin only; this is for our own page.
      'access-control-allow-origin': 'https://infinitysheets-main.netlify.app',
    },
  });
};

export const config = { path: '/api/geo' };
