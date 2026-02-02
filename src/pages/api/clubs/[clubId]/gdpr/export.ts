import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';
import { hasPermission, type Role } from '../../../../../lib/permissions';

/**
 * GDPR Data Export Endpoint
 * Exports all data associated with a specific email address for data subject access requests (GDPR Article 15)
 * Only admins can access this endpoint
 */
export const GET: APIRoute = async ({ params, url, cookies, locals }) => {
  try {
    const { clubId } = params;
    const email = url.searchParams.get('email');

    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email parameter required' }), {
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

    // Only admin can export data
    if (!hasPermission(member.role as Role, 'settings.edit')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions. Admin access required.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const exportData: {
      email: string;
      club_name: string;
      export_date: string;
      contact_submissions: any[];
      form_submissions: any[];
      audit_log_entries: any[];
      user_info: any | null;
    } = {
      email,
      club_name: '',
      export_date: new Date().toISOString(),
      contact_submissions: [],
      form_submissions: [],
      audit_log_entries: [],
      user_info: null,
    };

    // Get club info
    const club = await db.getClubById(clubId);
    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    exportData.club_name = club.name;

    // Get contact form submissions
    const contactSubmissions = await locals.runtime.env.DB!.prepare(`
      SELECT id, name, email, phone, message, consent, created_at
      FROM contact_submissions
      WHERE club_id = ? AND email = ?
      ORDER BY created_at DESC
    `).bind(clubId, email).all();
    exportData.contact_submissions = contactSubmissions.results || [];

    // Get custom form submissions
    const formSubmissions = await locals.runtime.env.DB!.prepare(`
      SELECT fs.id, fs.form_id, f.name as form_name, fs.data, fs.created_at
      FROM form_submissions fs
      JOIN forms f ON fs.form_id = f.id
      WHERE fs.club_id = ?
      AND json_extract(fs.data, '$') LIKE ?
      ORDER BY fs.created_at DESC
    `).bind(clubId, `%${email}%`).all();
    exportData.form_submissions = formSubmissions.results || [];

    // Check if this email matches a user in the system
    const userRecord = await locals.runtime.env.DB!.prepare(`
      SELECT u.id, u.name, u.email, u.created_at
      FROM users u
      WHERE u.email = ?
    `).bind(email).first<{ id: string; name: string; email: string; created_at: string }>();

    if (userRecord) {
      exportData.user_info = {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        created_at: userRecord.created_at,
      };

      // Get audit log entries where this user took actions
      const auditLogs = await locals.runtime.env.DB!.prepare(`
        SELECT action, entity_type, entity_id, details, created_at
        FROM audit_log
        WHERE club_id = ? AND user_id = ?
        ORDER BY created_at DESC
        LIMIT 100
      `).bind(clubId, userRecord.id).all();
      exportData.audit_log_entries = auditLogs.results || [];
    }

    // Log the export action
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'gdpr_export_completed',
      entityType: 'system',
      entityId: clubId,
      details: JSON.stringify({ email, records_exported: {
        contact_submissions: exportData.contact_submissions.length,
        form_submissions: exportData.form_submissions.length,
        audit_log_entries: exportData.audit_log_entries.length,
      }}),
    });

    // Return data as JSON
    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="gdpr-export-${email}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('GDPR export error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to export data',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
