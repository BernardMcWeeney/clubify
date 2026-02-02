import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../lib/db';
import { getAuthContext } from '../../../lib/auth';

// Get club details
export const GET: APIRoute = async ({ params, locals, cookies }) => {
  try {
    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clubId = params.id;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check user has access to this club
    const member = await db.getClubMember(clubId, user.id);
    if (!member) {
      return new Response(JSON.stringify({ error: 'Not a member of this club' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const club = await db.getClubById(clubId);
    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      club,
      role: member.role
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get club error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get club' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Update club
export const PATCH: APIRoute = async ({ params, request, locals, cookies }) => {
  try {
    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clubId = params.id;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check user has admin access
    const member = await db.getClubMember(clubId, user.id);
    if (!member || !['admin', 'pro'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updates = await request.json();

    // Whitelist allowed fields
    const allowedFields = [
      'name', 'tagline', 'description', 'crest_url',
      'primary_color', 'secondary_color', 'accent_color',
      'template', 'contact_email', 'contact_phone', 'address',
      'website_url', 'facebook_url', 'twitter_url', 'instagram_url',
      'is_live', 'setup_completed', 'setup_step',
      'sport_settings'
    ];

    const filteredUpdates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'sport_settings') {
          filteredUpdates[field] = JSON.stringify(updates[field]);
        } else {
          filteredUpdates[field] = updates[field];
        }
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.updateClub(clubId, filteredUpdates as any);

    // Log the update
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'club_updated',
      entityType: 'club',
      entityId: clubId,
      details: JSON.stringify(filteredUpdates)
    });

    const club = await db.getClubById(clubId);

    return new Response(JSON.stringify({
      success: true,
      club
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update club error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update club' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
