import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../lib/db';
import { getAuthContext } from '../../../lib/auth';

export const GET: APIRoute = async ({ locals, cookies }) => {
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

    const deletedClubs = await db.getDeletedClubs();

    return new Response(JSON.stringify({
      clubs: deletedClubs,
      count: deletedClubs.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get recycling bin error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get recycling bin' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
