-- Migration: 0006_module_toggles.sql
-- Adds module configuration to clubs table for enabling/disabling features

-- Add modules_config JSON field to clubs table
-- Stores which modules are enabled/disabled for each club
ALTER TABLE clubs ADD COLUMN modules_config TEXT DEFAULT '{"inbox":true,"forms":true,"sponsors":true,"fixtures":true,"posts":true,"media":true}';
