// Node.js runtime — more reliable than Edge for proxying to external backends
export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const backendUrl = process.env.API_URL;
  if (!backendUrl) {
    return res.status(500).json({
      error: 'API_URL environment variable is not configured on Vercel.',
      hint: 'Go to your Vercel project → Settings → Environment Variables and add API_URL pointing to your backend (e.g. https://your-api.example.com/api)',
    });
  }

  // Parse the incoming request URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  // Get the 'path' parameter that was rewritten (e.g., 'auth/employee/login')
  const pathParam = url.searchParams.get('path') || '';

  // Remove 'path' so it doesn't get forwarded to the backend
  url.searchParams.delete('path');
  const queryString = url.searchParams.toString();

  // Construct target URL
  const cleanBackendUrl = backendUrl.replace(/\/$/, '');
  const cleanPath = pathParam.replace(/^\//, '');
  const targetUrl = `${cleanBackendUrl}/${cleanPath}${queryString ? '?' + queryString : ''}`;

  // Forward headers, stripping hop-by-hop headers that cause issues
  const headers = { ...req.headers };
  delete headers['host'];
  delete headers['connection'];
  delete headers['content-length'];
  delete headers['transfer-encoding'];

  try {
    // Collect body for methods that support it
    let body = undefined;
    if (!['GET', 'HEAD'].includes(req.method)) {
      body = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
      });
    }

    // 10-second timeout so the function doesn't hang and hit Vercel's limit
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
      response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: body && body.length > 0 ? body : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    // Forward response headers
    const responseHeaders = Object.fromEntries(response.headers.entries());
    // Remove headers that can't be set manually in Node.js http responses
    delete responseHeaders['content-encoding'];
    delete responseHeaders['transfer-encoding'];

    res.status(response.status);
    Object.entries(responseHeaders).forEach(([k, v]) => {
      try { res.setHeader(k, v); } catch (_) { /* skip invalid headers */ }
    });

    const responseBody = await response.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    console.error('Proxy error:', error);
    res.status(502).json({
      error: isTimeout
        ? 'Backend request timed out after 10 seconds'
        : 'Failed to proxy request to backend',
      details: error.message,
      target: targetUrl,
    });
  }
}
