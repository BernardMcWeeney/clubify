// Authentication utilities
import type { AstroCookies } from 'astro';
import { DatabaseService, type User } from './db';

const SESSION_COOKIE = 'clubify_session';

// Only use secure cookies in production (HTTPS)
// This allows cookies to work on localhost (HTTP) during development
const isProduction = import.meta.env.PROD;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30 // 30 days
};

export interface AuthContext {
  user: User | null;
  sessionId: string | null;
}

export async function getAuthContext(
  cookies: AstroCookies,
  db: DatabaseService
): Promise<AuthContext> {
  const sessionId = cookies.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    return { user: null, sessionId: null };
  }

  const session = await db.getSession(sessionId);

  if (!session) {
    cookies.delete(SESSION_COOKIE, { path: '/' });
    return { user: null, sessionId: null };
  }

  return { user: session.user, sessionId };
}

export function setSessionCookie(cookies: AstroCookies, sessionId: string): void {
  cookies.set(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function requireAuth(
  cookies: AstroCookies,
  db: DatabaseService
): Promise<User> {
  const { user } = await getAuthContext(cookies, db);

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

// Send magic link email via Resend
export async function sendMagicLinkEmail(
  email: string,
  token: string,
  baseUrl: string,
  resendApiKey: string
): Promise<void> {
  const magicLink = `${baseUrl}/auth/verify?token=${token}`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Clubify <noreply@clubify.ie>',
      to: email,
      subject: 'Sign in to Clubify',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid #334155;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 12px; margin-bottom: 16px;"></div>
              <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Clubify</h1>
            </div>

            <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 16px; text-align: center;">Sign in to your account</h2>

            <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
              Click the button below to sign in. This link will expire in 15 minutes.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: #ffffff; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
                Sign in to Clubify
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 16px;">
              Or copy and paste this link into your browser:
            </p>

            <p style="color: #22c55e; font-size: 12px; word-break: break-all; text-align: center; background-color: #0f172a; padding: 12px; border-radius: 8px;">
              ${magicLink}
            </p>

            <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">

            <p style="color: #64748b; font-size: 12px; text-align: center;">
              If you didn't request this email, you can safely ignore it.
            </p>
          </div>
        </body>
        </html>
      `
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Resend error:', error);
    throw new Error(`Failed to send email: ${response.status}`);
  }
}

// Send password reset email via Resend (triggered by super admin)
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  baseUrl: string,
  resendApiKey?: string,
  requestedBy?: string
): Promise<void> {
  const resetLink = `${baseUrl}/auth/verify?token=${token}`;

  if (!resendApiKey) {
    console.log(`\n[DEV MODE] Password reset for ${email}: ${resetLink}\n`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Clubify <noreply@clubify.ie>',
      to: email,
      subject: 'Reset your Clubify password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid #334155;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #14b8a6, #0d9488); border-radius: 12px; margin-bottom: 16px;"></div>
              <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Clubify</h1>
            </div>

            <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 16px; text-align: center;">Password Reset Request</h2>

            <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
              A Clubify administrator has sent you a password reset link. Click the button below to sign in. This link will expire in 15 minutes.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #14b8a6, #0d9488); color: #ffffff; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
                Sign in to Clubify
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 16px;">
              Or copy and paste this link into your browser:
            </p>

            <p style="color: #14b8a6; font-size: 12px; word-break: break-all; text-align: center; background-color: #0f172a; padding: 12px; border-radius: 8px;">
              ${resetLink}
            </p>

            <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">

            <p style="color: #64748b; font-size: 12px; text-align: center;">
              If you didn't request this password reset, you can safely ignore this email. Your account is secure.
            </p>
          </div>
        </body>
        </html>
      `
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Resend error:', error);
    throw new Error(`Failed to send password reset email: ${response.status}`);
  }
}

export async function sendInvitationEmail(
  email: string,
  token: string,
  clubName: string,
  inviterName: string,
  role: string,
  baseUrl: string,
  resendApiKey?: string
): Promise<void> {
  const inviteLink = `${baseUrl}/auth/invite?token=${token}`;

  if (!resendApiKey) {
    console.log(`\n[DEV MODE] Invitation for ${email}: ${inviteLink}\n`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Clubify <noreply@clubify.ie>',
      to: email,
      subject: `You've been invited to join ${clubName} on Clubify`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 40px; border: 1px solid #334155;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 12px; margin-bottom: 16px;"></div>
              <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Clubify</h1>
            </div>

            <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 16px; text-align: center;">You're invited!</h2>

            <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
              <strong style="color: #ffffff;">${inviterName}</strong> has invited you to join
              <strong style="color: #ffffff;">${clubName}</strong> as <strong style="color: #22c55e;">${role}</strong>.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: #ffffff; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
                Accept Invitation
              </a>
            </div>

            <p style="color: #64748b; font-size: 12px; text-align: center;">
              This invitation expires in 7 days.
            </p>

            <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">

            <p style="color: #64748b; font-size: 12px; text-align: center;">
              If you didn't expect this invitation, you can safely ignore it.
            </p>
          </div>
        </body>
        </html>
      `
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Resend error:', error);
    throw new Error(`Failed to send invitation: ${response.status}`);
  }
}
