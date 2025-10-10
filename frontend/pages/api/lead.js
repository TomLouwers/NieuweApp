export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false });
  }
  try {
    const chunks = [];
    for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    const raw = Buffer.concat(chunks).toString('utf8');
    const data = (() => { try { return JSON.parse(raw); } catch { return {}; } })();
    const email = String(data?.email || '').trim();
    const source = String(data?.source || 'unknown');
    const intent = String(data?.intent || '');
    const ok = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
    if (!ok) return res.status(400).json({ ok: false, error: 'invalid_email' });

    try {
      console.log('[lead]', JSON.stringify({ email, source, intent, ts: Date.now() }));
    } catch {}

    const webhook = process.env.LEAD_WEBHOOK_URL;
    if (webhook) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source, intent, ts: Date.now() }),
        });
      } catch {}
    }
  } catch {}
  return res.status(204).end();
}

