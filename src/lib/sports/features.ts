// Feature Gating System
// Controls which features are available per sport type

import { normalizeSportId, type SportType } from './index';

export interface FeatureGates {
  // Core content features
  fixtures: boolean;
  results: boolean;
  news: boolean;
  gallery: boolean;
  sponsors: boolean;
  forms: boolean;

  // Scoring systems
  gaaScoring: boolean;      // Goals + Points (e.g., 2-14)
  standardScoring: boolean; // Simple numeric scores
  setScoring: boolean;      // Sets/games (tennis)
  timeScoring: boolean;     // Times/distances (athletics, cycling)
  strokeScoring: boolean;   // Golf scoring (over/under par)

  // Sport-specific features
  leaderboard: boolean;     // Rankings/league tables
  handicaps: boolean;       // Golf handicaps
  routes: boolean;          // Cycling routes
  personalBests: boolean;   // Athletics PBs
  courtBooking: boolean;    // Tennis court reservations

  // Team structure
  multipleTeams: boolean;   // Multiple teams/age groups
  individualMembers: boolean; // Individual sport focus
}

export interface ModuleDefaults {
  inbox: boolean;
  forms: boolean;
  sponsors: boolean;
  fixtures: boolean;
  posts: boolean;
  media: boolean;
}

// Feature configuration per sport
export const SPORT_FEATURES: Record<SportType, FeatureGates> = {
  gaa: {
    fixtures: true,
    results: true,
    news: true,
    gallery: true,
    sponsors: true,
    forms: true,
    gaaScoring: true,
    standardScoring: false,
    setScoring: false,
    timeScoring: false,
    strokeScoring: false,
    leaderboard: true,
    handicaps: false,
    routes: false,
    personalBests: false,
    courtBooking: false,
    multipleTeams: true,
    individualMembers: false,
  },

  football: {
    fixtures: true,
    results: true,
    news: true,
    gallery: true,
    sponsors: true,
    forms: true,
    gaaScoring: false,
    standardScoring: true,
    setScoring: false,
    timeScoring: false,
    strokeScoring: false,
    leaderboard: true,
    handicaps: false,
    routes: false,
    personalBests: false,
    courtBooking: false,
    multipleTeams: true,
    individualMembers: false,
  },

  rugby: {
    fixtures: true,
    results: true,
    news: true,
    gallery: true,
    sponsors: true,
    forms: true,
    gaaScoring: false,
    standardScoring: true, // Tries, conversions, penalties = points
    setScoring: false,
    timeScoring: false,
    strokeScoring: false,
    leaderboard: true,
    handicaps: false,
    routes: false,
    personalBests: false,
    courtBooking: false,
    multipleTeams: true,
    individualMembers: false,
  },

  athletics: {
    fixtures: true,
    results: true,
    news: true,
    gallery: true,
    sponsors: true,
    forms: true,
    gaaScoring: false,
    standardScoring: false,
    setScoring: false,
    timeScoring: true,
    strokeScoring: false,
    leaderboard: true,
    handicaps: false,
    routes: false,
    personalBests: true,
    courtBooking: false,
    multipleTeams: false,
    individualMembers: true,
  },

  golf: {
    fixtures: true,
    results: true,
    news: true,
    gallery: true,
    sponsors: true,
    forms: true,
    gaaScoring: false,
    standardScoring: false,
    setScoring: false,
    timeScoring: false,
    strokeScoring: true,
    leaderboard: true,
    handicaps: true,
    routes: false,
    personalBests: false,
    courtBooking: false,
    multipleTeams: false,
    individualMembers: true,
  },

  tennis: {
    fixtures: true,
    results: true,
    news: true,
    gallery: true,
    sponsors: true,
    forms: true,
    gaaScoring: false,
    standardScoring: false,
    setScoring: true,
    timeScoring: false,
    strokeScoring: false,
    leaderboard: true,
    handicaps: false,
    routes: false,
    personalBests: false,
    courtBooking: true,
    multipleTeams: false,
    individualMembers: true,
  },

  cycling: {
    fixtures: true,
    results: true,
    news: true,
    gallery: true,
    sponsors: true,
    forms: true,
    gaaScoring: false,
    standardScoring: false,
    setScoring: false,
    timeScoring: true,
    strokeScoring: false,
    leaderboard: true,
    handicaps: false,
    routes: true,
    personalBests: true,
    courtBooking: false,
    multipleTeams: false,
    individualMembers: true,
  },
};

// Default module configuration per sport
export const SPORT_MODULE_DEFAULTS: Record<SportType, ModuleDefaults> = {
  gaa: {
    inbox: true,
    forms: true,
    sponsors: true,
    fixtures: true,
    posts: true,
    media: true,
  },
  football: {
    inbox: true,
    forms: true,
    sponsors: true,
    fixtures: true,
    posts: true,
    media: true,
  },
  rugby: {
    inbox: true,
    forms: true,
    sponsors: true,
    fixtures: true,
    posts: true,
    media: true,
  },
  athletics: {
    inbox: true,
    forms: true,
    sponsors: true,
    fixtures: true,
    posts: true,
    media: true,
  },
  golf: {
    inbox: true,
    forms: true,
    sponsors: true,
    fixtures: true,
    posts: true,
    media: true,
  },
  tennis: {
    inbox: true,
    forms: true,
    sponsors: true,
    fixtures: true,
    posts: true,
    media: true,
  },
  cycling: {
    inbox: true,
    forms: true,
    sponsors: true,
    fixtures: true,
    posts: true,
    media: true,
  },
};

// Helper functions

export function getSportFeatures(sportId: SportType | string): FeatureGates {
  return SPORT_FEATURES[normalizeSportId(sportId)] || SPORT_FEATURES.gaa;
}

export function hasFeature(sportId: SportType | string, feature: keyof FeatureGates): boolean {
  const features = getSportFeatures(sportId);
  return features[feature] ?? false;
}

export function getScoringType(sportId: SportType | string): 'GAA' | 'standard' | 'sets' | 'time' | 'stroke' {
  const features = getSportFeatures(sportId);

  if (features.gaaScoring) return 'GAA';
  if (features.setScoring) return 'sets';
  if (features.timeScoring) return 'time';
  if (features.strokeScoring) return 'stroke';
  return 'standard';
}

export function getModuleDefaults(sportId: SportType | string): ModuleDefaults {
  return SPORT_MODULE_DEFAULTS[normalizeSportId(sportId)] || SPORT_MODULE_DEFAULTS.gaa;
}

// Check if a club can use a specific feature
export function canAccessFeature(clubType: SportType | string, feature: keyof FeatureGates): boolean {
  return hasFeature(clubType, feature);
}

// Get list of enabled features for a sport (useful for display)
export function getEnabledFeatures(sportId: SportType | string): (keyof FeatureGates)[] {
  const features = getSportFeatures(sportId);
  return (Object.keys(features) as (keyof FeatureGates)[]).filter((key) => features[key]);
}
