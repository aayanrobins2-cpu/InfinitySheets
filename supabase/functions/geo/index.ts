// Roughly where this request entered the network, for the VPN nudge.
//
// Supabase sits behind Cloudflare, which does not pass a country header here,
// but `cf-ray` ends in the IATA code of the data centre that took the request
// ("...-BOM" = Mumbai). That is the nearest edge to the client's exit IP, so
// its UTC offset is a fair answer to "where does this connection come out?".
// We return only the offset and a city label — no IP, nothing stored, no
// third-party lookup. Unknown codes return null, and the browser then says
// nothing rather than guessing.
//
// Kept byte-identical to the deployed function (project annyogfzxzznyzkzlodx).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Cloudflare colo (IATA) → IANA zone. The busiest edges only; anything not
// listed is treated as unknown.
const COLO: Record<string, string> = {
  BOM: "Asia/Kolkata", DEL: "Asia/Kolkata", MAA: "Asia/Kolkata", BLR: "Asia/Kolkata", CCU: "Asia/Kolkata", HYD: "Asia/Kolkata", AMD: "Asia/Kolkata", NAG: "Asia/Kolkata", PAT: "Asia/Kolkata",
  CMB: "Asia/Colombo", KHI: "Asia/Karachi", LHE: "Asia/Karachi", ISB: "Asia/Karachi", DAC: "Asia/Dhaka", KTM: "Asia/Kathmandu", MLE: "Indian/Maldives",
  DXB: "Asia/Dubai", RUH: "Asia/Riyadh", JED: "Asia/Riyadh", DOH: "Asia/Qatar", KWI: "Asia/Kuwait", MCT: "Asia/Muscat", BAH: "Asia/Bahrain", TLV: "Asia/Jerusalem", AMM: "Asia/Amman", BEY: "Asia/Beirut", BGW: "Asia/Baghdad",
  LHR: "Europe/London", MAN: "Europe/London", EDI: "Europe/London", DUB: "Europe/Dublin", LIS: "Europe/Lisbon", MAD: "Europe/Madrid", BCN: "Europe/Madrid",
  CDG: "Europe/Paris", MRS: "Europe/Paris", FRA: "Europe/Berlin", DUS: "Europe/Berlin", HAM: "Europe/Berlin", MUC: "Europe/Berlin", BER: "Europe/Berlin",
  AMS: "Europe/Amsterdam", BRU: "Europe/Brussels", ZRH: "Europe/Zurich", GVA: "Europe/Zurich", VIE: "Europe/Vienna", MXP: "Europe/Rome", FCO: "Europe/Rome", PMO: "Europe/Rome",
  ARN: "Europe/Stockholm", OSL: "Europe/Oslo", CPH: "Europe/Copenhagen", HEL: "Europe/Helsinki", WAW: "Europe/Warsaw", PRG: "Europe/Prague", BUD: "Europe/Budapest", OTP: "Europe/Bucharest", SOF: "Europe/Sofia", ATH: "Europe/Athens", IST: "Europe/Istanbul", KBP: "Europe/Kyiv", BEG: "Europe/Belgrade", ZAG: "Europe/Zagreb", RIX: "Europe/Riga", VNO: "Europe/Vilnius", TLL: "Europe/Tallinn", KEF: "Atlantic/Reykjavik", MLA: "Europe/Malta", LCA: "Asia/Nicosia",
  SIN: "Asia/Singapore", KUL: "Asia/Kuala_Lumpur", BKK: "Asia/Bangkok", SGN: "Asia/Ho_Chi_Minh", HAN: "Asia/Ho_Chi_Minh", MNL: "Asia/Manila", CGK: "Asia/Jakarta", DPS: "Asia/Makassar",
  HKG: "Asia/Hong_Kong", TPE: "Asia/Taipei", NRT: "Asia/Tokyo", KIX: "Asia/Tokyo", ICN: "Asia/Seoul", PVG: "Asia/Shanghai", HKN: "Asia/Shanghai",
  SYD: "Australia/Sydney", MEL: "Australia/Melbourne", BNE: "Australia/Brisbane", PER: "Australia/Perth", ADL: "Australia/Adelaide", AKL: "Pacific/Auckland", CHC: "Pacific/Auckland", NAN: "Pacific/Fiji",
  JNB: "Africa/Johannesburg", CPT: "Africa/Johannesburg", DUR: "Africa/Johannesburg", LOS: "Africa/Lagos", NBO: "Africa/Nairobi", CAI: "Africa/Cairo", ACC: "Africa/Accra", CMN: "Africa/Casablanca", TUN: "Africa/Tunis", DAR: "Africa/Dar_es_Salaam", KGL: "Africa/Kigali", ADD: "Africa/Addis_Ababa", MRU: "Indian/Mauritius",
  IAD: "America/New_York", EWR: "America/New_York", JFK: "America/New_York", BOS: "America/New_York", ATL: "America/New_York", MIA: "America/New_York", ORD: "America/Chicago", DFW: "America/Chicago", MCI: "America/Chicago", DEN: "America/Denver", PHX: "America/Phoenix", LAX: "America/Los_Angeles", SJC: "America/Los_Angeles", SFO: "America/Los_Angeles", SEA: "America/Los_Angeles", PDX: "America/Los_Angeles",
  YYZ: "America/Toronto", YUL: "America/Toronto", YVR: "America/Vancouver", YYC: "America/Edmonton",
  MEX: "America/Mexico_City", GRU: "America/Sao_Paulo", GIG: "America/Sao_Paulo", EZE: "America/Argentina/Buenos_Aires", SCL: "America/Santiago", BOG: "America/Bogota", LIM: "America/Lima", UIO: "America/Guayaquil", PTY: "America/Panama", SJO: "America/Costa_Rica", KIN: "America/Jamaica",
};

function offsetMinutes(timeZone: string, at: Date): number | null {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const parts = Object.fromEntries(dtf.formatToParts(at).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
    const asUTC = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute), Number(parts.second));
    return Math.round((asUTC - at.getTime()) / 60000);
  } catch (_) { return null; }
}

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const ray = req.headers.get("cf-ray") || "";
  const colo = (ray.split("-")[1] || "").toUpperCase();
  const zone = COLO[colo] || null;
  const now = new Date();
  return new Response(JSON.stringify({
    edge: colo || null,
    timezone: zone,
    offsetMinutes: zone ? offsetMinutes(zone, now) : null,
  }), { headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });
});
