import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';

// POST /api/clubs/[clubId]/social/select-page - Save selected Facebook page
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
    if (!member || member.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can connect social accounts' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { pageId, pageName, accessToken } = body;

    if (!pageId || !accessToken) {
      return new Response(JSON.stringify({ error: 'Page ID and access token required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete existing connection if any
    await db.deleteSocialConnection(clubId, 'facebook');

    // Create new connection
    await db.createSocialConnection({
      clubId,
      platform: 'facebook',
      accessToken,
      pageId,
      pageName: pageName || 'Facebook Page',
      connectedBy: user.id,
    });

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'social_connected',
      entityType: 'social_connection',
      details: JSON.stringify({ platform: 'facebook', pageName, pageId }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error selecting Facebook page:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
