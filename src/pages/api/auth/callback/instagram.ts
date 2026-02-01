import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../lib/db';
import { getAuthContext } from '../../../../lib/auth';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
  };
}

// GET /api/auth/callback/instagram - Handle Instagram OAuth callback (via Facebook)
export const GET: APIRoute = async ({ url, cookies, locals, redirect }) => {
  try {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Handle error from Facebook
    if (error) {
      console.error('Instagram OAuth error:', error, errorDescription);
      return redirect('/admin?error=instagram_denied', 302);
    }

    if (!code || !state) {
      return redirect('/admin?error=invalid_callback', 302);
    }

    // Decode and validate state
    let stateData: { clubId: string; userId: string; ts: number; platform: string };
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return redirect('/admin?error=invalid_state', 302);
    }

    // Verify this is for Instagram
    if (stateData.platform !== 'instagram') {
      return redirect('/admin?error=invalid_platform', 302);
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

    const fbAppId = locals.runtime.env.FACEBOOK_APP_ID;
    const fbAppSecret = locals.runtime.env.FACEBOOK_APP_SECRET;
    const siteUrl = locals.runtime.env.SITE_URL || 'https://clubify.ie';
    const redirectUri = `${siteUrl}/api/auth/callback/instagram`;

    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', fbAppId);
    tokenUrl.searchParams.set('client_secret', fbAppSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('Failed to exchange code for token:', err);
      return redirect(`/${club.slug}/admin-portal/settings/social?error=token_exchange_failed`, 302);
    }

    const tokenData = await tokenResponse.json();
    const userAccessToken = tokenData.access_token;

    // Get user's Facebook Pages with Instagram Business Accounts
    const pagesUrl = new URL('https://graph.facebook.com/v18.0/me/accounts');
    pagesUrl.searchParams.set('access_token', userAccessToken);
    pagesUrl.searchParams.set('fields', 'id,name,access_token,instagram_business_account');

    const pagesResponse = await fetch(pagesUrl.toString());
    if (!pagesResponse.ok) {
      const err = await pagesResponse.text();
      console.error('Failed to get Facebook Pages:', err);
      return redirect(`/${club.slug}/admin-portal/settings/social?error=pages_fetch_failed`, 302);
    }

    const pagesData = await pagesResponse.json();
    const pages: FacebookPage[] = pagesData.data || [];

    // Filter pages that have Instagram Business Accounts
    const pagesWithInstagram = pages.filter(page => page.instagram_business_account?.id);

    if (pagesWithInstagram.length === 0) {
      return redirect(`/${club.slug}/admin-portal/settings/social?error=no_instagram_accounts`, 302);
    }

    // For MVP: If only one page with Instagram, connect it automatically
    if (pagesWithInstagram.length === 1) {
      const page = pagesWithInstagram[0];
      const igAccountId = page.instagram_business_account!.id;

      // Get Instagram account username
      const igUrl = new URL(`https://graph.facebook.com/v18.0/${igAccountId}`);
      igUrl.searchParams.set('fields', 'username');
      igUrl.searchParams.set('access_token', page.access_token);

      const igResponse = await fetch(igUrl.toString());
      const igData = igResponse.ok ? await igResponse.json() : {};
      const igUsername = igData.username || 'Unknown';

      // Delete existing connection if any
      await db.deleteSocialConnection(stateData.clubId, 'instagram');

      // Create new connection with page token (which also works for Instagram API)
      await db.createSocialConnection({
        clubId: stateData.clubId,
        platform: 'instagram',
        accessToken: page.access_token,
        pageId: page.id,
        pageName: page.name,
        externalUserId: igAccountId,
        externalUsername: igUsername,
        connectedBy: user.id,
      });

      // Log audit
      await db.logAudit({
        clubId: stateData.clubId,
        userId: user.id,
        action: 'social_connected',
        entityType: 'social_connection',
        details: JSON.stringify({
          platform: 'instagram',
          username: igUsername,
          pageName: page.name,
        }),
      });

      return redirect(`/${club.slug}/admin-portal/settings/social?success=instagram_connected`, 302);
    }

    // Multiple pages with Instagram: Store in URL params and redirect to selection
    const encodedPages = btoa(JSON.stringify(pagesWithInstagram.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      token: p.access_token,
      igId: p.instagram_business_account?.id,
    }))));

    return redirect(`/${club.slug}/admin-portal/settings/social/select-instagram?pages=${encodedPages}`, 302);
  } catch (error) {
    console.error('Error in Instagram callback:', error);
    return redirect('/admin?error=callback_error', 302);
  }
};
