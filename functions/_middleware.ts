// Middleware for Cloudflare Pages Functions
// Ensures D1 database is initialized for all API routes

export async function onRequest(context) {
  // D1 database binding is automatically available in context.env.DB
  // No additional setup needed - just pass through to the route handler
  return context.next();
}
