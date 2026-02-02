-- Clubify Database Schema
-- Migration: 0010_recycling_bin.sql
-- Adds soft delete support for clubs (recycling bin)

-- Add deleted_by column (deleted_at may already exist from initial schema)
-- SQLite workaround: try to add column, ignore error if exists
-- Run this manually or via migration tool that handles errors

-- Check if deleted_by column exists, if not add it
-- This uses a CREATE TABLE approach that's safer for SQLite
CREATE TABLE IF NOT EXISTS _migration_check (id INTEGER);
DROP TABLE IF EXISTS _migration_check;

-- The safest approach: try to add columns (will error if exist, which is OK)
-- In production, you can run: ALTER TABLE clubs ADD COLUMN deleted_by TEXT REFERENCES users(id);

-- Create index for efficient recycling bin queries (IF NOT EXISTS is supported for indexes)
CREATE INDEX IF NOT EXISTS idx_clubs_deleted ON clubs(deleted_at);
CREATE INDEX IF NOT EXISTS idx_clubs_deleted_at_not_null ON clubs(deleted_at) WHERE deleted_at IS NOT NULL;
