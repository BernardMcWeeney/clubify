import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../lib/db';
import { setSessionCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const { token } = await request.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB);

    // Verify the magic link
    const result = await db.verifyMagicLink(token);

    if (!result) {
      return new Response(JSON.stringify({ error: 'Invalid or expired link' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get or create user
    let user = await db.getUserByEmail(result.email);

    if (!user) {
      // This shouldn't happen normally, but handle it
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mark email as verified
    if (!user.email_verified) {
      await db.updateUser(user.id, { email_verified: 1 } as any);
    }

    // Create session
    const sessionId = await db.createSession(user.id);
    setSessionCookie(cookies, sessionId);

    // Get user's clubs
    const clubs = await db.getUserClubs(user.id);

    // Log the auth event
    await db.logAudit({
      userId: user.id,
      action: 'user_login',
      details: 'Magic link authentication'
    });

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      clubs,
      hasClubs: clubs.length > 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Verify error:', error);
    return new Response(JSON.stringify({ error: 'Verification failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
