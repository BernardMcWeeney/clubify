import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';

export const GET: APIRoute = async ({ locals, cookies, params }) => {
  try {
    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);
    const clubId = params.clubId;

    if (!user || !clubId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const member = await db.getClubMember(clubId, user.id);
    if (!member || !['admin', 'pro'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const settings = await db.getContactSettings(clubId);
    const retentionDays = settings?.retention_days ?? 30;
    const submissions = await db.getContactSubmissions(clubId, retentionDays);

    return new Response(JSON.stringify({ submissions, retentionDays }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get contact submissions error:', error);
    return new Response(JSON.stringify({ error: 'Failed to load submissions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
