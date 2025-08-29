<template>
  <AppLayout title="Editar Regra de Proxy">
    <div class="p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <Button @click="goBack" variant="ghost" size="sm">
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </template>
            Voltar
          </Button>
          <h1 class="text-2xl font-bold text-text">Editar Regra de Proxy</h1>
        </div>
        <p class="text-sm text-text-muted">
          Edite a configuração da regra de redirecionamento de proxy reverso
        </p>
      </div>

      <!-- Form -->
      <Card class="max-w-4xl">
        <form @submit.prevent="submitForm" class="p-6 space-y-6">
          <!-- Domain Selection -->
          <div>
            <label for="domain_id" class="block text-sm font-medium text-text mb-2">
              Domínio <span class="text-danger">*</span>
            </label>
            <select
              id="domain_id"
              v-model="form.domain_id"
              required
              class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              :class="{ 'border-danger': errors.domain_id }"
            >
              <option value="">Selecione um domínio</option>
              <option 
                v-for="domain in domains" 
                :key="domain.id" 
                :value="domain.id"
              >
                {{ domain.name }} - {{ domain.description }}
              </option>
            </select>
            <p v-if="errors.domain_id" class="mt-2 text-sm text-danger">{{ errors.domain_id }}</p>
          </div>

          <!-- Source Configuration -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="source_host" class="block text-sm font-medium text-text mb-2">
                Host de Origem <span class="text-danger">*</span>
              </label>
              <input
                id="source_host"
                v-model="form.source_host"
                type="text"
                required
                placeholder="exemplo.com"
                class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                :class="{ 'border-danger': errors.source_host }"
              />
              <p v-if="errors.source_host" class="mt-2 text-sm text-danger">{{ errors.source_host }}</p>
            </div>

            <div>
              <label for="source_port" class="block text-sm font-medium text-text mb-2">
                Porta de Origem <span class="text-danger">*</span>
              </label>
              <select
                id="source_port"
                v-model="form.source_port"
                required
                class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                :class="{ 'border-danger': errors.source_port }"
              >
                <option value="80">80 (HTTP)</option>
                <option value="443">443 (HTTPS)</option>
                <option value="8080">8080</option>
                <option value="3000">3000</option>
                <option value="9000">9000</option>
              </select>
              <p v-if="errors.source_port" class="mt-2 text-sm text-danger">{{ errors.source_port }}</p>
            </div>
          </div>

          <!-- Target Configuration -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label for="target_host" class="block text-sm font-medium text-text mb-2">
                Host de Destino <span class="text-danger">*</span>
              </label>
              <input
                id="target_host"
                v-model="form.target_host"
                type="text"
                required
                placeholder="localhost"
                class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                :class="{ 'border-danger': errors.target_host }"
              />
              <p v-if="errors.target_host" class="mt-2 text-sm text-danger">{{ errors.target_host }}</p>
            </div>

            <div>
              <label for="target_port" class="block text-sm font-medium text-text mb-2">
                Porta de Destino <span class="text-danger">*</span>
              </label>
              <input
                id="target_port"
                v-model="form.target_port"
                type="text"
                required
                placeholder="3000"
                class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                :class="{ 'border-danger': errors.target_port }"
              />
              <p v-if="errors.target_port" class="mt-2 text-sm text-danger">{{ errors.target_port }}</p>
            </div>

            <div>
              <label for="protocol" class="block text-sm font-medium text-text mb-2">
                Protocolo <span class="text-danger">*</span>
              </label>
              <select
                id="protocol"
                v-model="form.protocol"
                required
                class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                :class="{ 'border-danger': errors.protocol }"
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
              </select>
              <p v-if="errors.protocol" class="mt-2 text-sm text-danger">{{ errors.protocol }}</p>
            </div>
          </div>

          <!-- Priority and Status -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="priority" class="block text-sm font-medium text-text mb-2">
                Prioridade <span class="text-danger">*</span>
              </label>
              <input
                id="priority"
                v-model="form.priority"
                type="number"
                min="1"
                max="1000"
                required
                class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                :class="{ 'border-danger': errors.priority }"
              />
              <p class="mt-1 text-xs text-text-muted">Regras com prioridade maior são processadas primeiro</p>
              <p v-if="errors.priority" class="mt-2 text-sm text-danger">{{ errors.priority }}</p>
            </div>

            <div>
              <label class="flex items-center gap-2">
                <input
                  id="is_active"
                  v-model="form.is_active"
                  type="checkbox"
                  class="w-4 h-4 text-accent bg-elevated border-border rounded focus:ring-accent focus:ring-2"
                />
                <span class="text-sm font-medium text-text">Regra Ativa</span>
              </label>
              <p class="mt-1 text-xs text-text-muted">Regras inativas não são aplicadas ao Nginx</p>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end gap-3 pt-6 border-t border-border">
            <Button @click="goBack" variant="ghost">
              Cancelar
            </Button>
            <Button type="submit" :disabled="isSubmitting" class="bg-accent hover:bg-accent-light">
              <template #icon v-if="isSubmitting">
                <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </template>
              {{ isSubmitting ? 'Salvando...' : 'Salvar Alterações' }}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import Button from '@/Components/ui/Button.vue';
import Card from '@/Components/ui/Card.vue';
import { useToast } from '@/Composables/useToast';

interface Domain {
  id: number;
  name: string;
  description: string;
}

interface ProxyRule {
  id: number;
  domain_id: number;
  source_host: string;
  source_port: string;
  target_host: string;
  target_port: string;
  protocol: string;
  priority: number;
  is_active: boolean;
  domain?: Domain;
}

interface Props {
  proxyRule: ProxyRule;
  domains: Domain[];
}

const props = defineProps<Props>();
const { success, error } = useToast();

// State
const isSubmitting = ref(false);

// Form
const form = reactive({
  domain_id: props.proxyRule.domain_id,
  source_host: props.proxyRule.source_host,
  source_port: props.proxyRule.source_port,
  target_host: props.proxyRule.target_host,
  target_port: props.proxyRule.target_port,
  protocol: props.proxyRule.protocol,
  priority: props.proxyRule.priority,
  is_active: props.proxyRule.is_active,
});

// Errors
const errors = reactive({
  domain_id: '',
  source_host: '',
  source_port: '',
  target_host: '',
  target_port: '',
  protocol: '',
  priority: '',
});

// Methods
const goBack = () => {
  router.visit('/proxy');
};

const submitForm = async () => {
  isSubmitting.value = true;
  
  try {
    await router.post(`/proxy/${props.proxyRule.id}`, {
      _method: 'PUT',
      ...form
    }, {
      preserveState: false,
      preserveScroll: false,
      onSuccess: () => {
        success('Regra de proxy atualizada com sucesso!');
        router.visit('/proxy');
      },
      onError: (validationErrors) => {
        // Limpar erros anteriores
        Object.keys(errors).forEach(key => {
          errors[key] = '';
        });
        
        // Definir novos erros
        Object.keys(validationErrors).forEach(key => {
          if (key in errors) {
            errors[key] = validationErrors[key];
          }
        });
        
        error('Por favor, corrija os erros no formulário');
      },
      onFinish: () => {
        isSubmitting.value = false;
      }
    });
  } catch (e) {
    error('Erro ao atualizar regra de proxy');
    isSubmitting.value = false;
  }
};

onMounted(() => {
  // Formulário já inicializado com props
});
</script>
