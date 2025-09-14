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

          <!-- Configurações Básicas -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900">Configurações Básicas</h3>
            
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
                <label for="is_active" class="font-medium text-green-900">Domínio Ativo</label>
                <p class="text-green-700">Habilitar este domínio na configuração do proxy</p>
              </div>
            </div>

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
          </div>

          <!-- Configurações de Segurança -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900">Configurações de Segurança</h3>
            
            <div class="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div class="flex items-center h-5">
                <input
                  id="force_https"
                  v-model="form.force_https"
                  type="checkbox"
                  class="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded transition-colors duration-200"
                />
              </div>
              <div class="text-sm">
                <label for="force_https" class="font-medium text-orange-900">Forçar HTTPS</label>
                <p class="text-orange-700">Redirecionar automaticamente HTTP → HTTPS (recomendado)</p>
              </div>
            </div>

            <div class="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <div class="flex items-center h-5">
                <input
                  id="block_external_access"
                  v-model="form.block_external_access"
                  type="checkbox"
                  class="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded transition-colors duration-200"
                />
              </div>
              <div class="text-sm">
                <label for="block_external_access" class="font-medium text-red-900">Bloquear Acesso Externo</label>
                <p class="text-red-700">Impedir acesso direto às portas da aplicação (ex: localhost:8484)</p>
              </div>
            </div>

            <div v-if="form.block_external_access" class="ml-7 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label for="internal_bind_ip" class="block text-sm font-medium text-gray-700 mb-2">
                IP de Bind Interno
              </label>
              <select
                id="internal_bind_ip"
                v-model="form.internal_bind_ip"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="127.0.0.1">127.0.0.1 (Localhost apenas)</option>
                <option value="0.0.0.0">0.0.0.0 (Todos os IPs)</option>
              </select>
              <p class="mt-1 text-xs text-gray-500">
                127.0.0.1 = Acesso apenas local | 0.0.0.0 = Acesso de qualquer IP
              </p>
            </div>
          </div>

          <!-- Configurações de Redirecionamento -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900">Redirecionamento WWW</h3>
            
            <div class="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div class="flex items-center h-5">
                <input
                  id="www_redirect"
                  v-model="form.www_redirect"
                  type="checkbox"
                  class="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded transition-colors duration-200"
                />
              </div>
              <div class="text-sm">
                <label for="www_redirect" class="font-medium text-purple-900">Redirecionamento WWW</label>
                <p class="text-purple-700">Redirecionar entre www.dominio.com e dominio.com</p>
              </div>
            </div>

            <div v-if="form.www_redirect" class="ml-7 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label for="www_redirect_type" class="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Redirecionamento
              </label>
              <select
                id="www_redirect_type"
                v-model="form.www_redirect_type"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="www_to_non_www">www.dominio.com → dominio.com</option>
                <option value="non_www_to_www">dominio.com → www.dominio.com</option>
              </select>
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
  is_active: props.domain.is_active,
  force_https: props.domain.force_https ?? true,
  block_external_access: props.domain.block_external_access ?? false,
  internal_bind_ip: props.domain.internal_bind_ip || '127.0.0.1',
  www_redirect: props.domain.www_redirect ?? false,
  www_redirect_type: props.domain.www_redirect_type || 'www_to_non_www'
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
