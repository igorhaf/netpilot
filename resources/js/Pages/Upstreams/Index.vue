<template>
    <AppLayout title="Upstreams">
        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-2xl font-semibold text-gray-800">Upstream Servers</h2>
                            <Link :href="route('upstreams.create')" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                Add Upstream
                            </Link>
                        </div>

                        <div v-if="upstreams.data.length === 0" class="text-center py-8 text-gray-500">
                            No upstream servers configured yet.
                        </div>

                        <div v-else class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Domain
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Target URL
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Weight
                                        </th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Health Check
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
                                    <tr v-for="upstream in upstreams.data" :key="upstream.id">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm font-medium text-gray-900">
                                                {{ upstream.name }}
                                            </div>
                                            <div v-if="upstream.description" class="text-sm text-gray-500">
                                                {{ upstream.description }}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">
                                                {{ upstream.domain?.name || 'N/A' }}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <a :href="upstream.target_url" target="_blank" class="text-sm text-blue-600 hover:text-blue-900">
                                                {{ upstream.target_url }}
                                            </a>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {{ upstream.weight }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div v-if="upstream.health_check_path" class="text-sm text-gray-900">
                                                <code class="bg-gray-100 px-1 rounded">{{ upstream.health_check_path }}</code>
                                                <div class="text-xs text-gray-500">
                                                    Every {{ upstream.health_check_interval }}s
                                                </div>
                                            </div>
                                            <span v-else class="text-sm text-gray-400">Disabled</span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span v-if="upstream.is_active" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Active
                                            </span>
                                            <span v-else class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                Inactive
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link :href="route('upstreams.edit', upstream.id)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                                                Edit
                                            </Link>
                                            <button @click="deleteUpstream(upstream.id)" class="text-red-600 hover:text-red-900">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination -->
                        <div v-if="upstreams.links.length > 3" class="mt-4">
                            <nav class="flex justify-center">
                                <Link
                                    v-for="link in upstreams.links"
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
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { Link, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const props = defineProps({
    upstreams: Object
});

const deleteUpstream = (id) => {
    if (confirm('Are you sure you want to delete this upstream server?')) {
        router.delete(route('upstreams.destroy', id), {
            preserveScroll: true,
            onSuccess: () => {
                // Upstream deleted successfully
            }
        });
    }
};
</script>
