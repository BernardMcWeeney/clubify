// Database service for Cloudflare D1
import { generateId, generateToken, addMinutes, addDays, isExpired } from './utils';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  email_verified: number;
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  county: string;
  crest_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  template: string;
  tagline: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  is_live: number;
  setup_completed: number;
  setup_step: number;
  created_at: string;
  updated_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: string;
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface MagicLink {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  used: number;
  created_at: string;
}

export class DatabaseService {
  constructor(private db: D1Database) {}

  // User operations
  async createUser(email: string, name: string): Promise<User> {
    const id = generateId();
    await this.db.prepare(
      `INSERT INTO users (id, email, name) VALUES (?, ?, ?)`
    ).bind(id, email, name).run();

    return this.getUserById(id) as Promise<User>;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db.prepare(
      `SELECT * FROM users WHERE id = ?`
    ).bind(id).first<User>();
    return result;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.prepare(
      `SELECT * FROM users WHERE email = ?`
    ).bind(email.toLowerCase()).first<User>();
    return result;
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    const fields = Object.keys(data).filter(k => k !== 'id');
    const values = fields.map(k => (data as any)[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db.prepare(
      `UPDATE users SET ${setClause}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...values, id).run();
  }

  // Magic link operations
  async createMagicLink(email: string): Promise<string> {
    const id = generateId();
    const token = generateToken();
    const expiresAt = addMinutes(new Date(), 15).toISOString();

    // Invalidate existing magic links for this email
    await this.db.prepare(
      `UPDATE magic_links SET used = 1 WHERE email = ? AND used = 0`
    ).bind(email.toLowerCase()).run();

    await this.db.prepare(
      `INSERT INTO magic_links (id, email, token, expires_at) VALUES (?, ?, ?, ?)`
    ).bind(id, email.toLowerCase(), token, expiresAt).run();

    return token;
  }

  async verifyMagicLink(token: string): Promise<{ email: string } | null> {
    const result = await this.db.prepare(
      `SELECT * FROM magic_links WHERE token = ? AND used = 0`
    ).bind(token).first<MagicLink>();

    if (!result || isExpired(result.expires_at)) {
      return null;
    }

    // Mark as used
    await this.db.prepare(
      `UPDATE magic_links SET used = 1 WHERE id = ?`
    ).bind(result.id).run();

    return { email: result.email };
  }

  // Session operations
  async createSession(userId: string): Promise<string> {
    const id = generateId();
    const expiresAt = addDays(new Date(), 30).toISOString();

    await this.db.prepare(
      `INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`
    ).bind(id, userId, expiresAt).run();

    return id;
  }

  async getSession(sessionId: string): Promise<{ session: Session; user: User } | null> {
    const result = await this.db.prepare(`
      SELECT s.*, u.id as user_id, u.email, u.name, u.avatar_url, u.email_verified, u.created_at as user_created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).bind(sessionId).first<any>();

    if (!result || isExpired(result.expires_at)) {
      if (result) {
        await this.deleteSession(sessionId);
      }
      return null;
    }

    return {
      session: {
        id: result.id,
        user_id: result.user_id,
        expires_at: result.expires_at,
        created_at: result.created_at
      },
      user: {
        id: result.user_id,
        email: result.email,
        name: result.name,
        avatar_url: result.avatar_url,
        email_verified: result.email_verified,
        created_at: result.user_created_at,
        updated_at: result.user_created_at
      }
    };
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.db.prepare(
      `DELETE FROM sessions WHERE id = ?`
    ).bind(sessionId).run();
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.db.prepare(
      `DELETE FROM sessions WHERE user_id = ?`
    ).bind(userId).run();
  }

  // Club operations
  async createClub(data: {
    name: string;
    slug: string;
    county: string;
    ownerId: string;
  }): Promise<Club> {
    const id = generateId();

    await this.db.prepare(`
      INSERT INTO clubs (id, name, slug, county) VALUES (?, ?, ?, ?)
    `).bind(id, data.name, data.slug, data.county).run();

    // Add owner as admin
    const memberId = generateId();
    await this.db.prepare(`
      INSERT INTO club_members (id, club_id, user_id, role) VALUES (?, ?, ?, 'admin')
    `).bind(memberId, id, data.ownerId).run();

    return this.getClubById(id) as Promise<Club>;
  }

  async getClubById(id: string): Promise<Club | null> {
    return this.db.prepare(
      `SELECT * FROM clubs WHERE id = ?`
    ).bind(id).first<Club>();
  }

  async getClubBySlug(slug: string): Promise<Club | null> {
    return this.db.prepare(
      `SELECT * FROM clubs WHERE slug = ?`
    ).bind(slug.toLowerCase()).first<Club>();
  }

  async isSlugAvailable(slug: string): Promise<boolean> {
    const result = await this.db.prepare(
      `SELECT id FROM clubs WHERE slug = ?`
    ).bind(slug.toLowerCase()).first();
    return !result;
  }

  async updateClub(id: string, data: Partial<Club>): Promise<void> {
    const fields = Object.keys(data).filter(k => k !== 'id');
    const values = fields.map(k => (data as any)[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db.prepare(
      `UPDATE clubs SET ${setClause}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...values, id).run();
  }

  async getUserClubs(userId: string): Promise<(Club & { role: string })[]> {
    const results = await this.db.prepare(`
      SELECT c.*, cm.role
      FROM clubs c
      JOIN club_members cm ON c.id = cm.club_id
      WHERE cm.user_id = ?
      ORDER BY c.created_at DESC
    `).bind(userId).all<Club & { role: string }>();

    return results.results || [];
  }

  // Club member operations
  async getClubMember(clubId: string, userId: string): Promise<ClubMember | null> {
    return this.db.prepare(
      `SELECT * FROM club_members WHERE club_id = ? AND user_id = ?`
    ).bind(clubId, userId).first<ClubMember>();
  }

  async getClubMembers(clubId: string): Promise<(ClubMember & { user: User })[]> {
    const results = await this.db.prepare(`
      SELECT cm.*, u.email, u.name, u.avatar_url
      FROM club_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.club_id = ?
      ORDER BY cm.joined_at ASC
    `).bind(clubId).all<any>();

    return (results.results || []).map(r => ({
      id: r.id,
      club_id: r.club_id,
      user_id: r.user_id,
      role: r.role,
      invited_by: r.invited_by,
      invited_at: r.invited_at,
      joined_at: r.joined_at,
      user: {
        id: r.user_id,
        email: r.email,
        name: r.name,
        avatar_url: r.avatar_url,
        email_verified: 1,
        created_at: r.joined_at,
        updated_at: r.joined_at
      }
    }));
  }

  async addClubMember(clubId: string, userId: string, role: string, invitedBy?: string): Promise<void> {
    const id = generateId();
    await this.db.prepare(`
      INSERT INTO club_members (id, club_id, user_id, role, invited_by, invited_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(id, clubId, userId, role, invitedBy || null).run();
  }

  async updateClubMemberRole(clubId: string, userId: string, role: string): Promise<void> {
    await this.db.prepare(
      `UPDATE club_members SET role = ? WHERE club_id = ? AND user_id = ?`
    ).bind(role, clubId, userId).run();
  }

  async removeClubMember(clubId: string, userId: string): Promise<void> {
    await this.db.prepare(
      `DELETE FROM club_members WHERE club_id = ? AND user_id = ?`
    ).bind(clubId, userId).run();
  }

  // Invitation operations
  async createInvitation(data: {
    clubId: string;
    email: string;
    role: string;
    invitedBy: string;
  }): Promise<string> {
    const id = generateId();
    const token = generateToken();
    const expiresAt = addDays(new Date(), 7).toISOString();

    await this.db.prepare(`
      INSERT INTO club_invitations (id, club_id, email, role, token, invited_by, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.clubId, data.email.toLowerCase(), data.role, token, data.invitedBy, expiresAt).run();

    return token;
  }

  async getInvitation(token: string): Promise<{
    id: string;
    club_id: string;
    club_name: string;
    email: string;
    role: string;
    expires_at: string;
    accepted: number;
  } | null> {
    const result = await this.db.prepare(`
      SELECT ci.*, c.name as club_name
      FROM club_invitations ci
      JOIN clubs c ON ci.club_id = c.id
      WHERE ci.token = ?
    `).bind(token).first<any>();

    return result;
  }

  async acceptInvitation(token: string, userId: string): Promise<{ clubId: string } | null> {
    const invitation = await this.getInvitation(token);

    if (!invitation || invitation.accepted || isExpired(invitation.expires_at)) {
      return null;
    }

    // Mark as accepted
    await this.db.prepare(
      `UPDATE club_invitations SET accepted = 1 WHERE token = ?`
    ).bind(token).run();

    // Add user to club
    await this.addClubMember(invitation.club_id, userId, invitation.role, invitation.id);

    return { clubId: invitation.club_id };
  }

  // Audit log
  async logAudit(data: {
    clubId?: string;
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
  }): Promise<void> {
    const id = generateId();
    await this.db.prepare(`
      INSERT INTO audit_log (id, club_id, user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.clubId || null,
      data.userId || null,
      data.action,
      data.entityType || null,
      data.entityId || null,
      data.details || null,
      data.ipAddress || null
    ).run();
  }
}
