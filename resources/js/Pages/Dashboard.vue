<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="mt-2 text-sm text-gray-600">Overview of your proxy configuration</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link href="/domains" class="block">
          <Card hover class="group cursor-pointer">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-5 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500">Domains</dt>
                  <dd class="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">{{ stats.domains }}</dd>
                </dl>
              </div>
            </div>
            <template #footer>
              <div class="text-sm text-blue-600 font-medium group-hover:text-blue-700 transition-colors duration-200">
                View all domains →
              </div>
            </template>
          </Card>
        </Link>

        <Link href="/upstreams" class="block">
          <Card hover class="group cursor-pointer">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-5 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500">Upstreams</dt>
                  <dd class="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-200">{{ stats.upstreams }}</dd>
                </dl>
              </div>
            </div>
            <template #footer>
              <div class="text-sm text-green-600 font-medium group-hover:text-green-700 transition-colors duration-200">
                View all upstreams →
              </div>
            </template>
          </Card>
        </Link>

        <Link href="/routes" class="block">
          <Card hover class="group cursor-pointer">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-5 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500">Routes</dt>
                  <dd class="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-200">{{ stats.routes }}</dd>
                </dl>
              </div>
            </div>
            <template #footer>
              <div class="text-sm text-purple-600 font-medium group-hover:text-purple-700 transition-colors duration-200">
                View all routes →
              </div>
            </template>
          </Card>
        </Link>

        <Link href="/redirects" class="block">
          <Card hover class="group cursor-pointer">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-5 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500">Redirects</dt>
                  <dd class="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-200">{{ stats.redirects }}</dd>
                </dl>
              </div>
            </div>
            <template #footer>
              <div class="text-sm text-orange-600 font-medium group-hover:text-orange-700 transition-colors duration-200">
                View all redirects →
              </div>
            </template>
          </Card>
        </Link>
      </div>

      <!-- Quick Actions -->
      <Card>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <p class="text-sm text-gray-600">Common tasks to manage your proxy</p>
        </template>
        <div class="flex flex-wrap gap-3">
          <Button href="/domains/create" variant="primary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Domain
          </Button>
          <Button href="/upstreams/create" variant="success">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            Add Upstream
          </Button>
          <Button href="/sync" variant="outline">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Sync Configuration
          </Button>
        </div>
      </Card>

      <!-- Recent Activity -->
      <div v-if="recentEvents?.length" class="mt-8 bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Recent Certificate Events</h3>
          <div class="mt-5">
            <div class="flow-root">
              <ul class="-mb-8">
                <li v-for="(event, idx) in recentEvents" :key="event.id" class="relative pb-8">
                  <div v-if="idx !== recentEvents.length - 1" class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></div>
                  <div class="relative flex space-x-3">
                    <div>
                      <span :class="event.status === 'success' ? 'bg-green-500' : 'bg-red-500'" class="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" v-if="event.status === 'success'"></path>
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" v-else></path>
                        </svg>
                      </span>
                    </div>
                    <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p class="text-sm text-gray-500">{{ event.event_type }} for <span class="font-medium text-gray-900">{{ event.domain }}</span></p>
                      </div>
                      <div class="text-right text-sm whitespace-nowrap text-gray-500">
                        {{ formatDate(event.created_at) }}
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
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
  stats: { type: Object, required: true },
  recentEvents: { type: Array, default: () => [] }
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
