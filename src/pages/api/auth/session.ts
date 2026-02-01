import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../lib/db';
import { getAuthContext } from '../../../lib/auth';

export const GET: APIRoute = async ({ locals, cookies }) => {
  try {
    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);

    if (!user) {
      return new Response(JSON.stringify({ user: null, clubs: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clubs = await db.getUserClubs(user.id);

    return new Response(JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url
      },
      clubs
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Session error:', error);
    return new Response(JSON.stringify({ user: null, clubs: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
