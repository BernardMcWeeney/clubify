<script lang="ts">
    import type { PageData } from './$types';
    export let data: PageData;
</script>

<div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Super Admin Dashboard</h1>
    <p class="mb-4">Welcome to the super admin area. This should only be accessible at admin.clubify.net</p>
    
    <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Tenants</h2>
        {#if data.tenants && data.tenants.length > 0}
            <ul class="space-y-4">
                {#each data.tenants as tenant}
                    <li class="border-b pb-2">
                        <p class="font-medium">{tenant.name}</p>
                        <p class="text-sm text-gray-600">{tenant.domain}</p>
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="text-gray-500">No tenants found</p>
        {/if}
    </div>
</div>