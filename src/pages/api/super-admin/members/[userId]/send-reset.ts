import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../../lib/db';
import { getAuthContext, sendPasswordResetEmail } from '../../../../../lib/auth';

export const POST: APIRoute = async ({ locals, cookies, params }) => {
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

    const userId = params.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the target user
    const targetUser = await db.getUserById(userId);
    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create a magic link for this user
    const magicLink = await db.createMagicLink(targetUser.email);

    // Get the base URL for the email
    const baseUrl = locals.runtime.env.BASE_URL || 'https://clubify.ie';
    const resendApiKey = locals.runtime.env.RESEND_API_KEY;

    // Send the password reset email
    await sendPasswordResetEmail(
      targetUser.email,
      magicLink.token,
      baseUrl,
      resendApiKey,
      user.email
    );

    // Log the action
    await db.logAudit({
      userId: user.id,
      action: 'super_admin_send_password_reset',
      entityType: 'user',
      entityId: userId,
      details: JSON.stringify({
        targetEmail: targetUser.email,
        targetUserId: userId,
        requestedBy: user.email
      })
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Password reset link sent to ${targetUser.email}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Send password reset error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send password reset' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
