<template>
  <AppLayout title="Novo Certificado SSL">
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
          <h1 class="text-2xl font-bold text-text">Novo Certificado SSL</h1>
        </div>
        <p class="text-sm text-text-muted">
          Solicite um novo certificado SSL via Let's Encrypt
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

          <!-- Domain Name -->
          <div>
            <label for="domain_name" class="block text-sm font-medium text-text mb-2">
              Nome do Domínio Principal <span class="text-danger">*</span>
            </label>
            <input
              id="domain_name"
              v-model="form.domain_name"
              type="text"
              required
              placeholder="exemplo.com"
              class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              :class="{ 'border-danger': errors.domain_name }"
            />
            <p class="mt-1 text-xs text-text-muted">Domínio principal para o certificado</p>
            <p v-if="errors.domain_name" class="mt-2 text-sm text-danger">{{ errors.domain_name }}</p>
          </div>

          <!-- SAN Domains -->
          <div>
            <label class="block text-sm font-medium text-text mb-2">
              Domínios SAN (Subject Alternative Names)
            </label>
            <div class="space-y-3">
              <div 
                v-for="(domain, index) in form.san_domains" 
                :key="index"
                class="flex gap-3"
              >
                <input
                  v-model="domain.value"
                  type="text"
                  placeholder="www.exemplo.com"
                  class="flex-1 px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <Button 
                  @click="removeSanDomain(index)" 
                  type="button"
                  variant="danger" 
                  size="sm"
                >
                  <template #icon>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </template>
                </Button>
              </div>
              <Button 
                @click="addSanDomain" 
                type="button"
                variant="outline" 
                size="sm"
              >
                <template #icon>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                </template>
                Adicionar Domínio SAN
              </Button>
            </div>
            <p class="mt-1 text-xs text-text-muted">Domínios adicionais incluídos no mesmo certificado</p>
          </div>

          <!-- Auto Renewal Settings -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="flex items-center gap-2">
                <input
                  v-model="form.auto_renew"
                  type="checkbox"
                  class="w-4 h-4 text-accent bg-elevated border-border rounded focus:ring-accent focus:ring-2"
                />
                <span class="text-sm font-medium text-text">Renovação Automática</span>
              </label>
              <p class="mt-1 text-xs text-text-muted">Renovar automaticamente antes da expiração</p>
            </div>

            <div>
              <label for="renewal_days_before" class="block text-sm font-medium text-text mb-2">
                Dias Antes da Expiração
              </label>
              <input
                id="renewal_days_before"
                v-model="form.renewal_days_before"
                type="number"
                min="1"
                max="90"
                placeholder="30"
                class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                :class="{ 'border-danger': errors.renewal_days_before }"
              />
              <p class="mt-1 text-xs text-text-muted">Quantos dias antes da expiração renovar</p>
              <p v-if="errors.renewal_days_before" class="mt-2 text-sm text-danger">{{ errors.renewal_days_before }}</p>
            </div>
          </div>

          <!-- Preview -->
          <div v-if="form.domain_name" class="p-4 bg-elevated/50 rounded-lg border border-border">
            <h3 class="text-sm font-medium text-text mb-2">Preview do Certificado:</h3>
            <div class="text-sm text-text-muted space-y-1">
              <p><strong>Domínio Principal:</strong> {{ form.domain_name }}</p>
              <p v-if="form.san_domains.length > 0">
                <strong>Domínios SAN:</strong> {{ form.san_domains.map(d => d.value).filter(v => v).join(', ') }}
              </p>
              <p><strong>Renovação Automática:</strong> {{ form.auto_renew ? 'Sim' : 'Não' }}</p>
              <p v-if="form.auto_renew">
                <strong>Renovar:</strong> {{ form.renewal_days_before }} dias antes da expiração
              </p>
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
              {{ isSubmitting ? 'Solicitando...' : 'Solicitar Certificado SSL' }}
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
// A função route está disponível globalmente via window.route

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
  domain_name: '',
  san_domains: [] as Array<{ value: string }>,
  auto_renew: true,
  renewal_days_before: 30,
});

// Methods
const goBack = () => {
  router.visit(route('ssl.index'));
};

const addSanDomain = () => {
  form.san_domains.push({ value: '' });
};

const removeSanDomain = (index: number) => {
  form.san_domains.splice(index, 1);
};

const submitForm = async () => {
  isSubmitting.value = true;
  errors.value = {};

  try {
    // Prepare SAN domains data
    const sanDomains = form.san_domains
      .map(d => d.value)
      .filter(v => v.trim() !== '');

    const payload = {
      ...form,
      san_domains: sanDomains.length > 0 ? sanDomains : null,
    };

    await router.post(route('ssl.store'), payload, {
      onSuccess: () => {
        success('Certificado SSL solicitado com sucesso!');
      },
      onError: (validationErrors) => {
        Object.keys(validationErrors).forEach(key => {
          errors[key] = validationErrors[key];
        });
        error('Erro ao solicitar certificado SSL');
      },
      onFinish: () => {
        isSubmitting.value = false;
      }
    });
  } catch (error) {
    error('Erro ao solicitar certificado SSL');
    isSubmitting.value = false;
  }
};
</script>
