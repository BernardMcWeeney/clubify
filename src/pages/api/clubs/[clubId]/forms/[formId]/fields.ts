import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../../lib/db';
import { getAuthContext } from '../../../../../../lib/auth';

export const PUT: APIRoute = async ({ request, locals, cookies, params }) => {
  try {
    const db = new DatabaseService(locals.runtime.env.DB);
    const { user } = await getAuthContext(cookies, db);
    const clubId = params.clubId;
    const formId = params.formId;

    if (!user || !clubId || !formId) {
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
    const fields = Array.isArray(body.fields) ? body.fields : [];

    await db.replaceFormFields(formId, fields.map((field: any, index: number) => ({
      label: field.label,
      type: field.type,
      required: field.required ? 1 : 0,
      options: field.options ? JSON.stringify(field.options) : null,
      placeholder: field.placeholder || null,
      help_text: field.help_text || null,
      order_index: field.order_index ?? index
    })));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update form fields error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update fields' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
