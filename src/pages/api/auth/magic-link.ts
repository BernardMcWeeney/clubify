import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../lib/db';
import { sendMagicLinkEmail } from '../../../lib/auth';
import { isValidEmail } from '../../../lib/utils';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { email, name } = await request.json();

    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB);
    const baseUrl = locals.runtime.env.SITE_URL || 'https://clubify.ie';

    // Check if user exists
    let user = await db.getUserByEmail(email);

    // If name provided and user doesn't exist, this is a signup
    if (!user && name) {
      user = await db.createUser(email.toLowerCase(), name);
    }

    // Create magic link
    const token = await db.createMagicLink(email.toLowerCase());

    // Send email
    await sendMagicLinkEmail(email, token, baseUrl);

    return new Response(JSON.stringify({
      success: true,
      message: 'Magic link sent to your email',
      isNewUser: !user
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send magic link' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
