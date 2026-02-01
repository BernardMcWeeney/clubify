import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';

// DELETE /api/clubs/[clubId]/media/[mediaId] - Delete media
export const DELETE: APIRoute = async ({ params, cookies, locals }) => {
  try {
    const { clubId, mediaId } = params;
    if (!clubId || !mediaId) {
      return new Response(JSON.stringify({ error: 'Club ID and Media ID required' }), {
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

    // Get media record
    const media = await locals.runtime.env.DB!.prepare(`
      SELECT * FROM media WHERE id = ? AND club_id = ?
    `).bind(mediaId, clubId).first<any>();

    if (!media) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete from R2 if configured
    const r2 = locals.runtime.env.MEDIA;
    if (r2) {
      // Extract key from URL
      const urlParts = media.url.split('/media/');
      if (urlParts.length > 1) {
        const key = urlParts[1];
        try {
          await r2.delete(key);
        } catch (e) {
          console.error('Failed to delete from R2:', e);
        }
      }
    }

    // Delete from database
    await locals.runtime.env.DB!.prepare(`
      DELETE FROM media WHERE id = ?
    `).bind(mediaId).run();

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'media_deleted',
      entityType: 'media',
      entityId: mediaId,
      details: JSON.stringify({ filename: media.filename }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
