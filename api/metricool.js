// Metricool API proxy — keeps METRICOOL_API_KEY off the browser.
//
// Env vars required (add to Vercel dashboard):
//   METRICOOL_API_KEY  — the REST API key from Metricool → Account Settings → API
//
// Actions:
//   GET  /api/metricool?action=brands&userId=XXX  → list brands for the account
//   POST /api/metricool?action=schedule            → schedule a post

const BASE = 'https://app.metricool.com/api/v2';

// Insert Cloudinary format+quality transformation into image URLs.
// Converts to JPEG and auto-optimises quality/size for platform compliance:
//   - Instagram 8 MB limit, Bluesky 1 MB limit, TikTok no-PNG rule, etc.
// Videos and non-Cloudinary URLs are returned unchanged.
function applyCloudinaryTransform(url) {
  if (!url.includes('res.cloudinary.com')) return url;
  if (url.includes('/video/'))             return url; // leave videos alone
  if (/\/upload\/[^/]*f_(?:jpg|jpeg|png|webp)/.test(url)) return url; // already has format
  return url.replace('/upload/', '/upload/f_jpg,q_auto/');
}

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
      //
      // Metricool's fetcher chokes on %2B / %20 in Cloudinary paths, so we
      // route the image through our own /api/image-proxy which gives Metricool
      // a clean, encoding-free URL to fetch. The proxy also applies the
      // Cloudinary f_jpg,q_auto transform for platform compliance.
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'calendar.kelliworks.com';
      const validUrls = (mediaUrls || []).filter(u => typeof u === 'string' && u.startsWith('http'));
      const mediaIds = [];

      // Extract mediaId from any Metricool normalize response shape.
      function extractMediaId(d) {
        if (!d || typeof d !== 'object') return null;
        // Walk every value in the object (top-level and one level deep)
        // looking for a key that contains "id" or "mediaid" (case-insensitive).
        for (const [k, v] of Object.entries(d)) {
          if (/mediaid/i.test(k) && v) return String(v);
        }
        for (const [k, v] of Object.entries(d)) {
          if (k === 'id' && v) return String(v);
        }
        for (const [k, v] of Object.entries(d)) {
          if (v && typeof v === 'object') {
            const nested = extractMediaId(v);
            if (nested) return nested;
          }
        }
        return null;
      }

      async function normalizeUrl(urlToNormalize) {
        const endpoint =
          `https://app.metricool.com/api/actions/normalize/image/url` +
          `?url=${encodeURIComponent(urlToNormalize)}&userId=${userId}&blogId=${blogId}`;
        const nr = await fetch(endpoint, { headers: mcHeaders });
        const data = await nr.json();
        console.log('[metricool proxy] normalize attempt for', urlToNormalize, '→', JSON.stringify(data));
        return { data, mediaId: extractMediaId(data) };
      }

      for (const u of validUrls) {
        try {
          const transformedUrl = applyCloudinaryTransform(u);

          // For uploaded images (no encoding issues), try normalizing directly
          // with the Cloudinary URL first — this avoids an extra proxy hop.
          // Only route through our proxy for URLs with problematic encoded chars.
          const hasEncodingIssues = /%2B|%20|\+/.test(u);

          let mediaId = null;

          if (!hasEncodingIssues) {
            // Try direct Cloudinary URL first
            const direct = await normalizeUrl(transformedUrl);
            mediaId = direct.mediaId;
            if (!mediaId) {
              console.warn('[metricool proxy] direct normalize got no mediaId, trying proxy fallback');
            }
          }

          // Use proxy if direct failed or URL has encoding issues
          if (!mediaId) {
            const proxyUrl = `https://${host}/api/image-proxy?url=${encodeURIComponent(transformedUrl)}`;
            const proxied = await normalizeUrl(proxyUrl);
            mediaId = proxied.mediaId;
            if (!mediaId) {
              console.warn('[metricool proxy] proxy normalize also got no mediaId. Full response:', JSON.stringify(proxied.data));
            }
          }

          if (mediaId) {
            mediaIds.push({ mediaId });
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
