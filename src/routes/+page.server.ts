import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // Create a test tenant if none exists
    const testTenant = await prisma.tenant.upsert({
        where: {
            domain: 'test.clubify.net'
        },
        update: {},
        create: {
            name: 'Test Club',
            domain: 'test.clubify.net'
        }
    });
    
    return {
        testTenant
    };
};