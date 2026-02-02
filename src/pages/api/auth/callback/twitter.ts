import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../lib/db';
import { getAuthContext } from '../../../../lib/auth';

// GET /api/auth/callback/twitter - Handle Twitter OAuth 2.0 callback
export const GET: APIRoute = async ({ url, cookies, locals, redirect }) => {
  try {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Handle error from Twitter
    if (error) {
      console.error('Twitter OAuth error:', error, errorDescription);
      return redirect('/admin?error=twitter_denied', 302);
    }

    if (!code || !state) {
      return redirect('/admin?error=invalid_callback', 302);
    }

    // Decode and validate state
    let stateData: { clubId: string; userId: string; ts: number; codeVerifier: string };
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return redirect('/admin?error=invalid_state', 302);
    }

    // Check state is not too old (30 minutes max)
    if (Date.now() - stateData.ts > 30 * 60 * 1000) {
      return redirect('/admin?error=state_expired', 302);
    }

    const db = new DatabaseService(locals.runtime.env.DB!, locals.runtime.env.ENCRYPTION_SECRET);
    const { user } = await getAuthContext(cookies, db);

    // Verify user matches state
    if (!user || user.id !== stateData.userId) {
      return redirect('/admin/login?error=session_expired', 302);
    }

    // Verify user is still admin of the club
    const member = await db.getClubMember(stateData.clubId, user.id);
    if (!member || member.role !== 'admin') {
      return redirect('/admin?error=permission_denied', 302);
    }

    // Get club for redirect
    const club = await db.getClubById(stateData.clubId);
    if (!club) {
      return redirect('/admin?error=club_not_found', 302);
    }

    const twitterClientId = locals.runtime.env.TWITTER_CLIENT_ID;
    const twitterClientSecret = locals.runtime.env.TWITTER_CLIENT_SECRET;
    const siteUrl = locals.runtime.env.SITE_URL || 'https://clubify.ie';
    const redirectUri = `${siteUrl}/api/auth/callback/twitter`;

    // Exchange code for access token (Twitter OAuth 2.0 with PKCE)
    const tokenUrl = 'https://api.twitter.com/2/oauth2/token';

    const tokenParams = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: twitterClientId,
      redirect_uri: redirectUri,
      code_verifier: stateData.codeVerifier,
    });

    const authHeader = btoa(`${twitterClientId}:${twitterClientSecret}`);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`,
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('Failed to exchange code for token:', err);
      return redirect(`/${club.slug}/admin-portal/settings/social?error=token_exchange_failed`, 302);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // Get Twitter user info
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const err = await userResponse.text();
      console.error('Failed to get Twitter user info:', err);
      return redirect(`/${club.slug}/admin-portal/settings/social?error=user_fetch_failed`, 302);
    }

    const userData = await userResponse.json();
    const twitterUsername = userData.data?.username || 'Unknown';
    const twitterUserId = userData.data?.id;

    // Delete existing connection if any
    await db.deleteSocialConnection(stateData.clubId, 'twitter');

    // Create new connection
    await db.createSocialConnection({
      clubId: stateData.clubId,
      platform: 'twitter',
      accessToken: accessToken,
      refreshToken: refreshToken,
      externalUserId: twitterUserId,
      externalUsername: twitterUsername,
      connectedBy: user.id,
    });

    // Log audit
    await db.logAudit({
      clubId: stateData.clubId,
      userId: user.id,
      action: 'social_connected',
      entityType: 'social_connection',
      details: JSON.stringify({ platform: 'twitter', username: twitterUsername }),
    });

    return redirect(`/${club.slug}/admin-portal/settings/social?success=twitter_connected`, 302);
  } catch (error) {
    console.error('Error in Twitter callback:', error);
    return redirect('/admin?error=callback_error', 302);
  }
};
