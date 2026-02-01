-- Migration: 0004_site_features.sql

-- Site settings (navigation, header CTA, footer links)
CREATE TABLE IF NOT EXISTS site_settings (
  club_id TEXT PRIMARY KEY REFERENCES clubs(id) ON DELETE CASCADE,
  nav_items TEXT,
  header_settings TEXT,
  footer_links TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Sponsors
CREATE TABLE IF NOT EXISTS sponsors (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  tier TEXT DEFAULT 'main',
  sponsoring TEXT,
  start_date TEXT,
  end_date TEXT,
  sort_order INTEGER DEFAULT 0,
  placements TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_sponsors_club ON sponsors(club_id);

-- Contact form settings
CREATE TABLE IF NOT EXISTS contact_settings (
  club_id TEXT PRIMARY KEY REFERENCES clubs(id) ON DELETE CASCADE,
  notify_email TEXT,
  retention_days INTEGER DEFAULT 30,
  form_title TEXT,
  form_intro TEXT,
  success_message TEXT,
  is_enabled INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Contact submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  consent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_contact_submissions_club ON contact_submissions(club_id);

-- Forms
CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  success_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(club_id, slug)
);

CREATE INDEX idx_forms_club ON forms(club_id);

-- Form fields
CREATE TABLE IF NOT EXISTS form_fields (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  required INTEGER DEFAULT 0,
  options TEXT,
  placeholder TEXT,
  help_text TEXT,
  order_index INTEGER DEFAULT 0
);

CREATE INDEX idx_form_fields_form ON form_fields(form_id);

-- Form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_club ON form_submissions(club_id);
