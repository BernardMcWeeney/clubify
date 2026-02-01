import type { APIRoute } from 'astro';

/**
 * Serves media files from R2 storage
 * Route: /media/clubs/{clubId}/{mediaId}.{ext}
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const key = params.key;

    if (!key) {
      return new Response('Not found', { status: 404 });
    }

    const r2 = locals.runtime.env.MEDIA;
    if (!r2) {
      return new Response('Media storage not configured', { status: 503 });
    }

    // Get object from R2
    const object = await r2.get(key);

    if (!object) {
      return new Response('Media not found', { status: 404 });
    }

    // Stream the file with appropriate headers
    return new Response(object.body, {
      status: 200,
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.etag,
      },
    });
  } catch (error) {
    console.error('Error serving media:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
