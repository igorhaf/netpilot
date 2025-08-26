<template>
  <AppLayout title="Nova Regra de Redirect">
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
          <h1 class="text-2xl font-bold text-text">Nova Regra de Redirect</h1>
        </div>
        <p class="text-sm text-text-muted">
          Configure uma nova regra de redirecionamento HTTP
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

          <!-- Source and Target Configuration -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="source_pattern" class="block text-sm font-medium text-text mb-2">
                Caminho de Origem <span class="text-danger">*</span>
              </label>
              <input
                id="source_pattern"
                v-model="form.source_pattern"
                type="text"
                required
                placeholder="/old-path"
                class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                :class="{ 'border-danger': errors.source_pattern }"
              />
              <p class="mt-1 text-xs text-text-muted">Ex: /old-path, /api/v1/*, /blog/*</p>
              <p v-if="errors.source_pattern" class="mt-2 text-sm text-danger">{{ errors.source_pattern }}</p>
            </div>

            <div>
              <label for="target_url" class="block text-sm font-medium text-text mb-2">
                URL de Destino <span class="text-danger">*</span>
              </label>
              <input
                id="target_url"
                v-model="form.target_url"
                type="url"
                required
                placeholder="https://exemplo.com/new-path"
                class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                :class="{ 'border-danger': errors.target_url }"
              />
              <p class="mt-1 text-xs text-text-muted">URL completa para onde redirecionar</p>
              <p v-if="errors.target_url" class="mt-2 text-sm text-danger">{{ errors.target_url }}</p>
            </div>
          </div>

          <!-- Redirect Configuration -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label for="redirect_type" class="block text-sm font-medium text-text mb-2">
                Tipo de Redirect <span class="text-danger">*</span>
              </label>
              <select
                id="redirect_type"
                v-model="form.redirect_type"
                required
                class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                :class="{ 'border-danger': errors.redirect_type }"
              >
                <option value="301">301 - Permanente</option>
                <option value="302">302 - Temporário</option>
                <option value="307">307 - Temporário (mantém método)</option>
                <option value="308">308 - Permanente (mantém método)</option>
              </select>
              <p v-if="errors.redirect_type" class="mt-2 text-sm text-danger">{{ errors.redirect_type }}</p>
            </div>

            <div>
              <label for="priority" class="block text-sm font-medium text-text mb-2">
                Prioridade
              </label>
              <input
                id="priority"
                v-model="form.priority"
                type="number"
                min="1"
                max="1000"
                placeholder="100"
                class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                :class="{ 'border-danger': errors.priority }"
              />
              <p class="mt-1 text-xs text-text-muted">Menor número = maior prioridade</p>
              <p v-if="errors.priority" class="mt-2 text-sm text-danger">{{ errors.priority }}</p>
            </div>

            <div class="flex flex-col justify-end">
              <label class="flex items-center gap-2">
                <input
                  v-model="form.preserve_query"
                  type="checkbox"
                  class="w-4 h-4 text-accent bg-elevated border-border rounded focus:ring-accent focus:ring-2"
                />
                <span class="text-sm font-medium text-text">Manter Query Strings</span>
              </label>
              <p class="mt-1 text-xs text-text-muted">Preservar parâmetros ?param=value</p>
            </div>
          </div>

          <!-- Status -->
          <div>
            <label class="flex items-center gap-2">
              <input
                v-model="form.is_active"
                type="checkbox"
                class="w-4 h-4 text-accent bg-elevated border-border rounded focus:ring-accent focus:ring-2"
              />
              <span class="text-sm font-medium text-text">Ativar regra imediatamente</span>
            </label>
            <p class="mt-1 text-xs text-text-muted">A regra será aplicada ao Nginx se marcada</p>
          </div>

          <!-- Preview -->
          <div v-if="form.source_pattern && form.target_url" class="p-4 bg-elevated/50 rounded-lg border border-border">
            <h3 class="text-sm font-medium text-text mb-2">Preview da Regra:</h3>
            <div class="text-sm text-text-muted space-y-1">
              <p><strong>Origem:</strong> {{ form.source_pattern }}</p>
              <p><strong>Destino:</strong> {{ form.target_url }}</p>
              <p><strong>Tipo:</strong> {{ getRedirectTypeName(form.redirect_type) }}</p>
              <p><strong>Prioridade:</strong> {{ form.priority }}</p>
              <p><strong>Query Strings:</strong> {{ form.preserve_query ? 'Preservar' : 'Ignorar' }}</p>
              <p><strong>Status:</strong> {{ form.is_active ? 'Ativa' : 'Inativa' }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <Button @click="goBack" type="button" variant="ghost">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              :disabled="isSubmitting"
              class="bg-accent hover:bg-accent-light"
            >
              <template #icon v-if="isSubmitting">
                <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </template>
              {{ isSubmitting ? 'Criando...' : 'Criar Regra de Redirect' }}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import Button from '@/Components/ui/Button.vue';
import Card from '@/Components/ui/Card.vue';
import { useToast } from '@/Composables/useToast';
import { route } from '@/ziggy';

interface Domain {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface Props {
  domains: Domain[];
}

const props = defineProps<Props>();
const { success, error } = useToast();

// State
const isSubmitting = ref(false);
const errors = reactive<Record<string, string>>({});

// Form
const form = reactive({
  domain_id: '',
  source_pattern: '',
  target_url: '',
  redirect_type: 301,
  priority: 100,
  is_active: true,
  preserve_query: true,
});

// Methods
const goBack = () => {
  router.visit(route('redirects.index'));
};

const getRedirectTypeName = (type: number): string => {
  const types = {
    301: '301 - Permanente',
    302: '302 - Temporário',
    307: '307 - Temporário (mantém método)',
    308: '308 - Permanente (mantém método)',
  };
  return types[type as keyof typeof types] || 'Desconhecido';
};

const submitForm = async () => {
  isSubmitting.value = true;
  errors.value = {};

  try {
    await router.post(route('redirects.store'), form, {
      onSuccess: () => {
        success('Regra de redirect criada com sucesso!');
      },
      onError: (validationErrors) => {
        Object.keys(validationErrors).forEach(key => {
          errors[key] = validationErrors[key];
        });
        error('Erro ao criar regra de redirect');
      },
      onFinish: () => {
        isSubmitting.value = false;
      }
    });
  } catch (error) {
    error('Erro ao criar regra de redirect');
    isSubmitting.value = false;
  }
};
</script>