<template>
  <div class="space-y-1">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 transition-colors duration-200">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    <div class="relative">
      <textarea
        v-if="type === 'textarea'"
        :id="id"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :rows="rows"
        :class="[
          'block w-full rounded-lg border transition-all duration-200 ease-in-out ring-brand disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none',
          error 
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 dark:border-gray-700 focus:border-[--brand-500] focus:ring-[--brand-500] hover:border-gray-400 dark:hover:border-gray-600',
          sizeClasses
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="focused = true"
        @blur="focused = false"
        v-bind="$attrs"
      />
      
      <input
        v-else
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :class="[
          'block w-full rounded-lg border transition-all duration-200 ease-in-out ring-brand disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
          error 
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' 
            : 'border-gray-300 dark:border-gray-700 focus:border-[--brand-500] focus:ring-[--brand-500] hover:border-gray-400 dark:hover:border-gray-600',
          sizeClasses
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="focused = true"
        @blur="focused = false"
        v-bind="$attrs"
      />
      <div v-if="loading" class="absolute inset-y-0 right-0 flex items-center pr-3">
        <svg class="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <p v-if="error" class="text-sm text-red-600 flex items-center">
        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        {{ error }}
      </p>
    </transition>
    <p v-if="help && !error" class="text-sm text-gray-500">{{ help }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, default: null },
  type: { type: String, default: 'text' },
  modelValue: { type: [String, Number], default: '' },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  help: { type: String, default: null },
  size: { type: String, default: 'md' },
  rows: { type: Number, default: 3 }
})

const emit = defineEmits(['update:modelValue'])

const focused = ref(false)

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }
  return sizes[props.size] || sizes.md
})
</script>
