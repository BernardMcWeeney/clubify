import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
    const tenants = await prisma.tenant.findMany({
        select: {
            id: true,
            name: true,
            domain: true
        }
    });
    
    return {
        tenants
    };
};