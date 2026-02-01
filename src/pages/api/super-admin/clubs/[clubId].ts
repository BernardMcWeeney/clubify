import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../lib/db';
import { getAuthContext } from '../../../../lib/auth';

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

    const clubId = params.clubId;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { is_live } = await request.json();
    if (typeof is_live !== 'number') {
      return new Response(JSON.stringify({ error: 'Invalid status value' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.updateClub(clubId, { is_live });

    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'super_admin_update',
      entityType: 'club',
      entityId: clubId,
      details: JSON.stringify({ is_live })
    });

    return new Response(JSON.stringify({ success: true, is_live }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Super admin update error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update club' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
