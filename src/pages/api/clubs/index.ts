import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../lib/db';
import { getAuthContext } from '../../../lib/auth';
import { slugify, isValidSlug } from '../../../lib/utils';

// Create a new club
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { name, county, slug: requestedSlug } = await request.json();

    if (!name || !county) {
      return new Response(JSON.stringify({ error: 'Name and county are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate or validate slug
    let slug = requestedSlug ? requestedSlug.toLowerCase() : slugify(name);

    if (!isValidSlug(slug)) {
      return new Response(JSON.stringify({ error: 'Invalid slug format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check slug availability
    const isAvailable = await db.isSlugAvailable(slug);
    if (!isAvailable) {
      // Try appending county
      slug = slugify(`${name}-${county}`);
      const isAvailable2 = await db.isSlugAvailable(slug);
      if (!isAvailable2) {
        return new Response(JSON.stringify({ error: 'Slug is not available' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Create the club
    const club = await db.createClub({
      name,
      slug,
      county,
      ownerId: user.id
    });

    // Log the event
    await db.logAudit({
      clubId: club.id,
      userId: user.id,
      action: 'club_created',
      entityType: 'club',
      entityId: club.id,
      details: JSON.stringify({ name, slug, county })
    });

    return new Response(JSON.stringify({
      success: true,
      club
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Create club error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create club' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Get user's clubs
export const GET: APIRoute = async ({ locals, cookies }) => {
  try {
    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clubs = await db.getUserClubs(user.id);

    return new Response(JSON.stringify({ clubs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get clubs error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get clubs' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
