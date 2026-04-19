// Cloudflare Pages Function for Uploads API
// File: functions/api/uploads.ts
// Handles POST requests to /api/uploads (R2)

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
  }

  if (!env.UPLOADS) {
    return new Response(
      JSON.stringify({ error: 'Uploads bucket not configured' }),
      { status: 500, headers: corsHeaders() }
    );
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Unsupported content type' }),
        { status: 400, headers: corsHeaders() }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files.length) {
      return new Response(
        JSON.stringify({ error: 'No files uploaded' }),
        { status: 400, headers: corsHeaders() }
      );
    }

    const publicBase = String(env.R2_PUBLIC_URL || 'https://pub-89b5e27379404ae880af465e3773471f.r2.dev').replace(/\/$/, '');
    const uploaded = [];

    for (const item of files) {
      if (!(item instanceof File)) continue;
      if (!item.type.startsWith('image/')) continue;
      if (!item.size) continue;

      const safeName = item.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `products/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

      await env.UPLOADS.put(key, await item.arrayBuffer(), {
        httpMetadata: { contentType: item.type },
      });

      uploaded.push({
        url: `${publicBase}/${key}`,
        type: item.type,
        key,
      });
    }

    return new Response(
      JSON.stringify({ files: uploaded }),
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Upload failed', details: error.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
