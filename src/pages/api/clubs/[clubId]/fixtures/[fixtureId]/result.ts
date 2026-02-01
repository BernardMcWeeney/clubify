import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../../lib/db';
import { getAuthContext } from '../../../../../../lib/auth';

// POST /api/clubs/[clubId]/fixtures/[fixtureId]/result - Enter result
export const POST: APIRoute = async ({ params, request, cookies, locals }) => {
  try {
    const { clubId, fixtureId } = params;
    if (!clubId || !fixtureId) {
      return new Response(JSON.stringify({ error: 'Club ID and Fixture ID required' }), {
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

    if (!['admin', 'pro'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify fixture exists
    const existingFixture = await locals.runtime.env.DB!.prepare(
      `SELECT * FROM fixtures WHERE id = ? AND club_id = ?`
    ).bind(fixtureId, clubId).first();

    if (!existingFixture) {
      return new Response(JSON.stringify({ error: 'Fixture not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const {
      homeGoals,
      homePoints,
      awayGoals,
      awayPoints,
      matchReport,
      scorers,
      manOfTheMatch
    } = body;

    // Validate scores
    if (homeGoals === undefined || homePoints === undefined ||
        awayGoals === undefined || awayPoints === undefined) {
      return new Response(JSON.stringify({ error: 'All scores are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate totals (GAA scoring: goal = 3 points)
    const homeTotal = (parseInt(homeGoals) * 3) + parseInt(homePoints);
    const awayTotal = (parseInt(awayGoals) * 3) + parseInt(awayPoints);

    // Determine result
    let result: 'win' | 'loss' | 'draw';
    const isHome = existingFixture.is_home;

    if (isHome) {
      if (homeTotal > awayTotal) result = 'win';
      else if (homeTotal < awayTotal) result = 'loss';
      else result = 'draw';
    } else {
      if (awayTotal > homeTotal) result = 'win';
      else if (awayTotal < homeTotal) result = 'loss';
      else result = 'draw';
    }

    // Update fixture with result
    await locals.runtime.env.DB!.prepare(`
      UPDATE fixtures SET
        home_goals = ?,
        home_points = ?,
        away_goals = ?,
        away_points = ?,
        result = ?,
        match_report = ?,
        status = 'played',
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      homeGoals,
      homePoints,
      awayGoals,
      awayPoints,
      result,
      matchReport || null,
      fixtureId
    ).run();

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'fixture_result_entered',
      entityType: 'fixture',
      entityId: fixtureId,
      details: JSON.stringify({
        homeScore: `${homeGoals}-${homePoints}`,
        awayScore: `${awayGoals}-${awayPoints}`,
        result
      }),
    });

    // Fetch updated fixture
    const updatedFixture = await locals.runtime.env.DB!.prepare(
      `SELECT * FROM fixtures WHERE id = ?`
    ).bind(fixtureId).first();

    return new Response(JSON.stringify({ fixture: updatedFixture }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error recording result:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
