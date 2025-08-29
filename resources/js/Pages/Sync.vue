<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">Sync Configuration</h1>
        <p class="mt-2 text-sm text-gray-600">Generate Traefik dynamic config from database and sync proxy settings.</p>
      </div>

      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Proxy Synchronization</h3>
          <div class="mt-2 max-w-xl text-sm text-gray-500">
            <p>This will generate YAML configuration files for Traefik based on your current domains, routes, and redirects.</p>
          </div>
          <div class="mt-5">
            <button 
              @click="runSync" 
              :disabled="loading"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-if="loading">Syncing Configuration...</span>
              <span v-else>Run Sync</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Output -->
      <div v-if="output" class="mt-6 bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Sync Results</h3>
          <div class="mt-2">
            <div class="bg-gray-50 rounded-md p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800">Configuration Updated</h3>
                  <div class="mt-2 text-sm text-green-700">
                    <pre class="whitespace-pre-wrap">{{ output }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-blue-900">Next Steps</h3>
          <div class="mt-2 text-sm text-blue-700">
            <p>After syncing, Traefik will automatically reload the configuration. You can monitor the process with:</p>
            <code class="mt-2 block bg-blue-100 px-3 py-2 rounded text-blue-800">./vendor/bin/sail artisan proxy:logs --follow</code>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'

const output = ref('')
const loading = ref(false)

function runSync() {
  loading.value = true
  output.value = ''
  router.post('/sync', {}, {
    onSuccess: (page) => {
      const success = page.props?.flash?.success
      const error = page.props?.flash?.error
      output.value = success || error || 'Sync completed.'
    },
    onFinish: () => (loading.value = false),
    preserveScroll: true,
    preserveState: true,
  })
}
</script>
