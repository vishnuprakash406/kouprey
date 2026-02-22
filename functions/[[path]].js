/**
 * Routing handler for clean URLs
 * Maps /path to /path.html without redirect loops
 */
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Let API routes through to their handlers
  if (pathname.startsWith('/api/') || pathname.startsWith('/payu/')) {
    return next();
  }

  // Skip files with extensions and special paths
  if (pathname.includes('.') || pathname === '/' || pathname === '') {
    return next();
  }

  // Map clean URLs to HTML files
  const htmlMap = {
    '/master-login/admin': 'admin-dashboard.html',
    '/staff-login/dashboard': 'store-dashboard.html',
    '/master-login': 'master-login.html',
    '/staff-login': 'staff-login.html',
    '/product': 'product.html',
    '/checkout': 'checkout.html',
    '/track': 'track.html',
    '/returns': 'returns.html',
  };

  const htmlFile = htmlMap[pathname];

  if (htmlFile) {
    try {
      const htmlUrl = new URL(htmlFile, url.origin);
      const response = await fetch(htmlUrl);
      
      if (response.ok) {
        const html = await response.text();
        return new Response(html, {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        });
      }
    } catch (error) {
      console.error(`Failed to fetch ${htmlFile}:`, error);
    }
  }

  // Pass through all other requests
  return next();
}
