import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';

export const DELETE: APIRoute = async ({ request, locals, cookies, params }) => {
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

    const clubId = params.clubId;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Require confirmation in request body
    const body = await request.json().catch(() => ({}));
    if (body.confirm !== true) {
      return new Response(JSON.stringify({
        error: 'Confirmation required. Send { "confirm": true } to permanently delete.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const club = await db.getClub(clubId);
    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!club.deleted_at) {
      return new Response(JSON.stringify({
        error: 'Club must be in recycling bin before permanent deletion. Delete it first.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Store club info for audit before deletion
    const clubInfo = {
      clubId: club.id,
      clubName: club.name,
      clubSlug: club.slug,
      deletedAt: club.deleted_at
    };

    await db.permanentlyDeleteClub(clubId);

    // Log to audit without club_id since club no longer exists
    await db.logAudit({
      userId: user.id,
      action: 'super_admin_permanent_delete',
      entityType: 'club',
      entityId: clubId,
      details: JSON.stringify(clubInfo)
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Club permanently deleted'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Super admin permanent delete error:', error);
    return new Response(JSON.stringify({ error: 'Failed to permanently delete club' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
