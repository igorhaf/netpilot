<template>
  <TransitionGroup
    tag="div"
    :css="false"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @leave="onLeave"
    class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="[
        'bg-elevated border rounded-2xl p-4 shadow-elevation flex items-start gap-3',
        toast.type === 'success' ? 'border-success' : '',
        toast.type === 'error' ? 'border-danger' : '',
        toast.type === 'info' ? 'border-info' : '',
        toast.type === 'warning' ? 'border-warning' : '',
      ]"
      role="alert"
    >
      <!-- Ícone baseado no tipo -->
      <div :class="[
        'flex-shrink-0 w-5 h-5',
        toast.type === 'success' ? 'text-success' : '',
        toast.type === 'error' ? 'text-danger' : '',
        toast.type === 'info' ? 'text-info' : '',
        toast.type === 'warning' ? 'text-warning' : '',
      ]">
        <svg v-if="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="toast.type === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="toast.type === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <svg v-else-if="toast.type === 'info'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      </div>

      <!-- Conteúdo -->
      <div class="flex-1 pt-0.5">
        <p class="text-sm font-medium text-text">{{ toast.title }}</p>
        <p v-if="toast.message" class="mt-1 text-sm text-text-muted">{{ toast.message }}</p>
      </div>

      <!-- Botão de fechar -->
      <button
        @click="removeToast(toast.id)"
        class="flex-shrink-0 text-text-muted hover:text-text"
        aria-label="Fechar"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { TransitionGroup } from 'vue';

interface Toast {
  id: number;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
  timeout?: number;
}

// Estado global para toasts
const toasts = ref<Toast[]>([]);
let counter = 0;

// Adicionar um novo toast
const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = counter++;
  const newToast = {
    id,
    ...toast,
    duration: toast.duration || 5000
  };
  
  toasts.value.push(newToast);
  
  // Configurar timeout para remover o toast automaticamente
  newToast.timeout = window.setTimeout(() => {
    removeToast(id);
  }, newToast.duration);
};

// Remover um toast pelo ID
const removeToast = (id: number) => {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index !== -1) {
    clearTimeout(toasts.value[index].timeout);
    toasts.value.splice(index, 1);
  }
};

// Animações
const onBeforeEnter = (el: Element) => {
  const element = el as HTMLElement;
  element.style.opacity = '0';
  element.style.transform = 'translateX(100%)';
};

const onEnter = (el: Element, done: () => void) => {
  const element = el as HTMLElement;
  setTimeout(() => {
    element.style.transition = 'all 0.3s ease';
    element.style.opacity = '1';
    element.style.transform = 'translateX(0)';
    done();
  }, 20);
};

const onLeave = (el: Element, done: () => void) => {
  const element = el as HTMLElement;
  element.style.transition = 'all 0.3s ease';
  element.style.opacity = '0';
  element.style.transform = 'translateX(100%)';
  
  setTimeout(done, 300);
};

// Expor métodos para o composable
defineExpose({
  addToast,
  removeToast
});
</script>
