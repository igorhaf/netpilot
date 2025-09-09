<template>
  <AppLayout title="Upstreams">
    <PageLayout>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-text">Upstream Servers</h1>
          <p class="text-sm text-text-muted mt-1">Gerencie serviços backend e balanceamento</p>
        </div>
        <Link :href="route('upstreams.create')">
          <Button variant="default">Adicionar Upstream</Button>
        </Link>
      </div>

      <!-- Tabela -->
      <Card>
        <div v-if="upstreams.data.length === 0" class="py-12 flex justify-center">
          <div class="flex flex-col items-center text-center">
            <svg class="h-12 w-12 text-text-muted mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l3-1 3 1-.75-3m-8.5-6l1.75 7.5a2 2 0 001.95 1.5h6.1a2 2 0 001.95-1.5L20.5 11m-15.25 0h15.5M12 4v7" />
            </svg>
            <p class="text-text font-medium mb-2">Nenhum upstream configurado</p>
            <p class="text-text-muted max-w-md">Crie um upstream para conectar um serviço backend à sua regra de proxy.</p>
          </div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-border">
            <thead class="bg-elevated">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Nome</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Domínio</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Target URL</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Peso</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Health Check</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody class="bg-surface divide-y divide-border">
              <tr v-for="upstream in upstreams.data" :key="upstream.id" class="hover:bg-elevated">
                <td class="px-4 py-4 font-medium">{{ upstream.name }}</td>
                <td class="px-4 py-4 text-text-muted">{{ upstream.domain?.name || '—' }}</td>
                <td class="px-4 py-4 text-text-muted">{{ upstream.target_url }}</td>
                <td class="px-4 py-4 text-text-muted">{{ upstream.weight }}</td>
                <td class="px-4 py-4">
                  <Badge :variant="upstream.health_check_enabled ? 'success' : 'neutral'">
                    {{ upstream.health_check_enabled ? 'Habilitado' : 'Desabilitado' }}
                  </Badge>
                </td>
                <td class="px-4 py-4">
                  <Badge :variant="upstream.is_active ? 'success' : 'danger'">
                    {{ upstream.is_active ? 'Ativo' : 'Inativo' }}
                  </Badge>
                </td>
                <td class="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                  <Link :href="route('upstreams.edit', upstream.id)">
                    <Button variant="ghost" size="sm">Editar</Button>
                  </Link>
                  <Button variant="ghost" size="sm" class="text-danger" @click="deleteUpstream(upstream.id)">Excluir</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginação simples herdada -->
        <div v-if="upstreams.links && upstreams.links.length > 3" class="px-6 py-4 border-t border-border">
          <nav class="flex justify-center">
            <Link
              v-for="link in upstreams.links"
              :key="link.label"
              :href="link.url"
              v-html="link.label"
              :class="{
                'bg-accent text-white': link.active,
                'bg-surface text-text': !link.active
              }"
              class="px-3 py-2 mx-1 border rounded hover:bg-elevated"
              :disabled="!link.url"
            />
          </nav>
        </div>
      </Card>
    </PageLayout>
  </AppLayout>
</template>

<script setup>
import { Link, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import PageLayout from '@/Components/PageLayout.vue';
import Card from '@/Components/ui/Card.vue';
import Button from '@/Components/ui/Button.vue';
import Badge from '@/Components/ui/Badge.vue';

const props = defineProps({
  upstreams: Object
});

const deleteUpstream = (id) => {
  if (confirm('Are you sure you want to delete this upstream server?')) {
    router.delete(route('upstreams.destroy', id), {
      preserveScroll: true,
      onSuccess: () => {
        // Upstream deleted successfully
      }
    });
  }
};
</script>
