import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../lib/db';

/**
 * GDPR Auto-Purge Cron Job
 * Runs daily at 2am UTC to delete expired form submissions
 * based on each club's retention policy
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = new DatabaseService(locals.runtime.env.DB);

    // Get all clubs with their contact settings
    const clubSettings = await locals.runtime.env.DB!.prepare(`
      SELECT c.id as club_id, c.name as club_name, cs.retention_days
      FROM clubs c
      LEFT JOIN contact_settings cs ON c.id = cs.club_id
    `).all<{ club_id: string; club_name: string; retention_days: number | null }>();

    const results: { clubId: string; clubName: string; contactSubmissions: number; formSubmissions: number }[] = [];

    for (const club of clubSettings.results || []) {
      const retentionDays = club.retention_days || 30; // Default to 30 days if not set
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffISO = cutoffDate.toISOString();

      // Delete expired contact submissions
      const contactResult = await locals.runtime.env.DB!.prepare(`
        DELETE FROM contact_submissions
        WHERE club_id = ?
        AND created_at < datetime(?)
      `).bind(club.club_id, cutoffISO).run();

      // Delete expired form submissions
      const formResult = await locals.runtime.env.DB!.prepare(`
        DELETE FROM form_submissions
        WHERE club_id = ?
        AND created_at < datetime(?)
      `).bind(club.club_id, cutoffISO).run();

      const contactDeleted = contactResult.meta?.changes || 0;
      const formDeleted = formResult.meta?.changes || 0;

      // Only log if something was deleted
      if (contactDeleted > 0 || formDeleted > 0) {
        // Create audit log entry
        await db.logAudit({
          clubId: club.club_id,
          userId: 'system',
          action: 'gdpr_purge_completed',
          entityType: 'system',
          entityId: club.club_id,
          details: JSON.stringify({
            retention_days: retentionDays,
            contact_submissions_deleted: contactDeleted,
            form_submissions_deleted: formDeleted,
            cutoff_date: cutoffISO,
          }),
        });

        results.push({
          clubId: club.club_id,
          clubName: club.club_name,
          contactSubmissions: contactDeleted,
          formSubmissions: formDeleted,
        });
      }
    }

    console.log('GDPR auto-purge completed:', {
      clubs_processed: clubSettings.results?.length || 0,
      clubs_with_deletions: results.length,
      total_contact_submissions_deleted: results.reduce((sum, r) => sum + r.contactSubmissions, 0),
      total_form_submissions_deleted: results.reduce((sum, r) => sum + r.formSubmissions, 0),
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'GDPR auto-purge completed',
      summary: {
        clubs_processed: clubSettings.results?.length || 0,
        clubs_with_deletions: results.length,
        total_deletions: results.reduce((sum, r) => sum + r.contactSubmissions + r.formSubmissions, 0),
      },
      details: results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GDPR auto-purge error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'GDPR auto-purge failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
