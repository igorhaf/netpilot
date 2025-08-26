<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <div class="sm:flex sm:items-center mb-8">
        <div class="sm:flex-auto">
          <h1 class="text-3xl font-bold text-gray-900">Routes</h1>
          <p class="mt-2 text-sm text-gray-600">Manage routing rules and path-based traffic distribution.</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button href="/routes/create" variant="primary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Route
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
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upstream</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
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
                <tr v-for="route in routes.data" :key="route.id" class="hover:bg-gray-50 transition-colors duration-200">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-12 w-12">
                        <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
                          <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                          </svg>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-semibold text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                          {{ route.path_pattern }}
                        </div>
                        <div class="text-sm text-gray-500">{{ route.description || 'No description' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      <span class="text-sm font-medium text-gray-900">{{ route.domain?.name || 'N/A' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                      <span class="text-sm font-medium text-gray-900">{{ route.upstream?.name || 'N/A' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getMethodColor(route.http_method)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                      {{ route.http_method }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-full bg-gray-200 rounded-full h-2 mr-2" style="width: 60px;">
                        <div class="bg-green-600 h-2 rounded-full" :style="`width: ${Math.min(route.priority / 10, 100)}%`"></div>
                      </div>
                      <span class="text-sm text-gray-600">{{ route.priority }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="route.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                      <div :class="route.is_active ? 'bg-green-400' : 'bg-red-400'" class="w-1.5 h-1.5 rounded-full mr-1.5"></div>
                      {{ route.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                      <Button :href="`/routes/${route.id}/edit`" variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button @click="deleteRoute(route)" variant="ghost" size="sm" class="text-red-600 hover:text-red-700">
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
          <Card v-for="route in routes.data" :key="route.id" class="hover:shadow-md transition-shadow duration-200">
            <div class="flex items-start justify-between">
              <div class="flex items-center flex-1">
                <div class="flex-shrink-0 h-12 w-12">
                  <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
                    <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                    </svg>
                  </div>
                </div>
                <div class="ml-4 flex-1">
                  <div class="text-lg font-semibold text-gray-900">{{ route.path_pattern }}</div>
                  <div class="text-sm text-gray-500 mt-1">{{ route.description || 'No description' }}</div>
                  
                  <div class="flex flex-wrap gap-2 mt-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      <svg class="w-3 h-3 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                      </svg>
                      {{ route.domain?.name }}
                    </span>
                    
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      <div class="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                      {{ route.upstream?.name || 'N/A' }}
                    </span>
                    
                    <span :class="getMethodColor(route.http_method)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                      {{ route.http_method }}
                    </span>
                    
                    <span :class="route.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                      <div :class="route.is_active ? 'bg-green-400' : 'bg-red-400'" class="w-1.5 h-1.5 rounded-full mr-1.5"></div>
                      {{ route.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                  
                  <div class="flex items-center mt-2">
                    <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div class="bg-green-600 h-2 rounded-full" :style="`width: ${Math.min(route.priority / 10, 100)}%`"></div>
                    </div>
                    <span class="text-xs text-gray-600">Priority: {{ route.priority }}</span>
                  </div>
                  
                  <div class="text-xs text-gray-500 mt-2">
                    Created {{ formatDate(route.created_at) }}
                  </div>
                </div>
              </div>
              
              <div class="flex flex-col space-y-2 ml-4">
                <Button :href="`/routes/${route.id}/edit`" variant="ghost" size="sm">
                  Edit
                </Button>
                <Button @click="deleteRoute(route)" variant="ghost" size="sm" class="text-red-600 hover:text-red-700">
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </transition-group>
      </div>

      <!-- Pagination -->
      <div v-if="routes.links" class="mt-6">
        <nav class="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
          <div class="-mt-px flex w-0 flex-1">
            <Link v-if="routes.prev_page_url" :href="routes.prev_page_url" class="inline-flex items-center border-t-2 border-transparent pt-4 pr-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
              Previous
            </Link>
          </div>
          <div class="hidden md:-mt-px md:flex">
            <Link v-for="link in routes.links.slice(1, -1)" :key="link.label" :href="link.url" :class="[link.active ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium']" v-html="link.label"></Link>
          </div>
          <div class="-mt-px flex w-0 flex-1 justify-end">
            <Link v-if="routes.next_page_url" :href="routes.next_page_url" class="inline-flex items-center border-t-2 border-transparent pt-4 pl-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
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
  routes: { type: Object, required: true }
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const getMethodColor = (method) => {
  const colors = {
    'GET': 'bg-blue-100 text-blue-800 border-blue-200',
    'POST': 'bg-green-100 text-green-800 border-green-200',
    'PUT': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'PATCH': 'bg-orange-100 text-orange-800 border-orange-200',
    'DELETE': 'bg-red-100 text-red-800 border-red-200',
    'HEAD': 'bg-gray-100 text-gray-800 border-gray-200',
    'OPTIONS': 'bg-purple-100 text-purple-800 border-purple-200',
    '*': 'bg-indigo-100 text-indigo-800 border-indigo-200'
  }
  return colors[method] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const deleteRoute = (route) => {
  if (confirm(`Are you sure you want to delete the route ${route.path_pattern}?`)) {
    router.delete(`/routes/${route.id}`)
  }
}
</script>
