<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <div class="sm:flex sm:items-center mb-8">
        <div class="sm:flex-auto">
          <h1 class="text-3xl font-bold text-gray-900">Redirects</h1>
          <p class="mt-2 text-sm text-gray-600">Manage URL redirects and traffic forwarding rules.</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button href="/redirects/create" variant="primary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Redirect
          </Button>
        </div>
      </div>

      <Card no-padding>
        <div class="overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Pattern</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target URL</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <transition-group
                name="list"
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="opacity-0 transform translate-y-4"
                enter-to-class="opacity-100 transform translate-y-0"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100 transform translate-y-0"
                leave-to-class="opacity-0 transform translate-y-4"
                tag="tbody"
              >
                <tr v-for="redirect in redirects.data" :key="redirect.id" class="hover:bg-gray-50 transition-colors duration-200">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-12 w-12">
                        <div class="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
                          <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-semibold text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                          {{ redirect.source_pattern }}
                        </div>
                        <div class="text-sm text-gray-500">{{ redirect.description || 'No description' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      <span class="text-sm font-medium text-gray-900">{{ redirect.domain?.name || 'N/A' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded max-w-xs truncate">
                      {{ redirect.target_url }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getRedirectTypeColor(redirect.redirect_type)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                      {{ redirect.redirect_type }}
                      <span class="ml-1 text-xs opacity-75">{{ getRedirectTypeName(redirect.redirect_type) }}</span>
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-full bg-gray-200 rounded-full h-2 mr-2" style="width: 60px;">
                        <div class="bg-orange-600 h-2 rounded-full" :style="`width: ${Math.min(redirect.priority / 10, 100)}%`"></div>
                      </div>
                      <span class="text-sm text-gray-600">{{ redirect.priority }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="redirect.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                      <div :class="redirect.is_active ? 'bg-green-400' : 'bg-red-400'" class="w-1.5 h-1.5 rounded-full mr-1.5"></div>
                      {{ redirect.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                      <Button :href="`/redirects/${redirect.id}/edit`" variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button @click="deleteRedirect(redirect)" variant="ghost" size="sm" class="text-red-600 hover:text-red-700">
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              </transition-group>
            </tbody>
          </table>
        </div>
      </Card>

      <!-- Pagination -->
      <div v-if="redirects.links" class="mt-6">
        <nav class="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
          <div class="-mt-px flex w-0 flex-1">
            <Link v-if="redirects.prev_page_url" :href="redirects.prev_page_url" class="inline-flex items-center border-t-2 border-transparent pt-4 pr-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
              Previous
            </Link>
          </div>
          <div class="hidden md:-mt-px md:flex">
            <Link v-for="link in redirects.links.slice(1, -1)" :key="link.label" :href="link.url" :class="[link.active ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium']" v-html="link.label"></Link>
          </div>
          <div class="-mt-px flex w-0 flex-1 justify-end">
            <Link v-if="redirects.next_page_url" :href="redirects.next_page_url" class="inline-flex items-center border-t-2 border-transparent pt-4 pl-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
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
  redirects: { type: Object, required: true }
})

const getRedirectTypeColor = (type) => {
  const colors = {
    301: 'bg-green-100 text-green-800 border-green-200',
    302: 'bg-blue-100 text-blue-800 border-blue-200',
    303: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    307: 'bg-purple-100 text-purple-800 border-purple-200',
    308: 'bg-red-100 text-red-800 border-red-200'
  }
  return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const getRedirectTypeName = (type) => {
  const names = {
    301: 'Permanent',
    302: 'Temporary',
    303: 'See Other',
    307: 'Temp Redirect',
    308: 'Perm Redirect'
  }
  return names[type] || 'Unknown'
}

const deleteRedirect = (redirect) => {
  if (confirm(`Are you sure you want to delete the redirect from ${redirect.source_pattern}?`)) {
    router.delete(`/redirects/${redirect.id}`)
  }
}
</script>
