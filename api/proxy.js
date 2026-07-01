export const runtime = 'edge';

export default async function handler(request) {
  const backendUrl = process.env.API_URL;
  if (!backendUrl) {
    return new Response(
      JSON.stringify({ error: 'API_URL environment variable is not configured on Vercel.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Parse the incoming request URL
  const url = new URL(request.url);
  // Get the 'path' parameter that was rewritten (e.g., 'employees/123/profile')
  const pathParam = url.searchParams.get('path') || '';
  
  // Remove 'path' parameter from the search params so it doesn't get forwarded to the backend
  url.searchParams.delete('path');
  const queryString = url.searchParams.toString();

  // Construct target URL
  const cleanBackendUrl = backendUrl.replace(/\/$/, '');
  const cleanPath = pathParam.replace(/^\//, '');
  const targetUrl = `${cleanBackendUrl}/${cleanPath}${queryString ? '?' + queryString : ''}`;

  // Forward the headers, removing headers that could cause issues (like host)
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');

  try {
    // Only pass body for request methods that support it
    const hasBody = !['GET', 'HEAD'].includes(request.method);
    let body = null;
    if (hasBody) {
      body = await request.arrayBuffer();
      // Remove content-length and transfer-encoding to let fetch calculate them correctly
      headers.delete('content-length');
      headers.delete('transfer-encoding');
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
    });

    // Copy response headers
    const responseHeaders = new Headers(response.headers);
    
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Edge proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to proxy request to backend', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
