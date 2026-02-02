// Template System - Core Types and Definitions
import type { SportType } from '../sports';

export type BlockType =
  | 'hero'
  | 'next-fixture'
  | 'latest-news'
  | 'latest-result'
  | 'sponsors'
  | 'results-ticker'
  | 'events'
  | 'notices'
  | 'volunteer-spotlight'
  | 'community-feed'
  | 'photo-gallery'
  | 'contact'
  | 'highlight-cards'
  | 'leaderboard'
  | 'competitions'
  | 'routes'
  | 'club-records';

export interface BlockConfig {
  id: string;
  type: BlockType;
  required: boolean;
  locked: boolean; // Cannot be removed or repositioned
  visible: boolean;
  order: number;
  settings: Record<string, unknown>;
}

export type TemplateId =
  // GAA templates
  | 'gaa-classic'
  | 'gaa-matchday'
  | 'gaa-community'
  // Football templates
  | 'football-classic'
  | 'football-matchday'
  | 'football-community'
  // Rugby templates
  | 'rugby-classic'
  | 'rugby-matchday'
  | 'rugby-community'
  // Athletics templates
  | 'athletics-classic'
  | 'athletics-performance'
  | 'athletics-community'
  // Golf templates
  | 'golf-classic'
  | 'golf-competition'
  | 'golf-social'
  // Tennis templates
  | 'tennis-classic'
  | 'tennis-competition'
  | 'tennis-social'
  // Cycling templates
  | 'cycling-classic'
  | 'cycling-routes'
  | 'cycling-community';

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  sport: SportType;
  status: 'active' | 'preview'; // active = can be used, preview = coming soon
  blocks: BlockConfig[];
  constraints: TemplateConstraints;
}

export interface TemplateConstraints {
  hero: {
    titleMaxLength: number;
    taglineMaxLength: number;
  };
  notices: {
    maxItems: number;
  };
  news: {
    maxItems: number;
  };
  highlightCards: {
    count: number;
  };
}

export interface HomepageConfig {
  id: string;
  club_id: string;
  config: {
    blocks: BlockConfig[];
    overrides: Record<string, unknown>;
  };
  version: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// Default constraints shared across templates
export const DEFAULT_CONSTRAINTS: TemplateConstraints = {
  hero: {
    titleMaxLength: 60,
    taglineMaxLength: 120,
  },
  notices: {
    maxItems: 6,
  },
  news: {
    maxItems: 6,
  },
  highlightCards: {
    count: 3,
  },
};

// Validate content against constraints
export function validateBlockContent(
  blockType: BlockType,
  content: Record<string, unknown>,
  constraints: TemplateConstraints
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (blockType === 'hero') {
    const title = content.title as string | undefined;
    const tagline = content.tagline as string | undefined;

    if (title && title.length > constraints.hero.titleMaxLength) {
      errors.push(`Title must be ${constraints.hero.titleMaxLength} characters or less`);
    }
    if (tagline && tagline.length > constraints.hero.taglineMaxLength) {
      errors.push(`Tagline must be ${constraints.hero.taglineMaxLength} characters or less`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get default config for a template
export function getDefaultConfig(templateId: TemplateId): BlockConfig[] {
  const template = TEMPLATES[templateId];
  if (template) {
    return template.blocks;
  }
  // Fallback to GAA classic
  return getClassicBlocks();
}

// Classic Club template blocks (used as base for many templates)
function getClassicBlocks(): BlockConfig[] {
  return [
    {
      id: 'hero',
      type: 'hero',
      required: true,
      locked: true,
      visible: true,
      order: 0,
      settings: {},
    },
    {
      id: 'next-fixture',
      type: 'next-fixture',
      required: true,
      locked: false,
      visible: true,
      order: 1,
      settings: {},
    },
    {
      id: 'latest-news',
      type: 'latest-news',
      required: true,
      locked: false,
      visible: true,
      order: 2,
      settings: { maxItems: 3 },
    },
    {
      id: 'latest-result',
      type: 'latest-result',
      required: false,
      locked: false,
      visible: true,
      order: 3,
      settings: {},
    },
    {
      id: 'sponsors',
      type: 'sponsors',
      required: false,
      locked: false,
      visible: true,
      order: 4,
      settings: {},
    },
    {
      id: 'contact',
      type: 'contact',
      required: true,
      locked: false,
      visible: true,
      order: 5,
      settings: {},
    },
  ];
}

// Matchday Focus template blocks
function getMatchdayBlocks(): BlockConfig[] {
  return [
    {
      id: 'hero',
      type: 'hero',
      required: true,
      locked: true,
      visible: true,
      order: 0,
      settings: {},
    },
    {
      id: 'results-ticker',
      type: 'results-ticker',
      required: true,
      locked: true,
      visible: true,
      order: 1,
      settings: {},
    },
    {
      id: 'next-fixture',
      type: 'next-fixture',
      required: true,
      locked: false,
      visible: true,
      order: 2,
      settings: {},
    },
    {
      id: 'notices',
      type: 'notices',
      required: false,
      locked: false,
      visible: true,
      order: 3,
      settings: { maxItems: 6 },
    },
    {
      id: 'latest-news',
      type: 'latest-news',
      required: false,
      locked: false,
      visible: true,
      order: 4,
      settings: { maxItems: 3 },
    },
    {
      id: 'sponsors',
      type: 'sponsors',
      required: false,
      locked: false,
      visible: true,
      order: 5,
      settings: {},
    },
    {
      id: 'contact',
      type: 'contact',
      required: true,
      locked: false,
      visible: true,
      order: 6,
      settings: {},
    },
  ];
}

// Community First template blocks
function getCommunityBlocks(): BlockConfig[] {
  return [
    {
      id: 'hero',
      type: 'hero',
      required: true,
      locked: true,
      visible: true,
      order: 0,
      settings: {},
    },
    {
      id: 'highlight-cards',
      type: 'highlight-cards',
      required: true,
      locked: false,
      visible: true,
      order: 1,
      settings: { count: 3 },
    },
    {
      id: 'latest-news',
      type: 'latest-news',
      required: true,
      locked: false,
      visible: true,
      order: 2,
      settings: { maxItems: 3 },
    },
    {
      id: 'next-fixture',
      type: 'next-fixture',
      required: false,
      locked: false,
      visible: true,
      order: 3,
      settings: {},
    },
    {
      id: 'latest-result',
      type: 'latest-result',
      required: false,
      locked: false,
      visible: true,
      order: 4,
      settings: {},
    },
    {
      id: 'volunteer-spotlight',
      type: 'volunteer-spotlight',
      required: true,
      locked: false,
      visible: true,
      order: 5,
      settings: {},
    },
    {
      id: 'sponsors',
      type: 'sponsors',
      required: false,
      locked: false,
      visible: true,
      order: 6,
      settings: {},
    },
    {
      id: 'contact',
      type: 'contact',
      required: true,
      locked: false,
      visible: true,
      order: 7,
      settings: {},
    },
  ];
}

// Athletics performance template blocks
function getPerformanceBlocks(): BlockConfig[] {
  return [
    {
      id: 'hero',
      type: 'hero',
      required: true,
      locked: true,
      visible: true,
      order: 0,
      settings: {},
    },
    {
      id: 'club-records',
      type: 'club-records',
      required: true,
      locked: false,
      visible: true,
      order: 1,
      settings: {},
    },
    {
      id: 'events',
      type: 'events',
      required: true,
      locked: false,
      visible: true,
      order: 2,
      settings: {},
    },
    {
      id: 'latest-news',
      type: 'latest-news',
      required: true,
      locked: false,
      visible: true,
      order: 3,
      settings: { maxItems: 3 },
    },
    {
      id: 'sponsors',
      type: 'sponsors',
      required: false,
      locked: false,
      visible: true,
      order: 4,
      settings: {},
    },
    {
      id: 'contact',
      type: 'contact',
      required: true,
      locked: false,
      visible: true,
      order: 5,
      settings: {},
    },
  ];
}

// Golf competition template blocks
function getCompetitionBlocks(): BlockConfig[] {
  return [
    {
      id: 'hero',
      type: 'hero',
      required: true,
      locked: true,
      visible: true,
      order: 0,
      settings: {},
    },
    {
      id: 'competitions',
      type: 'competitions',
      required: true,
      locked: false,
      visible: true,
      order: 1,
      settings: {},
    },
    {
      id: 'leaderboard',
      type: 'leaderboard',
      required: true,
      locked: false,
      visible: true,
      order: 2,
      settings: {},
    },
    {
      id: 'latest-news',
      type: 'latest-news',
      required: true,
      locked: false,
      visible: true,
      order: 3,
      settings: { maxItems: 3 },
    },
    {
      id: 'sponsors',
      type: 'sponsors',
      required: false,
      locked: false,
      visible: true,
      order: 4,
      settings: {},
    },
    {
      id: 'contact',
      type: 'contact',
      required: true,
      locked: false,
      visible: true,
      order: 5,
      settings: {},
    },
  ];
}

// Social/club template blocks (golf, tennis)
function getSocialBlocks(): BlockConfig[] {
  return [
    {
      id: 'hero',
      type: 'hero',
      required: true,
      locked: true,
      visible: true,
      order: 0,
      settings: {},
    },
    {
      id: 'events',
      type: 'events',
      required: true,
      locked: false,
      visible: true,
      order: 1,
      settings: {},
    },
    {
      id: 'latest-news',
      type: 'latest-news',
      required: true,
      locked: false,
      visible: true,
      order: 2,
      settings: { maxItems: 3 },
    },
    {
      id: 'photo-gallery',
      type: 'photo-gallery',
      required: false,
      locked: false,
      visible: true,
      order: 3,
      settings: {},
    },
    {
      id: 'volunteer-spotlight',
      type: 'volunteer-spotlight',
      required: false,
      locked: false,
      visible: true,
      order: 4,
      settings: {},
    },
    {
      id: 'sponsors',
      type: 'sponsors',
      required: false,
      locked: false,
      visible: true,
      order: 5,
      settings: {},
    },
    {
      id: 'contact',
      type: 'contact',
      required: true,
      locked: false,
      visible: true,
      order: 6,
      settings: {},
    },
  ];
}

// Cycling routes template blocks
function getRoutesBlocks(): BlockConfig[] {
  return [
    {
      id: 'hero',
      type: 'hero',
      required: true,
      locked: true,
      visible: true,
      order: 0,
      settings: {},
    },
    {
      id: 'routes',
      type: 'routes',
      required: true,
      locked: false,
      visible: true,
      order: 1,
      settings: {},
    },
    {
      id: 'events',
      type: 'events',
      required: true,
      locked: false,
      visible: true,
      order: 2,
      settings: {},
    },
    {
      id: 'latest-news',
      type: 'latest-news',
      required: true,
      locked: false,
      visible: true,
      order: 3,
      settings: { maxItems: 3 },
    },
    {
      id: 'sponsors',
      type: 'sponsors',
      required: false,
      locked: false,
      visible: true,
      order: 4,
      settings: {},
    },
    {
      id: 'contact',
      type: 'contact',
      required: true,
      locked: false,
      visible: true,
      order: 5,
      settings: {},
    },
  ];
}

// Template metadata - 21 templates (3 per sport)
export const TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  // === GAA Templates (Active) ===
  'gaa-classic': {
    id: 'gaa-classic',
    name: 'Classic Club',
    description: 'The perfect all-rounder with hero, fixtures, news, and sponsors.',
    sport: 'gaa',
    status: 'active',
    blocks: getClassicBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'gaa-matchday': {
    id: 'gaa-matchday',
    name: 'Matchday Focus',
    description: 'Put the game at the centre with match highlights and results.',
    sport: 'gaa',
    status: 'active',
    blocks: getMatchdayBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'gaa-community': {
    id: 'gaa-community',
    name: 'Community First',
    description: 'Celebrate your community with events and volunteer highlights.',
    sport: 'gaa',
    status: 'active',
    blocks: getCommunityBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },

  // === Football Templates (Preview) ===
  'football-classic': {
    id: 'football-classic',
    name: 'Classic Club',
    description: 'A clean, professional layout for football clubs of all sizes.',
    sport: 'football',
    status: 'preview',
    blocks: getClassicBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'football-matchday': {
    id: 'football-matchday',
    name: 'Matchday Focus',
    description: 'Results and fixtures front and centre for match-focused clubs.',
    sport: 'football',
    status: 'preview',
    blocks: getMatchdayBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'football-community': {
    id: 'football-community',
    name: 'Community First',
    description: 'Showcase grassroots involvement and community spirit.',
    sport: 'football',
    status: 'preview',
    blocks: getCommunityBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },

  // === Rugby Templates (Preview) ===
  'rugby-classic': {
    id: 'rugby-classic',
    name: 'Classic Club',
    description: 'A professional layout for rugby clubs from minis to seniors.',
    sport: 'rugby',
    status: 'preview',
    blocks: getClassicBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'rugby-matchday': {
    id: 'rugby-matchday',
    name: 'Matchday Focus',
    description: 'Match reports and results take centre stage.',
    sport: 'rugby',
    status: 'preview',
    blocks: getMatchdayBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'rugby-community': {
    id: 'rugby-community',
    name: 'Community First',
    description: 'Highlight your club culture and community involvement.',
    sport: 'rugby',
    status: 'preview',
    blocks: getCommunityBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },

  // === Athletics Templates (Preview) ===
  'athletics-classic': {
    id: 'athletics-classic',
    name: 'Classic Club',
    description: 'A versatile layout for athletics and running clubs.',
    sport: 'athletics',
    status: 'preview',
    blocks: getClassicBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'athletics-performance': {
    id: 'athletics-performance',
    name: 'Performance Focus',
    description: 'Showcase PBs, club records, and race results prominently.',
    sport: 'athletics',
    status: 'preview',
    blocks: getPerformanceBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'athletics-community': {
    id: 'athletics-community',
    name: 'Community First',
    description: 'Perfect for parkrun groups and social running clubs.',
    sport: 'athletics',
    status: 'preview',
    blocks: getCommunityBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },

  // === Golf Templates (Preview) ===
  'golf-classic': {
    id: 'golf-classic',
    name: 'Classic Club',
    description: 'An elegant layout for golf clubs and societies.',
    sport: 'golf',
    status: 'preview',
    blocks: getClassicBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'golf-competition': {
    id: 'golf-competition',
    name: 'Competition Focus',
    description: 'Competitions and leaderboards front and centre.',
    sport: 'golf',
    status: 'preview',
    blocks: getCompetitionBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'golf-social': {
    id: 'golf-social',
    name: 'Social Club',
    description: 'Perfect for societies and social golf groups.',
    sport: 'golf',
    status: 'preview',
    blocks: getSocialBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },

  // === Tennis Templates (Preview) ===
  'tennis-classic': {
    id: 'tennis-classic',
    name: 'Classic Club',
    description: 'A clean layout for tennis clubs of all sizes.',
    sport: 'tennis',
    status: 'preview',
    blocks: getClassicBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'tennis-competition': {
    id: 'tennis-competition',
    name: 'Competition Focus',
    description: 'Leagues, ladders, and tournament results prominently displayed.',
    sport: 'tennis',
    status: 'preview',
    blocks: getCompetitionBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'tennis-social': {
    id: 'tennis-social',
    name: 'Social Club',
    description: 'Perfect for social tennis and mixed clubs.',
    sport: 'tennis',
    status: 'preview',
    blocks: getSocialBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },

  // === Cycling Templates (Preview) ===
  'cycling-classic': {
    id: 'cycling-classic',
    name: 'Classic Club',
    description: 'A versatile layout for cycling clubs and groups.',
    sport: 'cycling',
    status: 'preview',
    blocks: getClassicBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'cycling-routes': {
    id: 'cycling-routes',
    name: 'Routes Focus',
    description: 'Showcase your club routes, rides, and events.',
    sport: 'cycling',
    status: 'preview',
    blocks: getRoutesBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  'cycling-community': {
    id: 'cycling-community',
    name: 'Community First',
    description: 'Perfect for social cycling and sportive groups.',
    sport: 'cycling',
    status: 'preview',
    blocks: getCommunityBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
};

// Get template by ID
export function getTemplate(templateId: string): TemplateDefinition | null {
  return TEMPLATES[templateId as TemplateId] || null;
}

// Get all templates
export function getAllTemplates(): TemplateDefinition[] {
  return Object.values(TEMPLATES);
}

// Get templates for a specific sport
export function getTemplatesForSport(sport: SportType): TemplateDefinition[] {
  return Object.values(TEMPLATES).filter(t => t.sport === sport);
}

// Get active templates (excludes preview)
export function getActiveTemplates(): TemplateDefinition[] {
  return Object.values(TEMPLATES).filter(t => t.status === 'active');
}

// Get active templates for a specific sport
export function getActiveTemplatesForSport(sport: SportType): TemplateDefinition[] {
  return Object.values(TEMPLATES).filter(t => t.sport === sport && t.status === 'active');
}

// Legacy support: map old template IDs to new ones
const LEGACY_TEMPLATE_MAP: Record<string, TemplateId> = {
  'classic': 'gaa-classic',
  'matchday': 'gaa-matchday',
  'community': 'gaa-community',
};

export function resolveTemplateId(templateId: string): TemplateId {
  return LEGACY_TEMPLATE_MAP[templateId] || templateId as TemplateId;
}
