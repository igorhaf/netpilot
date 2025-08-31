<template>
  <AppLayout title="Dashboard">
    <div class="p-4 sm:p-6">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-text">Dashboard</h1>
        <p class="mt-2 text-sm text-text-muted">
          Visão geral do seu sistema de proxy reverso e certificados SSL
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <!-- Domínios -->
        <Card class="p-4 sm:p-6 hover:bg-elevated/50 transition-colors cursor-pointer" @click="goTo('/domains')">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex-1">
              <p class="text-sm text-text-muted">Domínios</p>
              <p class="text-xl sm:text-2xl font-bold text-text">{{ stats.domains.total }}</p>
              <div class="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="positive" size="sm">{{ stats.domains.active }} ativos</Badge>
                <Badge variant="neutral" size="sm">{{ stats.domains.inactive }} inativos</Badge>
              </div>
            </div>
            <div class="p-2 sm:p-3 bg-blue-500/20 rounded-lg flex-shrink-0">
              <!-- GlobeIcon do menu -->
              <svg class="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <!-- Proxy Rules -->
        <Card class="p-4 sm:p-6 hover:bg-elevated/50 transition-colors cursor-pointer" @click="goTo('/proxy')">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex-1">
              <p class="text-sm text-text-muted">Regras de Proxy</p>
              <p class="text-xl sm:text-2xl font-bold text-text">{{ stats.proxy_rules.total }}</p>
              <div class="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="positive" size="sm">{{ stats.proxy_rules.active }} ativas</Badge>
                <Badge variant="neutral" size="sm">{{ stats.proxy_rules.inactive }} inativas</Badge>
              </div>
            </div>
            <div class="p-2 sm:p-3 bg-green-500/20 rounded-lg flex-shrink-0">
              <!-- ProxyIcon do menu -->
              <svg class="w-6 h-6 sm:w-8 sm:h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 5v14M8 5v14" />
              </svg>
            </div>
          </div>
        </Card>

        <!-- SSL Certificates -->
        <Card class="p-4 sm:p-6 hover:bg-elevated/50 transition-colors cursor-pointer" @click="goTo('/ssl')">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex-1">
              <p class="text-sm text-text-muted">Certificados SSL</p>
              <p class="text-xl sm:text-2xl font-bold text-text">{{ stats.ssl_certificates.total }}</p>
              <div class="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="positive" size="sm">{{ stats.ssl_certificates.valid }} válidos</Badge>
                <Badge variant="warning" size="sm">{{ stats.ssl_certificates.expiring }} expirando</Badge>
                <Badge variant="negative" size="sm">{{ stats.ssl_certificates.expired }} expirados</Badge>
              </div>
            </div>
            <div class="p-2 sm:p-3 bg-yellow-500/20 rounded-lg flex-shrink-0">
              <!-- SSLIcon do menu -->
              <svg class="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </Card>

        <!-- Redirects -->
        <Card class="p-4 sm:p-6 hover:bg-elevated/50 transition-colors cursor-pointer" @click="goTo('/redirects')">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex-1">
              <p class="text-sm text-text-muted">Redirects</p>
              <p class="text-xl sm:text-2xl font-bold text-text">{{ stats.redirects.total }}</p>
              <div class="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="positive" size="sm">{{ stats.redirects.active }} ativos</Badge>
                <Badge variant="neutral" size="sm">{{ stats.redirects.inactive }} inativos</Badge>
              </div>
            </div>
            <div class="p-2 sm:p-3 bg-purple-500/20 rounded-lg flex-shrink-0">
              <!-- RedirectIcon do menu -->
              <svg class="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
        <!-- System Status -->
        <Card>
          <div class="p-4 sm:p-6">
            <h2 class="text-lg font-semibold text-text mb-4">Status do Sistema</h2>
            <div class="space-y-4">
              <!-- Nginx Status -->
              <div class="flex items-center justify-between p-3 sm:p-4 bg-elevated/50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                    <!-- ServerIcon do menu -->
                    <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-text">Nginx</p>
                    <p class="text-sm text-text-muted">Proxy Reverso</p>
                  </div>
                </div>
                <div class="text-right flex-shrink-0">
                  <Badge variant="positive">{{ systemStatus.nginx.status === 'operational' ? 'Operacional' : 'Offline' }}</Badge>
                  <p class="text-sm text-text-muted mt-1">Uptime: {{ systemStatus.nginx.uptime }}</p>
                </div>
              </div>

              <!-- Traefik Status -->
              <div class="flex items-center justify-between p-3 sm:p-4 bg-elevated/50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                    <!-- ShieldIcon do menu -->
                    <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-text">Traefik</p>
                    <p class="text-sm text-text-muted">SSL/TLS Manager</p>
                  </div>
                </div>
                <div class="text-right flex-shrink-0">
                  <Badge variant="positive">{{ systemStatus.traefik.status === 'operational' ? 'Operacional' : 'Offline' }}</Badge>
                  <p class="text-sm text-text-muted mt-1">Uptime: {{ systemStatus.traefik.uptime }}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <!-- Expiring Certificates -->
        <Card>
          <div class="p-4 sm:p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-text">Certificados Expirando</h2>
              <Button @click="goTo('/ssl')" variant="ghost" size="sm">
                Ver todos
              </Button>
            </div>
            <div v-if="expiringCertificates.length === 0" class="text-center py-6 sm:py-8">
              <svg class="w-10 h-10 sm:w-12 sm:h-12 text-text-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-text-muted">Todos os certificados estão válidos!</p>
            </div>
            <div v-else class="space-y-3">
              <div 
                v-for="cert in expiringCertificates.slice(0, 5)" 
                :key="cert.id"
                class="flex items-center justify-between p-3 bg-elevated/50 rounded-lg"
              >
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-text truncate">{{ cert.domain_name }}</p>
                  <p class="text-sm text-text-muted">{{ formatDate(cert.expires_at) }}</p>
                </div>
                <div class="text-right flex-shrink-0 ml-3">
                  <Badge :variant="cert.days_until_expiry <= 7 ? 'negative' : 'warning'">
                    {{ cert.days_until_expiry }} dias
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Recent Logs -->
      <Card>
        <div class="p-4 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-text">Logs Recentes</h2>
            <Button @click="goTo('/logs')" variant="ghost" size="sm">
              Ver todos logs
            </Button>
          </div>
          <div v-if="recentLogs.length === 0" class="text-center py-6 sm:py-8">
            <svg class="w-10 h-10 sm:w-12 sm:h-12 text-text-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-text-muted">Nenhum log encontrado</p>
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="log in recentLogs.slice(0, 8)" 
              :key="log.id"
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-elevated/50 rounded-lg gap-3"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="p-2 rounded-lg flex-shrink-0" :class="getLogTypeClass(log.type)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-text truncate">{{ getLogTypeLabel(log.type) }}</p>
                  <p class="text-sm text-text-muted truncate">{{ log.action }}</p>
                </div>
              </div>
              <div class="text-left sm:text-right flex-shrink-0">
                <Badge :variant="getLogStatusVariant(log.status)">
                  {{ getLogStatusLabel(log.status) }}
                </Badge>
                <p class="text-sm text-text-muted mt-1">{{ formatTime(log.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import Button from '@/Components/ui/Button.vue';
import Badge from '@/Components/ui/Badge.vue';
import Card from '@/Components/ui/Card.vue';
// A função route está disponível globalmente via window.route

interface Stats {
  domains: {
    total: number;
    active: number;
    inactive: number;
  };
  proxy_rules: {
    total: number;
    active: number;
    inactive: number;
  };
  ssl_certificates: {
    total: number;
    valid: number;
    expiring: number;
    expired: number;
  };
  redirects: {
    total: number;
    active: number;
    inactive: number;
  };
}

interface RecentLog {
  id: number;
  type: string;
  action: string;
  status: string;
  created_at: string;
  duration: number | null;
}

interface ExpiringCertificate {
  id: number;
  domain_name: string;
  expires_at: string;
  days_until_expiry: number;
  status: string;
}

interface SystemStatus {
  nginx: {
    status: string;
    uptime: string;
    last_deploy: string | null;
  };
  traefik: {
    status: string;
    uptime: string;
    last_deploy: string | null;
  };
}

interface Props {
  stats: Stats;
  recentLogs: RecentLog[];
  expiringCertificates: ExpiringCertificate[];
  systemStatus: SystemStatus;
}

const props = defineProps<Props>();

// Methods
const goTo = (path: string) => {
  router.visit(path);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR');
};

const getLogTypeLabel = (type: string) => {
  const labels = {
    nginx: 'Nginx',
    traefik: 'Traefik',
    ssl_renewal: 'SSL Renewal',
    proxy_update: 'Proxy Update',
  };
  return labels[type] || type;
};

const getLogTypeClass = (type: string) => {
  const classes = {
    nginx: 'bg-blue-500/20 text-blue-400',
    traefik: 'bg-green-500/20 text-green-400',
    ssl_renewal: 'bg-yellow-500/20 text-yellow-400',
    proxy_update: 'bg-purple-500/20 text-purple-400',
  };
  return classes[type] || 'bg-muted/20 text-muted';
};

const getLogStatusLabel = (status: string) => {
  const labels = {
    success: 'Sucesso',
    failed: 'Falha',
    running: 'Executando',
    pending: 'Pendente',
  };
  return labels[status] || status;
};

const getLogStatusVariant = (status: string) => {
  switch (status) {
    case 'success': return 'positive';
    case 'failed': return 'negative';
    case 'running': return 'info';
    case 'pending': return 'warning';
    default: return 'neutral';
  }
};
</script>