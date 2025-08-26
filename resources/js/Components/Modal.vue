<template>
  <teleport to="body">
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>
          
          <span class="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
          
          <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div v-if="show" :class="[
              'inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle',
              maxWidthClass
            ]">
              <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div v-if="icon" :class="[
                    'mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10',
                    iconBgClass
                  ]">
                    <component :is="icon" :class="['h-6 w-6', iconColorClass]" />
                  </div>
                  <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 v-if="title" class="text-lg font-medium leading-6 text-gray-900">{{ title }}</h3>
                    <div class="mt-2">
                      <slot />
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="$slots.footer" class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <slot name="footer" />
              </div>
            </div>
          </transition>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: null },
  icon: { type: [String, Object], default: null },
  variant: { type: String, default: 'default' },
  maxWidth: { type: String, default: 'md' }
})

const emit = defineEmits(['close'])

const maxWidthClass = computed(() => {
  const sizes = {
    sm: 'sm:max-w-sm sm:w-full',
    md: 'sm:max-w-md sm:w-full',
    lg: 'sm:max-w-lg sm:w-full',
    xl: 'sm:max-w-xl sm:w-full',
    '2xl': 'sm:max-w-2xl sm:w-full'
  }
  return sizes[props.maxWidth] || sizes.md
})

const iconBgClass = computed(() => {
  const variants = {
    danger: 'bg-red-100',
    warning: 'bg-yellow-100',
    success: 'bg-green-100',
    info: 'bg-blue-100',
    default: 'bg-gray-100'
  }
  return variants[props.variant] || variants.default
})

const iconColorClass = computed(() => {
  const variants = {
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    success: 'text-green-600',
    info: 'text-blue-600',
    default: 'text-gray-600'
  }
  return variants[props.variant] || variants.default
})
</script>
