<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Edit Upstream</h1>
        <p class="mt-2 text-sm text-gray-600">Update backend server configuration for <span class="font-semibold">{{ upstream.name }}</span>.</p>
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
            <p class="mt-1 text-sm text-gray-500">Choose the domain this upstream will serve</p>
          </div>

          <Input
            id="name"
            v-model="form.name"
            label="Upstream Name"
            type="text"
            placeholder="api-server-1"
            required
            :error="errors.name"
            help="A unique identifier for this upstream server"
          />

          <Input
            id="target_url"
            v-model="form.target_url"
            label="Target URL"
            type="url"
            placeholder="http://localhost:3000"
            required
            :error="errors.target_url"
            help="The backend server URL including protocol and port"
          />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="weight"
              v-model="form.weight"
              label="Weight"
              type="number"
              min="1"
              max="100"
              :error="errors.weight"
              help="Load balancing weight (1-100)"
            />

            <Input
              id="health_check_interval"
              v-model="form.health_check_interval"
              label="Health Check Interval (seconds)"
              type="number"
              min="10"
              max="3600"
              :error="errors.health_check_interval"
              help="How often to check server health"
            />
          </div>

          <Input
            id="health_check_path"
            v-model="form.health_check_path"
            label="Health Check Path"
            type="text"
            placeholder="/health"
            :error="errors.health_check_path"
            help="Optional path for health checks (e.g., /health, /status)"
          />

          <Input
            id="description"
            v-model="form.description"
            label="Description"
            type="textarea"
            placeholder="Optional description for this upstream"
            :error="errors.description"
            help="Add a description to help identify this upstream's purpose"
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
                <p class="text-green-700">Enable this upstream in the load balancer configuration</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button href="/upstreams" variant="outline">
              Cancel
            </Button>
            <Button type="submit" :loading="processing" variant="primary">
              Update Upstream
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
  upstream: { type: Object, required: true },
  domains: { type: Array, required: true },
  errors: { type: Object, default: () => ({}) }
})

const form = reactive({
  domain_id: props.upstream.domain_id,
  name: props.upstream.name,
  target_url: props.upstream.target_url,
  weight: props.upstream.weight || 100,
  health_check_path: props.upstream.health_check_path || '/health',
  health_check_interval: props.upstream.health_check_interval || 30,
  description: props.upstream.description || '',
  is_active: props.upstream.is_active
})

const processing = ref(false)

const submit = () => {
  processing.value = true
  router.put(`/upstreams/${props.upstream.id}`, form, {
    onFinish: () => (processing.value = false)
  })
}
</script>
