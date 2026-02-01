import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../../lib/db';
import { getAuthContext } from '../../../../../../lib/auth';
import { hasPermission, ROLE_HIERARCHY, ROLE_LABELS, type Role } from '../../../../../../lib/permissions';

// PATCH /api/clubs/[clubId]/team/[userId]/role - Change member role
export const PATCH: APIRoute = async ({ params, request, cookies, locals }) => {
  try {
    const { clubId, userId } = params;
    if (!clubId || !userId) {
      return new Response(JSON.stringify({ error: 'Club ID and User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB!);
    const { user } = await getAuthContext(cookies, db);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const member = await db.getClubMember(clubId, user.id);
    if (!member) {
      return new Response(JSON.stringify({ error: 'Not a member of this club' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check permission
    if (!hasPermission(member.role as Role, 'team.change_role')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Can't change own role
    if (userId === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot change your own role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get target member
    const targetMember = await db.getClubMember(clubId, userId);
    if (!targetMember) {
      return new Response(JSON.stringify({ error: 'Member not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Can't change another admin's role
    if (targetMember.role === 'admin') {
      return new Response(JSON.stringify({ error: 'Cannot change an admin\'s role' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { role } = await request.json();

    if (!role || !ROLE_HIERARCHY.includes(role)) {
      return new Response(JSON.stringify({ error: 'Valid role is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only admin can promote to admin
    if (role === 'admin' && member.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can promote to admin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update role
    await db.updateClubMemberRole(clubId, userId, role);

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'member_role_changed',
      entityType: 'club_member',
      entityId: userId,
      details: JSON.stringify({
        previousRole: targetMember.role,
        newRole: role,
      }),
    });

    return new Response(JSON.stringify({
      success: true,
      role,
      roleLabel: ROLE_LABELS[role as Role],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error changing role:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
