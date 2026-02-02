import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext } from '../../../../../lib/auth';
import { slugify } from '../../../../../lib/utils';

export const GET: APIRoute = async ({ locals, cookies, params }) => {
  try {
    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);
    const clubId = params.clubId;

    if (!user || !clubId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const member = await db.getClubMember(clubId, user.id);
    if (!member) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const forms = await db.getForms(clubId);
    return new Response(JSON.stringify({ forms }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get forms error:', error);
    return new Response(JSON.stringify({ error: 'Failed to load forms' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals, cookies, params }) => {
  try {
    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);
    const clubId = params.clubId;

    if (!user || !clubId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const member = await db.getClubMember(clubId, user.id);
    if (!member || !['admin', 'pro'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    if (!body.name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const slug = body.slug ? slugify(body.slug) : slugify(body.name);
    const form = await db.createForm({
      clubId,
      name: body.name,
      slug,
      description: body.description,
      isActive: body.is_active ?? 1,
      successMessage: body.success_message
    });

    return new Response(JSON.stringify({ form }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Create form error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create form' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
