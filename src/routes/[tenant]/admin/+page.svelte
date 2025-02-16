# File: src/routes/[tenant]/admin/+page.svelte
<script lang="ts">
    import type { PageData } from './$types';
    
    export let data: PageData;
</script>

<div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Tenant Admin Dashboard</h1>
    {#if data.tenant}
        <p>Managing tenant: {data.tenant.name}</p>
    {:else}
        <p class="text-red-500">No tenant found</p>
    {/if}
</div>