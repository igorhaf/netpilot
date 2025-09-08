<template>
  <div class="w-full h-48 flex items-center justify-center bg-gray-50 rounded">
    <span class="text-gray-500 text-sm">LineChart placeholder</span>
  </div>
</template>

<script setup>
const props = defineProps({
  data: { type: Array, default: () => [] }
})
</script>
