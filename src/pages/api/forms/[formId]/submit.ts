import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../lib/db';
import { checkRateLimit, getRateLimitKey, rateLimitExceeded, RATE_LIMITS } from '../../../../lib/rate-limit';

export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    // Rate limiting for form submissions
    const rateLimitKey = getRateLimitKey(request, 'form-submit');
    const rateLimitResult = await checkRateLimit(
      locals.runtime.env.RATE_LIMIT,
      rateLimitKey,
      RATE_LIMITS.formSubmit
    );

    if (!rateLimitResult.allowed) {
      return rateLimitExceeded(rateLimitResult, RATE_LIMITS.formSubmit);
    }

    const formId = params.formId;
    if (!formId) {
      return new Response(JSON.stringify({ error: 'Form ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB);
    const form = await db.getFormById(formId);
    if (!form || form.is_active === 0) {
      return new Response(JSON.stringify({ error: 'Form not available' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const fields = await db.getFormFields(formId);
    const body = await request.json();

    const payload: Record<string, any> = {};
    for (const field of fields) {
      const key = field.id;
      const value = body[key];
      if (field.required && (value === undefined || value === null || value === '')) {
        return new Response(JSON.stringify({ error: `Missing field: ${field.label}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      payload[key] = value ?? null;
    }

    await db.createFormSubmission({
      formId,
      clubId: form.club_id,
      payload
    });

    return new Response(JSON.stringify({
      success: true,
      message: form.success_message || 'Thanks! Your submission has been received.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Form submit error:', error);
    return new Response(JSON.stringify({ error: 'Failed to submit form' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
