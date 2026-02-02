// Utility functions

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

// Irish counties for GAA
export const IRISH_COUNTIES = [
  'Antrim', 'Armagh', 'Carlow', 'Cavan', 'Clare', 'Cork', 'Derry', 'Donegal',
  'Down', 'Dublin', 'Fermanagh', 'Galway', 'Kerry', 'Kildare', 'Kilkenny',
  'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath',
  'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Tyrone',
  'Waterford', 'Westmeath', 'Wexford', 'Wicklow', 'London', 'New York'
] as const;

export type IrishCounty = typeof IRISH_COUNTIES[number];

// Club roles
export const CLUB_ROLES = {
  admin: { label: 'Admin', description: 'Full access to all club settings' },
  pro: { label: 'PRO', description: 'Create and publish content, manage social media' },
  treasurer: { label: 'Treasurer', description: 'View financial reports and audit logs' },
  editor: { label: 'Editor', description: 'Create and edit content drafts' },
  viewer: { label: 'Viewer', description: 'View-only access to admin dashboard' }
} as const;

export type ClubRole = keyof typeof CLUB_ROLES;

// Templates
export const TEMPLATES = {
  classic: {
    name: 'Classic Club',
    description: 'The perfect all-rounder with hero, fixtures, news, and sponsors.'
  },
  matchday: {
    name: 'Matchday Focus',
    description: 'Put the game at the centre with match highlights and results.'
  },
  community: {
    name: 'Community First',
    description: 'Celebrate your community with events and volunteer highlights.'
  }
} as const;

export type TemplateName = keyof typeof TEMPLATES;
