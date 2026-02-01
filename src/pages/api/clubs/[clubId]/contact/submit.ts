import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { checkRateLimit, getRateLimitKey, rateLimitExceeded, RATE_LIMITS } from '../../../../../lib/rate-limit';

export const POST: APIRoute = async ({ request, locals, params }) => {
  try {
    // Rate limiting for contact form submissions
    const rateLimitKey = getRateLimitKey(request, 'contact-submit');
    const rateLimitResult = await checkRateLimit(
      locals.runtime.env.RATE_LIMIT,
      rateLimitKey,
      RATE_LIMITS.contactSubmit
    );

    if (!rateLimitResult.allowed) {
      return rateLimitExceeded(rateLimitResult, RATE_LIMITS.contactSubmit);
    }

    const clubId = params.clubId;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB);
    const settings = await db.getContactSettings(clubId);

    if (settings && settings.is_enabled === 0) {
      return new Response(JSON.stringify({ error: 'Contact form disabled' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { name, email, phone, message, consent } = body;

    if (!message || !consent) {
      return new Response(JSON.stringify({ error: 'Message and consent are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const submission = await db.createContactSubmission({
      clubId,
      name,
      email,
      phone,
      message,
      consent: consent ? 1 : 0
    });

    const notifyEmail = settings?.notify_email;
    const resendApiKey = locals.runtime.env.RESEND_API_KEY;

    if (notifyEmail && resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Clubify <noreply@clubify.ie>',
            to: notifyEmail,
            subject: 'New contact form submission',
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>New contact form submission</h2>
                <p><strong>Name:</strong> ${name || 'N/A'}</p>
                <p><strong>Email:</strong> ${email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
              </div>
            `
          })
        });
      } catch (error) {
        console.error('Contact email failed:', error);
      }
    } else {
      console.log('[DEV MODE] Contact submission:', submission.id);
    }

    return new Response(JSON.stringify({
      success: true,
      message: settings?.success_message || 'Thanks! We will get back to you shortly.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Contact submit error:', error);
    return new Response(JSON.stringify({ error: 'Failed to submit form' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
