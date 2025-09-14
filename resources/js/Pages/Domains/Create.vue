<template>
  <AppLayout title="Novo Domínio">
    <div class="space-y-6">
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
          Adicione um domínio para gerenciar redirects e certificados SSL automáticos
        </p>
      </div>

      <!-- Form -->
      <Card class="w-full">
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



          <!-- Configurações Básicas -->
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-text mb-4">Configurações Básicas</h3>
              <div class="space-y-4">
                <div class="flex items-start gap-3">
                  <input
                    v-model="form.is_active"
                    id="is_active"
                    type="checkbox"
                    class="w-5 h-5 text-accent bg-elevated border-border rounded focus:ring-accent focus:ring-2 mt-0.5"
                  />
                  <div>
                    <label for="is_active" class="text-sm font-medium text-text cursor-pointer">
                      Ativar Domínio
                    </label>
                    <p class="text-xs text-text-muted mt-1">
                      Quando ativo, o domínio ficará disponível para receber tráfego e configurar redirects
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <input
                    v-model="form.auto_ssl"
                    id="auto_ssl"
                    type="checkbox"
                    class="w-5 h-5 text-accent bg-elevated border-border rounded focus:ring-accent focus:ring-2 mt-0.5"
                  />
                  <div>
                    <label for="auto_ssl" class="text-sm font-medium text-text cursor-pointer">
                      SSL Automático (Let's Encrypt)
                    </label>
                    <p class="text-xs text-text-muted mt-1">
                      Gerar e renovar automaticamente certificados SSL gratuitos via Let's Encrypt
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Configurações de Segurança -->
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-text mb-4">Configurações de Segurança</h3>
              <div class="space-y-4">
                <div class="flex items-start gap-3">
                  <input
                    v-model="form.force_https"
                    id="force_https"
                    type="checkbox"
                    class="w-5 h-5 text-accent bg-elevated border-border rounded focus:ring-accent focus:ring-2 mt-0.5"
                  />
                  <div>
                    <label for="force_https" class="text-sm font-medium text-text cursor-pointer">
                      Forçar HTTPS (Redirecionamento HTTP → HTTPS)
                    </label>
                    <p class="text-xs text-text-muted mt-1">
                      Redireciona automaticamente todo tráfego HTTP para HTTPS (recomendado)
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <input
                    v-model="form.block_external_access"
                    id="block_external_access"
                    type="checkbox"
                    class="w-5 h-5 text-accent bg-elevated border-border rounded focus:ring-accent focus:ring-2 mt-0.5"
                  />
                  <div>
                    <label for="block_external_access" class="text-sm font-medium text-text cursor-pointer">
                      Bloquear Acesso Externo Direto
                    </label>
                    <p class="text-xs text-text-muted mt-1">
                      Impede acesso direto às portas da aplicação (ex: localhost:8484) de IPs externos
                    </p>
                  </div>
                </div>

                <div v-if="form.block_external_access" class="ml-8">
                  <label for="internal_bind_ip" class="block text-sm font-medium text-text mb-2">
                    IP de Bind Interno
                  </label>
                  <select
                    id="internal_bind_ip"
                    v-model="form.internal_bind_ip"
                    class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="127.0.0.1">127.0.0.1 (Localhost apenas)</option>
                    <option value="0.0.0.0">0.0.0.0 (Todos os IPs)</option>
                  </select>
                  <p class="mt-1 text-xs text-text-muted">
                    127.0.0.1 = Acesso apenas local | 0.0.0.0 = Acesso de qualquer IP
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Configurações de Redirecionamento -->
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-text mb-4">Redirecionamento WWW</h3>
              <div class="space-y-4">
                <div class="flex items-start gap-3">
                  <input
                    v-model="form.www_redirect"
                    id="www_redirect"
                    type="checkbox"
                    class="w-5 h-5 text-accent bg-elevated border-border rounded focus:ring-accent focus:ring-2 mt-0.5"
                  />
                  <div>
                    <label for="www_redirect" class="text-sm font-medium text-text cursor-pointer">
                      Ativar Redirecionamento WWW
                    </label>
                    <p class="text-xs text-text-muted mt-1">
                      Redireciona entre www.dominio.com e dominio.com
                    </p>
                  </div>
                </div>

                <div v-if="form.www_redirect" class="ml-8">
                  <label for="www_redirect_type" class="block text-sm font-medium text-text mb-2">
                    Tipo de Redirecionamento
                  </label>
                  <select
                    id="www_redirect_type"
                    v-model="form.www_redirect_type"
                    class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="www_to_non_www">www.dominio.com → dominio.com</option>
                    <option value="non_www_to_www">dominio.com → www.dominio.com</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div v-if="form.name" class="p-4 bg-elevated/50 rounded-lg border border-border">
            <h3 class="text-sm font-medium text-text mb-3">Preview do Domínio</h3>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-accent"></div>
                <span class="text-sm font-medium text-text">{{ form.name }}</span>
                <span v-if="form.auto_ssl" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-success/10 text-success">
                  🔒 SSL Ativo
                </span>
              </div>
              <p v-if="form.description" class="text-sm text-text-muted pl-4">{{ form.description }}</p>
              <div class="flex items-center gap-4 text-xs text-text-muted pl-4">
                <span>Status: {{ form.is_active ? '✅ Ativo' : '❌ Inativo' }}</span>
                <span>SSL: {{ form.auto_ssl ? '🔒 Let\'s Encrypt' : '🔓 Desabilitado' }}</span>
                <span v-if="form.force_https">🔒 HTTPS Forçado</span>
                <span v-if="form.block_external_access">🛡️ Acesso Protegido</span>
              </div>
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

    <!-- SSL Progress Monitor -->
    <SslProgressMonitor 
      :domain-name="form.name"
      :certificate-id="createdCertificateId"
      :is-visible="showSslProgress"
      @close="closeSslProgress"
      @retry="retrySslCreation"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import Button from '@/Components/ui/Button.vue';
import Card from '@/Components/ui/Card.vue';
import SslProgressMonitor from '@/Components/SslProgressMonitor.vue';
import { useToast } from '@/Composables/useToast';

const { success, error } = useToast();

// State
const isSubmitting = ref(false);
const errors = reactive<Record<string, string>>({});
const showSslProgress = ref(false);
const createdCertificateId = ref<number | undefined>();

// Form
const form = reactive({
  name: '',
  description: '',
  is_active: true,
  auto_ssl: true,
  force_https: true,
  block_external_access: false,
  internal_bind_ip: '127.0.0.1',
  www_redirect: false,
  www_redirect_type: 'www_to_non_www',
});

// Methods
const goBack = () => {
  router.visit('/domains');
};

const submitForm = async () => {
  isSubmitting.value = true;
  Object.keys(errors).forEach(key => delete errors[key]);

  try {
    await router.post('/domains', form, {
      onSuccess: (page) => {
        success('Domínio criado com sucesso!');
        
        // Se SSL automático está ativado, mostrar monitor de progresso
        if (form.auto_ssl) {
          showSslProgress.value = true;
          // Simular ID do certificado (em produção, viria do backend)
          createdCertificateId.value = Math.floor(Math.random() * 1000);
        } else {
          // Redirecionar diretamente se não há SSL
          setTimeout(() => {
            router.visit('/domains');
          }, 1000);
        }
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
  } catch (err) {
    error('Erro ao criar domínio');
    isSubmitting.value = false;
  }
};

const closeSslProgress = () => {
  showSslProgress.value = false;
  // Redirecionar para lista de domínios
  setTimeout(() => {
    router.visit('/domains');
  }, 500);
};

const retrySslCreation = () => {
  // Em produção, fazer nova requisição para criar certificado SSL
  console.log('Retrying SSL certificate creation for domain:', form.name);
};
</script>
