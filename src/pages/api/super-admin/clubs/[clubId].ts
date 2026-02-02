import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../lib/db';
import { getAuthContext } from '../../../../lib/auth';

// Helper to validate slug
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length >= 3 && slug.length <= 50;
}

export const PATCH: APIRoute = async ({ request, locals, cookies, params }) => {
  try {
    if (!locals.runtime.env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);
    const superAdminEmail = locals.runtime.env.SUPER_ADMIN_EMAIL;

    if (!user || !superAdminEmail || user.email.toLowerCase() !== superAdminEmail.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clubId = params.clubId;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();
    const updates: Record<string, any> = {};
    const auditDetails: Record<string, any> = {};

    // Handle is_live toggle
    if (typeof data.is_live === 'number') {
      updates.is_live = data.is_live;
      auditDetails.is_live = data.is_live;
    }

    // Handle slug update
    if (typeof data.slug === 'string') {
      const newSlug = data.slug.toLowerCase().trim();

      if (!isValidSlug(newSlug)) {
        return new Response(JSON.stringify({
          error: 'Invalid slug. Must be 3-50 lowercase alphanumeric characters with hyphens allowed in the middle.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if slug is already taken by another club
      const existingClub = await db.getClubBySlug(newSlug);
      if (existingClub && existingClub.id !== clubId) {
        return new Response(JSON.stringify({ error: 'This slug is already in use' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      updates.slug = newSlug;
      auditDetails.slug = newSlug;
    }

    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: 'No valid updates provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.updateClub(clubId, updates);

    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'super_admin_update',
      entityType: 'club',
      entityId: clubId,
      details: JSON.stringify(auditDetails)
    });

    return new Response(JSON.stringify({ success: true, ...updates }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Super admin update error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update club' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Soft delete club (move to recycling bin)
export const DELETE: APIRoute = async ({ locals, cookies, params }) => {
  try {
    if (!locals.runtime.env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);
    const superAdminEmail = locals.runtime.env.SUPER_ADMIN_EMAIL;

    if (!user || !superAdminEmail || user.email.toLowerCase() !== superAdminEmail.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clubId = params.clubId;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const club = await db.getClub(clubId);
    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (club.deleted_at) {
      return new Response(JSON.stringify({ error: 'Club is already deleted' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.softDeleteClub(clubId, user.id);

    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'super_admin_soft_delete',
      entityType: 'club',
      entityId: clubId,
      details: JSON.stringify({ clubName: club.name, clubSlug: club.slug })
    });

    return new Response(JSON.stringify({ success: true, message: 'Club moved to recycling bin' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Super admin soft delete error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete club' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// GDPR Export - Get all club data
export const GET: APIRoute = async ({ locals, cookies, params, url }) => {
  try {
    if (!locals.runtime.env.DB) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);
    const superAdminEmail = locals.runtime.env.SUPER_ADMIN_EMAIL;

    if (!user || !superAdminEmail || user.email.toLowerCase() !== superAdminEmail.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clubId = params.clubId;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if this is a GDPR export request
    const isExport = url.searchParams.get('export') === 'gdpr';
    if (!isExport) {
      // Just return basic club info
      const club = await db.getClub(clubId);
      return new Response(JSON.stringify(club), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Full GDPR export
    const club = await db.getClub(clubId);
    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const members = await db.getClubMembers(clubId);
    const posts = await db.getPosts(clubId);
    const pages = await db.getPages(clubId);
    const fixtures = await db.getFixtures(clubId);
    const forms = await db.getForms(clubId);
    const sponsors = await db.getSponsors(clubId);
    const socialConnections = await db.getSocialConnections(clubId);

    // Get form submissions for all forms
    const formSubmissions: Record<string, any[]> = {};
    for (const form of forms) {
      formSubmissions[form.id] = await db.getFormSubmissions(form.id);
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      club: {
        ...club,
        // Remove sensitive tokens
        navigation_items: club.navigation_items ? JSON.parse(club.navigation_items) : [],
      },
      members: members.map(m => ({
        role: m.role,
        joinedAt: m.joined_at,
        user: {
          email: m.user.email,
          name: m.user.name,
        }
      })),
      content: {
        posts: posts.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          status: p.status,
          category: p.category,
          publishedAt: p.published_at,
          createdAt: p.created_at,
        })),
        pages: pages.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          status: p.status,
          createdAt: p.created_at,
        })),
        fixtures: fixtures.length,
      },
      forms: forms.map(f => ({
        id: f.id,
        title: f.title,
        status: f.status,
        submissionCount: formSubmissions[f.id]?.length || 0,
      })),
      sponsors: sponsors.map(s => ({
        name: s.name,
        tier: s.tier,
      })),
      socialConnections: socialConnections.map(sc => ({
        platform: sc.platform,
        connectedAt: sc.created_at,
        // Don't export tokens
      })),
    };

    // Log the export
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'super_admin_gdpr_export',
      entityType: 'club',
      entityId: clubId,
      details: JSON.stringify({ exportedAt: exportData.exportedAt })
    });

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${club.slug}-gdpr-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    console.error('GDPR export error:', error);
    return new Response(JSON.stringify({ error: 'Failed to export data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
