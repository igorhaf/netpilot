<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Add Redirect</h1>
        <p class="mt-2 text-sm text-gray-600">Create a new URL redirect rule for traffic forwarding and SEO management.</p>
      </div>

      <Card class="max-w-2xl">
        <form @submit.prevent="submit" class="space-y-6">
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
            <p class="mt-1 text-sm text-gray-500">Choose the domain this redirect applies to</p>
          </div>

          <Input
            id="source_pattern"
            v-model="form.source_pattern"
            label="Source Pattern"
            type="text"
            placeholder="/old-path/*"
            required
            :error="errors.source_pattern"
            help="URL pattern to match for redirection (supports wildcards like /old/*, /users/{id})"
          />

          <Input
            id="target_url"
            v-model="form.target_url"
            label="Target URL"
            type="url"
            placeholder="https://example.com/new-path"
            required
            :error="errors.target_url"
            help="The destination URL to redirect to (must include protocol)"
          />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="redirect_type" class="block text-sm font-medium text-gray-700 mb-2">Redirect Type</label>
              <select
                id="redirect_type"
                v-model="form.redirect_type"
                required
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
                :class="{ 'border-red-300': errors.redirect_type }"
              >
                <option value="301">301 - Permanent Redirect</option>
                <option value="302">302 - Temporary Redirect</option>
                <option value="303">303 - See Other</option>
                <option value="307">307 - Temporary Redirect (Preserve Method)</option>
                <option value="308">308 - Permanent Redirect (Preserve Method)</option>
              </select>
              <p v-if="errors.redirect_type" class="mt-2 text-sm text-red-600">{{ errors.redirect_type }}</p>
              <p class="mt-1 text-sm text-gray-500">Choose the appropriate HTTP redirect status code</p>
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

          <Input
            id="description"
            v-model="form.description"
            label="Description"
            type="textarea"
            placeholder="Optional description for this redirect"
            :error="errors.description"
            help="Add a description to help identify this redirect's purpose"
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
                <p class="text-green-700">Enable this redirect in the proxy configuration</p>
              </div>
            </div>

            <div class="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div class="flex items-center h-5">
                <input
                  id="preserve_query"
                  v-model="form.preserve_query"
                  type="checkbox"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded transition-colors duration-200"
                />
              </div>
              <div class="text-sm">
                <label for="preserve_query" class="font-medium text-blue-900">Preserve Query Parameters</label>
                <p class="text-blue-700">Keep query string parameters when redirecting</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button href="/redirects" variant="outline">
              Cancel
            </Button>
            <Button type="submit" :loading="processing" variant="primary">
              Create Redirect
            </Button>
          </div>
        </form>
      </Card>
    </div>
  </AppLayout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { router } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import Card from '@/Components/Card.vue'
import Button from '@/Components/Button.vue'
import Input from '@/Components/Input.vue'

const props = defineProps({
  domains: { type: Array, required: true },
  errors: { type: Object, default: () => ({}) }
})

const form = reactive({
  domain_id: '',
  source_pattern: '',
  target_url: '',
  redirect_type: 301,
  priority: 100,
  description: '',
  is_active: true,
  preserve_query: true
})

const processing = ref(false)

const submit = () => {
  processing.value = true
  router.post('/redirects', form, {
    onFinish: () => (processing.value = false)
  })
}
</script>
