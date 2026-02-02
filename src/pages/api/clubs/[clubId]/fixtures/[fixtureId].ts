import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';

// GET /api/clubs/[clubId]/fixtures/[fixtureId] - Get single fixture
export const GET: APIRoute = async ({ params, cookies, locals }) => {
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

    const fixture = await locals.runtime.env.DB!.prepare(`
      SELECT * FROM fixtures WHERE id = ? AND club_id = ?
    `).bind(fixtureId, clubId).first();

    if (!fixture) {
      return new Response(JSON.stringify({ error: 'Fixture not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ fixture }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching fixture:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PATCH /api/clubs/[clubId]/fixtures/[fixtureId] - Update fixture
export const PATCH: APIRoute = async ({ params, request, cookies, locals }) => {
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
      opponent,
      matchDate,
      matchTime,
      venue,
      competition,
      isHome,
      teamName,
      notes,
      status
    } = body;

    // Build update
    const updates: Record<string, any> = {};
    if (opponent !== undefined) updates.opponent = opponent.trim();
    if (matchDate !== undefined) updates.match_date = matchDate;
    if (matchTime !== undefined) updates.match_time = matchTime || null;
    if (venue !== undefined) updates.venue = venue?.trim() || null;
    if (competition !== undefined) updates.competition = competition?.trim() || null;
    if (isHome !== undefined) updates.is_home = isHome ? 1 : 0;
    if (teamName !== undefined) updates.team_name = teamName?.trim() || null;
    if (notes !== undefined) updates.notes = notes?.trim() || null;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();

      const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(updates), fixtureId];

      await locals.runtime.env.DB!.prepare(
        `UPDATE fixtures SET ${setClauses} WHERE id = ?`
      ).bind(...values).run();
    }

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'fixture_updated',
      entityType: 'fixture',
      entityId: fixtureId,
      details: JSON.stringify({ updates: Object.keys(updates) }),
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
    console.error('Error updating fixture:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/clubs/[clubId]/fixtures/[fixtureId] - Delete fixture
export const DELETE: APIRoute = async ({ params, cookies, locals }) => {
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

    await locals.runtime.env.DB!.prepare(
      `DELETE FROM fixtures WHERE id = ?`
    ).bind(fixtureId).run();

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'fixture_deleted',
      entityType: 'fixture',
      entityId: fixtureId,
      details: JSON.stringify({ opponent: existingFixture.opponent }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting fixture:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
