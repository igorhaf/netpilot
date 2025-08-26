<template>
  <transition-group
    tag="div"
    name="toast"
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-x-full opacity-0"
    enter-to-class="transform translate-x-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-x-0 opacity-100"
    leave-to-class="transform translate-x-full opacity-0"
    class="fixed top-4 right-4 z-50 space-y-2"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="[
        'max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
        toastClasses(toast.type)
      ]"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <component :is="getIcon(toast.type)()" :class="['h-6 w-6', iconClasses(toast.type)]" />
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p :class="['text-sm font-medium', textClasses(toast.type)]">{{ toast.title }}</p>
            <p v-if="toast.message" :class="['mt-1 text-sm', messageClasses(toast.type)]">{{ toast.message }}</p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              @click="removeToast(toast.id)"
              :class="['rounded-md inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2', buttonClasses(toast.type)]"
            >
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition-group>
</template>

<script setup>
import { ref, onMounted, onUnmounted, h } from 'vue'
import { usePage } from '@inertiajs/vue3'

const toasts = ref([])

const addToast = (toast) => {
  const id = Date.now() + Math.random()
  toasts.value.push({ ...toast, id })
  
  if (toast.duration !== 0) {
    setTimeout(() => removeToast(id), toast.duration || 5000)
  }
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

const getIcon = (type) => {
  const icons = {
    success: () => h('svg', { class: 'h-6 w-6', fill: 'currentColor', viewBox: '0 0 20 20' }, [
      h('path', { 'fill-rule': 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', 'clip-rule': 'evenodd' })
    ]),
    error: () => h('svg', { class: 'h-6 w-6', fill: 'currentColor', viewBox: '0 0 20 20' }, [
      h('path', { 'fill-rule': 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z', 'clip-rule': 'evenodd' })
    ]),
    warning: () => h('svg', { class: 'h-6 w-6', fill: 'currentColor', viewBox: '0 0 20 20' }, [
      h('path', { 'fill-rule': 'evenodd', d: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z', 'clip-rule': 'evenodd' })
    ]),
    info: () => h('svg', { class: 'h-6 w-6', fill: 'currentColor', viewBox: '0 0 20 20' }, [
      h('path', { 'fill-rule': 'evenodd', d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z', 'clip-rule': 'evenodd' })
    ])
  }
  return icons[type] || icons.info
}

const toastClasses = (type) => {
  const classes = {
    success: 'bg-green-50 border border-green-200',
    error: 'bg-red-50 border border-red-200',
    warning: 'bg-yellow-50 border border-yellow-200',
    info: 'bg-blue-50 border border-blue-200'
  }
  return classes[type] || classes.info
}

const iconClasses = (type) => {
  const classes = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  }
  return classes[type] || classes.info
}

const textClasses = (type) => {
  const classes = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800'
  }
  return classes[type] || classes.info
}

const messageClasses = (type) => {
  const classes = {
    success: 'text-green-700',
    error: 'text-red-700',
    warning: 'text-yellow-700',
    info: 'text-blue-700'
  }
  return classes[type] || classes.info
}

const buttonClasses = (type) => {
  const classes = {
    success: 'text-green-400 hover:text-green-600 focus:ring-green-500',
    error: 'text-red-400 hover:text-red-600 focus:ring-red-500',
    warning: 'text-yellow-400 hover:text-yellow-600 focus:ring-yellow-500',
    info: 'text-blue-400 hover:text-blue-600 focus:ring-blue-500'
  }
  return classes[type] || classes.info
}

// Global toast function
window.toast = addToast

const page = usePage()

const handleFlash = () => {
  if (page.props?.flash?.success) {
    addToast({ type: 'success', title: 'Success', message: page.props.flash.success })
  }
  if (page.props?.flash?.error) {
    addToast({ type: 'error', title: 'Error', message: page.props.flash.error })
  }
}

onMounted(() => {
  // Check on mount and page changes
  handleFlash()
  document.addEventListener('inertia:success', handleFlash)
  document.addEventListener('inertia:finish', handleFlash)
})

onUnmounted(() => {
  document.removeEventListener('inertia:success', handleFlash)
  document.removeEventListener('inertia:finish', handleFlash)
})

defineExpose({ addToast, removeToast })
</script>

<style scoped>
.toast-move,
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-active {
  position: absolute;
  right: 0;
}
</style>
