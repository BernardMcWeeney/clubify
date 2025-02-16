# File: src/routes/[tenant]/+page.svelte
<script lang="ts">
    import type { PageData } from './$types';
    
    export let data: PageData;
</script>

<div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Welcome to {data.tenant?.name ?? 'Unknown Club'}</h1>
    <p>This is the public-facing page for this club.</p>
</div>