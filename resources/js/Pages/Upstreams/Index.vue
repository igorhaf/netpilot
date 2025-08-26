<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <div class="sm:flex sm:items-center mb-8">
        <div class="sm:flex-auto">
          <h1 class="text-3xl font-bold text-gray-900">Upstreams</h1>
          <p class="mt-2 text-sm text-gray-600">Manage backend servers and load balancing configuration.</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button href="/upstreams/create" variant="primary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Upstream
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
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upstream</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target URL</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                <tr v-for="upstream in upstreams.data" :key="upstream.id" class="hover:bg-gray-50 transition-colors duration-200">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-12 w-12">
                        <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                          <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2v-4a2 2 0 00-2-2m8-8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"></path>
                          </svg>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-semibold text-gray-900">{{ upstream.name }}</div>
                        <div class="text-sm text-gray-500">{{ upstream.description || 'No description' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      <span class="text-sm font-medium text-gray-900">{{ upstream.domain?.name || 'N/A' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                      {{ upstream.target_url }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-full bg-gray-200 rounded-full h-2 mr-2" style="width: 60px;">
                        <div class="bg-purple-600 h-2 rounded-full" :style="`width: ${upstream.weight}%`"></div>
                      </div>
                      <span class="text-sm text-gray-600">{{ upstream.weight }}%</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="upstream.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                      <div :class="upstream.is_active ? 'bg-green-400' : 'bg-red-400'" class="w-1.5 h-1.5 rounded-full mr-1.5"></div>
                      {{ upstream.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                      <Button :href="`/upstreams/${upstream.id}/edit`" variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button @click="deleteUpstream(upstream)" variant="ghost" size="sm" class="text-red-600 hover:text-red-700">
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
          <Card v-for="upstream in upstreams.data" :key="upstream.id" class="hover:shadow-md transition-shadow duration-200">
            <div class="flex items-start justify-between">
              <div class="flex items-center flex-1">
                <div class="flex-shrink-0 h-12 w-12">
                  <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2v-4a2 2 0 00-2-2m8-8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"></path>
                    </svg>
                  </div>
                </div>
                <div class="ml-4 flex-1">
                  <div class="text-lg font-semibold text-gray-900">{{ upstream.name }}</div>
                  <div class="text-sm text-gray-500 mt-1">{{ upstream.description || 'No description' }}</div>
                  
                  <div class="flex flex-wrap gap-2 mt-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      <svg class="w-3 h-3 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                      </svg>
                      {{ upstream.domain?.name }}
                    </span>
                    
                    <span :class="upstream.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                      <div :class="upstream.is_active ? 'bg-green-400' : 'bg-red-400'" class="w-1.5 h-1.5 rounded-full mr-1.5"></div>
                      {{ upstream.is_active ? 'Active' : 'Inactive' }}
                    </span>
                    
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      Weight: {{ upstream.weight }}
                    </span>
                  </div>
                  
                  <div class="text-sm text-gray-600 mt-2 font-mono bg-gray-50 px-2 py-1 rounded">
                    {{ upstream.target_url }}
                  </div>
                  
                  <div class="text-xs text-gray-500 mt-2">
                    Created {{ formatDate(upstream.created_at) }}
                  </div>
                </div>
              </div>
              
              <div class="flex flex-col space-y-2 ml-4">
                <Button :href="`/upstreams/${upstream.id}/edit`" variant="ghost" size="sm">
                  Edit
                </Button>
                <Button @click="deleteUpstream(upstream)" variant="ghost" size="sm" class="text-red-600 hover:text-red-700">
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </transition-group>
      </div>

      <!-- Pagination -->
      <div v-if="upstreams.links" class="mt-6">
        <nav class="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
          <div class="-mt-px flex w-0 flex-1">
            <Link v-if="upstreams.prev_page_url" :href="upstreams.prev_page_url" class="inline-flex items-center border-t-2 border-transparent pt-4 pr-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
              Previous
            </Link>
          </div>
          <div class="hidden md:-mt-px md:flex">
            <Link v-for="link in upstreams.links.slice(1, -1)" :key="link.label" :href="link.url" :class="[link.active ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium']" v-html="link.label"></Link>
          </div>
          <div class="-mt-px flex w-0 flex-1 justify-end">
            <Link v-if="upstreams.next_page_url" :href="upstreams.next_page_url" class="inline-flex items-center border-t-2 border-transparent pt-4 pl-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
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
  upstreams: { type: Object, required: true }
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const deleteUpstream = (upstream) => {
  if (confirm(`Are you sure you want to delete ${upstream.name}?`)) {
    router.delete(`/upstreams/${upstream.id}`)
  }
}
</script>
