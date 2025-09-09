<template>
    <AppLayout title="Rotas">
        <PageLayout>
                            <div class="flex justify-between items-center mb-6">
                                <h2 class="text-2xl font-semibold text-gray-800">Route Rules</h2>
                                <Link :href="route('routes.create')" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                    Add Route
                                </Link>
                            </div>

                        <div v-if="routes.data.length === 0" class="text-center py-8 text-gray-500">
                            No routes configured yet.
                        </div>

                        <div v-else class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Domain
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Path Pattern
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Upstream
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Method
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Priority
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr v-for="route in routes.data" :key="route.id">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm font-medium text-gray-900">
                                                {{ route.domain?.name || 'N/A' }}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">
                                                <code class="bg-gray-100 px-2 py-1 rounded">{{ route.path_pattern || '/' }}</code>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">
                                                {{ route.upstream?.name || 'N/A' }}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {{ route.http_method }}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ route.priority }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span v-if="route.is_active" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Active
                                            </span>
                                            <span v-else class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                Inactive
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link :href="route('routes.edit', route.id)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                                                Edit
                                            </Link>
                                            <button @click="deleteRoute(route.id)" class="text-red-600 hover:text-red-900">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination -->
                        <div v-if="routes.links.length > 3" class="mt-4">
                            <nav class="flex justify-center">
                                <Link
                                    v-for="link in routes.links"
                                    :key="link.label"
                                    :href="link.url"
                                    v-html="link.label"
                                    :class="{
                                        'bg-blue-500 text-white': link.active,
                                        'bg-white text-gray-700': !link.active
                                    }"
                                    class="px-3 py-2 mx-1 border rounded hover:bg-gray-100"
                                    :disabled="!link.url"
                                />
                            </nav>
                        </div>
        </PageLayout>
    </AppLayout>
</template>

<script setup>
import { Link, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import PageLayout from '@/Components/PageLayout.vue';

const props = defineProps({
    routes: Object
});

const deleteRoute = (id) => {
    if (confirm('Are you sure you want to delete this route?')) {
        router.delete(route('routes.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                // Route deleted successfully
            }
        });
    }
};
</script>
