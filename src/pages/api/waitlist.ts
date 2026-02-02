import type { APIRoute } from 'astro';
import { DatabaseService } from '../../lib/db';
import { isReady, type SportType, SPORT_TYPES } from '../../lib/sports';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { email, clubName, sport } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate sport
    if (!sport || !SPORT_TYPES.includes(sport as SportType)) {
      return new Response(
        JSON.stringify({ error: 'Valid sport is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if sport is "coming_soon" - only allow waitlist for those
    if (isReady(sport as SportType)) {
      return new Response(
        JSON.stringify({
          error: `${sport.toUpperCase()} is already available. Create your club now!`,
          redirect: '/admin/signup',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add to waitlist
    const db = new DatabaseService(locals.runtime.env.DB);
    const waitlistEntry = await db.addToWaitlist({
      email: email.trim().toLowerCase(),
      clubName: clubName?.trim() || undefined,
      sport,
      source: 'website',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `You've been added to the ${sport} waitlist!`,
        id: waitlistEntry.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Waitlist error:', error);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// GET endpoint to check waitlist count (for marketing purposes)
export const GET: APIRoute = async ({ url, locals }) => {
  const sport = url.searchParams.get('sport');

  if (!sport || !SPORT_TYPES.includes(sport as SportType)) {
    return new Response(
      JSON.stringify({ error: 'Valid sport parameter is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = new DatabaseService(locals.runtime.env.DB);
  const count = await db.getWaitlistCount(sport);

  return new Response(
    JSON.stringify({ sport, count }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
