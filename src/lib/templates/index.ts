// Template System - Core Types and Definitions

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
  | 'highlight-cards';

export interface BlockConfig {
  id: string;
  type: BlockType;
  required: boolean;
  locked: boolean; // Cannot be removed or repositioned
  visible: boolean;
  order: number;
  settings: Record<string, unknown>;
}

export interface TemplateDefinition {
  id: 'classic' | 'matchday' | 'community';
  name: string;
  description: string;
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
export function getDefaultConfig(templateId: 'classic' | 'matchday' | 'community'): BlockConfig[] {
  switch (templateId) {
    case 'classic':
      return getClassicBlocks();
    case 'matchday':
      return getMatchdayBlocks();
    case 'community':
      return getCommunityBlocks();
    default:
      return getClassicBlocks();
  }
}

// Classic Club template blocks
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

// Template metadata
export const TEMPLATES: Record<string, TemplateDefinition> = {
  classic: {
    id: 'classic',
    name: 'Classic Club',
    description: 'The perfect all-rounder with hero, fixtures, news, and sponsors.',
    blocks: getClassicBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  matchday: {
    id: 'matchday',
    name: 'Matchday Focus',
    description: 'Put the game at the centre with match highlights and results.',
    blocks: getMatchdayBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
  community: {
    id: 'community',
    name: 'Community First',
    description: 'Celebrate your community with events and volunteer highlights.',
    blocks: getCommunityBlocks(),
    constraints: DEFAULT_CONSTRAINTS,
  },
};

// Get template by ID
export function getTemplate(templateId: string): TemplateDefinition | null {
  return TEMPLATES[templateId] || null;
}
