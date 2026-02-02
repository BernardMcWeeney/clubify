import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';
import { slugify, generateId } from '../../../../../lib/utils';

// GET /api/clubs/[clubId]/pages - List pages
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

    const pages = await db.getPages(clubId);

    return new Response(JSON.stringify({ pages }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/clubs/[clubId]/pages - Create page
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

    if (!['admin', 'pro', 'editor'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { title, content, metaDescription, isPublished } = body;

    if (!title?.trim()) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let slug = slugify(title);
    const existing = await db.getPageBySlug(clubId, slug);
    if (existing) {
      slug = `${slug}-${generateId().slice(0, 8)}`;
    }

    const page = await db.createPage({
      clubId,
      title: title.trim(),
      slug,
      content,
      metaDescription: metaDescription?.trim(),
      isPublished: isPublished && ['admin', 'pro'].includes(member.role),
      authorId: user.id,
    });

    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'page_created',
      entityType: 'page',
      entityId: page.id,
      details: JSON.stringify({ title: page.title }),
    });

    return new Response(JSON.stringify({ page }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating page:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
