// File: api/stok-v2.js
// Proxy untuk API v2 (...cek_stock_akrab_v2)

const DEFAULT_UPSTREAM = "https://panel.khfy-store.com/api_v3/cek_stock_akrab_v2";
const FETCH_TIMEOUT_MS = 10000;

function cors(req, res) {
  const origin = process.env.CORS_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
}

module.exports = async (req, res) => {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);

  try {
    const r = await fetch(DEFAULT_UPSTREAM, {
      method: "GET",
      headers: { "accept": "application/json" },
      signal: ac.signal
    });
    clearTimeout(timer);

    if (!r.ok) {
        return res.status(r.status).json({ ok: false, error: `Upstream API error: ${r.status}` });
    }
    
    // Ambil data JSON
    const data = await r.json();

    // Atur cache 1 detik
    res.setHeader("Cache-Control", "s-maxage=1, stale-while-revalidate=5");
    return res.status(200).json(data); // Kirim JSON apa adanya

  } catch (e) {
    const isAbort = e && (e.name === "AbortError" || e.code === "ABORT_ERR");
    return res.status(isAbort ? 504 : 502).json({
      ok: false,
      error: isAbort ? "Timeout ke server supplier" : (e && e.message) || "Proxy error"
    });
  }
};
