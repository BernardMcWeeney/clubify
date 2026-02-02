import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../lib/db';
import { getAuthContext } from '../../../../lib/auth';

// List all members across all clubs with filtering
export const GET: APIRoute = async ({ locals, cookies, url }) => {
  try {
    if (!locals.runtime.env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);
    const superAdminEmail = locals.runtime.env.SUPER_ADMIN_EMAIL;

    if (!user || !superAdminEmail || user.email.toLowerCase() !== superAdminEmail.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clubId = url.searchParams.get('clubId') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const result = await db.getAllMembers({ clubId, search, limit, offset });

    return new Response(JSON.stringify({
      members: result.members,
      total: result.total,
      limit,
      offset
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get members error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get members' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Add a member to a club
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    if (!locals.runtime.env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);
    const superAdminEmail = locals.runtime.env.SUPER_ADMIN_EMAIL;

    if (!user || !superAdminEmail || user.email.toLowerCase() !== superAdminEmail.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { clubId, email, name, role } = body;

    if (!clubId || !email || !role) {
      return new Response(JSON.stringify({ error: 'Club ID, email, and role are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate role
    const validRoles = ['admin', 'pro', 'treasurer', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if club exists
    const club = await db.getClub(clubId);
    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user exists, create if not
    let targetUser = await db.getUserByEmail(email);
    if (!targetUser) {
      // Create the user
      targetUser = await db.createUser(email.toLowerCase(), name || email.split('@')[0]);
    }

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'Failed to create user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if already a member
    const existingMember = await db.getClubMember(clubId, targetUser.id);
    if (existingMember) {
      return new Response(JSON.stringify({ error: 'User is already a member of this club' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add member
    const member = await db.superAdminAddMember({
      clubId,
      userId: targetUser.id,
      role,
      addedBy: user.id,
    });

    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'super_admin_add_member',
      entityType: 'club_member',
      entityId: member.id,
      details: JSON.stringify({
        targetEmail: email,
        targetUserId: targetUser.id,
        role,
        clubName: club.name
      })
    });

    return new Response(JSON.stringify({
      success: true,
      member: {
        ...member,
        user: targetUser,
        club
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Add member error:', error);
    return new Response(JSON.stringify({ error: 'Failed to add member' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
