import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../lib/db';
import { getAuthContext } from '../../../../lib/auth';
import { getDefaultConfig, validateBlockContent, DEFAULT_CONSTRAINTS, type BlockConfig } from '../../../../lib/templates';

// GET /api/clubs/[clubId]/homepage-config - Get homepage configuration
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

    const club = await db.getClubById(clubId);
    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get custom config or use default
    const homepageConfig = await db.getHomepageConfig(clubId);
    const templateId = club.template as 'classic' | 'matchday' | 'community';
    const defaultBlocks = getDefaultConfig(templateId);

    let config: { blocks: BlockConfig[]; overrides: Record<string, unknown> };

    if (homepageConfig) {
      config = JSON.parse(homepageConfig.config);
    } else {
      config = {
        blocks: defaultBlocks,
        overrides: {},
      };
    }

    return new Response(JSON.stringify({
      config,
      template: templateId,
      defaultBlocks,
      version: homepageConfig?.version || 0,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting homepage config:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/clubs/[clubId]/homepage-config - Save homepage configuration
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

    // Only admin and pro can edit homepage
    if (!['admin', 'pro'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const club = await db.getClubById(clubId);
    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { blocks, overrides } = body;

    if (!blocks || !Array.isArray(blocks)) {
      return new Response(JSON.stringify({ error: 'Blocks array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate blocks against template constraints
    const templateId = club.template as 'classic' | 'matchday' | 'community';
    const defaultBlocks = getDefaultConfig(templateId);
    const errors: string[] = [];

    // Check that required blocks are present and visible
    for (const defaultBlock of defaultBlocks) {
      if (defaultBlock.required) {
        const block = blocks.find((b: BlockConfig) => b.id === defaultBlock.id);
        if (!block) {
          errors.push(`Required block "${defaultBlock.type}" is missing`);
        } else if (!block.visible) {
          errors.push(`Required block "${defaultBlock.type}" cannot be hidden`);
        }
      }

      // Check that locked blocks haven't been moved or removed
      if (defaultBlock.locked) {
        const block = blocks.find((b: BlockConfig) => b.id === defaultBlock.id);
        if (!block) {
          errors.push(`Locked block "${defaultBlock.type}" cannot be removed`);
        } else if (block.order !== defaultBlock.order) {
          errors.push(`Locked block "${defaultBlock.type}" cannot be reordered`);
        }
      }
    }

    // Validate content overrides
    if (overrides) {
      for (const [blockId, content] of Object.entries(overrides)) {
        const block = blocks.find((b: BlockConfig) => b.id === blockId);
        if (block) {
          const validation = validateBlockContent(
            block.type,
            content as Record<string, unknown>,
            DEFAULT_CONSTRAINTS
          );
          if (!validation.valid) {
            errors.push(...validation.errors);
          }
        }
      }
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save the config
    const savedConfig = await db.saveHomepageConfig({
      clubId,
      config: { blocks, overrides: overrides || {} },
      updatedBy: user.id,
    });

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'homepage_config_updated',
      entityType: 'homepage_config',
      entityId: savedConfig.id,
    });

    return new Response(JSON.stringify({
      success: true,
      version: savedConfig.version,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving homepage config:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/clubs/[clubId]/homepage-config - Reset to default
export const DELETE: APIRoute = async ({ params, cookies, locals }) => {
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

    // Only admin can reset homepage
    if (member.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can reset homepage' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.deleteHomepageConfig(clubId);

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'homepage_config_reset',
      entityType: 'homepage_config',
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error resetting homepage config:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
