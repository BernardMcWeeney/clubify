import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../lib/db';
import { getAuthContext } from '../../../lib/auth';

const IMPERSONATION_COOKIE = 'clubify_impersonate';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
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

    // Only super admin can impersonate
    if (!user || !superAdminEmail || user.email.toLowerCase() !== superAdminEmail.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { clubId } = await request.json();
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the club
    const club = await db.getClub(clubId);
    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set impersonation cookie with club info
    const impersonationData = {
      clubId: club.id,
      clubName: club.name,
      clubSlug: club.slug,
      superAdminEmail: user.email,
      startedAt: new Date().toISOString(),
    };

    cookies.set(IMPERSONATION_COOKIE, JSON.stringify(impersonationData), {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours max for impersonation
    });

    // Log the impersonation
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'super_admin_impersonate_start',
      entityType: 'club',
      entityId: clubId,
      details: JSON.stringify({ superAdminEmail: user.email })
    });

    return new Response(JSON.stringify({
      success: true,
      redirectUrl: `/${club.slug}/admin-portal`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Impersonation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to impersonate' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Exit impersonation
export const DELETE: APIRoute = async ({ locals, cookies }) => {
  try {
    if (!locals.runtime.env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const impersonationCookie = cookies.get(IMPERSONATION_COOKIE)?.value;
    if (!impersonationCookie) {
      return new Response(JSON.stringify({ error: 'Not in impersonation mode' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);

    let impersonationData;
    try {
      impersonationData = JSON.parse(impersonationCookie);
    } catch {
      // Invalid cookie, just clear it
    }

    // Log the exit
    if (user && impersonationData?.clubId) {
      await db.logAudit({
        clubId: impersonationData.clubId,
        userId: user.id,
        action: 'super_admin_impersonate_end',
        entityType: 'club',
        entityId: impersonationData.clubId,
        details: JSON.stringify({ superAdminEmail: user.email })
      });
    }

    // Clear the impersonation cookie
    cookies.delete(IMPERSONATION_COOKIE, { path: '/' });

    return new Response(JSON.stringify({
      success: true,
      redirectUrl: '/admin/super',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Exit impersonation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to exit impersonation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Helper to check if currently impersonating (for use in pages)
export function getImpersonationData(cookies: { get: (name: string) => { value: string } | undefined }): {
  clubId: string;
  clubName: string;
  clubSlug: string;
  superAdminEmail: string;
  startedAt: string;
} | null {
  const cookie = cookies.get(IMPERSONATION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    return JSON.parse(cookie);
  } catch {
    return null;
  }
}
