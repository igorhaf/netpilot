<template>
  <div v-if="isVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-surface rounded-lg shadow-xl max-w-md w-full mx-4">
      <!-- Header -->
      <div class="p-6 border-b border-border">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
            <svg v-if="status === 'processing'" class="w-5 h-5 text-accent animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <svg v-else-if="status === 'valid'" class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <svg v-else-if="status === 'failed'" class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            <svg v-else class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-medium text-text">Certificado SSL</h3>
            <p class="text-sm text-text-muted">{{ domainName }}</p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div class="space-y-4">
          <!-- Status -->
          <div class="flex items-center gap-3">
            <div class="flex-1">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-text">Status</span>
                <span class="text-sm" :class="statusColor">{{ statusText }}</span>
              </div>
              
              <!-- Progress Bar -->
              <div class="w-full bg-elevated rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-500"
                  :class="progressBarColor"
                  :style="{ width: progressPercentage + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Steps -->
          <div class="space-y-2">
            <div v-for="step in steps" :key="step.id" class="flex items-center gap-3 text-sm">
              <div class="w-4 h-4 flex items-center justify-center">
                <div v-if="step.status === 'completed'" class="w-2 h-2 bg-success rounded-full"></div>
                <div v-else-if="step.status === 'processing'" class="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <div v-else class="w-2 h-2 bg-border rounded-full"></div>
              </div>
              <span :class="step.status === 'completed' ? 'text-success' : step.status === 'processing' ? 'text-accent' : 'text-text-muted'">
                {{ step.text }}
              </span>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="status === 'failed' && errorMessage" class="p-3 bg-danger/10 border border-danger/20 rounded-lg">
            <p class="text-sm text-danger">{{ errorMessage }}</p>
          </div>

          <!-- Success Message -->
          <div v-if="status === 'valid'" class="p-3 bg-success/10 border border-success/20 rounded-lg">
            <p class="text-sm text-success">
              🎉 Certificado SSL criado com sucesso! Válido até {{ formatDate(expiresAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-border flex justify-end gap-3">
        <Button v-if="status === 'failed'" @click="retry" variant="outline">
          Tentar Novamente
        </Button>
        <Button @click="close" :variant="status === 'valid' ? 'default' : 'ghost'">
          {{ status === 'valid' ? 'Concluído' : 'Fechar' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Button from '@/Components/ui/Button.vue';

interface Props {
  domainName: string;
  certificateId?: number;
  isVisible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  retry: [];
}>();

// State
const status = ref<'pending' | 'processing' | 'valid' | 'failed'>('pending');
const errorMessage = ref<string>('');
const expiresAt = ref<string>('');

// Steps
const steps = ref([
  { id: 1, text: 'Validando domínio', status: 'pending' },
  { id: 2, text: 'Gerando chave privada', status: 'pending' },
  { id: 3, text: 'Solicitando certificado', status: 'pending' },
  { id: 4, text: 'Instalando certificado', status: 'pending' },
]);

// Computed
const statusText = computed(() => {
  switch (status.value) {
    case 'pending': return 'Aguardando...';
    case 'processing': return 'Processando...';
    case 'valid': return 'Concluído';
    case 'failed': return 'Falhou';
    default: return 'Desconhecido';
  }
});

const statusColor = computed(() => {
  switch (status.value) {
    case 'processing': return 'text-accent';
    case 'valid': return 'text-success';
    case 'failed': return 'text-danger';
    default: return 'text-text-muted';
  }
});

const progressBarColor = computed(() => {
  switch (status.value) {
    case 'processing': return 'bg-accent';
    case 'valid': return 'bg-success';
    case 'failed': return 'bg-danger';
    default: return 'bg-border';
  }
});

const progressPercentage = computed(() => {
  const completedSteps = steps.value.filter(step => step.status === 'completed').length;
  if (status.value === 'valid') return 100;
  if (status.value === 'failed') return Math.max(25, (completedSteps / steps.value.length) * 100);
  return (completedSteps / steps.value.length) * 100;
});

// Methods
const updateStep = (stepId: number, stepStatus: 'pending' | 'processing' | 'completed') => {
  const step = steps.value.find(s => s.id === stepId);
  if (step) {
    step.status = stepStatus;
  }
};

const simulateProgress = () => {
  status.value = 'processing';
  
  // Step 1: Validating domain
  updateStep(1, 'processing');
  setTimeout(() => {
    updateStep(1, 'completed');
    
    // Step 2: Generating private key
    updateStep(2, 'processing');
    setTimeout(() => {
      updateStep(2, 'completed');
      
      // Step 3: Requesting certificate
      updateStep(3, 'processing');
      setTimeout(() => {
        updateStep(3, 'completed');
        
        // Step 4: Installing certificate
        updateStep(4, 'processing');
        setTimeout(() => {
          updateStep(4, 'completed');
          status.value = 'valid';
          expiresAt.value = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        }, 1000);
      }, 1500);
    }, 1000);
  }, 1000);
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const close = () => {
  emit('close');
};

const retry = () => {
  // Reset state
  status.value = 'pending';
  errorMessage.value = '';
  steps.value.forEach(step => step.status = 'pending');
  
  emit('retry');
  simulateProgress();
};

// Lifecycle
onMounted(() => {
  if (props.isVisible) {
    // Start simulation after a short delay
    setTimeout(() => {
      simulateProgress();
    }, 500);
  }
});
</script>
