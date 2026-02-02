import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';

// GET /api/clubs/[clubId]/posts/[postId] - Get single post
export const GET: APIRoute = async ({ params, cookies, locals }) => {
  try {
    const { clubId, postId } = params;
    if (!clubId || !postId) {
      return new Response(JSON.stringify({ error: 'Club ID and Post ID required' }), {
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

    const result = await locals.runtime.env.DB!.prepare(`
      SELECT p.*, u.name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ? AND p.club_id = ?
    `).bind(postId, clubId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ post: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PATCH /api/clubs/[clubId]/posts/[postId] - Update post
export const PATCH: APIRoute = async ({ params, request, cookies, locals }) => {
  try {
    const { clubId, postId } = params;
    if (!clubId || !postId) {
      return new Response(JSON.stringify({ error: 'Club ID and Post ID required' }), {
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

    // Verify post exists and belongs to club
    const existingPost = await locals.runtime.env.DB!.prepare(
      `SELECT * FROM posts WHERE id = ? AND club_id = ?`
    ).bind(postId, clubId).first();

    if (!existingPost) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { title, summary, content, featuredImage, category, status } = body;

    // Build update object
    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title.trim();
    if (summary !== undefined) updates.summary = summary?.trim() || null;
    if (content !== undefined) updates.content = content;
    if (featuredImage !== undefined) updates.featured_image = featuredImage;
    if (category !== undefined) updates.category = category;

    // Handle status changes - only admin/pro can publish
    if (status !== undefined) {
      if (status === 'published' && !['admin', 'pro'].includes(member.role)) {
        // Editor cannot publish, keep as draft
        updates.status = 'draft';
      } else {
        updates.status = status;
        if (status === 'published' && !existingPost.published_at) {
          updates.published_at = new Date().toISOString();
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.updatePost(postId, updates);
    }

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'post_updated',
      entityType: 'post',
      entityId: postId,
      details: JSON.stringify({ updates: Object.keys(updates) }),
    });

    // Fetch updated post
    const updatedPost = await locals.runtime.env.DB!.prepare(
      `SELECT * FROM posts WHERE id = ?`
    ).bind(postId).first();

    return new Response(JSON.stringify({ post: updatedPost }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/clubs/[clubId]/posts/[postId] - Delete post
export const DELETE: APIRoute = async ({ params, cookies, locals }) => {
  try {
    const { clubId, postId } = params;
    if (!clubId || !postId) {
      return new Response(JSON.stringify({ error: 'Club ID and Post ID required' }), {
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

    // Only admin and pro can delete
    if (!['admin', 'pro'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify post exists
    const existingPost = await locals.runtime.env.DB!.prepare(
      `SELECT * FROM posts WHERE id = ? AND club_id = ?`
    ).bind(postId, clubId).first();

    if (!existingPost) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.deletePost(postId);

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'post_deleted',
      entityType: 'post',
      entityId: postId,
      details: JSON.stringify({ title: existingPost.title }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
