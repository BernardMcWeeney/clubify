-- Migration: 0009_sport_feature_flags.sql
-- Adds sport-specific feature flags and per-club sport settings

-- Normalize GAA key to lowercase for consistent lookups
UPDATE sport_defaults SET sport = 'gaa' WHERE sport = 'GAA';

-- Add feature flags to sport defaults (core + sport-specific)
ALTER TABLE sport_defaults ADD COLUMN feature_flags TEXT DEFAULT '{}';

-- Add per-club sport settings (booking links, pricing, etc.)
ALTER TABLE clubs ADD COLUMN sport_settings TEXT DEFAULT '{}';

-- Seed feature flags per sport
UPDATE sport_defaults SET feature_flags = '{"core":["website_editor","posts","pages","media","sponsors","forms","inbox","social_publishing"],"sport_specific":["fixtures","results","gaa_scoring","multi_team"]}' WHERE sport = 'gaa';
UPDATE sport_defaults SET feature_flags = '{"core":["website_editor","posts","pages","media","sponsors","forms","inbox","social_publishing"],"sport_specific":["fixtures","results","league_tables"]}' WHERE sport = 'football';
UPDATE sport_defaults SET feature_flags = '{"core":["website_editor","posts","pages","media","sponsors","forms","inbox","social_publishing"],"sport_specific":["fixtures","results","squad_management"]}' WHERE sport = 'rugby';
UPDATE sport_defaults SET feature_flags = '{"core":["website_editor","posts","pages","media","sponsors","forms","inbox","social_publishing"],"sport_specific":["events","results","personal_bests"]}' WHERE sport = 'athletics';
UPDATE sport_defaults SET feature_flags = '{"core":["website_editor","posts","pages","media","sponsors","forms","inbox","social_publishing"],"sport_specific":["membership_pricing","booking_links","handicaps","leaderboards"]}' WHERE sport = 'golf';
UPDATE sport_defaults SET feature_flags = '{"core":["website_editor","posts","pages","media","sponsors","forms","inbox","social_publishing"],"sport_specific":["booking_links","rankings"]}' WHERE sport = 'tennis';
UPDATE sport_defaults SET feature_flags = '{"core":["website_editor","posts","pages","media","sponsors","forms","inbox","social_publishing"],"sport_specific":["routes","events","ride_reports"]}' WHERE sport = 'cycling';
