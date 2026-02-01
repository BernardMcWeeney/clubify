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

    // Generate or validate slug (format: clubname-county)
    const countySlug = slugify(county);
    let slug = slugify(requestedSlug || `${name}-${county}`);

    if (countySlug && !slug.endsWith(`-${countySlug}`)) {
      slug = slugify(`${slug}-${countySlug}`);
    }

    if (!isValidSlug(slug)) {
      return new Response(JSON.stringify({ error: 'Invalid slug format. Use clubname-county.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check slug availability
    const isAvailable = await db.isSlugAvailable(slug);
    if (!isAvailable) {
      return new Response(JSON.stringify({ error: 'That domain is already taken. Try a slightly different club name.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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
