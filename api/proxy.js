/**
 * Vercel Serverless Proxy  (/api/proxy.js)
 * Rewrites: /api/:path* → /api/proxy.js?path=:path*
 *
 * Forwards all /api/* requests to the .NET backend defined in API_URL env var.
 * Set API_URL to your backend's ROOT URL (no trailing /api), e.g.:
 *   https://your-api.fly.dev
 * The proxy injects /api/ automatically so the full path becomes:
 *   https://your-api.fly.dev/api/auth/employee/login
 */

export default async function handler(req, res) {
  // ── 1. Validate env var ────────────────────────────────────────────────────
  const backendBase = process.env.API_URL;
  if (!backendBase) {
    return res.status(500).json({
      error: 'API_URL is not set.',
      hint: 'Vercel → Project Settings → Environment Variables → add API_URL (e.g. https://your-api.fly.dev)',
    });
  }

  // ── 2. Extract path + remaining query string from raw URL ──────────────────
  // Vercel rewrites /api/auth/employee/login → /api/proxy.js?path=auth/employee/login
  const rawUrl = req.url || '/';
  const qIndex = rawUrl.indexOf('?');
  const qs = qIndex !== -1 ? rawUrl.slice(qIndex + 1) : '';
  const params = new URLSearchParams(qs);

  const apiPath = params.get('path') || '';   // e.g. "auth/employee/login"
  params.delete('path');                       // remaining are real query params
  const forwardQs = params.toString();         // e.g. "search=foo&status=active"

  // ── 3. Build target URL ────────────────────────────────────────────────────
  const base = backendBase.replace(/\/$/, '');
  const path = apiPath.replace(/^\//, '');
  // Inject /api/ so that API_URL=https://backend.com produces:
  //   https://backend.com/api/auth/employee/login
  const targetUrl = `${base}/api/${path}${forwardQs ? '?' + forwardQs : ''}`;

  // ── 4. Strip hop-by-hop request headers ───────────────────────────────────
  const forwardHeaders = { ...req.headers };
  [
    'host', 'connection', 'keep-alive', 'proxy-authenticate',
    'proxy-authorization', 'te', 'trailers', 'upgrade',
    'content-length', 'transfer-encoding',
  ].forEach(h => delete forwardHeaders[h]);

  // ── 5. Buffer request body ─────────────────────────────────────────────────
  let bodyBuffer;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
    bodyBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
    if (bodyBuffer.length > 0) {
      // Re-inject accurate content-length so the backend can parse the body
      forwardHeaders['content-length'] = String(bodyBuffer.length);
    } else {
      bodyBuffer = undefined;
    }
  }

  // ── 6. Fetch with 15s timeout ──────────────────────────────────────────────
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  let backendResponse;
  try {
    backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: bodyBuffer,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const timedOut = err.name === 'AbortError';
    console.error('[proxy] fetch error:', err.message, '| target:', targetUrl);
    return res.status(502).json({
      error: timedOut ? 'Backend timed out (15 s)' : 'Could not reach backend',
      details: err.message,
      target: targetUrl,
    });
  } finally {
    clearTimeout(timer);
  }

  // ── 7. Forward response, stripping hop-by-hop response headers ────────────
  const skipResponseHeaders = new Set([
    'content-encoding', 'transfer-encoding', 'connection',
    'keep-alive', 'upgrade', 'trailer',
  ]);

  res.status(backendResponse.status);
  backendResponse.headers.forEach((value, key) => {
    if (!skipResponseHeaders.has(key.toLowerCase())) {
      try { res.setHeader(key, value); } catch (_) { /* ignore */ }
    }
  });

  const responseBuffer = Buffer.from(await backendResponse.arrayBuffer());
  res.end(responseBuffer);
}
