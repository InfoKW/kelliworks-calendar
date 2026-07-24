// Metricool API proxy — keeps METRICOOL_API_KEY off the browser.
//
// Env vars required (add to Vercel dashboard):
//   METRICOOL_API_KEY  — the REST API key from Metricool → Account Settings → API
//
// Actions:
//   GET  /api/metricool?action=brands&userId=XXX  → list brands for the account
//   POST /api/metricool?action=schedule            → schedule a post

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
    // ── List brands (discover userId + blogId) ───────────────────────────
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

      if (!userId)          return res.status(400).json({ error: 'userId required' });
      if (!blogId)          return res.status(400).json({ error: 'blogId required' });
      if (!networks?.length) return res.status(400).json({ error: 'networks array required' });
      if (!publicationDate) return res.status(400).json({ error: 'publicationDate required' });

      // Step 1: Normalize each image URL through Metricool's normalize endpoint.
      // This uploads the image to Metricool's servers and returns a mediaId.
      // Endpoint: GET /api/actions/normalize/image/url?url=<encoded-url>
      const validUrls = (mediaUrls || []).filter(u => typeof u === 'string' && u.startsWith('http'));
      const mediaIds = [];

      for (const u of validUrls) {
        try {
          const normalizeEndpoint =
            `https://app.metricool.com/api/actions/normalize/image/url` +
            `?url=${encodeURIComponent(u)}&userId=${userId}&blogId=${blogId}`;
          const nr = await fetch(normalizeEndpoint, { headers: mcHeaders });
          const normalizeData = await nr.json();
          console.log('[metricool proxy] normalize response for', u, ':', JSON.stringify(normalizeData));

          // Extract mediaId — try common response shapes
          const mediaId = normalizeData?.mediaId
            ?? normalizeData?.data?.mediaId
            ?? normalizeData?.id
            ?? normalizeData?.data?.id;

          if (mediaId) {
            mediaIds.push({ mediaId: String(mediaId) });
          } else {
            console.warn('[metricool proxy] normalize returned no mediaId:', JSON.stringify(normalizeData));
          }
        } catch (e) {
          console.error('[metricool proxy] normalize error:', e.message);
        }
      }

      // Step 2: Build the media field.
      // Metricool uses media: { mediaId } for a single image.
      // For multiple images use an array: media: [{ mediaId }, { mediaId }]
      const mediaField = mediaIds.length === 1
        ? mediaIds[0]
        : mediaIds.length > 1
          ? mediaIds
          : null;

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

      console.log('[metricool proxy] payload being sent to Metricool:', JSON.stringify(payload, null, 2));

      const r = await fetch(
        `${BASE}/scheduler/posts?userId=${userId}&blogId=${blogId}`,
        { method: 'POST', headers: mcHeaders, body: JSON.stringify(payload) }
      );

      const rawText = await r.text();
      console.log('[metricool proxy] Metricool raw response:', rawText);

      let data;
      try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }

      if (!r.ok) {
        return res.status(r.status).json({
          error: data?.error || data?.message || rawText,
          metricoolStatus: r.status,
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
