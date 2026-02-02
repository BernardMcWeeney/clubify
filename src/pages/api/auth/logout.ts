import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../lib/db';
import { clearSessionCookie, getAuthContext } from '../../../lib/auth';

export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    const db = new DatabaseService(locals.runtime.env.DB);
    const { sessionId, user } = await getAuthContext(cookies, db);

    if (sessionId) {
      await db.deleteSession(sessionId);

      if (user) {
        await db.logAudit({
          userId: user.id,
          action: 'user_logout'
        });
      }
    }

    clearSessionCookie(cookies);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Logout error:', error);
    clearSessionCookie(cookies);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
