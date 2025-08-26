<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <div class="sm:flex sm:items-center mb-8">
        <div class="sm:flex-auto">
          <h1 class="text-3xl font-bold text-gray-900">Domains</h1>
          <p class="mt-2 text-sm text-gray-600">Manage your proxy domains and SSL certificates with automatic HTTPS.</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button href="/domains/create" variant="primary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Domain
          </Button>
        </div>
      </div>

      <!-- Desktop Table -->
      <div class="hidden lg:block">
        <Card>
          <div class="overflow-hidden">
            <table class="w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auto TLS</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Routes</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <transition-group
                name="list"
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="opacity-0 transform translate-y-4"
                enter-to-class="opacity-100 transform translate-y-0"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100 transform translate-y-0"
                leave-to-class="opacity-0 transform translate-y-4"
                tag="tbody"
                class="bg-white divide-y divide-gray-200"
              >
                  <tr v-for="domain in domains.data" :key="domain.id" class="hover:bg-gray-50 transition-colors duration-200">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-12 w-12">
                        <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                          <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                          </svg>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-semibold text-gray-900">{{ domain.name }}</div>
                        <div class="text-sm text-gray-500">{{ domain.description || 'No description' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="domain.auto_tls ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                      <svg v-if="domain.auto_tls" class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      {{ domain.auto_tls ? 'Enabled' : 'Disabled' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="domain.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                      <div :class="domain.is_active ? 'bg-green-400' : 'bg-red-400'" class="w-1.5 h-1.5 rounded-full mr-1.5"></div>
                      {{ domain.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex items-center">
                      <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                      </svg>
                      {{ domain.routes_count || 0 }} routes
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(domain.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                      <Button :href="`/domains/${domain.id}/edit`" variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button @click="deleteDomain(domain)" variant="ghost" size="sm" class="text-red-600 hover:text-red-700">
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
                </transition-group>
            </table>
          </div>
        </Card>
      </div>

      <!-- Mobile Cards -->
      <div class="lg:hidden space-y-4">
        <transition-group
          name="list"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 transform translate-y-4"
          enter-to-class="opacity-100 transform translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 transform translate-y-0"
          leave-to-class="opacity-0 transform translate-y-4"
        >
          <Card v-for="domain in domains.data" :key="domain.id" class="hover:shadow-md transition-shadow duration-200">
            <div class="flex items-start justify-between">
              <div class="flex items-center flex-1">
                <div class="flex-shrink-0 h-12 w-12">
                  <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                    </svg>
                  </div>
                </div>
                <div class="ml-4 flex-1">
                  <div class="text-lg font-semibold text-gray-900">{{ domain.name }}</div>
                  <div class="text-sm text-gray-500 mt-1">{{ domain.description || 'No description' }}</div>
                  
                  <div class="flex flex-wrap gap-2 mt-3">
                    <span :class="domain.auto_tls ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                      <svg v-if="domain.auto_tls" class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      {{ domain.auto_tls ? 'Auto TLS' : 'No TLS' }}
                    </span>
                    
                    <span :class="domain.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                      <div :class="domain.is_active ? 'bg-green-400' : 'bg-red-400'" class="w-1.5 h-1.5 rounded-full mr-1.5"></div>
                      {{ domain.is_active ? 'Active' : 'Inactive' }}
                    </span>
                    
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      <svg class="w-3 h-3 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                      </svg>
                      {{ domain.routes_count || 0 }} routes
                    </span>
                  </div>
                  
                  <div class="text-xs text-gray-500 mt-2">
                    Created {{ formatDate(domain.created_at) }}
                  </div>
                </div>
              </div>
              
              <div class="flex flex-col space-y-2 ml-4">
                <Button :href="`/domains/${domain.id}/edit`" variant="ghost" size="sm">
                  Edit
                </Button>
                <Button @click="deleteDomain(domain)" variant="ghost" size="sm" class="text-red-600 hover:text-red-700">
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </transition-group>
      </div>

      <!-- Pagination -->
      <div v-if="domains.links" class="mt-6">
        <nav class="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
          <div class="-mt-px flex w-0 flex-1">
            <Link v-if="domains.prev_page_url" :href="domains.prev_page_url" class="inline-flex items-center border-t-2 border-transparent pt-4 pr-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
              Previous
            </Link>
          </div>
          <div class="hidden md:-mt-px md:flex">
            <Link v-for="link in domains.links.slice(1, -1)" :key="link.label" :href="link.url" :class="link.active ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'" class="inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium">
              {{ link.label }}
            </Link>
          </div>
          <div class="-mt-px flex w-0 flex-1 justify-end">
            <Link v-if="domains.next_page_url" :href="domains.next_page_url" class="inline-flex items-center border-t-2 border-transparent pt-4 pl-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
              Next
            </Link>
          </div>
        </nav>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { Link, router } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import Card from '@/Components/Card.vue'
import Button from '@/Components/Button.vue'

const props = defineProps({
  domains: { type: Object, required: true }
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const deleteDomain = (domain) => {
  if (confirm(`Are you sure you want to delete ${domain.name}?`)) {
    router.delete(`/domains/${domain.id}`)
  }
}
</script>
