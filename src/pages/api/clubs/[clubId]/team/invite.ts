import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext, sendInvitationEmail } from '../../../../../lib/auth';
import { hasPermission, ROLE_HIERARCHY, ROLE_LABELS, type Role } from '../../../../../lib/permissions';
import { isValidEmail } from '../../../../../lib/utils';

// POST /api/clubs/[clubId]/team/invite - Send invitation
export const POST: APIRoute = async ({ params, request, cookies, locals }) => {
  try {
    const { clubId } = params;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
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
    if (!hasPermission(member.role as Role, 'team.invite')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email, role } = await request.json();

    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!role || !ROLE_HIERARCHY.includes(role)) {
      return new Response(JSON.stringify({ error: 'Valid role is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only admin can invite other admins
    if (role === 'admin' && member.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can invite other admins' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is already a member
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      const existingMember = await db.getClubMember(clubId, existingUser.id);
      if (existingMember) {
        return new Response(JSON.stringify({ error: 'User is already a member of this club' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const club = await db.getClubById(clubId);
    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create invitation
    const token = await db.createInvitation({
      clubId,
      email,
      role,
      invitedBy: user.id,
    });

    const baseUrl = locals.runtime.env.SITE_URL || 'https://clubify.ie';
    const resendApiKey = locals.runtime.env.RESEND_API_KEY;

    // Send invitation email (or log in dev mode)
    await sendInvitationEmail(
      email,
      token,
      club.name,
      user.name,
      ROLE_LABELS[role as Role],
      baseUrl,
      resendApiKey
    );

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'member_invited',
      entityType: 'invitation',
      details: JSON.stringify({ email, role }),
    });

    return new Response(JSON.stringify({
      success: true,
      message: resendApiKey ? 'Invitation sent' : 'Invitation created (dev mode)',
      devMode: !resendApiKey,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
