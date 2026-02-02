-- Migration: 0008_multi_sport.sql
-- Add multi-sport support to Clubify
-- - Adds club_type field to clubs table
-- - Creates waitlist table for coming soon sports
-- - Creates sport_defaults table for per-sport configuration

-- Add club_type column to clubs table
-- Default to 'gaa' for all existing clubs
ALTER TABLE clubs ADD COLUMN club_type TEXT DEFAULT 'gaa';

-- Create index for efficient club_type queries
CREATE INDEX IF NOT EXISTS idx_clubs_type ON clubs(club_type);

-- Waitlist table for coming soon sports
CREATE TABLE IF NOT EXISTS sport_waitlist (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  club_name TEXT,
  sport TEXT NOT NULL,
  source TEXT DEFAULT 'website',
  notified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(email, sport)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_sport ON sport_waitlist(sport);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON sport_waitlist(email);

-- Sport defaults table for platform-level per-sport configuration
CREATE TABLE IF NOT EXISTS sport_defaults (
  sport TEXT PRIMARY KEY,
  status TEXT DEFAULT 'coming_soon',
  default_modules TEXT NOT NULL,
  default_template TEXT NOT NULL,
  terminology TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert default configurations for all supported sports
INSERT OR IGNORE INTO sport_defaults (sport, status, default_modules, default_template, terminology) VALUES
('gaa', 'ready', '{"inbox":true,"forms":true,"sponsors":true,"fixtures":true,"posts":true,"media":true}', 'gaa-classic', '{"fixture":"Match","result":"Result","team":"Team","venue":"Pitch","competition":"Championship","member":"Member"}'),
('football', 'coming_soon', '{"inbox":true,"forms":true,"sponsors":true,"fixtures":true,"posts":true,"media":true}', 'football-classic', '{"fixture":"Match","result":"Score","team":"Team","venue":"Ground","competition":"League","member":"Player"}'),
('rugby', 'coming_soon', '{"inbox":true,"forms":true,"sponsors":true,"fixtures":true,"posts":true,"media":true}', 'rugby-classic', '{"fixture":"Match","result":"Score","team":"Squad","venue":"Ground","competition":"League","member":"Player"}'),
('athletics', 'coming_soon', '{"inbox":true,"forms":true,"sponsors":true,"fixtures":true,"posts":true,"media":true}', 'athletics-classic', '{"fixture":"Event","result":"Time/Distance","team":"Club","venue":"Track","competition":"Championship","member":"Athlete"}'),
('golf', 'coming_soon', '{"inbox":true,"forms":true,"sponsors":true,"fixtures":true,"posts":true,"media":true}', 'golf-classic', '{"fixture":"Competition","result":"Score","team":"Club","venue":"Course","competition":"Tournament","member":"Member"}'),
('tennis', 'coming_soon', '{"inbox":true,"forms":true,"sponsors":true,"fixtures":true,"posts":true,"media":true}', 'tennis-classic', '{"fixture":"Match","result":"Score","team":"Player","venue":"Court","competition":"Tournament","member":"Player"}'),
('cycling', 'coming_soon', '{"inbox":true,"forms":true,"sponsors":true,"fixtures":true,"posts":true,"media":true}', 'cycling-classic', '{"fixture":"Event","result":"Time","team":"Club","venue":"Route","competition":"Race","member":"Rider"}');
