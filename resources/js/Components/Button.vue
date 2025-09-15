<template>
  <Link
    v-if="href"
    :href="href"
    :class="[
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-in-out ring-brand transform hover:-translate-y-0.5 active:translate-y-0',
      sizeClasses,
      variantClasses,
      disabled || loading ? 'opacity-50 cursor-not-allowed transform-none' : 'shadow-sm hover:shadow-md'
    ]"
    v-bind="$attrs"
  >
    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot />
  </Link>
  
  <button
    v-else
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-in-out ring-brand transform hover:-translate-y-0.5 active:translate-y-0',
      sizeClasses,
      variantClasses,
      disabled || loading ? 'opacity-50 cursor-not-allowed transform-none' : 'shadow-sm hover:shadow-md'
    ]"
    v-bind="$attrs"
  >
    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot />
  </button>
</template>

<script setup>
import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  href: { type: String, default: null },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }
  return sizes[props.size] || sizes.md
})

const variantClasses = computed(() => {
  const variants = {
    primary: 'bg-[--brand-600] hover:bg-[--brand-700] text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)]',
    secondary: 'bg-gray-700 hover:bg-gray-800 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    outline: 'border border-[color:rgba(148,163,184,0.35)] text-gray-200 bg-gray-900/60 hover:bg-gray-900/80',
    ghost: 'bg-gray-800/60 hover:bg-gray-800 border border-gray-700 text-gray-200'
  }
  return variants[props.variant] || variants.primary
})
</script>
