<template>
  <AppLayout title="Domínios">
    <div class="space-y-6">
      <!-- Header com ações -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold">Domínios</h1>
          <p class="text-text-muted mt-1">Gerencie os domínios do seu proxy reverso</p>
        </div>
        <Button @click="openCreateModal" variant="default" class="sm:self-end">
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
          </template>
          Adicionar Domínio
          </Button>
      </div>

      <!-- Filtros -->
        <Card>
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <label for="search" class="sr-only">Buscar</label>
            <div class="relative rounded-lg">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                          </svg>
                        </div>
              <input
                id="search"
                v-model="filters.search"
                type="search"
                class="block w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                placeholder="Buscar domínios..."
              />
                      </div>
                    </div>

          <div class="flex flex-col sm:flex-row gap-4">
            <div class="w-full sm:w-40">
              <label for="status" class="sr-only">Status</label>
              <select
                id="status"
                v-model="filters.status"
                class="block w-full border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              >
                <option value="">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            <div class="w-full sm:w-40">
              <label for="autoTLS" class="sr-only">Auto TLS</label>
              <select
                id="autoTLS"
                v-model="filters.autoTLS"
                class="block w-full border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              >
                <option value="">Todos Auto TLS</option>
                <option value="enabled">Habilitado</option>
                <option value="disabled">Desabilitado</option>
              </select>
                    </div>

            <Button variant="outline" @click="resetFilters">
              Limpar
                      </Button>
                    </div>
        </div>
      </Card>

      <!-- Tabela de Domínios -->
      <Card>
        <div v-if="loading" class="py-12 flex justify-center">
          <div class="flex flex-col items-center">
            <svg class="animate-spin h-10 w-10 text-accent mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-text-muted">Carregando domínios...</p>
          </div>
      </div>

        <div v-else-if="error" class="py-12 flex justify-center">
          <div class="flex flex-col items-center text-center">
            <svg class="h-12 w-12 text-danger mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
            <p class="text-danger font-medium mb-2">Erro ao carregar domínios</p>
            <p class="text-text-muted max-w-md">Ocorreu um erro ao carregar os dados. Por favor, tente novamente ou contate o suporte.</p>
            <Button @click="loadDomains" variant="outline" class="mt-4">
              Tentar novamente
            </Button>
                  </div>
                </div>

        <div v-else-if="filteredDomains.length === 0" class="py-12 flex justify-center">
          <div class="flex flex-col items-center text-center">
            <svg class="h-12 w-12 text-text-muted mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
            <p class="text-text font-medium mb-2">Nenhum domínio encontrado</p>
            <p class="text-text-muted max-w-md">
              {{ hasFilters ? 'Nenhum domínio corresponde aos filtros aplicados.' : 'Você ainda não tem nenhum domínio cadastrado.' }}
            </p>
            <div class="mt-4 flex space-x-3">
              <Button v-if="hasFilters" @click="resetFilters" variant="outline">
                Limpar filtros
              </Button>
              <Button @click="openCreateModal" variant="default">
                Adicionar Domínio
              </Button>
                  </div>
                </div>
              </div>
              
        <div v-else>
          <!-- Ações em lote -->
          <div v-if="selectedDomains.length > 0" class="bg-elevated p-4 rounded-lg mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p class="text-sm">
              <span class="font-medium">{{ selectedDomains.length }}</span> 
              {{ selectedDomains.length === 1 ? 'domínio selecionado' : 'domínios selecionados' }}
            </p>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" @click="toggleSelectedStatus">
                {{ allSelectedActive ? 'Desativar' : 'Ativar' }}
              </Button>
              <Button variant="danger" size="sm" @click="confirmDeleteSelected">
                Excluir
                </Button>
              <Button variant="ghost" size="sm" @click="clearSelection">
                Cancelar
                </Button>
            </div>
          </div>

          <Table :sticky-header="true" :col-span="7">
            <template #header>
              <th class="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  :checked="selectAll"
                  @change="toggleSelectAll"
                  class="rounded border-border text-accent focus:ring-accent"
                />
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Domínio
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Descrição
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Auto TLS
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Rotas
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Criado em
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                Ações
              </th>
            </template>

            <tr v-for="domain in filteredDomains" :key="domain.id" class="hover:bg-elevated">
              <td class="px-4 py-4">
                <input
                  type="checkbox"
                  :checked="isSelected(domain.id)"
                  @change="toggleSelection(domain.id)"
                  class="rounded border-border text-accent focus:ring-accent"
                />
              </td>
              <td class="px-4 py-4 font-medium">
                {{ domain.domain }}
              </td>
              <td class="px-4 py-4 text-text-muted">
                {{ domain.description || '—' }}
              </td>
              <td class="px-4 py-4">
                <Badge :variant="domain.autoTLS ? 'info' : 'neutral'">
                  {{ domain.autoTLS ? 'Habilitado' : 'Desabilitado' }}
                </Badge>
              </td>
              <td class="px-4 py-4">
                <Badge :variant="domain.active ? 'success' : 'danger'">
                  {{ domain.active ? 'Ativo' : 'Inativo' }}
                </Badge>
              </td>
              <td class="px-4 py-4">
                {{ domain.routesCount }}
              </td>
              <td class="px-4 py-4 text-text-muted">
                {{ formatDate(domain.createdAt) }}
              </td>
              <td class="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                <Button variant="ghost" size="sm" @click="editDomain(domain)">
                  Editar
                </Button>
                <Button variant="ghost" size="sm" class="text-danger" @click="confirmDelete(domain)">
                  Excluir
                </Button>
              </td>
            </tr>
          </Table>

          <!-- Paginação -->
          <div class="mt-6">
            <Pagination :links="domains.links" @navigate="goToPage" />
          </div>
          </div>
      </Card>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Link, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import Button from '@/Components/ui/Button.vue';
import Card from '@/Components/ui/Card.vue';
import Badge from '@/Components/ui/Badge.vue';
import Table from '@/Components/ui/Table.vue';
import Pagination from '@/Components/ui/Pagination.vue';
import { toast } from '@/Composables/useToast';
import { route } from '@/ziggy';

// Tipos
interface Domain {
  id: number;
  domain: string;
  description: string | null;
  autoTLS: boolean;
  active: boolean;
  routesCount: number;
  createdAt: string;
}

interface Filters {
  search: string;
  status: '' | 'active' | 'inactive';
  autoTLS: '' | 'enabled' | 'disabled';
}

// Estado
const domains = ref<{
  data: Domain[];
  links: any[];
}>({
  data: [],
  links: []
});
const loading = ref(true);
const error = ref(false);
const selectedDomains = ref<number[]>([]);
const filters = ref<Filters>({
  search: '',
  status: '',
  autoTLS: ''
});

// Computed
const filteredDomains = computed(() => {
  return domains.value.data.filter(domain => {
    // Filtro de busca
    if (filters.value.search && !domain.domain.toLowerCase().includes(filters.value.search.toLowerCase())) {
      return false;
    }
    
    // Filtro de status
    if (filters.value.status === 'active' && !domain.active) {
      return false;
    }
    if (filters.value.status === 'inactive' && domain.active) {
      return false;
    }
    
    // Filtro de autoTLS
    if (filters.value.autoTLS === 'enabled' && !domain.autoTLS) {
      return false;
    }
    if (filters.value.autoTLS === 'disabled' && domain.autoTLS) {
      return false;
    }
    
    return true;
  });
});

const selectAll = computed(() => {
  return domains.value.data.length > 0 && selectedDomains.value.length === domains.value.data.length;
});

const hasFilters = computed(() => {
  return filters.value.search !== '' || filters.value.status !== '' || filters.value.autoTLS !== '';
});

const allSelectedActive = computed(() => {
  if (selectedDomains.value.length === 0) return false;
  
  return selectedDomains.value.every(id => {
    const domain = domains.value.data.find(d => d.id === id);
    return domain && domain.active;
  });
});

// Métodos
const loadDomains = async () => {
  loading.value = true;
  error.value = false;
  
  try {
    // Simulação de carregamento de dados (em produção, use Inertia.get ou fetch)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Dados de exemplo
    domains.value = {
      data: [
        {
          id: 1,
          domain: 'example.com',
          description: 'Site principal',
          autoTLS: true,
          active: true,
          routesCount: 3,
          createdAt: '2023-08-15T14:30:00Z'
        },
        {
          id: 2,
          domain: 'api.example.com',
          description: 'API pública',
          autoTLS: true,
          active: true,
          routesCount: 5,
          createdAt: '2023-08-16T10:15:00Z'
        },
        {
          id: 3,
          domain: 'staging.example.com',
          description: 'Ambiente de homologação',
          autoTLS: false,
          active: false,
          routesCount: 2,
          createdAt: '2023-08-17T09:45:00Z'
        },
        {
          id: 4,
          domain: 'blog.example.com',
          description: null,
          autoTLS: true,
          active: true,
          routesCount: 1,
          createdAt: '2023-08-18T16:20:00Z'
        },
        {
          id: 5,
          domain: 'admin.example.com',
          description: 'Painel administrativo',
          autoTLS: true,
          active: true,
          routesCount: 4,
          createdAt: '2023-08-19T11:05:00Z'
        }
      ],
      links: [
        { url: null, label: '&laquo; Previous', active: false },
        { url: '#', label: '1', active: true },
        { url: '#', label: '2', active: false },
        { url: '#', label: '3', active: false },
        { url: '#', label: 'Next &raquo;', active: false }
      ]
    };
  } catch (e) {
    error.value = true;
    console.error('Erro ao carregar domínios:', e);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const resetFilters = () => {
  filters.value = {
    search: '',
    status: '',
    autoTLS: ''
  };
};

const isSelected = (id: number) => {
  return selectedDomains.value.includes(id);
};

const toggleSelection = (id: number) => {
  const index = selectedDomains.value.indexOf(id);
  if (index === -1) {
    selectedDomains.value.push(id);
  } else {
    selectedDomains.value.splice(index, 1);
  }
};

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedDomains.value = [];
  } else {
    selectedDomains.value = domains.value.data.map(domain => domain.id);
  }
};

const clearSelection = () => {
  selectedDomains.value = [];
};

const openCreateModal = () => {
  router.visit(route('domains.create'));
};

const editDomain = (domain: Domain) => {
  // Em produção, abra um modal ou navegue para uma página de edição
  toast.info('Editar domínio', `Editando ${domain.domain}`);
};

const confirmDelete = (domain: Domain) => {
  // Em produção, exiba um modal de confirmação
  if (confirm(`Tem certeza que deseja excluir o domínio ${domain.domain}?`)) {
    deleteDomain(domain.id);
  }
};

const deleteDomain = (id: number) => {
  // Em produção, envie uma requisição para excluir o domínio
  domains.value.data = domains.value.data.filter(domain => domain.id !== id);
  toast.success('Domínio excluído', 'O domínio foi excluído com sucesso.');
};

const confirmDeleteSelected = () => {
  // Em produção, exiba um modal de confirmação
  if (confirm(`Tem certeza que deseja excluir ${selectedDomains.value.length} domínios?`)) {
    deleteSelected();
  }
};

const deleteSelected = () => {
  // Em produção, envie uma requisição para excluir os domínios selecionados
  domains.value.data = domains.value.data.filter(domain => !selectedDomains.value.includes(domain.id));
  toast.success('Domínios excluídos', `${selectedDomains.value.length} domínios foram excluídos com sucesso.`);
  selectedDomains.value = [];
};

const toggleSelectedStatus = () => {
  // Em produção, envie uma requisição para ativar/desativar os domínios selecionados
  const newStatus = !allSelectedActive.value;
  
  domains.value.data = domains.value.data.map(domain => {
    if (selectedDomains.value.includes(domain.id)) {
      return { ...domain, active: newStatus };
    }
    return domain;
  });
  
  toast.success(
    newStatus ? 'Domínios ativados' : 'Domínios desativados',
    `${selectedDomains.value.length} domínios foram ${newStatus ? 'ativados' : 'desativados'} com sucesso.`
  );
};

const goToPage = (url: string) => {
  // Em produção, use router.get para navegar para a página
  console.log('Navegando para:', url);
};

// Lifecycle
onMounted(() => {
  loadDomains();
});
</script>