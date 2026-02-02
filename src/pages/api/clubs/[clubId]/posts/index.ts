import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';
import { slugify, generateId } from '../../../../../lib/utils';

// GET /api/clubs/[clubId]/posts - List posts
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

    // Check membership
    const member = await db.getClubMember(clubId, user.id);
    if (!member) {
      return new Response(JSON.stringify({ error: 'Not a member of this club' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all posts (both draft and published for admin)
    const results = await locals.runtime.env.DB!.prepare(`
      SELECT p.*, u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.club_id = ?
      ORDER BY p.created_at DESC
    `).bind(clubId).all();

    return new Response(JSON.stringify({ posts: results.results || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/clubs/[clubId]/posts - Create post
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

    // Check membership and permissions
    const member = await db.getClubMember(clubId, user.id);
    if (!member) {
      return new Response(JSON.stringify({ error: 'Not a member of this club' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only admin, pro, editor can create posts
    if (!['admin', 'pro', 'editor'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { title, summary, content, featuredImage, category, status } = body;

    if (!title?.trim()) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate slug
    let slug = slugify(title);
    const existing = await db.getPostBySlug(clubId, slug);
    if (existing) {
      slug = `${slug}-${generateId().slice(0, 8)}`;
    }

    // Only admin and pro can publish directly
    const finalStatus = status === 'published' && !['admin', 'pro'].includes(member.role)
      ? 'draft'
      : status || 'draft';

    const post = await db.createPost({
      clubId,
      title: title.trim(),
      slug,
      summary: summary?.trim(),
      content,
      featuredImage,
      category: category || 'news',
      status: finalStatus,
      authorId: user.id,
    });

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'post_created',
      entityType: 'post',
      entityId: post.id,
      details: JSON.stringify({ title: post.title, status: finalStatus }),
    });

    return new Response(JSON.stringify({ post }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
