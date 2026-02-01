import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../lib/db';
import { getAuthContext } from '../../../../lib/auth';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

// GET /api/auth/callback/facebook - Handle Facebook OAuth callback
export const GET: APIRoute = async ({ url, cookies, locals, redirect }) => {
  try {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Handle error from Facebook
    if (error) {
      console.error('Facebook OAuth error:', error, errorDescription);
      return redirect('/admin?error=facebook_denied', 302);
    }

    if (!code || !state) {
      return redirect('/admin?error=invalid_callback', 302);
    }

    // Decode and validate state
    let stateData: { clubId: string; userId: string; ts: number };
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return redirect('/admin?error=invalid_state', 302);
    }

    // Check state is not too old (30 minutes max)
    if (Date.now() - stateData.ts > 30 * 60 * 1000) {
      return redirect('/admin?error=state_expired', 302);
    }

    const db = new DatabaseService(locals.runtime.env.DB!);
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
    const redirectUri = `${siteUrl}/api/auth/callback/facebook`;

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

    // Get user's Facebook Pages
    const pagesUrl = new URL('https://graph.facebook.com/v18.0/me/accounts');
    pagesUrl.searchParams.set('access_token', userAccessToken);
    pagesUrl.searchParams.set('fields', 'id,name,access_token,category');

    const pagesResponse = await fetch(pagesUrl.toString());
    if (!pagesResponse.ok) {
      const err = await pagesResponse.text();
      console.error('Failed to get Facebook Pages:', err);
      return redirect(`/${club.slug}/admin-portal/settings/social?error=pages_fetch_failed`, 302);
    }

    const pagesData = await pagesResponse.json();
    const pages: FacebookPage[] = pagesData.data || [];

    if (pages.length === 0) {
      return redirect(`/${club.slug}/admin-portal/settings/social?error=no_pages_found`, 302);
    }

    // For MVP: If only one page, connect it automatically
    // Otherwise, store pages temporarily and redirect to selection
    if (pages.length === 1) {
      const page = pages[0];

      // Delete existing connection if any
      await db.deleteSocialConnection(stateData.clubId, 'facebook');

      // Create new connection with page token
      await db.createSocialConnection({
        clubId: stateData.clubId,
        platform: 'facebook',
        accessToken: page.access_token,
        pageId: page.id,
        pageName: page.name,
        connectedBy: user.id,
      });

      // Log audit
      await db.logAudit({
        clubId: stateData.clubId,
        userId: user.id,
        action: 'social_connected',
        entityType: 'social_connection',
        details: JSON.stringify({ platform: 'facebook', pageName: page.name, pageId: page.id }),
      });

      return redirect(`/${club.slug}/admin-portal/settings/social?success=facebook_connected`, 302);
    }

    // Multiple pages: Store in URL params and redirect to selection
    // In a production app, you'd store these in a KV or session store
    // For MVP, we'll encode them (up to 3 pages) in the URL
    const encodedPages = btoa(JSON.stringify(pages.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      token: p.access_token,
    }))));

    return redirect(`/${club.slug}/admin-portal/settings/social/select-page?pages=${encodedPages}`, 302);
  } catch (error) {
    console.error('Error in Facebook callback:', error);
    return redirect('/admin?error=callback_error', 302);
  }
};
