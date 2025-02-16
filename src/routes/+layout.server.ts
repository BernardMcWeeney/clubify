import type { LayoutServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: LayoutServerLoad = async ({ url }) => {
    const hostname = url.hostname;
    let tenant = null;
    
    // Skip tenant lookup for admin subdomain
    if (!hostname.startsWith('admin.')) {
        tenant = await prisma.tenant.findFirst({
            where: {
                domain: hostname
            },
            select: {
                id: true,
                name: true,
                domain: true
            }
        });
    }
    
    return {
        tenant
    };
};