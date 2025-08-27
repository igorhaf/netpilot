<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Edit Redirect</h1>
        <p class="mt-2 text-sm text-gray-600">Update redirect rule configuration for <span class="font-semibold font-mono">{{ redirect.source_pattern }}</span>.</p>
      </div>

      <Card class="max-w-2xl">
        <form @submit.prevent="submit" class="space-y-6">
          <div>
            <label for="domain_id" class="block text-sm font-medium text-text mb-2">Domínio</label>
            <select
              id="domain_id"
              v-model="form.domain_id"
              required
              class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              :class="{ 'border-danger': errors.domain_id }"
            >
              <option value="">Selecione um domínio</option>
              <option v-for="domain in domains" :key="domain.id" :value="domain.id">
                {{ domain.name }}
              </option>
            </select>
            <p v-if="errors.domain_id" class="mt-2 text-sm text-danger">{{ errors.domain_id }}</p>
            <p class="mt-1 text-sm text-text-muted">Escolha o domínio ao qual este redirect se aplica</p>
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
              <label for="redirect_type" class="block text-sm font-medium text-text mb-2">Tipo de Redirect</label>
              <select
                id="redirect_type"
                v-model="form.redirect_type"
                required
                class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                :class="{ 'border-danger': errors.redirect_type }"
              >
                <option value="301">301 - Redirecionamento Permanente</option>
                <option value="302">302 - Redirecionamento Temporário</option>
                <option value="303">303 - Ver Outro</option>
                <option value="307">307 - Redirecionamento Temporário (Preserva Método)</option>
                <option value="308">308 - Redirecionamento Permanente (Preserva Método)</option>
              </select>
                              <p v-if="errors.redirect_type" class="mt-2 text-sm text-danger">{{ errors.redirect_type }}</p>
                <p class="mt-1 text-sm text-text-muted">Escolha o código de status HTTP apropriado</p>
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
              Update Redirect
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
  redirect: { type: Object, required: true },
  domains: { type: Array, required: true },
  errors: { type: Object, default: () => ({}) }
})

const form = reactive({
  domain_id: props.redirect.domain_id,
  source_pattern: props.redirect.source_pattern,
  target_url: props.redirect.target_url,
  redirect_type: props.redirect.redirect_type || 301,
  priority: props.redirect.priority || 100,
  description: props.redirect.description || '',
  is_active: props.redirect.is_active,
  preserve_query: props.redirect.preserve_query
})

const processing = ref(false)

const submit = () => {
  processing.value = true
  router.put(`/redirects/${props.redirect.id}`, form, {
    onFinish: () => (processing.value = false)
  })
}
</script>
