import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';
import { generateId } from '../../../../../lib/utils';

// GET /api/clubs/[clubId]/media - List media
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

    const results = await locals.runtime.env.DB!.prepare(`
      SELECT m.*, u.name as uploaded_by_name
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.club_id = ?
      ORDER BY m.created_at DESC
    `).bind(clubId).all();

    return new Response(JSON.stringify({ media: results.results || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/clubs/[clubId]/media - Upload media
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

    // Only admin, pro, editor can upload
    if (!['admin', 'pro', 'editor'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if R2 is configured
    const r2 = locals.runtime.env.MEDIA;
    if (!r2) {
      return new Response(JSON.stringify({ error: 'Media storage not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const altText = formData.get('altText') as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'File is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum size is 10MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unique filename
    const mediaId = generateId();
    const ext = file.name.split('.').pop() || 'jpg';
    const key = `clubs/${clubId}/${mediaId}.${ext}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await r2.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Get the public URL (you'll need to configure a public bucket or custom domain)
    // For now, we'll use a placeholder URL format
    const siteUrl = locals.runtime.env.SITE_URL || 'https://clubify.ie';
    const url = `${siteUrl}/media/${key}`;

    // Save to database
    const id = generateId();
    await locals.runtime.env.DB!.prepare(`
      INSERT INTO media (id, club_id, filename, url, mime_type, size, alt_text, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, clubId, file.name, url, file.type, file.size, altText, user.id).run();

    const media = await locals.runtime.env.DB!.prepare(`
      SELECT * FROM media WHERE id = ?
    `).bind(id).first();

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'media_uploaded',
      entityType: 'media',
      entityId: id,
      details: JSON.stringify({ filename: file.name }),
    });

    return new Response(JSON.stringify({ media, key }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
