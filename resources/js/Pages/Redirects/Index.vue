<template>
  <AppLayout title="Redirects">
    <div class="space-y-6">
      <!-- Header com ações -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold">Redirects</h1>
          <p class="text-text-muted mt-1">Gerencie os redirecionamentos de URL do proxy</p>
        </div>
        <Button @click="openCreateModal" variant="default" class="sm:self-end">
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
          </template>
          Adicionar Redirect
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
                placeholder="Buscar redirects..."
              />
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4">
            <div class="w-full sm:w-40">
              <label for="type" class="sr-only">Tipo</label>
              <select
                id="type"
                v-model="filters.type"
                class="block w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-sm"
              >
                <option value="">Todos os tipos</option>
                <option value="301">301 - Permanente</option>
                <option value="302">302 - Temporário</option>
              </select>
            </div>

            <div class="w-full sm:w-40">
              <label for="status" class="sr-only">Status</label>
              <select
                id="status"
                v-model="filters.status"
                class="block w-full px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-sm"
              >
                <option value="">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            <Button variant="outline" @click="resetFilters">
              Limpar
            </Button>
          </div>
        </div>
      </Card>

      <!-- Tabela de Redirects -->
      <Card>
        <div v-if="loading" class="py-12 flex justify-center">
          <div class="flex flex-col items-center">
            <svg class="animate-spin h-10 w-10 text-accent mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
            <p class="text-text-muted">Carregando redirects...</p>
                        </div>
                      </div>

        <div v-else-if="filteredRedirects.length === 0" class="py-12 flex justify-center">
          <div class="flex flex-col items-center text-center">
            <svg class="h-12 w-12 text-text-muted mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7l4-4m0 0l4 4m-4-4v18" />
            </svg>
            <p class="text-text font-medium mb-2">Nenhum redirect encontrado</p>
            <p class="text-text-muted max-w-md">
              {{ hasFilters ? 'Nenhum redirect corresponde aos filtros aplicados.' : 'Você ainda não tem nenhum redirect cadastrado.' }}
            </p>
            <div class="mt-4 flex space-x-3">
              <Button v-if="hasFilters" @click="resetFilters" variant="outline">
                Limpar filtros
              </Button>
              <Button @click="openCreateModal" variant="default">
                Adicionar Redirect
              </Button>
                        </div>
                      </div>
                    </div>

        <div v-else>
          <Table :sticky-header="true" :col-span="7">
            <template #header>
              <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Domínio
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Padrão Origem
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                URL Destino
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Tipo
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Prioridade
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Status
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                Ações
              </th>
            </template>

            <tr v-for="redirect in filteredRedirects" :key="redirect.id" class="hover:bg-elevated">
              <td class="px-4 py-4">
                    <div class="flex items-center">
                  <div class="flex-shrink-0 h-8 w-8 bg-surface rounded-lg flex items-center justify-center mr-3">
                    <svg class="h-4 w-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7l4-4m0 0l4 4m-4-4v18" />
                    </svg>
                  </div>
                  <span class="font-medium">{{ redirect.domain.name }}</span>
                    </div>
                  </td>
              <td class="px-4 py-4">
                <code class="bg-surface px-2 py-1 rounded text-sm">{{ redirect.source_pattern }}</code>
              </td>
              <td class="px-4 py-4">
                <a :href="redirect.target_url" target="_blank" class="text-accent hover:underline">
                      {{ redirect.target_url }}
                </a>
                  </td>
              <td class="px-4 py-4">
                <Badge :variant="redirect.redirect_type === 301 ? 'warning' : 'info'">
                  {{ redirect.redirect_type }} {{ redirect.redirect_type === 301 ? 'Permanente' : 'Temporário' }}
                </Badge>
                  </td>
              <td class="px-4 py-4">
                <span class="text-sm">{{ redirect.priority }}</span>
                  </td>
              <td class="px-4 py-4">
                <Badge :variant="redirect.is_active ? 'success' : 'danger'">
                  {{ redirect.is_active ? 'Ativo' : 'Inativo' }}
                </Badge>
                  </td>
              <td class="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                <Button variant="ghost" size="sm" @click="editRedirect(redirect)">
                  Editar
                      </Button>
                <Button variant="ghost" size="sm" class="text-danger" @click="confirmDelete(redirect)">
                  Excluir
                      </Button>
                  </td>
                </tr>
          </Table>
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
import { toast } from '@/Composables/useToast';

// Props
interface Props {
  redirects: {
    data: Redirect[];
    links: any[];
    total?: number;
  };
  stats?: {
    total: number;
    active: number;
    inactive: number;
  };
}

const props = defineProps<Props>();

// Tipos
interface Redirect {
  id: number;
  domain: {
    id: number;
    name: string;
  };
  source_pattern: string;
  target_url: string;
  redirect_type: number;
  priority: number;
  is_active: boolean;
  preserve_query: boolean;
  created_at: string;
}

interface Filters {
  search: string;
  type: '' | '301' | '302';
  status: '' | 'active' | 'inactive';
}

// Estado
const redirects = ref(props.redirects);
const loading = ref(false);
const filters = ref<Filters>({
  search: '',
  type: '',
  status: ''
});

// Computed
const filteredRedirects = computed(() => {
  return redirects.value.data.filter(redirect => {
    // Filtro de busca
    if (filters.value.search && 
        !redirect.domain.name.toLowerCase().includes(filters.value.search.toLowerCase()) &&
        !redirect.source_pattern.toLowerCase().includes(filters.value.search.toLowerCase()) &&
        !redirect.target_url.toLowerCase().includes(filters.value.search.toLowerCase())) {
      return false;
    }
    
    // Filtro de tipo
    if (filters.value.type && redirect.redirect_type.toString() !== filters.value.type) {
      return false;
    }
    
    // Filtro de status
    if (filters.value.status === 'active' && !redirect.is_active) {
      return false;
    }
    if (filters.value.status === 'inactive' && redirect.is_active) {
      return false;
    }
    
    return true;
  });
});

const hasFilters = computed(() => {
  return filters.value.search !== '' || filters.value.type !== '' || filters.value.status !== '';
});

// Métodos

const resetFilters = () => {
  filters.value = {
    search: '',
    type: '',
    status: ''
  };
};

const openCreateModal = () => {
  router.visit('/redirects/create');
};

const editRedirect = (redirect: Redirect) => {
  router.visit(`/redirects/${redirect.id}/edit`);
};

const confirmDelete = (redirect: Redirect) => {
  if (confirm(`Tem certeza que deseja excluir o redirect ${redirect.source_pattern}?`)) {
    deleteRedirect(redirect.id);
  }
};

const deleteRedirect = async (id: number) => {
  try {
    await router.delete(`/redirects/${id}`, {
      onSuccess: () => {
        // Atualizar estado local imediatamente
        redirects.value.data = redirects.value.data.filter(redirect => redirect.id !== id);
        
        // Atualizar contadores se disponíveis
        if (redirects.value.total) {
          redirects.value.total--;
        }
        
        toast.success('Redirect excluído', 'O redirect foi excluído com sucesso.');
      },
      onError: (errors) => {
        toast.error('Erro ao excluir', 'Não foi possível excluir o redirect.');
        console.error('Erro ao excluir redirect:', errors);
      }
    });
  } catch (error) {
    toast.error('Erro ao excluir', 'Ocorreu um erro inesperado.');
    console.error('Erro inesperado:', error);
  }
};

// Lifecycle
onMounted(() => {
  // Os dados já são carregados via props do Inertia.js
  loading.value = false;
});
</script>