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

export interface Post {
  id: string;
  club_id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  featured_image: string | null;
  category: string;
  status: string;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Fixture {
  id: string;
  club_id: string;
  competition: string;
  home_team: string;
  away_team: string;
  venue: string | null;
  match_date: string;
  match_time: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  club_id: string;
  title: string;
  slug: string;
  content: string | null;
  meta_description: string | null;
  is_published: number;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialConnection {
  id: string;
  club_id: string;
  platform: 'facebook' | 'twitter' | 'instagram';
  access_token: string;
  refresh_token: string | null;
  page_id: string | null;
  page_name: string | null;
  expires_at: string | null;
  connected_by: string;
  created_at: string;
  updated_at: string;
}

export interface PublishJob {
  id: string;
  club_id: string;
  entity_type: 'post' | 'fixture_result';
  entity_id: string;
  platforms: string; // JSON array
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduled_at: string | null;
  results: string | null; // JSON
  error_message: string | null;
  created_by: string;
  created_at: string;
  completed_at: string | null;
}

export interface PushSubscription {
  id: string;
  club_id: string;
  endpoint: string;
  keys: string; // JSON
  user_agent: string | null;
  user_id: string | null;
  created_at: string;
}

export interface PublishHistory {
  id: string;
  club_id: string;
  entity_type: string;
  entity_id: string;
  platform: string;
  external_id: string | null;
  external_url: string | null;
  published_at: string;
  published_by: string | null;
}

export interface HomepageConfig {
  id: string;
  club_id: string;
  config: string; // JSON string
  version: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformStats {
  clubs: number;
  live_clubs: number;
  users: number;
  posts: number;
  fixtures: number;
  pages: number;
  media: number;
}

export interface ClubOverview extends Club {
  member_count: number;
  post_count: number;
  fixture_count: number;
  page_count: number;
  last_content_at: string | null;
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

  async getPlatformStats(): Promise<PlatformStats> {
    const result = await this.db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM clubs) as clubs,
        (SELECT COUNT(*) FROM clubs WHERE is_live = 1) as live_clubs,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM posts) as posts,
        (SELECT COUNT(*) FROM fixtures) as fixtures,
        (SELECT COUNT(*) FROM pages) as pages,
        (SELECT COUNT(*) FROM media) as media
    `).first<any>();

    return {
      clubs: result?.clubs || 0,
      live_clubs: result?.live_clubs || 0,
      users: result?.users || 0,
      posts: result?.posts || 0,
      fixtures: result?.fixtures || 0,
      pages: result?.pages || 0,
      media: result?.media || 0,
    };
  }

  async getClubOverviews(): Promise<ClubOverview[]> {
    const results = await this.db.prepare(`
      SELECT
        c.*,
        (SELECT COUNT(*) FROM club_members cm WHERE cm.club_id = c.id) as member_count,
        (SELECT COUNT(*) FROM posts p WHERE p.club_id = c.id) as post_count,
        (SELECT COUNT(*) FROM fixtures f WHERE f.club_id = c.id) as fixture_count,
        (SELECT COUNT(*) FROM pages pg WHERE pg.club_id = c.id) as page_count,
        (
          SELECT MAX(ts) FROM (
            SELECT MAX(updated_at) as ts FROM posts p WHERE p.club_id = c.id
            UNION ALL
            SELECT MAX(updated_at) as ts FROM fixtures f WHERE f.club_id = c.id
            UNION ALL
            SELECT MAX(updated_at) as ts FROM pages pg WHERE pg.club_id = c.id
          )
        ) as last_content_at
      FROM clubs c
      ORDER BY c.created_at DESC
    `).all<any>();

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

  async getAuditLogs(clubId: string, limit: number = 50, offset: number = 0): Promise<Array<{
    id: string;
    club_id: string;
    user_id: string | null;
    user_name: string | null;
    user_email: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    details: string | null;
    ip_address: string | null;
    created_at: string;
  }>> {
    const results = await this.db.prepare(`
      SELECT
        al.*,
        u.name as user_name,
        u.email as user_email
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.club_id = ?
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(clubId, limit, offset).all<any>();

    return results.results || [];
  }

  async getAuditLogCount(clubId: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM audit_log WHERE club_id = ?
    `).bind(clubId).first<{ count: number }>();

    return result?.count || 0;
  }

  // Post operations
  async getPublishedPosts(clubId: string, limit: number = 10): Promise<Post[]> {
    const results = await this.db.prepare(`
      SELECT * FROM posts
      WHERE club_id = ? AND status = 'published'
      ORDER BY published_at DESC
      LIMIT ?
    `).bind(clubId, limit).all<Post>();

    return results.results || [];
  }

  async getPostBySlug(clubId: string, slug: string): Promise<Post | null> {
    return this.db.prepare(
      `SELECT * FROM posts WHERE club_id = ? AND slug = ?`
    ).bind(clubId, slug).first<Post>();
  }

  async createPost(data: {
    clubId: string;
    title: string;
    slug: string;
    summary?: string;
    content?: string;
    featuredImage?: string;
    category?: string;
    status?: string;
    authorId?: string;
  }): Promise<Post> {
    const id = generateId();
    const publishedAt = data.status === 'published' ? new Date().toISOString() : null;

    await this.db.prepare(`
      INSERT INTO posts (id, club_id, title, slug, summary, content, featured_image, category, status, published_at, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.clubId,
      data.title,
      data.slug,
      data.summary || null,
      data.content || null,
      data.featuredImage || null,
      data.category || 'news',
      data.status || 'draft',
      publishedAt,
      data.authorId || null
    ).run();

    return this.db.prepare(`SELECT * FROM posts WHERE id = ?`).bind(id).first<Post>() as Promise<Post>;
  }

  async updatePost(id: string, data: Partial<Post>): Promise<void> {
    const fields = Object.keys(data).filter(k => k !== 'id');
    if (fields.length === 0) return;

    const values = fields.map(k => (data as any)[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db.prepare(
      `UPDATE posts SET ${setClause}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...values, id).run();
  }

  async deletePost(id: string): Promise<void> {
    await this.db.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run();
  }

  // Fixture operations
  async getUpcomingFixtures(clubId: string, limit: number = 5): Promise<Fixture[]> {
    const results = await this.db.prepare(`
      SELECT * FROM fixtures
      WHERE club_id = ? AND status = 'upcoming' AND match_date >= date('now')
      ORDER BY match_date ASC, match_time ASC
      LIMIT ?
    `).bind(clubId, limit).all<Fixture>();

    return results.results || [];
  }

  async getPlayedFixtures(clubId: string, limit: number = 5): Promise<Fixture[]> {
    const results = await this.db.prepare(`
      SELECT * FROM fixtures
      WHERE club_id = ? AND status = 'played'
      ORDER BY match_date DESC
      LIMIT ?
    `).bind(clubId, limit).all<Fixture>();

    return results.results || [];
  }

  async getAllFixtures(clubId: string): Promise<Fixture[]> {
    const results = await this.db.prepare(`
      SELECT * FROM fixtures
      WHERE club_id = ?
      ORDER BY match_date DESC, match_time DESC
    `).bind(clubId).all<Fixture>();

    return results.results || [];
  }

  async getFixtureById(id: string): Promise<Fixture | null> {
    return this.db.prepare(
      `SELECT * FROM fixtures WHERE id = ?`
    ).bind(id).first<Fixture>();
  }

  async createFixture(data: {
    clubId: string;
    competition: string;
    homeTeam: string;
    awayTeam: string;
    venue?: string;
    matchDate: string;
    matchTime?: string;
    status?: string;
  }): Promise<Fixture> {
    const id = generateId();

    await this.db.prepare(`
      INSERT INTO fixtures (id, club_id, competition, home_team, away_team, venue, match_date, match_time, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.clubId,
      data.competition,
      data.homeTeam,
      data.awayTeam,
      data.venue || null,
      data.matchDate,
      data.matchTime || null,
      data.status || 'upcoming'
    ).run();

    return this.db.prepare(`SELECT * FROM fixtures WHERE id = ?`).bind(id).first<Fixture>() as Promise<Fixture>;
  }

  async updateFixture(id: string, data: Partial<Fixture>): Promise<void> {
    const fields = Object.keys(data).filter(k => k !== 'id');
    if (fields.length === 0) return;

    const values = fields.map(k => (data as any)[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db.prepare(
      `UPDATE fixtures SET ${setClause}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...values, id).run();
  }

  async recordResult(id: string, homeScore: number, awayScore: number): Promise<void> {
    await this.db.prepare(`
      UPDATE fixtures SET home_score = ?, away_score = ?, status = 'played', updated_at = datetime('now')
      WHERE id = ?
    `).bind(homeScore, awayScore, id).run();
  }

  async deleteFixture(id: string): Promise<void> {
    await this.db.prepare(`DELETE FROM fixtures WHERE id = ?`).bind(id).run();
  }

  // Page operations
  async getPages(clubId: string): Promise<Page[]> {
    const results = await this.db.prepare(`
      SELECT * FROM pages WHERE club_id = ? ORDER BY title ASC
    `).bind(clubId).all<Page>();

    return results.results || [];
  }

  async getPublishedPages(clubId: string): Promise<Page[]> {
    const results = await this.db.prepare(`
      SELECT * FROM pages WHERE club_id = ? AND is_published = 1 ORDER BY title ASC
    `).bind(clubId).all<Page>();

    return results.results || [];
  }

  async getPageBySlug(clubId: string, slug: string): Promise<Page | null> {
    return this.db.prepare(
      `SELECT * FROM pages WHERE club_id = ? AND slug = ?`
    ).bind(clubId, slug).first<Page>();
  }

  async createPage(data: {
    clubId: string;
    title: string;
    slug: string;
    content?: string;
    metaDescription?: string;
    isPublished?: boolean;
    authorId?: string;
  }): Promise<Page> {
    const id = generateId();

    await this.db.prepare(`
      INSERT INTO pages (id, club_id, title, slug, content, meta_description, is_published, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.clubId,
      data.title,
      data.slug,
      data.content || null,
      data.metaDescription || null,
      data.isPublished ? 1 : 0,
      data.authorId || null
    ).run();

    return this.db.prepare(`SELECT * FROM pages WHERE id = ?`).bind(id).first<Page>() as Promise<Page>;
  }

  async updatePage(id: string, data: Partial<Page>): Promise<void> {
    const fields = Object.keys(data).filter(k => k !== 'id');
    if (fields.length === 0) return;

    const values = fields.map(k => (data as any)[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db.prepare(
      `UPDATE pages SET ${setClause}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...values, id).run();
  }

  async deletePage(id: string): Promise<void> {
    await this.db.prepare(`DELETE FROM pages WHERE id = ?`).bind(id).run();
  }

  // Social connection operations
  async getSocialConnections(clubId: string): Promise<SocialConnection[]> {
    const results = await this.db.prepare(`
      SELECT * FROM social_connections WHERE club_id = ? ORDER BY platform ASC
    `).bind(clubId).all<SocialConnection>();

    return results.results || [];
  }

  async getSocialConnection(clubId: string, platform: string): Promise<SocialConnection | null> {
    return this.db.prepare(
      `SELECT * FROM social_connections WHERE club_id = ? AND platform = ?`
    ).bind(clubId, platform).first<SocialConnection>();
  }

  async createSocialConnection(data: {
    clubId: string;
    platform: 'facebook' | 'twitter' | 'instagram';
    accessToken: string;
    refreshToken?: string;
    pageId?: string;
    pageName?: string;
    expiresAt?: string;
    connectedBy: string;
  }): Promise<SocialConnection> {
    const id = generateId();

    await this.db.prepare(`
      INSERT INTO social_connections (id, club_id, platform, access_token, refresh_token, page_id, page_name, expires_at, connected_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.clubId,
      data.platform,
      data.accessToken,
      data.refreshToken || null,
      data.pageId || null,
      data.pageName || null,
      data.expiresAt || null,
      data.connectedBy
    ).run();

    return this.db.prepare(`SELECT * FROM social_connections WHERE id = ?`).bind(id).first<SocialConnection>() as Promise<SocialConnection>;
  }

  async updateSocialConnection(id: string, data: Partial<SocialConnection>): Promise<void> {
    const fields = Object.keys(data).filter(k => k !== 'id');
    if (fields.length === 0) return;

    const values = fields.map(k => (data as any)[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db.prepare(
      `UPDATE social_connections SET ${setClause}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...values, id).run();
  }

  async deleteSocialConnection(clubId: string, platform: string): Promise<void> {
    await this.db.prepare(
      `DELETE FROM social_connections WHERE club_id = ? AND platform = ?`
    ).bind(clubId, platform).run();
  }

  // Publish job operations
  async createPublishJob(data: {
    clubId: string;
    entityType: 'post' | 'fixture_result';
    entityId: string;
    platforms: string[];
    scheduledAt?: string;
    createdBy: string;
  }): Promise<PublishJob> {
    const id = generateId();

    await this.db.prepare(`
      INSERT INTO publish_jobs (id, club_id, entity_type, entity_id, platforms, scheduled_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.clubId,
      data.entityType,
      data.entityId,
      JSON.stringify(data.platforms),
      data.scheduledAt || null,
      data.createdBy
    ).run();

    return this.db.prepare(`SELECT * FROM publish_jobs WHERE id = ?`).bind(id).first<PublishJob>() as Promise<PublishJob>;
  }

  async getPublishJob(id: string): Promise<PublishJob | null> {
    return this.db.prepare(
      `SELECT * FROM publish_jobs WHERE id = ?`
    ).bind(id).first<PublishJob>();
  }

  async getPendingPublishJobs(limit: number = 10): Promise<PublishJob[]> {
    const results = await this.db.prepare(`
      SELECT * FROM publish_jobs
      WHERE status = 'pending'
        AND (scheduled_at IS NULL OR scheduled_at <= datetime('now'))
      ORDER BY created_at ASC
      LIMIT ?
    `).bind(limit).all<PublishJob>();

    return results.results || [];
  }

  async updatePublishJob(id: string, data: {
    status?: string;
    results?: string;
    errorMessage?: string;
    completedAt?: string;
  }): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.results !== undefined) {
      updates.push('results = ?');
      values.push(data.results);
    }
    if (data.errorMessage !== undefined) {
      updates.push('error_message = ?');
      values.push(data.errorMessage);
    }
    if (data.completedAt !== undefined) {
      updates.push('completed_at = ?');
      values.push(data.completedAt);
    }

    if (updates.length === 0) return;

    await this.db.prepare(
      `UPDATE publish_jobs SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values, id).run();
  }

  // Publish history operations
  async recordPublishHistory(data: {
    clubId: string;
    entityType: string;
    entityId: string;
    platform: string;
    externalId?: string;
    externalUrl?: string;
    publishedBy?: string;
  }): Promise<void> {
    const id = generateId();

    await this.db.prepare(`
      INSERT INTO publish_history (id, club_id, entity_type, entity_id, platform, external_id, external_url, published_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.clubId,
      data.entityType,
      data.entityId,
      data.platform,
      data.externalId || null,
      data.externalUrl || null,
      data.publishedBy || null
    ).run();
  }

  async getPublishHistory(clubId: string, entityType: string, entityId: string): Promise<PublishHistory[]> {
    const results = await this.db.prepare(`
      SELECT * FROM publish_history
      WHERE club_id = ? AND entity_type = ? AND entity_id = ?
      ORDER BY published_at DESC
    `).bind(clubId, entityType, entityId).all<PublishHistory>();

    return results.results || [];
  }

  // Push subscription operations
  async createPushSubscription(data: {
    clubId: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string;
    userId?: string;
  }): Promise<void> {
    const id = generateId();

    await this.db.prepare(`
      INSERT OR REPLACE INTO push_subscriptions (id, club_id, endpoint, keys, user_agent, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.clubId,
      data.endpoint,
      JSON.stringify(data.keys),
      data.userAgent || null,
      data.userId || null
    ).run();
  }

  async getPushSubscriptions(clubId: string): Promise<PushSubscription[]> {
    const results = await this.db.prepare(`
      SELECT * FROM push_subscriptions WHERE club_id = ?
    `).bind(clubId).all<PushSubscription>();

    return results.results || [];
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await this.db.prepare(
      `DELETE FROM push_subscriptions WHERE endpoint = ?`
    ).bind(endpoint).run();
  }

  // Homepage config operations
  async getHomepageConfig(clubId: string): Promise<HomepageConfig | null> {
    return this.db.prepare(
      `SELECT * FROM homepage_configs WHERE club_id = ?`
    ).bind(clubId).first<HomepageConfig>();
  }

  async saveHomepageConfig(data: {
    clubId: string;
    config: object;
    updatedBy: string;
  }): Promise<HomepageConfig> {
    const existing = await this.getHomepageConfig(data.clubId);

    if (existing) {
      // Update existing config
      await this.db.prepare(`
        UPDATE homepage_configs
        SET config = ?, version = version + 1, updated_by = ?, updated_at = datetime('now')
        WHERE club_id = ?
      `).bind(
        JSON.stringify(data.config),
        data.updatedBy,
        data.clubId
      ).run();

      return this.getHomepageConfig(data.clubId) as Promise<HomepageConfig>;
    } else {
      // Create new config
      const id = generateId();
      await this.db.prepare(`
        INSERT INTO homepage_configs (id, club_id, config, updated_by)
        VALUES (?, ?, ?, ?)
      `).bind(
        id,
        data.clubId,
        JSON.stringify(data.config),
        data.updatedBy
      ).run();

      return this.db.prepare(`SELECT * FROM homepage_configs WHERE id = ?`).bind(id).first<HomepageConfig>() as Promise<HomepageConfig>;
    }
  }

  async deleteHomepageConfig(clubId: string): Promise<void> {
    await this.db.prepare(
      `DELETE FROM homepage_configs WHERE club_id = ?`
    ).bind(clubId).run();
  }
}
