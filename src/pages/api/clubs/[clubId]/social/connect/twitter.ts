import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../../lib/db';
import { getAuthContext } from '../../../../../../lib/auth';

// GET /api/clubs/[clubId]/social/connect/twitter - Initiate Twitter OAuth 2.0
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

    // Check for Twitter App credentials
    const twitterClientId = locals.runtime.env.TWITTER_CLIENT_ID;
    const twitterClientSecret = locals.runtime.env.TWITTER_CLIENT_SECRET;
    const siteUrl = locals.runtime.env.SITE_URL || 'https://clubify.ie';

    if (!twitterClientId || !twitterClientSecret) {
      return new Response(JSON.stringify({ error: 'Twitter app not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate state parameter for CSRF protection (includes clubId)
    const state = btoa(JSON.stringify({ clubId, userId: user.id, ts: Date.now() }));

    // Generate code verifier for PKCE (Twitter OAuth 2.0 requires PKCE)
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store code verifier in a temporary store (you may want to use a more robust solution)
    // For now, we'll encode it in the state
    const stateWithVerifier = btoa(JSON.stringify({
      clubId,
      userId: user.id,
      ts: Date.now(),
      codeVerifier
    }));

    // Build Twitter OAuth 2.0 URL
    const redirectUri = `${siteUrl}/api/auth/callback/twitter`;
    const scope = 'tweet.read tweet.write users.read offline.access';

    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', twitterClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', stateWithVerifier);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    return redirect(authUrl.toString(), 302);
  } catch (error) {
    console.error('Error initiating Twitter OAuth:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/clubs/[clubId]/social/connect/twitter - Disconnect Twitter
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

    await db.deleteSocialConnection(clubId, 'twitter');

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'social_disconnected',
      entityType: 'social_connection',
      details: JSON.stringify({ platform: 'twitter' }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error disconnecting Twitter:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Helper functions for PKCE (Proof Key for Code Exchange)
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

function base64URLEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
