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
              type="text"
              placeholder="Buscar por domínio, target..."
              class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <div class="flex gap-3">
            <select
              v-model="filters.status"
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
        <Table
          :columns="columns"
          :data="proxyRules.data"
          :loading="loading"
          :empty-message="'Nenhuma regra de proxy encontrada'"
          zebra
        >
          <template #source_host="{ row }">
            <div class="font-medium text-text">{{ row.source_host }}</div>
            <div class="text-sm text-text-muted">{{ row.protocol }}://{{ row.source_host }}:{{ row.source_port }}</div>
          </template>

          <template #target="{ row }">
            <div class="font-medium text-text">{{ row.target_host }}:{{ row.target_port }}</div>
            <div class="text-sm text-text-muted">{{ row.protocol }}</div>
          </template>

          <template #domain="{ row }">
            <div class="font-medium text-text">{{ row.domain?.name || 'N/A' }}</div>
            <div class="text-sm text-text-muted">{{ row.domain?.description || '' }}</div>
          </template>

          <template #is_active="{ row }">
            <Badge 
              :variant="row.is_active ? 'positive' : 'negative'"
            >
              {{ row.is_active ? 'Ativo' : 'Inativo' }}
            </Badge>
          </template>

          <template #priority="{ row }">
            <div class="text-center">
              <Badge variant="neutral">{{ row.priority }}</Badge>
            </div>
          </template>

          <template #actions="{ row }">
            <div class="flex items-center gap-2">
              <Button
                @click="toggleProxy(row)"
                :variant="row.is_active ? 'outline' : 'default'"
                size="sm"
              >
                {{ row.is_active ? 'Desativar' : 'Ativar' }}
              </Button>
              <Button @click="editProxy(row)" variant="ghost" size="sm">
                <template #icon>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </template>
              </Button>
              <Button @click="deleteProxy(row)" variant="danger" size="sm">
                <template #icon>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </template>
              </Button>
            </div>
          </template>
        </Table>

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
import Table from '@/Components/ui/Table.vue';
import Pagination from '@/Components/ui/Pagination.vue';
import { useToast } from '@/Composables/useToast';
import { route } from '@/ziggy';

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
}

const props = defineProps<Props>();
const { success, error } = useToast();

// State
const loading = ref(false);
const isDeploying = ref(false);
const filters = reactive({
  search: '',
  status: '',
});

// Table columns
const columns = [
  { key: 'source_host', label: 'Origem', sortable: true },
  { key: 'target', label: 'Destino' },
  { key: 'domain', label: 'Domínio' },
  { key: 'priority', label: 'Prioridade', sortable: true },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: 'Ações', align: 'center' },
];

// Methods
const createProxy = () => {
  router.visit(route('proxy.create'));
};

const editProxy = (proxyRule: ProxyRule) => {
  router.visit(route('proxy.edit', proxyRule.id));
};

const toggleProxy = async (proxyRule: ProxyRule) => {
  try {
    await router.post(route('proxy.toggle', proxyRule.id), {}, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        const action = proxyRule.is_active ? 'desativada' : 'ativada';
        success(`Regra ${action} com sucesso!`);
      },
      onError: () => {
        error('Erro ao alterar status da regra');
      }
    });
  } catch (error) {
          error('Erro ao alterar status da regra');
  }
};

const deleteProxy = (proxyRule: ProxyRule) => {
  if (confirm(`Tem certeza que deseja excluir a regra "${proxyRule.source_host}"?`)) {
    router.delete(route('proxy.destroy', proxyRule.id), {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        success('Regra excluída com sucesso!');
      },
      onError: () => {
        error('Erro ao excluir regra');
      }
    });
  }
};

const deployNginx = async () => {
  isDeploying.value = true;
  try {
    await router.post(route('proxy.deploy'), {}, {
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
  
  router.get(route('proxy.index'), params, {
    preserveState: true,
    preserveScroll: true,
  });
};

const handlePageChange = (page: number) => {
  router.get(route('proxy.index'), { page }, {
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
  // Watch for filter changes
  const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
  const statusSelect = document.querySelector('select') as HTMLSelectElement;
  
  if (searchInput) {
    searchInput.addEventListener('input', watchSearch);
  }
  
  if (statusSelect) {
    statusSelect.addEventListener('change', watchStatus);
  }
});
</script>
