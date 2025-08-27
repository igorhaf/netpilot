<template>
  <AppLayout title="Proxy Reverso">
    <div class="p-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-text">Regras de Proxy Reverso</h1>
          <p class="text-sm text-text-muted mt-1">
            Gerencie redirecionamentos de domínios para aplicações locais
          </p>
        </div>
        <div class="flex items-center gap-3 mt-4 sm:mt-0">
          <Button 
            @click="deployNginx" 
            :disabled="isDeploying"
            variant="ghost"
          >
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </template>
            {{ isDeploying ? 'Aplicando...' : 'Aplicar Configuração' }}
          </Button>
          <Button @click="createProxy" class="bg-accent hover:bg-accent-light">
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
            </template>
            Nova Regra
          </Button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-text-muted">Total</p>
              <p class="text-2xl font-bold text-text">{{ stats.total }}</p>
            </div>
            <div class="p-3 bg-muted/20 rounded-lg">
              <svg class="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/>
              </svg>
            </div>
          </div>
        </Card>
        
        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-text-muted">Ativas</p>
              <p class="text-2xl font-bold text-success">{{ stats.active }}</p>
            </div>
            <div class="p-3 bg-success/20 rounded-lg">
              <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"/>
              </svg>
            </div>
          </div>
        </Card>

        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-text-muted">Inativas</p>
              <p class="text-2xl font-bold text-danger">{{ stats.inactive }}</p>
            </div>
            <div class="p-3 bg-danger/20 rounded-lg">
              <svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
          </div>
        </Card>

        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-text-muted">Nginx Status</p>
              <p class="text-sm font-medium text-success">Operacional</p>
            </div>
            <div class="p-3 bg-success/20 rounded-lg">
              <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/>
              </svg>
            </div>
          </div>
        </Card>
      </div>



      <!-- Filters -->
      <Card class="p-4 mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input
              v-model="filters.search"
              @input="watchSearch"
              type="text"
              placeholder="Buscar por domínio, target..."
              class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <div class="flex gap-3">
            <select
              v-model="filters.status"
              @change="watchStatus"
              class="px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>
            <Button @click="clearFilters" variant="ghost">Limpar</Button>
          </div>
        </div>
      </Card>

      <!-- Table -->
      <Card>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted/20 border-b border-border">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-text">Origem</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-text">Destino</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-text">Domínio</th>
                <th class="px-4 py-3 text-center text-sm font-medium text-text">Prioridade</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-text">Status</th>
                <th class="px-4 py-3 text-center text-sm font-medium text-text">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-if="proxyRules.data.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-text-muted">
                  Nenhuma regra de proxy encontrada
                </td>
              </tr>
              <tr v-for="(rule, index) in proxyRules.data" :key="rule.id" :class="{ 'bg-muted/10': index % 2 === 1 }">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div>
                      <div class="font-medium text-text">{{ rule.source_host }}</div>
                      <div class="text-sm text-text-muted">{{ rule.protocol }}://{{ rule.source_host }}:{{ rule.source_port }}</div>
                    </div>
                    <Button
                      @click="openUrl(`${rule.protocol}://${rule.source_host}:${rule.source_port}`)"
                      variant="ghost"
                      size="sm"
                      class="p-1"
                      title="Abrir endereço em nova aba"
                    >
                      <template #icon>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      </template>
                    </Button>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="font-medium text-text">{{ rule.target_host }}:{{ rule.target_port }}</div>
                  <div class="text-sm text-text-muted">{{ rule.protocol }}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="font-medium text-text">{{ rule.domain?.name || 'N/A' }}</div>
                  <div class="text-sm text-text-muted">{{ rule.domain?.description || '' }}</div>
                </td>
                <td class="px-4 py-3 text-center">
                  <Badge variant="neutral">{{ rule.priority }}</Badge>
                </td>
                <td class="px-4 py-3">
                  <Badge :variant="rule.is_active ? 'positive' : 'negative'">
                    {{ rule.is_active ? 'Ativo' : 'Inativo' }}
                  </Badge>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-2">
                    <Button
                      @click="toggleProxy(rule)"
                      :variant="rule.is_active ? 'outline' : 'default'"
                      size="sm"
                    >
                      {{ rule.is_active ? 'Desativar' : 'Ativar' }}
                    </Button>
                    <Button @click="editProxy(rule)" variant="ghost" size="sm">
                      <template #icon>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </template>
                    </Button>
                    <Button @click="deleteProxy(rule)" variant="danger" size="sm">
                      <template #icon>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </template>
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-border">
          <Pagination
            :current-page="proxyRules.current_page"
            :total-pages="proxyRules.last_page"
            :total-items="proxyRules.total"
            :per-page="proxyRules.per_page"
            @navigate="handlePageChange"
          />
        </div>
      </Card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import Button from '@/Components/ui/Button.vue';
import Badge from '@/Components/ui/Badge.vue';
import Card from '@/Components/ui/Card.vue';

import Pagination from '@/Components/ui/Pagination.vue';
import { useToast } from '@/Composables/useToast';


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
  domain?: {
    name: string;
    description: string;
  };
  created_at: string;
}

interface Props {
  proxyRules: {
    data: ProxyRule[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
  };
  filters?: {
    search: string;
    status: string;
  };
}

const props = defineProps<Props>();
const { success, error } = useToast();

// State - Criar refs locais das props para permitir modificação
const proxyRules = ref(props.proxyRules);
const stats = ref(props.stats);
const loading = ref(false);
const isDeploying = ref(false);
const filters = reactive({
  search: props.filters?.search || '',
  status: props.filters?.status || '',
});



// Methods
const createProxy = () => {
  router.visit('/proxy/create');
};

const editProxy = (proxyRule: ProxyRule) => {
  router.visit(`/proxy/${proxyRule.id}/edit`);
};

const toggleProxy = async (proxyRule: ProxyRule) => {
  try {
    console.log('Tentando alterar status da regra:', proxyRule.id, 'URL:', `/proxy/${proxyRule.id}/toggle`);
    await router.post(`/proxy/${proxyRule.id}/toggle`, {}, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (response) => {
        console.log('Sucesso ao alterar status:', response);
        if (response.success) {
          success(response.message || 'Status alterado com sucesso!');
          // Atualizar estado local
          proxyRule.is_active = response.is_active;
        } else {
          error(response.message || 'Erro ao alterar status da regra');
        }
      },
      onError: (errors) => {
        console.error('Erro ao alterar status:', errors);
        error('Erro ao alterar status da regra');
      }
    });
  } catch (error) {
    console.error('Exceção ao alterar status:', error);
    error('Erro ao alterar status da regra');
  }
};

const openUrl = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

const deleteProxy = (proxyRule: ProxyRule) => {
  console.log('🔴 INÍCIO deleteProxy:', {
    id: proxyRule.id,
    source_host: proxyRule.source_host,
    url: `/proxy/${proxyRule.id}`
  });
  
  if (confirm(`Tem certeza que deseja excluir a regra "${proxyRule.source_host}"?`)) {
    console.log('✅ Usuário confirmou exclusão');
    console.log('📊 Estado ANTES da exclusão:', {
      total_rules: proxyRules.value.data.length,
      total_stats: stats.value.total,
      active_stats: stats.value.active,
      inactive_stats: stats.value.inactive
    });
    
    router.delete(`/proxy/${proxyRule.id}`, {
      onBefore: () => {
        console.log('⏳ onBefore: Iniciando requisição DELETE');
        return true;
      },
      onStart: () => {
        console.log('🚀 onStart: Requisição iniciada');
      },
      onProgress: (progress) => {
        console.log('📈 onProgress:', progress);
      },
      onSuccess: (page) => {
        console.log('✅ onSuccess chamado!', {
          page_data: page,
          response_type: typeof page
        });
        
        success('Regra excluída com sucesso!');
        
        // 🔧 SOLUÇÃO: Forçar reload completo da página para garantir sincronização
        setTimeout(() => {
          console.log('🔄 Forçando reload completo da página...');
          window.location.reload();
        }, 500);
      },
      onError: (errors) => {
        console.error('❌ onError chamado:', errors);
        error('Erro ao excluir regra');
      },
      onFinish: () => {
        console.log('🏁 onFinish: Requisição finalizada');
      }
    });
  } else {
    console.log('❌ Usuário cancelou exclusão');
  }
};

const deployNginx = async () => {
  isDeploying.value = true;
  try {
    await router.post('/proxy/deploy', {}, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        success('Configuração do Nginx aplicada com sucesso!');
      },
      onError: () => {
        error('Erro ao aplicar configuração do Nginx');
      },
      onFinish: () => {
        isDeploying.value = false;
      }
    });
  } catch (error) {
    error('Erro ao aplicar configuração do Nginx');
    isDeploying.value = false;
  }
};

const clearFilters = () => {
  filters.search = '';
  filters.status = '';
  applyFilters();
};

const applyFilters = () => {
  const params = {
    search: filters.search || undefined,
    status: filters.status || undefined,
  };
  
  router.get('/proxy', params, {
    preserveState: true,
    preserveScroll: true,
  });
};

const handlePageChange = (page: number) => {
  router.get('/proxy', { page }, {
    preserveState: true,
    preserveScroll: true,
  });
};

// Watchers
let searchTimeout: NodeJS.Timeout;
const watchSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(applyFilters, 500);
};

const watchStatus = () => {
  applyFilters();
};

onMounted(() => {
  // Componente montado
});
</script>
