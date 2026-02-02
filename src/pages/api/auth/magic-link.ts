import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../lib/db';
import { sendMagicLinkEmail } from '../../../lib/auth';
import { isValidEmail } from '../../../lib/utils';
import { checkRateLimit, getRateLimitKey, rateLimitExceeded, rateLimitHeaders, RATE_LIMITS } from '../../../lib/rate-limit';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Rate limiting - prevent brute force/spam
    const rateLimitKey = getRateLimitKey(request, 'magic-link');
    const rateLimitResult = await checkRateLimit(
      locals.runtime.env.RATE_LIMIT,
      rateLimitKey,
      RATE_LIMITS.magicLink
    );

    if (!rateLimitResult.allowed) {
      return rateLimitExceeded(rateLimitResult, RATE_LIMITS.magicLink);
    }

    // Check if database is configured
    if (!locals.runtime.env.DB) {
      return new Response(JSON.stringify({
        error: 'Database not configured. Please set up D1 database.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { email, name } = await request.json();

    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB);
    const baseUrl = locals.runtime.env.SITE_URL || new URL(request.url).origin;

    // Check if user exists
    let user = await db.getUserByEmail(email);

    // If name provided and user doesn't exist, this is a signup
    if (!user && name) {
      user = await db.createUser(email.toLowerCase(), name);
    }

    // Create magic link
    const token = await db.createMagicLink(email.toLowerCase());

    // Build the magic link URL
    const magicLink = `${baseUrl}/auth/verify?token=${token}`;

    // Send email (or return link in dev mode)
    const resendApiKey = locals.runtime.env.RESEND_API_KEY;

    if (resendApiKey) {
      // Production: send via Resend
      await sendMagicLinkEmail(email, token, baseUrl, resendApiKey);
    } else {
      // Dev mode: log to console
      console.log(`\n[DEV MODE] Magic link for ${email}: ${magicLink}\n`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: resendApiKey
        ? 'Magic link sent to your email'
        : 'Magic link generated (dev mode - check response)',
      isNewUser: !user,
      // In dev mode without email service, return the link directly
      ...(resendApiKey ? {} : { devModeLink: magicLink })
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to send magic link',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
