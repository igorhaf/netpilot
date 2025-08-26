<template>
  <div class="w-full overflow-x-auto">
    <table class="w-full border-collapse">
      <thead :class="[stickyHeader ? 'sticky top-0 z-10 bg-surface' : '']">
        <tr class="border-b border-border">
          <slot name="header" />
        </tr>
      </thead>
      <tbody>
        <template v-if="$slots.default">
          <slot />
        </template>
        <template v-else>
          <tr>
            <td
              :colspan="colSpan"
              class="py-10 text-center text-text-muted"
            >
              <slot name="empty">
                Nenhum dado disponível
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
      <tfoot v-if="$slots.footer" class="border-t border-border">
        <slot name="footer" />
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Props {
  stickyHeader?: boolean;
  colSpan?: number;
  zebra?: boolean;
}

withDefaults(defineProps<Props>(), {
  stickyHeader: false,
  colSpan: 1,
  zebra: false
});
</script>

<style scoped>
/* Estilo zebrado para linhas da tabela quando a prop zebra é true */
:deep(tbody tr:nth-child(even)) {
  background-color: rgba(26, 27, 38, 0.3);
}

/* Estilo hover para linhas da tabela */
:deep(tbody tr:hover) {
  background-color: var(--elevated);
}

/* Estilo para células da tabela */
:deep(th) {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:deep(td) {
  padding: 1rem;
  font-size: 0.875rem;
  color: var(--text);
}

/* Estilo para células de cabeçalho ordenáveis */
:deep(th.sortable) {
  cursor: pointer;
}

:deep(th.sortable:hover) {
  background-color: var(--elevated);
}

/* Estilo para células vazias */
:deep(td.empty) {
  padding: 2.5rem;
  text-align: center;
  color: var(--muted);
}
</style>
