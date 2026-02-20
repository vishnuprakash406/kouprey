/**
 * Catch-all handler for routing to static HTML pages
 * Avoids redirect loops by directly serving HTML content
 */
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip API and Payu routes - let their handlers take over
  if (pathname.startsWith('/api/') || pathname.startsWith('/payu/')) {
    return next();
  }

  // Skip files with extensions
  if (pathname.includes('.')) {
    return next();
  }

  // Route mapping for clean URLs
  const routes = {
    '/master-login': '/master-login.html',
    '/master-login/admin': '/admin-dashboard.html',
    '/staff-login': '/store.html',
    '/staff-login/dashboard': '/store-dashboard.html',
    '/product': '/product.html',
    '/checkout': '/checkout.html',
    '/track': '/track.html',
    '/returns': '/returns.html',
  };

  // Check if path matches a route
  const targetFile = routes[pathname];

  if (targetFile) {
    // Fetch the HTML file
    const fileUrl = new URL(targetFile, url.origin);
    const response = await fetch(fileUrl.toString());

    if (response.ok) {
      return new Response(response.body, {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }
  }

  // For unmatched paths, pass through
  return next();
}
