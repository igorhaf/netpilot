<template>
  <AppLayout>
    <div class="px-4 py-6 sm:px-0">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Editar Domínio</h1>
        <p class="mt-2 text-sm text-gray-600">Atualizar configuração do domínio e configurações SSL para <span class="font-semibold">{{ domain.name }}</span>.</p>
      </div>

      <Card class="max-w-2xl">
        <form @submit.prevent="submit" class="space-y-6">
          <Input
            id="name"
            v-model="form.name"
            label="Nome do Domínio"
            type="text"
            placeholder="exemplo.com"
            required
            :error="errors.name"
            help="Digite um nome de domínio válido (ex: exemplo.com, api.exemplo.com)"
          />

          <Input
            id="description"
            v-model="form.description"
            label="Descrição"
            type="textarea"
            placeholder="Descrição opcional para este domínio"
            :error="errors.description"
            help="Adicione uma descrição para ajudar a identificar o propósito deste domínio"
            :rows="3"
          />

          <div class="space-y-4">
            <div class="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div class="flex items-center h-5">
                <input
                  id="auto_ssl"
                  v-model="form.auto_ssl"
                  type="checkbox"
                  class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded transition-colors duration-200"
                />
              </div>
              <div class="text-sm">
                <label for="auto_ssl" class="font-medium text-blue-900">SSL Automático (Let's Encrypt)</label>
                <p class="text-blue-700">Obter e renovar automaticamente certificados SSL via Let's Encrypt</p>
              </div>
            </div>

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
                <p class="text-green-700">Enable this domain in the proxy configuration</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button @click="router.visit('/domains')" variant="outline">
              Cancelar
            </Button>
            <Button type="submit" :loading="processing" variant="default">
              Atualizar Domínio
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
import Card from '@/Components/ui/Card.vue'
import Button from '@/Components/ui/Button.vue'
import Input from '@/Components/Input.vue'

const props = defineProps({
  domain: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) }
})

const form = reactive({
  name: props.domain.name,
  description: props.domain.description || '',
  auto_ssl: props.domain.auto_ssl,
  is_active: props.domain.is_active
})

const processing = ref(false)

const submit = () => {
  processing.value = true
  router.put(`/domains/${props.domain.id}`, form, {
    onSuccess: () => {
      // Redirecionar para a lista de domínios após sucesso
      router.visit('/domains');
    },
    onError: (errors) => {
      console.error('Erro ao atualizar domínio:', errors);
    },
    onFinish: () => {
      processing.value = false;
    }
  })
}
</script>
