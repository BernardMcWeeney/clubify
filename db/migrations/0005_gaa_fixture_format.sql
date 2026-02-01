-- Migration: 0005_gaa_fixture_format.sql
-- Adds GAA-specific scoring fields to fixtures table

-- Add GAA score fields to fixtures table
ALTER TABLE fixtures ADD COLUMN home_goals INTEGER DEFAULT 0;
ALTER TABLE fixtures ADD COLUMN home_points INTEGER DEFAULT 0;
ALTER TABLE fixtures ADD COLUMN away_goals INTEGER DEFAULT 0;
ALTER TABLE fixtures ADD COLUMN away_points INTEGER DEFAULT 0;

-- Add field to track if club is home or away team
ALTER TABLE fixtures ADD COLUMN is_home INTEGER DEFAULT 1;

-- Add field to track match result from club's perspective
ALTER TABLE fixtures ADD COLUMN result TEXT;

-- Add field for match report
ALTER TABLE fixtures ADD COLUMN match_report TEXT;
