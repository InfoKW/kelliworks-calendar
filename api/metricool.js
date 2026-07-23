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
      let normalizedMedia = [];
      if (mediaUrls && mediaUrls.length > 0) {
        const httpUrls = mediaUrls.filter(u => u.startsWith('http'));
        const normalized = await Promise.all(
          httpUrls.map(async url => {
            try {
              const nr = await fetch(
                `https://app.metricool.com/api/actions/normalize/image/url?url=${encodeURIComponent(url)}`,
                { headers: mcHeaders }
              );
              if (!nr.ok) return null;
              const nd = await nr.json();
              // Metricool returns { url: '...' } after normalization
              return nd.url ? { url: nd.url } : { url };
            } catch {
              return { url }; // fall back to original
            }
          })
        );
        normalizedMedia = normalized.filter(Boolean);
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

      const r = await fetch(
        `${BASE}/scheduler/posts?userId=${userId}&blogId=${blogId}`,
        { method: 'POST', headers: mcHeaders, body: JSON.stringify(payload) }
      );

      const data = await r.json();
      return res.status(r.ok ? 200 : r.status).json(data);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (e) {
    console.error('[metricool proxy]', e);
    return res.status(500).json({ error: e.message });
  }
}
