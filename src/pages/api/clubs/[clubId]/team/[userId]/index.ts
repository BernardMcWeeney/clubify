import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../../lib/db';
import { getAuthContext } from '../../../../../../lib/auth';
import { hasPermission, type Role } from '../../../../../../lib/permissions';

// DELETE /api/clubs/[clubId]/team/[userId] - Remove member from club
export const DELETE: APIRoute = async ({ params, cookies, locals }) => {
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
    if (!hasPermission(member.role as Role, 'team.remove')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Can't remove self
    if (userId === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot remove yourself' }), {
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

    // Can't remove another admin
    if (targetMember.role === 'admin') {
      return new Response(JSON.stringify({ error: 'Cannot remove an admin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get target user info for audit log
    const targetUser = await db.getUserById(userId);

    // Remove member
    await db.removeClubMember(clubId, userId);

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'member_removed',
      entityType: 'club_member',
      entityId: userId,
      details: JSON.stringify({
        removedUserEmail: targetUser?.email,
        removedUserName: targetUser?.name,
        role: targetMember.role,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
