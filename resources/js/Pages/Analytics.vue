<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">System Analytics</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Circuit Breaker Status -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Circuit Breakers</h2>
        <div class="mt-4 space-y-4">
          <div v-for="cb in circuitBreakers" :key="cb.service" class="flex items-center">
            <span class="flex-shrink-0 h-4 w-4 rounded-full" 
              :class="{
                'bg-green-500': cb.state === 'closed',
                'bg-red-500': cb.state === 'open'
              }"></span>
            <span class="ml-3 text-sm font-medium text-gray-900">
              {{ cb.service }} ({{ cb.state }}, failures: {{ cb.failure_count }})
            </span>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Request Volume</h2>
        <LineChart :data="requestVolumeData" />
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Response Times</h2>
        <BarChart :data="responseTimeData" />
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Error Rate</h2>
        <PieChart :data="errorRateData" />
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Top Endpoints</h2>
        <Table :columns="topEndpointsColumns" :rows="topEndpoints" />
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Recent Events</h2>
        <Table :columns="recentEventsColumns" :rows="recentEvents" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LineChart from '@/Components/Charts/LineChart.vue'
import BarChart from '@/Components/Charts/BarChart.vue'
import PieChart from '@/Components/Charts/PieChart.vue'
import Table from '@/Components/Table.vue'

const requestVolumeData = ref([])
const responseTimeData = ref([])
const errorRateData = ref([])
const topEndpoints = ref([])
const recentEvents = ref([])
const circuitBreakers = ref([])

const topEndpointsColumns = [
  { key: 'endpoint', label: 'Endpoint' },
  { key: 'count', label: 'Requests' },
  { key: 'avg_time', label: 'Avg Time (ms)' },
  { key: 'error_rate', label: 'Error Rate' }
]

const recentEventsColumns = [
  { key: 'type', label: 'Event' },
  { key: 'timestamp', label: 'Time' },
  { key: 'details', label: 'Details' }
]

const fetchCircuitBreakers = async () => {
  try {
    const response = await axios.get('/api/v1/circuit-breakers');
    circuitBreakers.value = response.data;
  } catch (error) {
    console.error('Error fetching circuit breakers:', error);
  }
};

onMounted(async () => {
  // Fetch analytics data
  const response = await axios.get('/api/analytics')
  
  requestVolumeData.value = response.data.request_volume
  responseTimeData.value = response.data.response_times
  errorRateData.value = response.data.error_rates
  topEndpoints.value = response.data.top_endpoints
  recentEvents.value = response.data.recent_events
  
  fetchCircuitBreakers();
  setInterval(fetchCircuitBreakers, 10000);
})
</script>
