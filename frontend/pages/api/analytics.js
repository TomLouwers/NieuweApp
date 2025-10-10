export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false });
  }
  try {
    // Parse small JSON payload and avoid throwing on bad input
    const chunks = [];
    for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    const raw = Buffer.concat(chunks).toString('utf8');
    const data = (() => { try { return JSON.parse(raw); } catch { return {}; } })();
    // Best-effort log (avoid PII)
    try { console.log('[analytics]', JSON.stringify({ event: data?.event, ts: Date.now(), props: data?.props || {} })); } catch {}
  } catch {}
  // Always return quickly
  return res.status(204).end();
}

