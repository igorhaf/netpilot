<template>
  <div
    :class="[
      'bg-surface border border-border rounded-2xl overflow-hidden',
      elevated ? 'shadow-elevation' : '',
      className
    ]"
  >
    <div v-if="$slots.header" class="px-6 py-4 border-b border-border">
      <slot name="header" />
    </div>
    <div :class="[contentClass, $slots.header || $slots.footer ? 'p-6' : 'p-6']">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-border">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  elevated?: boolean;
  className?: string;
  contentClass?: string;
}

withDefaults(defineProps<Props>(), {
  elevated: false,
  className: '',
  contentClass: ''
});
</script>
