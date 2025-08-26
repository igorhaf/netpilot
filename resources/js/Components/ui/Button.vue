<template>
  <button
    :class="[
      'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none',
      variantClasses,
      sizeClasses,
      fullWidth ? 'w-full' : '',
      className
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="mr-2">
      <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>
    <span v-if="$slots.icon && !loading" class="mr-2">
      <slot name="icon" />
    </span>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  disabled: false,
  loading: false,
  fullWidth: false,
  className: ''
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'default':
      return 'bg-accent text-white hover:bg-accent-dark focus:bg-accent-dark disabled:bg-accent/50';
    case 'outline':
      return 'border border-border bg-transparent hover:bg-surface text-text hover:text-text disabled:text-text/50';
    case 'ghost':
      return 'bg-transparent text-text hover:bg-surface focus:bg-surface disabled:text-text/50';
    case 'danger':
      return 'bg-danger text-white hover:bg-danger/90 focus:bg-danger/90 disabled:bg-danger/50';
    default:
      return 'bg-accent text-white hover:bg-accent-dark focus:bg-accent-dark disabled:bg-accent/50';
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 px-3 py-1 text-xs';
    case 'md':
      return 'h-10 px-4 py-2';
    case 'lg':
      return 'h-12 px-6 py-2.5 text-base';
    default:
      return 'h-10 px-4 py-2';
  }
});
</script>
