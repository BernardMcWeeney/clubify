import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../lib/db';
import { isValidSlug } from '../../../lib/utils';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Slug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!isValidSlug(slug)) {
      return new Response(JSON.stringify({
        available: false,
        reason: 'Invalid slug format. Use clubname-county with only lowercase letters, numbers, and hyphens.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB);
    const isAvailable = await db.isSlugAvailable(slug);

    return new Response(JSON.stringify({
      available: isAvailable,
      slug,
      url: isAvailable ? `${slug}.clubify.ie` : null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Check slug error:', error);
    return new Response(JSON.stringify({ error: 'Failed to check slug' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
