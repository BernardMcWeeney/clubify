<script lang="ts">
    import type { PageData } from './$types';
    
    export let data: PageData;
</script>

<div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Clubify</h1>
    <p class="mb-4">Welcome to Clubify. A test tenant has been created:</p>
    
    <div class="bg-gray-100 p-4 rounded">
        <p>Test tenant domain: {data.testTenant.domain}</p>
        <p>Test tenant name: {data.testTenant.name}</p>
    </div>
    
    <div class="mt-8">
        <h2 class="text-xl font-semibold mb-2">Test Links:</h2>
        <ul class="list-disc pl-5">
            <li><a href="http://admin.clubify.net" class="text-blue-500 hover:underline">Super Admin Dashboard</a></li>
            <li><a href="http://test.clubify.net" class="text-blue-500 hover:underline">Test Tenant Public Page</a></li>
            <li><a href="http://test.clubify.net/admin" class="text-blue-500 hover:underline">Test Tenant Admin</a></li>
        </ul>
    </div>
</div>