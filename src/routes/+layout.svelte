<script lang="ts">
    import type { LayoutData } from './$types';
    import '../app.css';
    
    export let data: LayoutData;
</script>

<div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 py-6">
            {#if data.tenant}
                <h1 class="text-3xl font-bold text-gray-900">{data.tenant.name}</h1>
            {:else}
                <h1 class="text-3xl font-bold text-gray-900">Clubify</h1>
            {/if}
        </div>
    </header>
    
    <main class="max-w-7xl mx-auto px-4 py-6">
        <slot />
    </main>
</div>