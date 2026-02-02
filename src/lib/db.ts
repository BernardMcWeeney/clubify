// Database service for Cloudflare D1
import { generateId, generateToken, addMinutes, addDays, isExpired } from './utils';
import { encrypt, decrypt } from './crypto';

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
  club_type: string; // 'gaa' | 'football' | 'rugby' | 'athletics' | 'golf' | 'tennis' | 'cycling'
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
  modules_config: string | null;
  is_live: number;
  setup_completed: number;
  setup_step: number;
  created_at: string;
  updated_at: string;
}

export interface SportWaitlist {
  id: string;
  email: string;
  club_name: string | null;
  sport: string;
  source: string;
  notified: number;
  created_at: string;
}

export interface SportDefaults {
  sport: string;
  status: string;
  default_modules: string;
  default_template: string;
  terminology: string;
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
  home_goals: number | null;
  home_points: number | null;
  away_goals: number | null;
  away_points: number | null;
  is_home: number | null;
  result: string | null;
  match_report: string | null;
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
  external_user_id: string | null;
  external_username: string | null;
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

export interface SiteSettings {
  club_id: string;
  nav_items: string | null;
  header_settings: string | null;
  footer_links: string | null;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  club_id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: string;
  sponsoring: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  placements: string | null; // JSON array
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ContactSettings {
  club_id: string;
  notify_email: string | null;
  retention_days: number;
  form_title: string | null;
  form_intro: string | null;
  success_message: string | null;
  is_enabled: number;
  updated_at: string;
}

export interface ContactSubmission {
  id: string;
  club_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string;
  consent: number;
  created_at: string;
}

export interface Form {
  id: string;
  club_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: number;
  success_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: string;
  form_id: string;
  label: string;
  type: string;
  required: number;
  options: string | null;
  placeholder: string | null;
  help_text: string | null;
  order_index: number;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  club_id: string;
  data: string; // JSON
  created_at: string;
}

export class DatabaseService {
  private encryptionSecret?: string;

  constructor(private db: D1Database, encryptionSecret?: string) {
    this.encryptionSecret = encryptionSecret;
  }

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
    clubType?: string;
  }): Promise<Club> {
    const id = generateId();
    const clubType = data.clubType || 'gaa';

    await this.db.prepare(`
      INSERT INTO clubs (id, name, slug, county, club_type) VALUES (?, ?, ?, ?, ?)
    `).bind(id, data.name, data.slug, data.county, clubType).run();

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

  async getModuleConfig(clubId: string): Promise<Record<string, boolean>> {
    const club = await this.getClubById(clubId);
    if (!club || !club.modules_config) {
      // Return default config if not set
      return {
        inbox: true,
        forms: true,
        sponsors: true,
        fixtures: true,
        posts: true,
        media: true,
      };
    }
    return JSON.parse(club.modules_config);
  }

  async updateModuleConfig(clubId: string, config: Record<string, boolean>): Promise<void> {
    await this.db.prepare(
      `UPDATE clubs SET modules_config = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(JSON.stringify(config), clubId).run();
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
        (SELECT COUNT(*) FROM posts p WHERE p.club_id = c.id AND p.status = 'published') as published_post_count,
        (SELECT COUNT(*) FROM fixtures f WHERE f.club_id = c.id) as fixture_count,
        (SELECT COUNT(*) FROM pages pg WHERE pg.club_id = c.id) as page_count,
        (SELECT COUNT(*) FROM social_connections sc WHERE sc.club_id = c.id) as social_count,
        (
          SELECT MAX(ts) FROM (
            SELECT MAX(updated_at) as ts FROM posts p WHERE p.club_id = c.id
            UNION ALL
            SELECT MAX(updated_at) as ts FROM fixtures f WHERE f.club_id = c.id
            UNION ALL
            SELECT MAX(updated_at) as ts FROM pages pg WHERE pg.club_id = c.id
          )
        ) as last_content_at,
        CASE WHEN c.crest_url IS NOT NULL AND c.crest_url != '' THEN 1 ELSE 0 END as has_crest,
        CASE WHEN (c.contact_email IS NOT NULL AND c.contact_email != '') OR (c.contact_phone IS NOT NULL AND c.contact_phone != '') THEN 1 ELSE 0 END as has_contact,
        CASE WHEN ss.nav_items IS NOT NULL AND ss.nav_items != '[]' AND ss.nav_items != '' THEN 1 ELSE 0 END as has_nav
      FROM clubs c
      LEFT JOIN site_settings ss ON ss.club_id = c.id
      ORDER BY c.created_at DESC
    `).all<any>();

    // Calculate health score for each club
    return (results.results || []).map(club => {
      let healthScore = 0;
      const healthChecks = {
        hasCrest: club.has_crest === 1,
        hasContact: club.has_contact === 1,
        hasNav: club.has_nav === 1,
        hasPublishedPost: club.published_post_count > 0,
        hasSocialConnection: club.social_count > 0,
      };

      if (healthChecks.hasCrest) healthScore++;
      if (healthChecks.hasContact) healthScore++;
      if (healthChecks.hasNav) healthScore++;
      if (healthChecks.hasPublishedPost) healthScore++;
      if (healthChecks.hasSocialConnection) healthScore++;

      return {
        ...club,
        health_score: healthScore,
        health_max: 5,
        health_checks: healthChecks,
      };
    });
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

  async recordResult(
    id: string,
    homeGoals: number,
    homePoints: number,
    awayGoals: number,
    awayPoints: number,
    isHome: number
  ): Promise<void> {
    // Calculate total scores (GAA scoring: goals worth 3 points each)
    const homeTotal = (homeGoals * 3) + homePoints;
    const awayTotal = (awayGoals * 3) + awayPoints;

    // Determine result from club's perspective
    let result: string;
    if (isHome === 1) {
      // Club is home team
      result = homeTotal > awayTotal ? 'win' : homeTotal < awayTotal ? 'loss' : 'draw';
    } else {
      // Club is away team
      result = awayTotal > homeTotal ? 'win' : awayTotal < homeTotal ? 'loss' : 'draw';
    }

    await this.db.prepare(`
      UPDATE fixtures SET
        home_goals = ?,
        home_points = ?,
        away_goals = ?,
        away_points = ?,
        home_score = ?,
        away_score = ?,
        result = ?,
        status = 'played',
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(homeGoals, homePoints, awayGoals, awayPoints, homeTotal, awayTotal, result, id).run();
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

  // Social connection operations (with token encryption)
  private async decryptSocialConnection(connection: SocialConnection | null): Promise<SocialConnection | null> {
    if (!connection) return null;
    if (!this.encryptionSecret) return connection;

    return {
      ...connection,
      access_token: await decrypt(connection.access_token, this.encryptionSecret),
      refresh_token: connection.refresh_token
        ? await decrypt(connection.refresh_token, this.encryptionSecret)
        : null,
    };
  }

  async getSocialConnections(clubId: string): Promise<SocialConnection[]> {
    const results = await this.db.prepare(`
      SELECT * FROM social_connections WHERE club_id = ? ORDER BY platform ASC
    `).bind(clubId).all<SocialConnection>();

    const connections = results.results || [];

    // Decrypt tokens for each connection
    return Promise.all(
      connections.map(conn => this.decryptSocialConnection(conn) as Promise<SocialConnection>)
    );
  }

  async getSocialConnection(clubId: string, platform: string): Promise<SocialConnection | null> {
    const connection = await this.db.prepare(
      `SELECT * FROM social_connections WHERE club_id = ? AND platform = ?`
    ).bind(clubId, platform).first<SocialConnection>();

    return this.decryptSocialConnection(connection);
  }

  async createSocialConnection(data: {
    clubId: string;
    platform: 'facebook' | 'twitter' | 'instagram';
    accessToken: string;
    refreshToken?: string;
    pageId?: string;
    pageName?: string;
    externalUserId?: string;
    externalUsername?: string;
    expiresAt?: string;
    connectedBy: string;
  }): Promise<SocialConnection> {
    const id = generateId();

    // Encrypt tokens before storing
    const encryptedAccessToken = this.encryptionSecret
      ? await encrypt(data.accessToken, this.encryptionSecret)
      : data.accessToken;
    const encryptedRefreshToken = data.refreshToken && this.encryptionSecret
      ? await encrypt(data.refreshToken, this.encryptionSecret)
      : data.refreshToken || null;

    await this.db.prepare(`
      INSERT INTO social_connections (id, club_id, platform, access_token, refresh_token, page_id, page_name, external_user_id, external_username, expires_at, connected_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.clubId,
      data.platform,
      encryptedAccessToken,
      encryptedRefreshToken,
      data.pageId || null,
      data.pageName || null,
      data.externalUserId || null,
      data.externalUsername || null,
      data.expiresAt || null,
      data.connectedBy
    ).run();

    // Return decrypted version
    const result = await this.db.prepare(`SELECT * FROM social_connections WHERE id = ?`).bind(id).first<SocialConnection>();
    return this.decryptSocialConnection(result) as Promise<SocialConnection>;
  }

  async updateSocialConnection(id: string, data: Partial<SocialConnection>): Promise<void> {
    const fields = Object.keys(data).filter(k => k !== 'id');
    if (fields.length === 0) return;

    // Encrypt token fields if being updated
    const processedData = { ...data };
    if (processedData.access_token && this.encryptionSecret) {
      processedData.access_token = await encrypt(processedData.access_token, this.encryptionSecret);
    }
    if (processedData.refresh_token && this.encryptionSecret) {
      processedData.refresh_token = await encrypt(processedData.refresh_token, this.encryptionSecret);
    }

    const values = fields.map(k => (processedData as any)[k]);
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

  // Site settings operations
  async getSiteSettings(clubId: string): Promise<SiteSettings | null> {
    return this.db.prepare(
      `SELECT * FROM site_settings WHERE club_id = ?`
    ).bind(clubId).first<SiteSettings>();
  }

  async upsertSiteSettings(clubId: string, data: {
    nav_items?: string | null;
    header_settings?: string | null;
    footer_links?: string | null;
  }): Promise<void> {
    await this.db.prepare(`
      INSERT INTO site_settings (club_id, nav_items, header_settings, footer_links, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(club_id) DO UPDATE SET
        nav_items = excluded.nav_items,
        header_settings = excluded.header_settings,
        footer_links = excluded.footer_links,
        updated_at = datetime('now')
    `).bind(
      clubId,
      data.nav_items ?? null,
      data.header_settings ?? null,
      data.footer_links ?? null
    ).run();
  }

  // Sponsor operations
  async getSponsors(clubId: string): Promise<Sponsor[]> {
    const results = await this.db.prepare(`
      SELECT * FROM sponsors
      WHERE club_id = ?
      ORDER BY sort_order ASC, created_at DESC
    `).bind(clubId).all<Sponsor>();

    return results.results || [];
  }

  async getSponsorsForPlacement(clubId: string, placement: string): Promise<Sponsor[]> {
    const sponsors = await this.getSponsors(clubId);
    return sponsors.filter((s) => {
      if (!s.is_active) return false;
      const placements = s.placements ? JSON.parse(s.placements) as string[] : ['home'];
      return placements.includes('all') || placements.includes(placement);
    });
  }

  async createSponsor(data: {
    clubId: string;
    name: string;
    logoUrl?: string | null;
    websiteUrl?: string | null;
    tier?: string;
    sponsoring?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    sortOrder?: number;
    placements?: string[] | null;
    isActive?: number;
  }): Promise<Sponsor> {
    const id = generateId();

    await this.db.prepare(`
      INSERT INTO sponsors (
        id, club_id, name, logo_url, website_url, tier,
        sponsoring, start_date, end_date, sort_order, placements, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.clubId,
      data.name,
      data.logoUrl || null,
      data.websiteUrl || null,
      data.tier || 'main',
      data.sponsoring || null,
      data.startDate || null,
      data.endDate || null,
      data.sortOrder ?? 0,
      JSON.stringify(data.placements || ['home']),
      data.isActive ?? 1
    ).run();

    return this.db.prepare(`SELECT * FROM sponsors WHERE id = ?`).bind(id).first<Sponsor>() as Promise<Sponsor>;
  }

  async updateSponsor(id: string, data: Partial<Sponsor>): Promise<void> {
    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'club_id');
    if (fields.length === 0) return;

    const values = fields.map(k => (data as any)[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db.prepare(
      `UPDATE sponsors SET ${setClause}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...values, id).run();
  }

  async deleteSponsor(id: string): Promise<void> {
    await this.db.prepare(`DELETE FROM sponsors WHERE id = ?`).bind(id).run();
  }

  // Contact settings & submissions
  async getContactSettings(clubId: string): Promise<ContactSettings | null> {
    return this.db.prepare(
      `SELECT * FROM contact_settings WHERE club_id = ?`
    ).bind(clubId).first<ContactSettings>();
  }

  async upsertContactSettings(clubId: string, data: Partial<ContactSettings>): Promise<void> {
    await this.db.prepare(`
      INSERT INTO contact_settings (
        club_id, notify_email, retention_days, form_title, form_intro, success_message, is_enabled, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(club_id) DO UPDATE SET
        notify_email = excluded.notify_email,
        retention_days = excluded.retention_days,
        form_title = excluded.form_title,
        form_intro = excluded.form_intro,
        success_message = excluded.success_message,
        is_enabled = excluded.is_enabled,
        updated_at = datetime('now')
    `).bind(
      clubId,
      data.notify_email ?? null,
      data.retention_days ?? 30,
      data.form_title ?? null,
      data.form_intro ?? null,
      data.success_message ?? null,
      data.is_enabled ?? 1
    ).run();
  }

  async purgeContactSubmissions(clubId: string, retentionDays: number): Promise<void> {
    await this.db.prepare(
      `DELETE FROM contact_submissions WHERE club_id = ? AND created_at < datetime('now', ?)`
    ).bind(clubId, `-${retentionDays} days`).run();
  }

  async createContactSubmission(data: {
    clubId: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    message: string;
    consent: number;
  }): Promise<ContactSubmission> {
    const id = generateId();
    await this.db.prepare(`
      INSERT INTO contact_submissions (id, club_id, name, email, phone, message, consent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.clubId,
      data.name || null,
      data.email || null,
      data.phone || null,
      data.message,
      data.consent
    ).run();

    return this.db.prepare(`SELECT * FROM contact_submissions WHERE id = ?`).bind(id).first<ContactSubmission>() as Promise<ContactSubmission>;
  }

  async getContactSubmissions(clubId: string, retentionDays: number = 30): Promise<ContactSubmission[]> {
    await this.purgeContactSubmissions(clubId, retentionDays);
    const results = await this.db.prepare(`
      SELECT * FROM contact_submissions WHERE club_id = ?
      ORDER BY created_at DESC
    `).bind(clubId).all<ContactSubmission>();
    return results.results || [];
  }

  // Form builder operations
  async getForms(clubId: string): Promise<Form[]> {
    const results = await this.db.prepare(`
      SELECT * FROM forms WHERE club_id = ? ORDER BY created_at DESC
    `).bind(clubId).all<Form>();
    return results.results || [];
  }

  async getFormById(formId: string): Promise<Form | null> {
    return this.db.prepare(`SELECT * FROM forms WHERE id = ?`).bind(formId).first<Form>();
  }

  async getFormBySlug(clubId: string, slug: string): Promise<Form | null> {
    return this.db.prepare(`SELECT * FROM forms WHERE club_id = ? AND slug = ?`).bind(clubId, slug).first<Form>();
  }

  async createForm(data: {
    clubId: string;
    name: string;
    slug: string;
    description?: string | null;
    isActive?: number;
    successMessage?: string | null;
  }): Promise<Form> {
    const id = generateId();
    await this.db.prepare(`
      INSERT INTO forms (id, club_id, name, slug, description, is_active, success_message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.clubId,
      data.name,
      data.slug,
      data.description || null,
      data.isActive ?? 1,
      data.successMessage || null
    ).run();

    return this.db.prepare(`SELECT * FROM forms WHERE id = ?`).bind(id).first<Form>() as Promise<Form>;
  }

  async updateForm(id: string, data: Partial<Form>): Promise<void> {
    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'club_id');
    if (fields.length === 0) return;
    const values = fields.map(k => (data as any)[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db.prepare(
      `UPDATE forms SET ${setClause}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...values, id).run();
  }

  async deleteForm(id: string): Promise<void> {
    await this.db.prepare(`DELETE FROM forms WHERE id = ?`).bind(id).run();
  }

  async getFormFields(formId: string): Promise<FormField[]> {
    const results = await this.db.prepare(`
      SELECT * FROM form_fields WHERE form_id = ? ORDER BY order_index ASC
    `).bind(formId).all<FormField>();
    return results.results || [];
  }

  async replaceFormFields(formId: string, fields: Array<{
    label: string;
    type: string;
    required?: number;
    options?: string | null;
    placeholder?: string | null;
    help_text?: string | null;
    order_index?: number;
  }>): Promise<void> {
    await this.db.prepare(`DELETE FROM form_fields WHERE form_id = ?`).bind(formId).run();
    for (const field of fields) {
      const id = generateId();
      await this.db.prepare(`
        INSERT INTO form_fields (
          id, form_id, label, type, required, options, placeholder, help_text, order_index
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        formId,
        field.label,
        field.type,
        field.required ?? 0,
        field.options ?? null,
        field.placeholder ?? null,
        field.help_text ?? null,
        field.order_index ?? 0
      ).run();
    }
  }

  async createFormSubmission(data: {
    formId: string;
    clubId: string;
    payload: object;
  }): Promise<FormSubmission> {
    const id = generateId();
    await this.db.prepare(`
      INSERT INTO form_submissions (id, form_id, club_id, data)
      VALUES (?, ?, ?, ?)
    `).bind(
      id,
      data.formId,
      data.clubId,
      JSON.stringify(data.payload)
    ).run();

    return this.db.prepare(`SELECT * FROM form_submissions WHERE id = ?`).bind(id).first<FormSubmission>() as Promise<FormSubmission>;
  }

  async getFormSubmissions(formId: string): Promise<FormSubmission[]> {
    const results = await this.db.prepare(`
      SELECT * FROM form_submissions WHERE form_id = ? ORDER BY created_at DESC
    `).bind(formId).all<FormSubmission>();
    return results.results || [];
  }

  // Sport waitlist operations
  async addToWaitlist(data: {
    email: string;
    clubName?: string;
    sport: string;
    source?: string;
  }): Promise<SportWaitlist> {
    const id = generateId();

    await this.db.prepare(`
      INSERT OR IGNORE INTO sport_waitlist (id, email, club_name, sport, source)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      id,
      data.email.toLowerCase(),
      data.clubName || null,
      data.sport,
      data.source || 'website'
    ).run();

    // Return the waitlist entry (either new or existing)
    const result = await this.db.prepare(`
      SELECT * FROM sport_waitlist WHERE email = ? AND sport = ?
    `).bind(data.email.toLowerCase(), data.sport).first<SportWaitlist>();

    return result as SportWaitlist;
  }

  async getWaitlistBySport(sport: string): Promise<SportWaitlist[]> {
    const results = await this.db.prepare(`
      SELECT * FROM sport_waitlist WHERE sport = ? ORDER BY created_at DESC
    `).bind(sport).all<SportWaitlist>();

    return results.results || [];
  }

  async getWaitlistCount(sport: string): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count FROM sport_waitlist WHERE sport = ?
    `).bind(sport).first<{ count: number }>();

    return result?.count || 0;
  }

  async markWaitlistNotified(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const placeholders = ids.map(() => '?').join(',');
    await this.db.prepare(`
      UPDATE sport_waitlist SET notified = 1 WHERE id IN (${placeholders})
    `).bind(...ids).run();
  }

  // Sport defaults operations
  async getSportDefaults(sport: string): Promise<SportDefaults | null> {
    return this.db.prepare(`
      SELECT * FROM sport_defaults WHERE sport = ?
    `).bind(sport).first<SportDefaults>();
  }

  async getAllSportDefaults(): Promise<SportDefaults[]> {
    const results = await this.db.prepare(`
      SELECT * FROM sport_defaults ORDER BY sport ASC
    `).all<SportDefaults>();

    return results.results || [];
  }

  async updateSportStatus(sport: string, status: string): Promise<void> {
    await this.db.prepare(`
      UPDATE sport_defaults SET status = ?, updated_at = datetime('now') WHERE sport = ?
    `).bind(status, sport).run();
  }
}
