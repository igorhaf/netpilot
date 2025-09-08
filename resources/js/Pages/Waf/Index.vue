<template>
  <AppLayout>
    <template #header>
      <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        WAF Rules Management
      </h2>
    </template>

    <div class="py-12">
      <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg p-6">
          <div class="flex justify-end mb-4">
            <PrimaryButton @click="showCreateForm = true">
              Create New Rule
            </PrimaryButton>
          </div>

          <WafRuleTable :rules="rules" />

          <WafRuleCreateModal 
            v-model="showCreateForm" 
            @created="handleRuleCreated"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import WafRuleTable from './Partials/WafRuleTable.vue';
import WafRuleCreateModal from './Partials/WafRuleCreateModal.vue';
import { ref } from 'vue';

const props = defineProps({
  rules: {
    type: Array,
    default: () => []
  }
});

const showCreateForm = ref(false);

const handleRuleCreated = (newRule) => {
  props.rules.push(newRule);
  showCreateForm.value = false;
};
</script>
