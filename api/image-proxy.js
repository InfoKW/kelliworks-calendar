// Image proxy — lets Metricool fetch Cloudinary images via a clean URL.
// Metricool's fetcher chokes on URL-encoded special chars (e.g. %2B for +).
// We accept the raw Cloudinary URL as a query param and stream it back.
//
// Usage: GET /api/image-proxy?url=https%3A%2F%2Fres.cloudinary.com%2F...

export default async function handler(req, res) {
  const rawUrl = req.query.url;
  if (!rawUrl) return res.status(400).json({ error: 'url param required' });

  // req.query.url is already URL-decoded once by the HTTP server.
  // Do NOT call decodeURIComponent again — double-decoding turns %20 into
  // spaces and %2B into +, producing an invalid URL that fetch() rejects.
  const imageUrl = rawUrl;

  if (!imageUrl.startsWith('https://') && !imageUrl.startsWith('http://')) {
    return res.status(400).json({ error: 'url must be http(s)' });
  }

  try {
    const upstream = await fetch(imageUrl);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `upstream returned ${upstream.status}` });
    }

    const contentType = upstream.headers.get('content-type') || 'image/png';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error('[image-proxy]', e);
    return res.status(500).json({ error: e.message });
  }
}
