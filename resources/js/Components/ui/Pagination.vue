<template>
  <div
    v-if="links && links.length > 3"
    class="flex flex-wrap justify-center gap-1 mt-6"
    role="navigation"
    aria-label="Paginação"
  >
    <template v-for="(link, key) in links" :key="key">
      <!-- Link anterior -->
      <div v-if="link.url === null && link.label.includes('Previous')" class="sr-only">
        Anterior
      </div>
      
      <!-- Link próximo -->
      <div v-else-if="link.url === null && link.label.includes('Next')" class="sr-only">
        Próximo
      </div>
      
      <!-- Link ativo -->
      <div
        v-else-if="link.active"
        class="px-4 py-2 bg-accent text-white rounded-lg font-medium"
        aria-current="page"
      >
        {{ link.label }}
      </div>
      
      <!-- Link anterior clicável -->
      <button
        v-else-if="link.url && link.label.includes('Previous')"
        @click="$emit('navigate', link.url)"
        class="px-3 py-2 rounded-lg border border-border hover:bg-surface flex items-center justify-center"
        aria-label="Ir para página anterior"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>
      
      <!-- Link próximo clicável -->
      <button
        v-else-if="link.url && link.label.includes('Next')"
        @click="$emit('navigate', link.url)"
        class="px-3 py-2 rounded-lg border border-border hover:bg-surface flex items-center justify-center"
        aria-label="Ir para próxima página"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
      
      <!-- Links numéricos -->
      <button
        v-else-if="link.url"
        @click="$emit('navigate', link.url)"
        class="px-4 py-2 rounded-lg border border-border hover:bg-surface text-text"
      >
        {{ link.label }}
      </button>
      
      <!-- Elipses -->
      <span
        v-else
        class="px-4 py-2 text-text-muted"
      >
        {{ link.label }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

interface Link {
  active: boolean;
  label: string;
  url: string | null;
}

interface Props {
  links: Link[];
  enableKeyboardNav?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  links: () => [],
  enableKeyboardNav: true
});

const emit = defineEmits(['navigate']);

// Implementação de navegação por teclado (opcional)
const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.enableKeyboardNav) return;
  
  // Encontrar links anterior e próximo
  const prevLink = props.links.find(link => link.label.includes('Previous') && link.url);
  const nextLink = props.links.find(link => link.label.includes('Next') && link.url);
  
  if (event.key === 'ArrowLeft' && prevLink) {
    event.preventDefault();
    emit('navigate', prevLink.url);
  } else if (event.key === 'ArrowRight' && nextLink) {
    event.preventDefault();
    emit('navigate', nextLink.url);
  }
};

onMounted(() => {
  if (props.enableKeyboardNav) {
    window.addEventListener('keydown', handleKeyDown);
  }
});

onUnmounted(() => {
  if (props.enableKeyboardNav) {
    window.removeEventListener('keydown', handleKeyDown);
  }
});
</script>
