-- Clubify Database Schema
-- Migration: 0003_publishing.sql
-- Publishing pipeline for social media integration

-- Social media account connections
CREATE TABLE IF NOT EXISTS social_connections (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'facebook', 'twitter', 'instagram'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  page_id TEXT, -- For Facebook Pages
  page_name TEXT, -- Display name of connected page
  expires_at TEXT,
  connected_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(club_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_connections_club ON social_connections(club_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON social_connections(platform);

-- Publish jobs queue (for tracking published content)
CREATE TABLE IF NOT EXISTS publish_jobs (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'post', 'fixture_result'
  entity_id TEXT NOT NULL,
  platforms TEXT NOT NULL, -- JSON array: ["facebook", "website"]
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  scheduled_at TEXT, -- NULL for immediate publish
  results TEXT, -- JSON: per-platform results
  error_message TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_publish_jobs_club ON publish_jobs(club_id);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_status ON publish_jobs(status);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_entity ON publish_jobs(entity_type, entity_id);

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys TEXT NOT NULL, -- JSON: { p256dh, auth }
  user_agent TEXT,
  user_id TEXT REFERENCES users(id), -- Optional: link to user if logged in
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(club_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_club ON push_subscriptions(club_id);

-- Published content tracking (what was published where)
CREATE TABLE IF NOT EXISTS publish_history (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  external_id TEXT, -- ID on the external platform (e.g., Facebook post ID)
  external_url TEXT, -- URL on the external platform
  published_at TEXT DEFAULT (datetime('now')),
  published_by TEXT REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_publish_history_club ON publish_history(club_id);
CREATE INDEX IF NOT EXISTS idx_publish_history_entity ON publish_history(entity_type, entity_id);
