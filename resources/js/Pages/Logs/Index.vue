<template>
  <AppLayout title="Logs">
    <PageLayout>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-text">Logs de Deployment</h1>
          <p class="text-sm text-text-muted mt-1">
            Acompanhe execuções de deploy do Nginx, Traefik e renovações SSL
          </p>
        </div>
        <div class="flex items-center gap-3 mt-4 sm:mt-0">
          <Button @click="refreshLogs" variant="ghost">
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </template>
            Atualizar
          </Button>
          <Button @click="clearLogs" variant="outline">
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </template>
            Limpar Logs
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>
        </Card>
        
        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-text-muted">Sucesso</p>
              <p class="text-2xl font-bold text-success">{{ stats.success }}</p>
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
              <p class="text-sm text-text-muted">Falhas</p>
              <p class="text-2xl font-bold text-danger">{{ stats.failed }}</p>
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
              <p class="text-sm text-text-muted">Executando</p>
              <p class="text-2xl font-bold text-info">{{ stats.running }}</p>
            </div>
            <div class="p-3 bg-info/20 rounded-lg">
              <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
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
              placeholder="Buscar nos logs..."
              class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <div class="flex gap-3">
            <select
              v-model="filters.type"
              class="px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">Todos os tipos</option>
              <option v-for="(label, value) in types" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
            <select
              v-model="filters.status"
              class="px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option v-for="(label, value) in statuses" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
            <Button @click="clearFilters" variant="ghost">Limpar</Button>
          </div>
        </div>
      </Card>

      <!-- Logs Table -->
      <Card>
        <!-- Tabela HTML Simples para Debug -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-elevated border-b border-border">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-text-muted">Tipo / Ação</th>
                <th class="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                <th class="px-4 py-3 text-left font-medium text-text-muted">Iniciado em</th>
                <th class="px-4 py-3 text-left font-medium text-text-muted">Duração</th>
                <th class="px-4 py-3 text-center font-medium text-text-muted">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="logs.data.length === 0" class="border-b border-border">
                <td colspan="5" class="px-4 py-8 text-center text-text-muted">
                  Nenhum log encontrado
                </td>
              </tr>
              <tr v-for="log in logs.data" :key="log.id" class="border-b border-border hover:bg-elevated/50">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="p-1 rounded" :class="getTypeIconClass(log.type)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <div>
                      <div class="font-medium text-text">{{ types[log.type] || log.type }}</div>
                      <div class="text-sm text-text-muted">{{ formatAction(log.action) }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                        :class="{
                          'bg-success/20 text-success': log.status === 'success',
                          'bg-danger/20 text-danger': log.status === 'failed',
                          'bg-info/20 text-info': log.status === 'running',
                          'bg-warning/20 text-warning': log.status === 'pending'
                        }">
                    {{ statuses[log.status] || log.status }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="font-medium text-text">{{ formatDate(log.created_at) }}</div>
                  <div class="text-sm text-text-muted">{{ formatTime(log.created_at) }}</div>
                </td>
                <td class="px-4 py-3">
                  <div v-if="log.started_at && log.completed_at" class="text-sm">
                    {{ formatDuration(log.started_at, log.completed_at) }}
                  </div>
                  <div v-else-if="log.status === 'running'" class="text-sm text-info">
                    Executando...
                  </div>
                  <div v-else class="text-sm text-text-muted">-</div>
                </td>
                <td class="px-4 py-3 text-center">
                  <Button 
                    @click="viewLogDetails(log)" 
                    variant="ghost" 
                    size="sm"
                  >
                    <template #icon>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    </template>
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-border">
          <Pagination
            :current-page="logs.current_page"
            :total-pages="logs.last_page"
            :total-items="logs.total"
            :per-page="logs.per_page"
            @navigate="handlePageChange"
          />
        </div>
      </Card>
    

    <!-- Log Details Modal -->
    <div
      v-if="selectedLog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click="closeModal"
    >
      <div 
        class="bg-surface rounded-2xl border border-border max-w-4xl w-full max-h-[80vh] overflow-hidden"
        @click.stop
      >
        <div class="p-6 border-b border-border">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-text">Detalhes do Log</h2>
              <p class="text-sm text-text-muted">{{ types[selectedLog.type] }} - {{ selectedLog.action }}</p>
            </div>
            <Button @click="closeModal" variant="ghost">
              <template #icon>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </template>
            </Button>
          </div>
        </div>
        
        <div class="p-6 overflow-y-auto max-h-96">
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-text-muted">Status:</label>
              <Badge :variant="getStatusVariant(selectedLog.status)" class="ml-2">
                {{ statuses[selectedLog.status] }}
              </Badge>
            </div>
            
            <div v-if="selectedLog.output" class="space-y-2">
              <label class="text-sm font-medium text-text-muted">Saída:</label>
              <pre class="bg-elevated border border-border rounded-lg p-4 text-sm text-text overflow-x-auto">{{ selectedLog.output }}</pre>
            </div>
            
            <div v-if="selectedLog.error" class="space-y-2">
              <label class="text-sm font-medium text-text-muted">Erro:</label>
              <pre class="bg-danger/10 border border-danger/20 rounded-lg p-4 text-sm text-danger overflow-x-auto">{{ selectedLog.error }}</pre>
            </div>
            
            <div v-if="selectedLog.payload" class="space-y-2">
              <label class="text-sm font-medium text-text-muted">Payload:</label>
              <pre class="bg-elevated border border-border rounded-lg p-4 text-sm text-text overflow-x-auto">{{ JSON.stringify(selectedLog.payload, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageLayout>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import PageLayout from '@/Components/PageLayout.vue';
import Button from '@/Components/ui/Button.vue';
import Badge from '@/Components/ui/Badge.vue';
import Card from '@/Components/ui/Card.vue';
import Pagination from '@/Components/ui/Pagination.vue';
import { useToast } from '@/Composables/useToast';

interface DeploymentLog {
  id: number;
  type: 'nginx' | 'traefik' | 'ssl_renewal' | 'proxy_update';
  action: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  payload: any;
  output: string | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface Props {
  logs: {
    data: DeploymentLog[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  stats: {
    total: number;
    success: number;
    failed: number;
    running: number;
  };
  types: Record<string, string>;
  statuses: Record<string, string>;
  filters: {
    type?: string;
    status?: string;
    search?: string;
  };
}

const props = defineProps<Props>();
const { success, error } = useToast();

// State
const loading = ref(false);
const selectedLog = ref<DeploymentLog | null>(null);
const filters = reactive({
  search: props.filters.search || '',
  type: props.filters.type || '',
  status: props.filters.status || '',
});

// Table columns (não usado na tabela HTML simples)
// const columns = [
//   { key: 'type', label: 'Tipo / Ação' },
//   { key: 'status', label: 'Status' },
//   { key: 'created_at', label: 'Iniciado em', sortable: true },
//   { key: 'duration', label: 'Duração' },
//   { key: 'actions', label: 'Ações', align: 'center' },
// ];

// Methods
const refreshLogs = () => {
  loading.value = true;
  router.visit(window.location.pathname, {
    only: ['logs', 'stats', 'types', 'statuses', 'filters'],
    preserveState: false,
    preserveScroll: false,
    onFinish: () => {
      loading.value = false;
    }
  });
};

const clearLogs = () => {
  if (confirm('Tem certeza que deseja limpar todos os logs (exceto os em execução)?')) {
    loading.value = true;
    router.post('/logs/clear', {}, {
      preserveState: false,
      preserveScroll: false,
      onSuccess: (response) => {
        if (response.success) {
          success(response.message || 'Logs limpos com sucesso!');
          
          // Mostrar detalhes da limpeza se disponível
          if (response.details) {
            const details = response.details;
            console.log('Detalhes da limpeza:', details);
            
            // Mostrar toast com detalhes
            if (details.stuck_running_logs > 0) {
              success(`Logs travados removidos: ${details.stuck_running_logs}`);
            }
          }
          
          // Recarregar os logs após limpeza
          refreshLogs();
        } else {
          error(response.message || 'Erro ao limpar logs');
        }
      },
      onError: (errors) => {
        error('Erro ao limpar logs');
        console.error('Erro:', errors);
      },
      onFinish: () => {
        loading.value = false;
      }
    });
  }
};

const viewLogDetails = (log: DeploymentLog) => {
  selectedLog.value = log;
};

const closeModal = () => {
  selectedLog.value = null;
};

// Helper methods
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'success': return 'positive';
    case 'failed': return 'negative';
    case 'running': return 'info';
    case 'pending': return 'warning';
    default: return 'neutral';
  }
};

const getTypeIcon = (type: string) => {
  const icons = {
    nginx: 'ServerIcon',
    traefik: 'ShieldIcon', 
    ssl_renewal: 'CertificateIcon',
    proxy_update: 'ArrowsIcon',
    domain: 'GlobeIcon',
    redirect: 'RedirectIcon',
  };
  return icons[type] || 'DocumentIcon';
};

const getTypeIconClass = (type: string) => {
  const classes = {
    nginx: 'bg-blue-500/20 text-blue-400',
    traefik: 'bg-green-500/20 text-green-400',
    ssl_renewal: 'bg-yellow-500/20 text-yellow-400',
    proxy_update: 'bg-purple-500/20 text-purple-400',
    domain: 'bg-blue-500/20 text-blue-400',
    redirect: 'bg-purple-500/20 text-purple-400',
  };
  return classes[type] || 'bg-muted/20 text-muted';
};

// Função para formatar a ação de forma mais legível
const formatAction = (action: string) => {
  const actionMap: Record<string, string> = {
    'issue_certificate': 'Emissão de Certificado',
    'domain_validation': 'Validação do Domínio',
    'port_check': 'Verificação de Portas',
    'environment_prep': 'Preparação do Ambiente',
    'certificate_issuance': 'Emissão do Certificado',
    'certificate_application': 'Aplicação do Certificado',
    'final_verification': 'Verificação Final',
    'renew_certificate': 'Renovação de Certificado',
    'renewal_preparation': 'Preparação da Renovação',
    'renewal_execution': 'Execução da Renovação',
    'renewal_verification': 'Verificação da Renovação',
    'revoke_certificate': 'Revogação de Certificado',
    'revocation_preparation': 'Preparação da Revogação',
    'revocation_execution': 'Execução da Revogação',
    'revocation_cleanup': 'Limpeza da Revogação',
    'create': 'Criação',
    'update': 'Atualização',
    'delete': 'Exclusão',
  };
  
  return actionMap[action] || action;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('pt-BR');
};

const formatDuration = (startedAt: string, completedAt: string) => {
  const start = new Date(startedAt);
  const end = new Date(completedAt);
  const diffMs = end.getTime() - start.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  
  if (diffSeconds < 60) return `${diffSeconds}s`;
  
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

const clearFilters = () => {
  filters.search = '';
  filters.type = '';
  filters.status = '';
  applyFilters();
};

const applyFilters = () => {
  const params = {
    search: filters.search || undefined,
    type: filters.type || undefined,
    status: filters.status || undefined,
  };
  
  router.get(route('logs.index'), params, {
    preserveState: true,
    preserveScroll: true,
  });
};

const handlePageChange = (page: number) => {
  router.get(route('logs.index'), { page }, {
    preserveState: true,
    preserveScroll: true,
  });
};

// Icon components
const ServerIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/>
    </svg>
  `
};

const ShieldIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  `
};

const CertificateIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
    </svg>
  `
};

const ArrowsIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
    </svg>
  `
};

const DocumentIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  `
};

// Extra icons matching sidebar
const GlobeIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `
};

const RedirectIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  `
};
</script>
