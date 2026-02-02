// Sports Configuration System
// Defines all supported sports and their configurations

export type SportType = 'gaa' | 'football' | 'rugby' | 'athletics' | 'golf' | 'tennis' | 'cycling';

export type SportStatus = 'ready' | 'coming_soon';

export interface SportTerminology {
  fixture: string;
  result: string;
  team: string;
  venue: string;
  competition: string;
  member: string;
}

export interface SportFeatureList {
  title: string;
  description: string;
  icon: string;
}

export interface SportConfig {
  id: SportType;
  name: string;
  namePlural: string;
  slug: string;
  status: SportStatus;
  description: string;
  tagline: string;
  longDescription: string;
  primaryColor: string;
  secondaryColor: string;
  icon: string;
  heroImage: string;
  features: SportFeatureList[];
  terminology: SportTerminology;
  templateIds: string[];
}

// Sport configurations for all supported sports
export const SPORTS: Record<SportType, SportConfig> = {
  gaa: {
    id: 'gaa',
    name: 'GAA',
    namePlural: 'GAA Clubs',
    slug: 'gaa',
    status: 'ready',
    description: 'All-in-one website and app platform for GAA clubs.',
    tagline: 'Built for the way GAA clubs actually work',
    longDescription: 'From fixtures and results to news and community updates, Clubify gives your GAA club everything it needs to stay connected with members and supporters.',
    primaryColor: '#006838',
    secondaryColor: '#FFB300',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 2C12 2 8 6 8 12s4 10 4 10" stroke="currentColor" stroke-width="2"/><path d="M12 2c0 0 4 4 4 10s-4 10-4 10" stroke="currentColor" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"/></svg>`,
    heroImage: '/images/sports/gaa-hero.jpg',
    features: [
      { title: 'Fixtures & Results', description: 'Track matches with GAA-specific scoring (goals and points)', icon: 'calendar' },
      { title: 'News & Updates', description: 'Keep members informed with club news and announcements', icon: 'newspaper' },
      { title: 'Team Management', description: 'Organize teams across all age groups and codes', icon: 'users' },
      { title: 'Social Publishing', description: 'Share updates to Facebook, Twitter, and Instagram automatically', icon: 'share' },
      { title: 'Sponsor Showcase', description: 'Highlight your sponsors with dedicated profiles and placements', icon: 'star' },
      { title: 'Mobile App', description: 'Everything your website can do, available in a native mobile app', icon: 'smartphone' },
    ],
    terminology: {
      fixture: 'Match',
      result: 'Result',
      team: 'Team',
      venue: 'Pitch',
      competition: 'Championship',
      member: 'Member',
    },
    templateIds: ['gaa-classic', 'gaa-matchday', 'gaa-community'],
  },

  football: {
    id: 'football',
    name: 'Football',
    namePlural: 'Football Clubs',
    slug: 'football',
    status: 'coming_soon',
    description: 'Professional websites for football clubs of all sizes.',
    tagline: 'From grassroots to glory',
    longDescription: 'Whether you\'re a Sunday league team or a semi-professional club, Clubify provides the tools to manage fixtures, share news, and engage your supporters.',
    primaryColor: '#1e40af',
    secondaryColor: '#fbbf24',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 2l2.5 4.5 5 .5-3.5 3.5 1 5-5-2.5-5 2.5 1-5L4.5 7l5-.5L12 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    heroImage: '/images/sports/football-hero.jpg',
    features: [
      { title: 'League Tables', description: 'Automatic league standings and statistics tracking', icon: 'table' },
      { title: 'Fixtures & Results', description: 'Match scheduling with standard football scoring', icon: 'calendar' },
      { title: 'Squad Management', description: 'Manage players, stats, and team sheets', icon: 'users' },
      { title: 'News & Media', description: 'Share match reports, photos, and club updates', icon: 'newspaper' },
      { title: 'Sponsor Integration', description: 'Showcase kit sponsors, stadium partners, and more', icon: 'star' },
      { title: 'Mobile App', description: 'Native app with push notifications for match days', icon: 'smartphone' },
    ],
    terminology: {
      fixture: 'Match',
      result: 'Score',
      team: 'Team',
      venue: 'Ground',
      competition: 'League',
      member: 'Player',
    },
    templateIds: ['football-classic', 'football-matchday', 'football-community'],
  },

  rugby: {
    id: 'rugby',
    name: 'Rugby',
    namePlural: 'Rugby Clubs',
    slug: 'rugby',
    status: 'coming_soon',
    description: 'Powerful websites for rugby clubs and unions.',
    tagline: 'Unite your rugby community',
    longDescription: 'From minis to seniors, manage your entire rugby club with fixtures, results, team news, and community engagement tools built for the sport.',
    primaryColor: '#166534',
    secondaryColor: '#f59e0b',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="12" rx="8" ry="5" stroke="currentColor" stroke-width="2" transform="rotate(45 12 12)"/><line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" stroke-width="2"/><line x1="10" y1="6" x2="18" y2="14" stroke="currentColor" stroke-width="1.5"/><line x1="6" y1="10" x2="14" y2="18" stroke="currentColor" stroke-width="1.5"/></svg>`,
    heroImage: '/images/sports/rugby-hero.jpg',
    features: [
      { title: 'Fixtures & Results', description: 'Track tries, conversions, and penalties', icon: 'calendar' },
      { title: 'Age Grade Teams', description: 'Manage minis, youth, colts, and senior teams', icon: 'users' },
      { title: 'Club News', description: 'Match reports, training updates, and announcements', icon: 'newspaper' },
      { title: 'Social Media', description: 'Automatic posting to your club social channels', icon: 'share' },
      { title: 'Sponsors', description: 'Showcase shirt sponsors and club partners', icon: 'star' },
      { title: 'Mobile App', description: 'Keep supporters connected on match days', icon: 'smartphone' },
    ],
    terminology: {
      fixture: 'Match',
      result: 'Score',
      team: 'Squad',
      venue: 'Ground',
      competition: 'League',
      member: 'Player',
    },
    templateIds: ['rugby-classic', 'rugby-matchday', 'rugby-community'],
  },

  athletics: {
    id: 'athletics',
    name: 'Athletics',
    namePlural: 'Athletics Clubs',
    slug: 'athletics',
    status: 'coming_soon',
    description: 'Modern websites for athletics and running clubs.',
    tagline: 'Track, field, and beyond',
    longDescription: 'From track and field events to cross country and road running, give your athletics club the digital presence it deserves.',
    primaryColor: '#dc2626',
    secondaryColor: '#fcd34d',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="4" r="2" stroke="currentColor" stroke-width="2"/><path d="M15 8l-3 4-2-2-4 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 10l-3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 12l4 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 16l-2 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    heroImage: '/images/sports/athletics-hero.jpg',
    features: [
      { title: 'Events Calendar', description: 'Track meets, races, and training sessions', icon: 'calendar' },
      { title: 'Results & PBs', description: 'Record times, distances, and personal bests', icon: 'trophy' },
      { title: 'Leaderboards', description: 'Club records and age-group rankings', icon: 'chart' },
      { title: 'Club News', description: 'Race reports and athlete achievements', icon: 'newspaper' },
      { title: 'Training Groups', description: 'Organize by ability and event type', icon: 'users' },
      { title: 'Mobile App', description: 'Event info and results on the go', icon: 'smartphone' },
    ],
    terminology: {
      fixture: 'Event',
      result: 'Time/Distance',
      team: 'Club',
      venue: 'Track',
      competition: 'Championship',
      member: 'Athlete',
    },
    templateIds: ['athletics-classic', 'athletics-events', 'athletics-community'],
  },

  golf: {
    id: 'golf',
    name: 'Golf',
    namePlural: 'Golf Clubs',
    slug: 'golf',
    status: 'coming_soon',
    description: 'Elegant websites for golf clubs and societies.',
    tagline: 'Elevate your club experience',
    longDescription: 'From competition results to handicap tracking, create a digital home for your golf club that members will love.',
    primaryColor: '#15803d',
    secondaryColor: '#a3e635',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="18" r="3" stroke="currentColor" stroke-width="2"/><line x1="6" y1="4" x2="6" y2="16" stroke="currentColor" stroke-width="2"/><path d="M6 4l8 4-8 4" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    heroImage: '/images/sports/golf-hero.jpg',
    features: [
      { title: 'Competitions', description: 'Schedule and manage club competitions', icon: 'trophy' },
      { title: 'Leaderboards', description: 'Live scoring and results tables', icon: 'chart' },
      { title: 'Handicap Display', description: 'Member handicap information', icon: 'user' },
      { title: 'Course Info', description: 'Hole-by-hole course details', icon: 'map' },
      { title: 'Club News', description: 'Competition results and announcements', icon: 'newspaper' },
      { title: 'Mobile App', description: 'Competition info on the course', icon: 'smartphone' },
    ],
    terminology: {
      fixture: 'Competition',
      result: 'Score',
      team: 'Club',
      venue: 'Course',
      competition: 'Tournament',
      member: 'Member',
    },
    templateIds: ['golf-classic', 'golf-competition', 'golf-social'],
  },

  tennis: {
    id: 'tennis',
    name: 'Tennis',
    namePlural: 'Tennis Clubs',
    slug: 'tennis',
    status: 'coming_soon',
    description: 'Smart websites for tennis clubs and courts.',
    tagline: 'Game, set, connected',
    longDescription: 'Manage leagues, tournaments, and club news with a modern website that keeps your tennis community engaged.',
    primaryColor: '#ca8a04',
    secondaryColor: '#84cc16',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 3c-2 3-2 6 0 9s2 6 0 9" stroke="currentColor" stroke-width="2"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2"/></svg>`,
    heroImage: '/images/sports/tennis-hero.jpg',
    features: [
      { title: 'Match Scheduling', description: 'League and tournament fixtures', icon: 'calendar' },
      { title: 'Results & Rankings', description: 'Track match results and player rankings', icon: 'trophy' },
      { title: 'Club Leagues', description: 'Internal leagues and ladders', icon: 'chart' },
      { title: 'Club News', description: 'Tournament updates and announcements', icon: 'newspaper' },
      { title: 'Social Events', description: 'Club socials and coaching sessions', icon: 'users' },
      { title: 'Mobile App', description: 'Match info and court availability', icon: 'smartphone' },
    ],
    terminology: {
      fixture: 'Match',
      result: 'Score',
      team: 'Player',
      venue: 'Court',
      competition: 'Tournament',
      member: 'Player',
    },
    templateIds: ['tennis-classic', 'tennis-tournament', 'tennis-social'],
  },

  cycling: {
    id: 'cycling',
    name: 'Cycling',
    namePlural: 'Cycling Clubs',
    slug: 'cycling',
    status: 'coming_soon',
    description: 'Dynamic websites for cycling clubs and groups.',
    tagline: 'Ride together, stay connected',
    longDescription: 'From club spins to racing, build a community hub for your cycling club with routes, events, and rider news.',
    primaryColor: '#0891b2',
    secondaryColor: '#f97316',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="17" r="4" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="17" r="4" stroke="currentColor" stroke-width="2"/><path d="M6 17l4-8h4l4 8" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="7" r="2" stroke="currentColor" stroke-width="2"/></svg>`,
    heroImage: '/images/sports/cycling-hero.jpg',
    features: [
      { title: 'Club Spins', description: 'Schedule regular group rides and events', icon: 'calendar' },
      { title: 'Routes', description: 'Share club routes with maps and elevation', icon: 'map' },
      { title: 'Race Results', description: 'Track racing results and achievements', icon: 'trophy' },
      { title: 'Club News', description: 'Ride reports and cycling news', icon: 'newspaper' },
      { title: 'Group Rides', description: 'Organize by pace and ability', icon: 'users' },
      { title: 'Mobile App', description: 'Route info and ride updates on the go', icon: 'smartphone' },
    ],
    terminology: {
      fixture: 'Event',
      result: 'Time',
      team: 'Club',
      venue: 'Route',
      competition: 'Race',
      member: 'Rider',
    },
    templateIds: ['cycling-classic', 'cycling-routes', 'cycling-community'],
  },
};

// Helper functions

export function getSport(id: SportType): SportConfig {
  return SPORTS[id];
}

export function getSportBySlug(slug: string): SportConfig | null {
  return Object.values(SPORTS).find((s) => s.slug === slug) || null;
}

export function getAllSports(): SportConfig[] {
  return Object.values(SPORTS);
}

export function getReadySports(): SportConfig[] {
  return Object.values(SPORTS).filter((s) => s.status === 'ready');
}

export function getComingSoonSports(): SportConfig[] {
  return Object.values(SPORTS).filter((s) => s.status === 'coming_soon');
}

export function isReady(sportId: SportType): boolean {
  return SPORTS[sportId]?.status === 'ready';
}

export function getSportTerminology(sportId: SportType): SportTerminology {
  return SPORTS[sportId]?.terminology || SPORTS.gaa.terminology;
}

// Array of sport types for iteration
export const SPORT_TYPES: SportType[] = ['gaa', 'football', 'rugby', 'athletics', 'golf', 'tennis', 'cycling'];
