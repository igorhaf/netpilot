<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Add Route</h1>
        <p class="mt-2 text-sm text-gray-600">Create a new routing rule to direct traffic to backend services.</p>
      </div>

      <Card class="max-w-2xl">
        <form @submit.prevent="submit" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="domain_id" class="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <select
                id="domain_id"
                v-model="form.domain_id"
                required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
                :class="{ 'border-red-300': errors.domain_id }"
              >
                <option value="">Select a domain</option>
                <option v-for="domain in domains" :key="domain.id" :value="domain.id">
                  {{ domain.name }}
                </option>
              </select>
              <p v-if="errors.domain_id" class="mt-2 text-sm text-red-600">{{ errors.domain_id }}</p>
            </div>

            <div>
              <label for="upstream_id" class="block text-sm font-medium text-gray-700 mb-2">Upstream</label>
              <select
                id="upstream_id"
                v-model="form.upstream_id"
                required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
                :class="{ 'border-red-300': errors.upstream_id }"
              >
                <option value="">Select an upstream</option>
                <option v-for="upstream in filteredUpstreams" :key="upstream.id" :value="upstream.id">
                  {{ upstream.name }}
                </option>
              </select>
              <p v-if="errors.upstream_id" class="mt-2 text-sm text-red-600">{{ errors.upstream_id }}</p>
            </div>
          </div>

          <Input
            id="path_pattern"
            v-model="form.path_pattern"
            label="Path Pattern"
            type="text"
            placeholder="/api/v1/*"
            required
            :error="errors.path_pattern"
            help="URL path pattern to match (supports wildcards like /api/*, /users/{id})"
          />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="http_method" class="block text-sm font-medium text-gray-700 mb-2">HTTP Method</label>
              <select
                id="http_method"
                v-model="form.http_method"
                required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
                :class="{ 'border-red-300': errors.http_method }"
              >
                <option value="*">* (All Methods)</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
              <p v-if="errors.http_method" class="mt-2 text-sm text-red-600">{{ errors.http_method }}</p>
            </div>

            <Input
              id="priority"
              v-model="form.priority"
              label="Priority"
              type="number"
              min="1"
              max="1000"
              :error="errors.priority"
              help="Higher numbers = higher priority (1-1000)"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="timeout"
              v-model="form.timeout"
              label="Timeout (seconds)"
              type="number"
              min="1"
              max="300"
              :error="errors.timeout"
              help="Request timeout in seconds (1-300)"
            />
          </div>

          <Input
            id="description"
            v-model="form.description"
            label="Description"
            type="textarea"
            placeholder="Optional description for this route"
            :error="errors.description"
            help="Add a description to help identify this route's purpose"
            :rows="3"
          />

          <div class="space-y-4">
            <div class="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div class="flex items-center h-5">
                <input
                  id="is_active"
                  v-model="form.is_active"
                  type="checkbox"
                  class="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded transition-colors duration-200"
                />
              </div>
              <div class="text-sm">
                <label for="is_active" class="font-medium text-green-900">Active</label>
                <p class="text-green-700">Enable this route in the proxy configuration</p>
              </div>
            </div>

            <div class="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div class="flex items-center h-5">
                <input
                  id="preserve_host"
                  v-model="form.preserve_host"
                  type="checkbox"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded transition-colors duration-200"
                />
              </div>
              <div class="text-sm">
                <label for="preserve_host" class="font-medium text-blue-900">Preserve Host Header</label>
                <p class="text-blue-700">Keep the original Host header when forwarding requests</p>
              </div>
            </div>

            <div class="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div class="flex items-center h-5">
                <input
                  id="strip_prefix"
                  v-model="form.strip_prefix"
                  type="checkbox"
                  class="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded transition-colors duration-200"
                />
              </div>
              <div class="text-sm">
                <label for="strip_prefix" class="font-medium text-yellow-900">Strip Path Prefix</label>
                <p class="text-yellow-700">Remove the matched path prefix before forwarding to upstream</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button href="/routes" variant="outline">
              Cancel
            </Button>
            <Button type="submit" :loading="processing" variant="primary">
              Create Route
            </Button>
          </div>
        </form>
      </Card>
    </div>
  </AppLayout>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { router } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import Card from '@/Components/Card.vue'
import Button from '@/Components/Button.vue'
import Input from '@/Components/Input.vue'

const props = defineProps({
  domains: { type: Array, required: true },
  upstreams: { type: Array, required: true },
  errors: { type: Object, default: () => ({}) }
})

const form = reactive({
  domain_id: '',
  upstream_id: '',
  path_pattern: '',
  http_method: '*',
  priority: 100,
  timeout: 30,
  description: '',
  is_active: true,
  preserve_host: true,
  strip_prefix: false
})

const processing = ref(false)

const filteredUpstreams = computed(() => {
  if (!form.domain_id) return props.upstreams
  return props.upstreams.filter(upstream => upstream.domain_id == form.domain_id)
})

const submit = () => {
  processing.value = true
  router.post('/routes', form, {
    onFinish: () => (processing.value = false)
  })
}
</script>
