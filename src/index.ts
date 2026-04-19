export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Initialize database if needed
    if (!env.DB) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/reviews - Submit a new review
    if (path === '/api/reviews' && method === 'POST') {
      try {
        const reviewData = await request.json();
        const { productId, displayName, email, rating, title, content, timestamp } = reviewData;

        // Insert review into database
        await env.DB.prepare(`
          INSERT INTO reviews (productId, displayName, email, rating, title, content, timestamp, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(productId, displayName, email, rating, title, content, timestamp).run();

        return new Response(
          JSON.stringify({ success: true, message: 'Review submitted successfully' }),
          { 
            status: 201, 
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
          }
        );
      } catch (error) {
        console.error('Review submission error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to submit review', details: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }

    // GET /api/reviews - Fetch reviews for a product
    if (path === '/api/reviews' && method === 'GET') {
      try {
        const productId = url.searchParams.get('productId');
        if (!productId) {
          return new Response(
            JSON.stringify({ error: 'productId parameter required' }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          );
        }

        const { results } = await env.DB.prepare(`
          SELECT id, productId, displayName, email, rating, title, content, timestamp, created_at
          FROM reviews
          WHERE productId = ?
          ORDER BY created_at DESC
          LIMIT 100
        `).bind(productId).all();

        return new Response(
          JSON.stringify(results || []),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
          }
        );
      } catch (error) {
        console.error('Review retrieval error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch reviews', details: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
