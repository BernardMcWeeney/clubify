-- Clubify Database Schema
-- Migration: 0002_templates_and_pages.sql

-- Static pages (about, contact, sponsors, safeguarding, etc.)
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  meta_description TEXT,
  is_published INTEGER DEFAULT 0,
  author_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(club_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_pages_club ON pages(club_id);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);

-- Homepage configurations (template-specific block settings per club)
CREATE TABLE IF NOT EXISTS homepage_configs (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  config TEXT NOT NULL, -- JSON: block visibility, content overrides, ordering
  version INTEGER DEFAULT 1,
  updated_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(club_id)
);

CREATE INDEX IF NOT EXISTS idx_homepage_configs_club ON homepage_configs(club_id);

-- Post categories for better organization
CREATE TABLE IF NOT EXISTS post_categories (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#22c55e',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(club_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_post_categories_club ON post_categories(club_id);
