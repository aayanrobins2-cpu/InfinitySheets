// Where this visitor's connection comes from, for the VPN check.
//
// Netlify geolocates every request from the visitor's own IP address and hands
// it to the function as `context.geo` — this is the visitor's location, not the
// CDN node that served them (the earlier Cloudflare data-centre signal was the
// latter, and walled genuine users). We return only the country and timezone:
// no IP, nothing stored, no third-party lookup.
export default async (req, context) => {
  const geo = context.geo || {};
  return new Response(JSON.stringify({
    country: geo.country?.code || null,
    timezone: geo.timezone || null,
  }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store, private',
    },
  });
};

export const config = { path: '/api/geo' };
