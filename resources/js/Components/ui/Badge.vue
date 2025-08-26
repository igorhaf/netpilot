<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variantClasses,
      className
    ]"
  >
    <slot name="icon" v-if="$slots.icon">
      <div class="mr-1 h-3 w-3"></div>
    </slot>
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'neutral' | 'success' | 'danger' | 'warning' | 'info';
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  className: ''
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'neutral':
      return 'bg-border text-text';
    case 'success':
      return 'bg-success-light text-success';
    case 'danger':
      return 'bg-danger-light text-danger';
    case 'warning':
      return 'bg-warning-light text-warning';
    case 'info':
      return 'bg-info-light text-info';
    default:
      return 'bg-border text-text';
  }
});
</script>
