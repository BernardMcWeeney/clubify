import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';

export const POST: APIRoute = async ({ locals, cookies, params }) => {
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

    const club = await db.getClub(clubId);
    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!club.deleted_at) {
      return new Response(JSON.stringify({ error: 'Club is not in the recycling bin' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.restoreClub(clubId);

    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'super_admin_restore',
      entityType: 'club',
      entityId: clubId,
      details: JSON.stringify({ clubName: club.name, clubSlug: club.slug })
    });

    return new Response(JSON.stringify({ success: true, message: 'Club restored successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Super admin restore error:', error);
    return new Response(JSON.stringify({ error: 'Failed to restore club' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
