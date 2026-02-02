/**
 * API Middleware Utilities
 * Reduces boilerplate in API endpoints by providing common patterns for:
 * - Authentication
 * - Permission checking
 * - Error handling
 * - JSON responses
 */

import type { APIContext, APIRoute } from 'astro';
import { DatabaseService, type User, type Club, type ClubMember } from '../db';
import { getAuthContext } from '../auth';
import { hasPermission, type Permission, type Role } from '../permissions';

// Standard JSON response helpers
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function errorResponse(error: string, status: number, details?: unknown): Response {
  return jsonResponse({ error, ...(details ? { details } : {}) }, status);
}

export function successResponse(data?: unknown): Response {
  return jsonResponse({ success: true, ...(data || {}) });
}

// Context passed to middleware-wrapped handlers
export interface ApiContext {
  db: DatabaseService;
  user: User;
  request: Request;
  params: Record<string, string | undefined>;
  url: URL;
}

export interface ClubApiContext extends ApiContext {
  club: Club;
  member: ClubMember;
}

export interface SuperAdminContext extends ApiContext {
  isSuperAdmin: true;
}

type ApiHandler<T extends ApiContext = ApiContext> = (ctx: T) => Promise<Response>;

/**
 * Wraps an API handler with authentication check
 */
export function withAuth(handler: ApiHandler<ApiContext>): APIRoute {
  return async (context: APIContext): Promise<Response> => {
    try {
      if (!context.locals.runtime.env.DB) {
        return errorResponse('Database not configured', 500);
      }

      const db = new DatabaseService(context.locals.runtime.env.DB);
      const { user } = await getAuthContext(context.cookies, db);

      if (!user) {
        return errorResponse('Unauthorized', 401);
      }

      return handler({
        db,
        user,
        request: context.request,
        params: context.params as Record<string, string | undefined>,
        url: new URL(context.request.url),
      });
    } catch (error) {
      console.error('API error:', error);
      return errorResponse('Internal server error', 500);
    }
  };
}

/**
 * Wraps an API handler with club membership and optional permission check
 */
export function withClubAuth(permission?: Permission): (handler: ApiHandler<ClubApiContext>) => APIRoute {
  return (handler: ApiHandler<ClubApiContext>): APIRoute => {
    return withAuth(async (ctx) => {
      const clubId = ctx.params.clubId;

      if (!clubId) {
        return errorResponse('Club ID required', 400);
      }

      const club = await ctx.db.getClub(clubId);
      if (!club) {
        return errorResponse('Club not found', 404);
      }

      const member = await ctx.db.getClubMember(clubId, ctx.user.id);
      if (!member) {
        return errorResponse('Not a member of this club', 403);
      }

      if (permission && !hasPermission(member.role as Role, permission)) {
        return errorResponse('Insufficient permissions', 403);
      }

      return handler({
        ...ctx,
        club,
        member,
      });
    });
  };
}

/**
 * Wraps an API handler with super admin check
 */
export function withSuperAdmin(handler: ApiHandler<SuperAdminContext>): APIRoute {
  return async (context: APIContext): Promise<Response> => {
    try {
      if (!context.locals.runtime.env.DB) {
        return errorResponse('Database not configured', 500);
      }

      const db = new DatabaseService(context.locals.runtime.env.DB);
      const { user } = await getAuthContext(context.cookies, db);
      const superAdminEmail = context.locals.runtime.env.SUPER_ADMIN_EMAIL;

      if (!user || !superAdminEmail ||
          user.email.toLowerCase() !== superAdminEmail.toLowerCase()) {
        return errorResponse('Forbidden', 403);
      }

      return handler({
        db,
        user,
        request: context.request,
        params: context.params as Record<string, string | undefined>,
        url: new URL(context.request.url),
        isSuperAdmin: true,
      });
    } catch (error) {
      console.error('Super admin API error:', error);
      return errorResponse('Internal server error', 500);
    }
  };
}

/**
 * Parse JSON body with error handling
 */
export async function parseJsonBody<T = unknown>(request: Request): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}

/**
 * Validate required fields in an object
 */
export function validateRequired<T extends Record<string, unknown>>(
  data: T | null,
  fields: (keyof T)[]
): { valid: true; data: T } | { valid: false; missing: string[] } {
  if (!data) {
    return { valid: false, missing: fields as string[] };
  }

  const missing = fields.filter(field => data[field] === undefined || data[field] === null || data[field] === '');

  if (missing.length > 0) {
    return { valid: false, missing: missing as string[] };
  }

  return { valid: true, data };
}
