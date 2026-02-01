import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../../lib/db';
import { getAuthContext } from '../../../../../../lib/auth';

// GET /api/clubs/[clubId]/social/connect/instagram - Initiate Instagram connection via Facebook
export const GET: APIRoute = async ({ params, cookies, locals, redirect }) => {
  try {
    const { clubId } = params;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB!, locals.runtime.env.ENCRYPTION_SECRET);
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

    // Only admin can connect social accounts
    if (member.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can connect social accounts' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for Facebook App credentials (Instagram uses Facebook Graph API)
    const fbAppId = locals.runtime.env.FACEBOOK_APP_ID;
    const fbAppSecret = locals.runtime.env.FACEBOOK_APP_SECRET;
    const siteUrl = locals.runtime.env.SITE_URL || 'https://clubify.ie';

    if (!fbAppId || !fbAppSecret) {
      return new Response(JSON.stringify({ error: 'Facebook app not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate state parameter for CSRF protection
    const state = btoa(JSON.stringify({
      clubId,
      userId: user.id,
      ts: Date.now(),
      platform: 'instagram' // Mark that this is for Instagram
    }));

    // Build Facebook OAuth URL with Instagram permissions
    const redirectUri = `${siteUrl}/api/auth/callback/instagram`;
    const scope = 'pages_show_list,instagram_basic,instagram_content_publish,pages_read_engagement';

    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', fbAppId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('response_type', 'code');

    return redirect(authUrl.toString(), 302);
  } catch (error) {
    console.error('Error initiating Instagram OAuth:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/clubs/[clubId]/social/connect/instagram - Disconnect Instagram
export const DELETE: APIRoute = async ({ params, cookies, locals }) => {
  try {
    const { clubId } = params;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB!, locals.runtime.env.ENCRYPTION_SECRET);
    const { user } = await getAuthContext(cookies, db);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const member = await db.getClubMember(clubId, user.id);
    if (!member || member.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can disconnect social accounts' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.deleteSocialConnection(clubId, 'instagram');

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'social_disconnected',
      entityType: 'social_connection',
      details: JSON.stringify({ platform: 'instagram' }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error disconnecting Instagram:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
