import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';
import { generateId } from '../../../../../lib/utils';

// GET /api/clubs/[clubId]/fixtures - List fixtures
export const GET: APIRoute = async ({ params, url, cookies, locals }) => {
  try {
    const { clubId } = params;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB!);
    const { user } = await getAuthContext(cookies, db);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const member = await db.getClubMember(clubId, user.id);
    if (!member) {
      return new Response(JSON.stringify({ error: 'Not a member of this club' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get filter from query params
    const filter = url.searchParams.get('filter') || 'all';

    let fixtures;
    if (filter === 'upcoming') {
      fixtures = await db.getUpcomingFixtures(clubId, 50);
    } else if (filter === 'played') {
      fixtures = await db.getPlayedFixtures(clubId, 50);
    } else {
      // Get all fixtures
      const results = await locals.runtime.env.DB!.prepare(`
        SELECT * FROM fixtures
        WHERE club_id = ?
        ORDER BY match_date DESC
      `).bind(clubId).all();
      fixtures = results.results || [];
    }

    return new Response(JSON.stringify({ fixtures }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/clubs/[clubId]/fixtures - Create fixture
export const POST: APIRoute = async ({ params, request, cookies, locals }) => {
  try {
    const { clubId } = params;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB!);
    const { user } = await getAuthContext(cookies, db);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const member = await db.getClubMember(clubId, user.id);
    if (!member) {
      return new Response(JSON.stringify({ error: 'Not a member of this club' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only admin and pro can manage fixtures
    if (!['admin', 'pro'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const {
      opponent,
      matchDate,
      matchTime,
      venue,
      competition,
      isHome,
      teamName,
      notes
    } = body;

    if (!opponent?.trim()) {
      return new Response(JSON.stringify({ error: 'Opponent is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!matchDate) {
      return new Response(JSON.stringify({ error: 'Match date is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fixture = await db.createFixture({
      clubId,
      opponent: opponent.trim(),
      matchDate,
      matchTime: matchTime || null,
      venue: venue?.trim() || null,
      competition: competition?.trim() || null,
      isHome: isHome ?? true,
      teamName: teamName?.trim() || null,
      notes: notes?.trim() || null,
    });

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'fixture_created',
      entityType: 'fixture',
      entityId: fixture.id,
      details: JSON.stringify({ opponent, matchDate }),
    });

    return new Response(JSON.stringify({ fixture }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating fixture:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
