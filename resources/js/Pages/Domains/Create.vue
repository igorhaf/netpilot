<template>
  <AppLayout title="Novo Domínio">
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
          <h1 class="text-2xl font-bold text-text">Novo Domínio</h1>
        </div>
        <p class="text-sm text-text-muted">
          Adicione um novo domínio ao sistema
        </p>
      </div>

      <!-- Form -->
      <Card class="max-w-4xl">
        <form @submit.prevent="submitForm" class="p-6 space-y-6">
          <!-- Domain Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-text mb-2">
              Nome do Domínio <span class="text-danger">*</span>
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              placeholder="exemplo.com"
              class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              :class="{ 'border-danger': errors.name }"
            />
            <p class="mt-1 text-xs text-text-muted">Nome do domínio (ex: exemplo.com, www.exemplo.com)</p>
            <p v-if="errors.name" class="mt-2 text-sm text-danger">{{ errors.name }}</p>
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-text mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              placeholder="Descrição do domínio e sua finalidade..."
              class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              :class="{ 'border-danger': errors.description }"
            ></textarea>
            <p class="mt-1 text-xs text-text-muted">Descrição opcional para identificar o domínio</p>
            <p v-if="errors.description" class="mt-2 text-sm text-danger">{{ errors.description }}</p>
          </div>

          <!-- DNS Records -->
          <div>
            <label class="block text-sm font-medium text-text mb-2">
              Registros DNS
            </label>
            <div class="space-y-3">
              <div 
                v-for="(record, index) in form.dns_records" 
                :key="index"
                class="grid grid-cols-3 gap-3"
              >
                <select
                  v-model="record.type"
                  class="px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="A">A</option>
                  <option value="CNAME">CNAME</option>
                  <option value="MX">MX</option>
                  <option value="TXT">TXT</option>
                </select>
                <input
                  v-model="record.name"
                  type="text"
                  placeholder="Nome"
                  class="px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <div class="flex gap-2">
                  <input
                    v-model="record.value"
                    type="text"
                    placeholder="Valor"
                    class="flex-1 px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                  <Button 
                    @click="removeDnsRecord(index)" 
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
              </div>
              <Button 
                @click="addDnsRecord" 
                type="button"
                variant="outline" 
                size="sm"
              >
                <template #icon>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                </template>
                Adicionar Registro DNS
              </Button>
            </div>
            <p class="mt-1 text-xs text-text-muted">Registros DNS para configuração do domínio</p>
          </div>

          <!-- Settings -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="flex items-center gap-2">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="w-4 h-4 text-accent bg-elevated border-border rounded focus:ring-accent focus:ring-2"
                />
                <span class="text-sm font-medium text-text">Domínio Ativo</span>
              </label>
              <p class="mt-1 text-xs text-text-muted">Ativar o domínio no sistema</p>
            </div>

            <div>
              <label class="flex items-center gap-2">
                <input
                  v-model="form.auto_ssl"
                  type="checkbox"
                  class="w-4 h-4 text-accent bg-elevated border-border rounded focus:ring-accent focus:ring-2"
                />
                <span class="text-sm font-medium text-text">SSL Automático</span>
              </label>
              <p class="mt-1 text-xs text-text-muted">Solicitar certificado SSL automaticamente</p>
            </div>
          </div>

          <!-- Preview -->
          <div v-if="form.name" class="p-4 bg-elevated/50 rounded-lg border border-border">
            <h3 class="text-sm font-medium text-text mb-2">Preview do Domínio:</h3>
            <div class="text-sm text-text-muted space-y-1">
              <p><strong>Nome:</strong> {{ form.name }}</p>
              <p v-if="form.description"><strong>Descrição:</strong> {{ form.description }}</p>
              <p><strong>Status:</strong> {{ form.is_active ? 'Ativo' : 'Inativo' }}</p>
              <p><strong>SSL Automático:</strong> {{ form.auto_ssl ? 'Sim' : 'Não' }}</p>
              <p v-if="form.dns_records.length > 0">
                <strong>Registros DNS:</strong> {{ form.dns_records.length }} configurado(s)
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
              {{ isSubmitting ? 'Criando...' : 'Criar Domínio' }}
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

const { success, error } = useToast();

// State
const isSubmitting = ref(false);
const errors = reactive<Record<string, string>>({});

// Form
const form = reactive({
  name: '',
  description: '',
  is_active: true,
  auto_ssl: true,
  dns_records: [] as Array<{ type: string; name: string; value: string }>,
});

// Methods
const goBack = () => {
  router.visit(route('domains.index'));
};

const addDnsRecord = () => {
  form.dns_records.push({ type: 'A', name: '', value: '' });
};

const removeDnsRecord = (index: number) => {
  form.dns_records.splice(index, 1);
};

const submitForm = async () => {
  isSubmitting.value = true;
  errors.value = {};

  try {
    // Prepare DNS records data
    const dnsRecords = form.dns_records
      .filter(record => record.name && record.value)
      .reduce((acc, record) => {
        acc[record.type] = record.value;
        return acc;
      }, {} as Record<string, string>);

    const payload = {
      ...form,
      dns_records: Object.keys(dnsRecords).length > 0 ? dnsRecords : null,
    };

    await router.post(route('domains.store'), payload, {
      onSuccess: () => {
        success('Domínio criado com sucesso!');
      },
      onError: (validationErrors) => {
        Object.keys(validationErrors).forEach(key => {
          errors[key] = validationErrors[key];
        });
        error('Erro ao criar domínio');
      },
      onFinish: () => {
        isSubmitting.value = false;
      }
    });
  } catch (error) {
    error('Erro ao criar domínio');
    isSubmitting.value = false;
  }
};
</script>
