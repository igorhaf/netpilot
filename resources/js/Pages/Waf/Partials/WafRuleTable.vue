<template>
  <div>
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expression</th>
          <th class="px-6 py-3"></th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="rule in rules" :key="rule.id">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ rule.name }}</td>
          <td class="px-6 py-4 whitespace-pre-wrap text-sm text-gray-600">{{ rule.expression }}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900" @click="$emit('edit', rule)">Edit</button>
          </td>
        </tr>
        <tr v-if="!rules || !rules.length">
          <td colspan="3" class="px-6 py-4 text-sm text-gray-500">No rules found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  rules: {
    type: Array,
    default: () => []
  }
});
</script>
