<template>
  <AppLayout title="Certificados SSL">
    <PageLayout>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-text">Certificados SSL</h1>
          <p class="text-sm text-text-muted mt-1">
            Gerencie certificados Let's Encrypt para seus domínios
          </p>
        </div>
        <div class="flex items-center gap-3 mt-4 sm:mt-0">
          <Button 
            @click="renewAll" 
            :disabled="isRenewing"
            variant="ghost"
          >
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </template>
            {{ isRenewing ? 'Renovando...' : 'Renovar Expirados' }}
          </Button>
          <Button @click="createSSL" class="bg-accent hover:bg-accent-light">
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
            </template>
            Novo Certificado
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
          </div>
        </Card>
        
        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-text-muted">Válidos</p>
              <p class="text-2xl font-bold text-success">{{ stats.valid }}</p>
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
              <p class="text-sm text-text-muted">Expirando</p>
              <p class="text-2xl font-bold text-warning">{{ stats.expiring }}</p>
            </div>
            <div class="p-3 bg-warning/20 rounded-lg">
              <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
          </div>
        </Card>

        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-text-muted">Expirados</p>
              <p class="text-2xl font-bold text-danger">{{ stats.expired }}</p>
            </div>
            <div class="p-3 bg-danger/20 rounded-lg">
              <svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <!-- Debug Info -->
      <Card class="p-4 mb-6 bg-yellow-50 border-yellow-200">
        <div class="text-sm">
          <h3 class="font-medium text-yellow-800 mb-2">Debug Info - SSL</h3>
          <div class="grid grid-cols-2 gap-4 text-xs">
            <div>
              <strong>Certificates Total:</strong> {{ certificates.total }}<br>
              <strong>Certificates Count:</strong> {{ certificates.data.length }}<br>
              <strong>Current Page:</strong> {{ certificates.current_page }}<br>
              <strong>Last Page:</strong> {{ certificates.last_page }}
            </div>
            <div>
              <strong>Stats Total:</strong> {{ stats.total }}<br>
              <strong>Stats Valid:</strong> {{ stats.valid }}<br>
              <strong>Stats Expiring:</strong> {{ stats.expiring }}<br>
              <strong>Stats Expired:</strong> {{ stats.expired }}
            </div>
          </div>
          <div class="mt-2">
            <strong>Sample Certificates:</strong>
            <pre class="text-xs bg-white p-2 rounded mt-1 overflow-auto">{{ JSON.stringify(certificates.data.slice(0, 2), null, 2) }}</pre>
          </div>
        </div>
      </Card>

      <!-- Filters -->
      <Card class="p-4 mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Buscar por domínio..."
              class="w-full px-3 py-2 bg-elevated border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <div class="flex gap-3">
            <select
              v-model="filters.status"
              class="px-3 py-2 bg-elevated border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="valid">Válido</option>
              <option value="expiring">Expirando</option>
              <option value="expired">Expirado</option>
              <option value="pending">Pendente</option>
              <option value="failed">Falha</option>
            </select>
            <Button @click="clearFilters" variant="ghost">Limpar</Button>
          </div>
        </div>
      </Card>

      <!-- Table -->
      <Card>
        <!-- Tabela HTML Simples para Debug -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-elevated border-b border-border">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-text-muted">Domínio Principal</th>
                <th class="px-4 py-3 text-left font-medium text-text-muted">SAN Domains</th>
                <th class="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                <th class="px-4 py-3 text-left font-medium text-text-muted">Expira em</th>
                <th class="px-4 py-3 text-left font-medium text-text-muted">Auto Renovação</th>
                <th class="px-4 py-3 text-center font-medium text-text-muted">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="certificates.data.length === 0" class="border-b border-border">
                <td colspan="6" class="px-4 py-8 text-center text-text-muted">
                  Nenhum certificado SSL encontrado
                </td>
              </tr>
              <tr v-for="cert in certificates.data" :key="cert.id" class="border-b border-border hover:bg-elevated/50">
                <td class="px-4 py-3">
                  <div class="font-medium text-text">{{ cert.domain_name }}</div>
                  <div class="text-sm text-text-muted">{{ cert.domain?.name || 'N/A' }}</div>
                </td>
                <td class="px-4 py-3">
                  <div v-if="cert.san_domains && cert.san_domains.length" class="space-y-1">
                    <div 
                      v-for="domain in cert.san_domains.slice(0, 2)" 
                      :key="domain"
                      class="text-sm text-text-muted"
                    >
                      {{ domain }}
                    </div>
                    <div v-if="cert.san_domains.length > 2" class="text-xs text-text-muted">
                      +{{ cert.san_domains.length - 2 }} mais
                    </div>
                  </div>
                  <span v-else class="text-sm text-text-muted">Nenhum</span>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                        :class="{
                          'bg-success/20 text-success': cert.status === 'valid',
                          'bg-danger/20 text-danger': cert.status === 'expired',
                          'bg-warning/20 text-warning': cert.status === 'expiring',
                          'bg-info/20 text-info': cert.status === 'pending',
                          'bg-red-500/20 text-red-400': cert.status === 'failed'
                        }">
                    {{ getStatusLabel(cert.status) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div v-if="cert.expires_at">
                    <div class="font-medium text-text">{{ formatDate(cert.expires_at) }}</div>
                    <div class="text-sm" :class="getExpiryClass(cert.expires_at)">
                      {{ getExpiryText(cert.expires_at) }}
                    </div>
                  </div>
                  <span v-else class="text-sm text-text-muted">N/A</span>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                        :class="{
                          'bg-success/20 text-success': cert.auto_renew,
                          'bg-muted/20 text-muted': !cert.auto_renew
                        }">
                    {{ cert.auto_renew ? 'Sim' : 'Não' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center gap-2">
                    <Button
                      v-if="cert.status === 'expiring' || cert.status === 'expired'"
                      @click="renewCertificate(cert)"
                      variant="default"
                      size="sm"
                    >
                      Renovar
                    </Button>
                    <Button
                      @click="toggleAutoRenew(cert)"
                      :variant="cert.auto_renew ? 'outline' : 'default'"
                      size="sm"
                    >
                      {{ cert.auto_renew ? 'Desativar Auto' : 'Ativar Auto' }}
                    </Button>
                    <Button @click="viewCertificate(cert)" variant="ghost" size="sm">
                      <template #icon>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </template>
                    </Button>
                    <Button @click="deleteCertificate(cert)" variant="danger" size="sm">
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
            :current-page="certificates.current_page"
            :total-pages="certificates.last_page"
            :total-items="certificates.total"
            :per-page="certificates.per_page"
            @navigate="handlePageChange"
          />
        </div>
      </Card>
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


interface SslCertificate {
  id: number;
  domain_id: number;
  domain_name: string;
  san_domains: string[] | null;
  status: 'pending' | 'valid' | 'expiring' | 'expired' | 'failed';
  issuer: string;
  issued_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
  domain?: {
    name: string;
    description: string;
  };
  created_at: string;
}

interface Props {
  certificates: {
    data: SslCertificate[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  stats: {
    total: number;
    valid: number;
    expiring: number;
    expired: number;
  };
}

const props = defineProps<Props>();
const { success, error } = useToast();

// State
const loading = ref(false);
const isRenewing = ref(false);
const filters = reactive({
  search: '',
  status: '',
});

// Table columns
const columns = [
  { key: 'domain_name', label: 'Domínio Principal', sortable: true },
  { key: 'san_domains', label: 'SAN Domains' },
  { key: 'status', label: 'Status' },
  { key: 'expires_at', label: 'Expira em', sortable: true },
  { key: 'auto_renew', label: 'Auto Renovação' },
  { key: 'actions', label: 'Ações', align: 'center' },
];

// Methods
const createSSL = () => {
          router.visit('/ssl/create');
};

const viewCertificate = (certificate: SslCertificate) => {
          router.visit(`/ssl/${certificate.id}`);
};

const renewCertificate = async (certificate: SslCertificate) => {
  try {
            await router.post(`/ssl/${certificate.id}/renew`, {}, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        success('Certificado renovado com sucesso!');
      },
      onError: () => {
        showToast('Erro ao renovar certificado', 'error');
      }
    });
  } catch (error) {
    showToast('Erro ao renovar certificado', 'error');
  }
};

const toggleAutoRenew = async (certificate: SslCertificate) => {
  try {
            await router.post(`/ssl/${certificate.id}/toggle`, {}, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        const action = certificate.auto_renew ? 'desativada' : 'ativada';
        showToast(`Auto renovação ${action} com sucesso!`, 'success');
      },
      onError: () => {
        showToast('Erro ao alterar auto renovação', 'error');
      }
    });
  } catch (error) {
    showToast('Erro ao alterar auto renovação', 'error');
  }
};

const deleteCertificate = (certificate: SslCertificate) => {
  if (confirm(`Tem certeza que deseja excluir o certificado para "${certificate.domain_name}"?`)) {
            router.delete(`/ssl/${certificate.id}`, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        showToast('Certificado excluído com sucesso!', 'success');
      },
      onError: () => {
        showToast('Erro ao excluir certificado', 'error');
      }
    });
  }
};

const renewAll = async () => {
  isRenewing.value = true;
  try {
            await router.post('/ssl/renew-all', {}, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        showToast('Renovação em lote iniciada!', 'success');
      },
      onError: () => {
        showToast('Erro ao iniciar renovação em lote', 'error');
      },
      onFinish: () => {
        isRenewing.value = false;
      }
    });
  } catch (error) {
    showToast('Erro ao iniciar renovação em lote', 'error');
    isRenewing.value = false;
  }
};

// Helper methods
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'valid': return 'positive';
    case 'expiring': return 'warning';
    case 'expired': return 'negative';
    case 'failed': return 'negative';
    case 'pending': return 'info';
    default: return 'neutral';
  }
};

const getStatusLabel = (status: string) => {
  const labels = {
    valid: 'Válido',
    expiring: 'Expirando',
    expired: 'Expirado',
    failed: 'Falha',
    pending: 'Pendente',
  };
  return labels[status] || status;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const getExpiryText = (expiresAt: string) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return `Expirou há ${Math.abs(diffDays)} dias`;
  if (diffDays === 0) return 'Expira hoje';
  if (diffDays === 1) return 'Expira amanhã';
  return `Expira em ${diffDays} dias`;
};

const getExpiryClass = (expiresAt: string) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'text-danger';
  if (diffDays <= 30) return 'text-warning';
  return 'text-text-muted';
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
  
          router.get('/ssl', params, {
    preserveState: true,
    preserveScroll: true,
  });
};

const handlePageChange = (page: number) => {
          router.get('/ssl', { page }, {
    preserveState: true,
    preserveScroll: true,
  });
};
</script>
