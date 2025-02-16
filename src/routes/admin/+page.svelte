# File: src/routes/admin/+page.svelte
<script lang="ts">
    import { prisma } from '$lib/server/prisma';
</script>

<div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Super Admin Dashboard</h1>
    <p>Welcome to the super admin area. This should only be accessible at admin.clubify.net</p>
</div>