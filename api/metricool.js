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

      // Normalize image URLs through Metricool's CDN before attaching to post.
      // Only Cloudinary/external HTTP URLs can be normalized — skip data: URIs.
      console.log('[metricool] mediaUrls received:', JSON.stringify(mediaUrls));
      let normalizedMedia = [];
      if (mediaUrls && mediaUrls.length > 0) {
        const httpUrls = mediaUrls.filter(u => u.startsWith('http'));
        console.log('[metricool] httpUrls to normalize:', JSON.stringify(httpUrls));
        const normalized = await Promise.all(
          httpUrls.map(async url => {
            try {
              const normalizeUrl =
                `https://app.metricool.com/api/actions/normalize/image/url` +
                `?url=${encodeURIComponent(url)}&userId=${userId}`;
              const nr = await fetch(normalizeUrl, { headers: mcHeaders });
              const nText = await nr.text();
              console.log('[metricool] normalize status:', nr.status, 'body:', nText);
              if (!nr.ok) return { url }; // fall back to original on error
              let nd;
              try { nd = JSON.parse(nText); } catch { return { url }; }
              return nd.url ? { url: nd.url } : { url };
            } catch (e) {
              console.warn('[metricool] normalize failed:', e.message);
              return { url }; // fall back to original
            }
          })
        );
        normalizedMedia = normalized.filter(Boolean);
        console.log('[metricool] normalizedMedia:', JSON.stringify(normalizedMedia));
      }

      const payload = {
        publicationDate: {
          dateTime: publicationDate,                       // "2026-04-28T08:00:00"
          timezone:  timezone || 'America/New_York',
        },
        text:        text || '',
        // providers must be objects {network: '...'}, NOT plain strings
        providers:   networks.map(n => ({ network: n })),
        autoPublish: true,
        ...(normalizedMedia.length > 0 ? { media: normalizedMedia } : {}),
      };

      console.log('[metricool] POST /scheduler/posts payload:', JSON.stringify(payload));

      const r = await fetch(
        `${BASE}/scheduler/posts?userId=${userId}&blogId=${blogId}`,
        { method: 'POST', headers: mcHeaders, body: JSON.stringify(payload) }
      );

      const rawText = await r.text();
      console.log('[metricool] response status:', r.status, 'body:', rawText);

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
