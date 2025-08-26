<template>
  <div :class="[
    'rounded-xl transition-all duration-300 ease-in-out bg-gray-950/70 border border-gray-900 shadow-[0_12px_48px_rgba(0,0,0,0.45)]',
    hover ? 'hover:shadow-lg hover:-translate-y-1' : '',
    clickable ? 'cursor-pointer' : ''
  ]" @click="clickable ? $emit('click') : null">
    <div v-if="$slots.header" class="px-6 py-4 border-b border-gray-900 bg-gray-950/60">
      <slot name="header" />
    </div>
    <div :class="padding">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-900 bg-gray-950/60 rounded-b-xl">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  hover: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  noPadding: { type: Boolean, default: false }
})

const emit = defineEmits(['click'])

const padding = computed(() => {
  return props.noPadding ? '' : 'p-6'
})
</script>
