import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';

// GET /api/clubs/[clubId]/pages/[pageId]
export const GET: APIRoute = async ({ params, cookies, locals }) => {
  try {
    const { clubId, pageId } = params;
    if (!clubId || !pageId) {
      return new Response(JSON.stringify({ error: 'Club ID and Page ID required' }), {
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

    const page = await locals.runtime.env.DB!.prepare(
      `SELECT * FROM pages WHERE id = ? AND club_id = ?`
    ).bind(pageId, clubId).first();

    if (!page) {
      return new Response(JSON.stringify({ error: 'Page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ page }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PATCH /api/clubs/[clubId]/pages/[pageId]
export const PATCH: APIRoute = async ({ params, request, cookies, locals }) => {
  try {
    const { clubId, pageId } = params;
    if (!clubId || !pageId) {
      return new Response(JSON.stringify({ error: 'Club ID and Page ID required' }), {
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

    if (!['admin', 'pro', 'editor'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existingPage = await locals.runtime.env.DB!.prepare(
      `SELECT * FROM pages WHERE id = ? AND club_id = ?`
    ).bind(pageId, clubId).first();

    if (!existingPage) {
      return new Response(JSON.stringify({ error: 'Page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { title, content, metaDescription, isPublished } = body;

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content;
    if (metaDescription !== undefined) updates.meta_description = metaDescription?.trim() || null;
    if (isPublished !== undefined && ['admin', 'pro'].includes(member.role)) {
      updates.is_published = isPublished ? 1 : 0;
    }

    if (Object.keys(updates).length > 0) {
      await db.updatePage(pageId, updates);
    }

    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'page_updated',
      entityType: 'page',
      entityId: pageId,
      details: JSON.stringify({ updates: Object.keys(updates) }),
    });

    const updatedPage = await locals.runtime.env.DB!.prepare(
      `SELECT * FROM pages WHERE id = ?`
    ).bind(pageId).first();

    return new Response(JSON.stringify({ page: updatedPage }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating page:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/clubs/[clubId]/pages/[pageId]
export const DELETE: APIRoute = async ({ params, cookies, locals }) => {
  try {
    const { clubId, pageId } = params;
    if (!clubId || !pageId) {
      return new Response(JSON.stringify({ error: 'Club ID and Page ID required' }), {
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

    const existingPage = await locals.runtime.env.DB!.prepare(
      `SELECT * FROM pages WHERE id = ? AND club_id = ?`
    ).bind(pageId, clubId).first<any>();

    if (!existingPage) {
      return new Response(JSON.stringify({ error: 'Page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.deletePage(pageId);

    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'page_deleted',
      entityType: 'page',
      entityId: pageId,
      details: JSON.stringify({ title: existingPage.title }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
