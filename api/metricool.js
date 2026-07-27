// Metricool API proxy — keeps METRICOOL_API_KEY off the browser.
//
// Env vars required (add to Vercel dashboard):
//   METRICOOL_API_KEY  — the REST API key from Metricool → Account Settings → API
//
// Media flow (per Metricool docs):
//   1. Call normalize endpoint with the public Cloudinary URL → get mediaId
//   2. Include mediaId in the post body when scheduling
//
// Normalize endpoint: GET /api/actions/normalize/image/url?url=<URL>
//   - Only X-Mc-Auth header needed — no userId/blogId in query params

const BASE = 'https://app.metricool.com/api/v2';

export default async function handler(req, res) {
  const apiKey = process.env.METRICOOL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'METRICOOL_API_KEY not configured in Vercel env vars' });
  }

  const { action } = req.query;

  const mcHeaders = {
    'X-Mc-Auth': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    // ── List brands ──────────────────────────────────────────────────────
    if (action === 'brands' && req.method === 'GET') {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'userId query param required' });
      const r = await fetch(`${BASE}/user/blogs?userId=${userId}`, { headers: mcHeaders });
      const data = await r.json();
      return res.status(r.ok ? 200 : r.status).json(data);
    }

    // ── Schedule a post ──────────────────────────────────────────────────
    if (action === 'schedule' && req.method === 'POST') {
      const { userId, blogId, text, networks, publicationDate, timezone, mediaUrls } = req.body;

      if (!userId)           return res.status(400).json({ error: 'userId required' });
      if (!blogId)           return res.status(400).json({ error: 'blogId required' });
      if (!networks?.length) return res.status(400).json({ error: 'networks array required' });
      if (!publicationDate)  return res.status(400).json({ error: 'publicationDate required' });

      // Step 1 — Normalize each media URL to get a Metricool mediaId.
      // Per Metricool docs: GET /api/actions/normalize/image/url?url=<PUBLIC_URL>
      // Only X-Mc-Auth header required. URL must be public and non-expiring.
      const validUrls = (mediaUrls || []).filter(u => typeof u === 'string' && u.startsWith('http'));
      const mediaIds  = [];

      for (const rawUrl of validUrls) {
        try {
          const normalizeEndpoint =
            `https://app.metricool.com/api/actions/normalize/image/url` +
            `?url=${encodeURIComponent(rawUrl)}`;

          const nr   = await fetch(normalizeEndpoint, { headers: mcHeaders });
          const body = await nr.text();
          console.log('[metricool] normalize status:', nr.status, '| body:', body);

          let nd;
          try { nd = JSON.parse(body); } catch { nd = {}; }

          // Walk the response to find any field that looks like a media ID
          const mediaId = nd?.mediaId ?? nd?.data?.mediaId ?? nd?.id ?? nd?.data?.id ?? null;

          if (mediaId) {
            console.log('[metricool] got mediaId:', mediaId, 'for url:', rawUrl);
            mediaIds.push({ mediaId: String(mediaId) });
          } else {
            console.warn('[metricool] normalize returned no mediaId. Full response:', body);
          }
        } catch (e) {
          console.error('[metricool] normalize error for', rawUrl, ':', e.message);
        }
      }

      // Step 2 — Build the post payload with mediaId(s).
      // Single image: media: { mediaId }
      // Multiple images: media: [{ mediaId }, ...]
      const mediaField =
        mediaIds.length === 1 ? mediaIds[0] :
        mediaIds.length  > 1 ? mediaIds     : null;

      const payload = {
        publicationDate: {
          dateTime: publicationDate,
          timezone:  timezone || 'America/New_York',
        },
        text:        text || '',
        providers:   networks.map(n => ({ network: n })),
        autoPublish: true,
        ...(mediaField ? { media: mediaField } : {}),
      };

      console.log('[metricool] scheduling payload:', JSON.stringify(payload, null, 2));

      const r = await fetch(
        `${BASE}/scheduler/posts?userId=${userId}&blogId=${blogId}`,
        { method: 'POST', headers: mcHeaders, body: JSON.stringify(payload) }
      );

      const rawText = await r.text();
      console.log('[metricool] schedule response:', rawText);

      let data;
      try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }

      if (!r.ok) {
        return res.status(r.status).json({
          error:             data?.error || data?.message || rawText,
          metricoolStatus:   r.status,
          metricoolResponse: data,
        });
      }
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (e) {
    console.error('[metricool proxy]', e);
    return res.status(500).json({ error: e.message });
  }
}
