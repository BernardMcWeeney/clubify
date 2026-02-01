// Authentication utilities
import type { AstroCookies } from 'astro';
import { DatabaseService, type User } from './db';

const SESSION_COOKIE = 'clubify_session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
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

// Simple email sending (placeholder - replace with actual email service)
export async function sendMagicLinkEmail(email: string, token: string, baseUrl: string): Promise<void> {
  const magicLink = `${baseUrl}/auth/verify?token=${token}`;

  // In production, use an email service like Resend, SendGrid, or Mailgun
  // For now, we'll just log it
  console.log(`
    ========================================
    Magic Link Email (Dev Mode)
    ========================================
    To: ${email}
    Subject: Sign in to Clubify

    Click here to sign in:
    ${magicLink}

    This link expires in 15 minutes.
    ========================================
  `);

  // TODO: Integrate with email service
  // await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${RESEND_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     from: 'Clubify <noreply@clubify.ie>',
  //     to: email,
  //     subject: 'Sign in to Clubify',
  //     html: `...`
  //   })
  // });
}

export async function sendInvitationEmail(
  email: string,
  token: string,
  clubName: string,
  inviterName: string,
  role: string,
  baseUrl: string
): Promise<void> {
  const inviteLink = `${baseUrl}/auth/invite?token=${token}`;

  console.log(`
    ========================================
    Invitation Email (Dev Mode)
    ========================================
    To: ${email}
    Subject: You've been invited to join ${clubName} on Clubify

    ${inviterName} has invited you to join ${clubName} as ${role}.

    Click here to accept:
    ${inviteLink}

    This invitation expires in 7 days.
    ========================================
  `);
}
