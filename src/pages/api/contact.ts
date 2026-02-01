import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { name, email, club, subject, message } = body;

    // Validation
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: 'Please fill in all required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for Resend API key
    const resendApiKey = locals.runtime.env.RESEND_API_KEY;

    if (resendApiKey) {
      // Send email via Resend
      const subjectMap: Record<string, string> = {
        demo: 'Demo Request',
        pricing: 'Pricing Question',
        features: 'Feature Inquiry',
        support: 'Technical Support',
        partnership: 'Partnership Opportunity',
        other: 'General Inquiry',
      };

      const emailSubject = `[Clubify Contact] ${subjectMap[subject] || subject} from ${name}`;

      const emailBody = `
New contact form submission from Clubify.ie

Name: ${name}
Email: ${email}
Club: ${club || 'Not specified'}
Subject: ${subjectMap[subject] || subject}

Message:
${message}
      `.trim();

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Clubify <noreply@clubify.ie>',
          to: ['hello@clubify.ie'],
          reply_to: email,
          subject: emailSubject,
          text: emailBody,
        }),
      });

      if (!res.ok) {
        console.error('Resend API error:', await res.text());
        // Don't expose error to user, just log it
      }
    } else {
      // Log contact submission if no email service
      console.log('Contact form submission (no email service configured):', {
        name,
        email,
        club,
        subject,
        message: message.substring(0, 100) + '...',
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process your request. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
