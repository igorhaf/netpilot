<template>
  <div :class="[
    'bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 ease-in-out',
    hover ? 'hover:shadow-lg hover:-translate-y-1' : '',
    clickable ? 'cursor-pointer' : ''
  ]" @click="clickable ? $emit('click') : null">
    <div v-if="$slots.header" class="px-6 py-4 border-b border-gray-200">
      <slot name="header" />
    </div>
    <div :class="padding">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
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
