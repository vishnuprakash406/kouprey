// Cloudflare Pages Function for Reviews API
// File: functions/api/reviews.ts
// Handles GET and POST requests to /api/reviews

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Check if database is available
  if (!env.DB) {
    return new Response(
      JSON.stringify({ error: 'Database not configured' }),
      { status: 500, headers: corsHeaders() }
    );
  }

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  // POST - Submit a new review
  if (method === 'POST') {
    return handlePost(request, env);
  }

  // GET - Fetch reviews for a product
  if (method === 'GET') {
    return handleGet(url, env);
  }

  return new Response('Method not allowed', { 
    status: 405, 
    headers: corsHeaders() 
  });
}

// Handle POST request - Submit review
async function handlePost(request, env) {
  try {
    const reviewData = await request.json();
    const { productId, displayName, email, rating, title, content, timestamp } = reviewData;

    // Validate required fields
    if (!productId || !displayName || !rating || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // Insert review into D1 database
    await env.DB.prepare(`
      INSERT INTO reviews (productId, displayName, email, rating, title, content, timestamp, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(productId, displayName, email || null, rating, title || null, content, timestamp).run();

    return new Response(
      JSON.stringify({ success: true, message: 'Review submitted successfully' }),
      { status: 201, headers: corsHeaders() }
    );
  } catch (error) {
    console.error('Review submission error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to submit review', details: error.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Handle GET request - Fetch reviews
async function handleGet(url, env) {
  try {
    const productId = url.searchParams.get('productId');
    
    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'productId parameter required' }),
        { status: 400, headers: corsHeaders() }
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
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    console.error('Review retrieval error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch reviews', details: error.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

// CORS headers for cross-origin requests
function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
