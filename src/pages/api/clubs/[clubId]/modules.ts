import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../lib/db';
import { getAuthContext } from '../../../../lib/auth';
import { hasPermission, type Role } from '../../../../lib/permissions';

// GET /api/clubs/[clubId]/modules - Get module configuration
export const GET: APIRoute = async ({ params, cookies, locals }) => {
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

    const config = await db.getModuleConfig(clubId);

    return new Response(JSON.stringify({ config }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching module config:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PATCH /api/clubs/[clubId]/modules - Update module configuration
export const PATCH: APIRoute = async ({ params, request, cookies, locals }) => {
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

    // Only admin can change module configuration
    if (!hasPermission(member.role as Role, 'settings.edit')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid configuration' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.updateModuleConfig(clubId, config);

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'modules_updated',
      entityType: 'club',
      entityId: clubId,
      details: JSON.stringify({ modules: config }),
    });

    return new Response(JSON.stringify({ success: true, config }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating module config:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
