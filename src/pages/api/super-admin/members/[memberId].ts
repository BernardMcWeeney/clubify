import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../lib/db';
import { getAuthContext } from '../../../../lib/auth';

// Get member details
export const GET: APIRoute = async ({ locals, cookies, params }) => {
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

    const memberId = params.memberId;
    if (!memberId) {
      return new Response(JSON.stringify({ error: 'Member ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const member = await db.getMemberById(memberId);
    if (!member) {
      return new Response(JSON.stringify({ error: 'Member not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(member), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get member error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get member' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Remove member from club
export const DELETE: APIRoute = async ({ locals, cookies, params }) => {
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

    const memberId = params.memberId;
    if (!memberId) {
      return new Response(JSON.stringify({ error: 'Member ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const member = await db.getMemberById(memberId);
    if (!member) {
      return new Response(JSON.stringify({ error: 'Member not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.superAdminRemoveMember(member.club_id, member.user_id);

    await db.logAudit({
      clubId: member.club_id,
      userId: user.id,
      action: 'super_admin_remove_member',
      entityType: 'club_member',
      entityId: memberId,
      details: JSON.stringify({
        removedEmail: member.user.email,
        removedUserId: member.user_id,
        role: member.role,
        clubName: member.club.name
      })
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Member removed from club'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return new Response(JSON.stringify({ error: 'Failed to remove member' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Update member role
export const PATCH: APIRoute = async ({ request, locals, cookies, params }) => {
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

    const memberId = params.memberId;
    if (!memberId) {
      return new Response(JSON.stringify({ error: 'Member ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { role } = body;

    if (!role) {
      return new Response(JSON.stringify({ error: 'Role is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validRoles = ['admin', 'pro', 'treasurer', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const member = await db.getMemberById(memberId);
    if (!member) {
      return new Response(JSON.stringify({ error: 'Member not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const previousRole = member.role;
    await db.updateClubMemberRole(member.club_id, member.user_id, role);

    await db.logAudit({
      clubId: member.club_id,
      userId: user.id,
      action: 'super_admin_change_role',
      entityType: 'club_member',
      entityId: memberId,
      details: JSON.stringify({
        targetEmail: member.user.email,
        targetUserId: member.user_id,
        previousRole,
        newRole: role,
        clubName: member.club.name
      })
    });

    return new Response(JSON.stringify({
      success: true,
      previousRole,
      newRole: role
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update member role error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update member role' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
