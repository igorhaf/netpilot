import api from '../api'

export interface JobQueue {
  id: string
  name: string
  description?: string
  scriptType: 'internal' | 'shell' | 'node' | 'python'
  scriptPath?: string  // Comando ou caminho do script
  cronExpression?: string
  isActive: boolean
  isLocked?: boolean
  priority: 'low' | 'normal' | 'high' | 'critical' | number
  timeout?: number
  timeoutSeconds?: number  // API retorna este campo
  retryAttempts?: number
  maxRetries?: number  // API retorna este campo
  environment?: string
  processor?: string
  queueName?: string
  lastExecution?: Date
  nextExecution?: Date
  status?: 'running' | 'completed' | 'failed' | 'paused'
  executionCount?: number
  successRate?: number
  avgExecutionTime?: number
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
}

export interface JobStatistics {
  totalJobs: number
  activeJobs: number
  completedExecutions: number
  failedExecutions: number
  averageExecutionTime: number
  upcomingExecutions: number
  queuesProcessing?: number
  totalQueues?: number
  successRate?: number
  avgWaitTime?: number
}

export interface JobExecution {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  triggerType: 'manual' | 'scheduled' | 'webhook'
  startedAt?: Date
  completedAt?: Date
  executionTimeMs?: number
  outputLog?: string
  errorLog?: string
  retryCount?: number
  metadata?: Record<string, any>
  jobQueue?: {
    id: string
    name: string
    scriptType: string
  }
  triggeredBy?: {
    id: string
    email: string
  }
  createdAt?: Date
}

export interface JobQueuesListResponse {
  data: JobQueue[]
  statistics: JobStatistics
}

export interface JobQueuesFilters {
  search?: string
  status?: string
  isActive?: string
  page?: number
  limit?: number
}

// API Functions
export const jobQueuesApi = {
  // List job queues with filters
  async list(filters: JobQueuesFilters = {}): Promise<JobQueuesListResponse> {
    const params = new URLSearchParams()

    if (filters.search) params.append('search', filters.search)
    if (filters.isActive) params.append('isActive', filters.isActive)

    const [jobQueuesResponse, statisticsResponse] = await Promise.all([
      api.get(`/job-queues?${params.toString()}`),
      api.get('/job-queues/statistics')
    ])

    return {
      data: jobQueuesResponse.data,
      statistics: statisticsResponse.data
    }
  },

  // Get single job queue
  async get(id: string): Promise<JobQueue> {
    const response = await api.get(`/job-queues/${id}`)
    return response.data
  },

  // Create job queue
  async create(data: Partial<JobQueue>): Promise<JobQueue> {
    const response = await api.post('/job-queues', data)
    return response.data
  },

  // Update job queue
  async update(id: string, data: Partial<JobQueue>): Promise<JobQueue> {
    const response = await api.patch(`/job-queues/${id}`, data)
    return response.data
  },

  // Delete job queue
  async delete(id: string): Promise<void> {
    await api.delete(`/job-queues/${id}`)
  },

  // Execute job manually
  async execute(id: string, options: { triggerType?: string; metadata?: Record<string, any> } = {}): Promise<JobExecution> {
    const response = await api.post(`/job-queues/${id}/execute`, {
      triggerType: options.triggerType || 'manual',
      metadata: options.metadata
    })
    return response.data
  },

  // Toggle active status
  async toggleActive(id: string): Promise<JobQueue> {
    const response = await api.post(`/job-queues/${id}/toggle`)
    return response.data
  },

  // Get statistics
  async getStatistics(): Promise<JobStatistics> {
    const response = await api.get('/job-queues/statistics')
    return response.data
  },

  // Get upcoming executions
  async getUpcomingExecutions(limit: number = 10): Promise<any[]> {
    const response = await api.get(`/job-queues/upcoming?limit=${limit}`)
    return response.data
  },

  // Validate cron expression
  async validateCron(id: string, cronExpression: string): Promise<{ isValid: boolean; error?: string; nextExecutions?: Date[] }> {
    const response = await api.post(`/job-queues/${id}/validate-cron`, { cronExpression })
    return response.data
  }
}

// Job Executions API
export const jobExecutionsApi = {
  // List executions
  async list(filters: { jobQueueId?: string; status?: string; page?: number; limit?: number } = {}): Promise<{ data: JobExecution[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams()

    if (filters.jobQueueId) params.append('jobQueueId', filters.jobQueueId)
    if (filters.status) params.append('status', filters.status)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/job-executions?${params.toString()}`)
    return response.data
  },

  // Get single execution
  async get(id: string): Promise<JobExecution> {
    const response = await api.get(`/job-executions/${id}`)
    return response.data
  },

  // Cancel execution
  async cancel(id: string): Promise<JobExecution> {
    const response = await api.post(`/job-executions/${id}/cancel`)
    return response.data
  },

  // Retry execution
  async retry(id: string): Promise<JobExecution> {
    const response = await api.post(`/job-executions/${id}/retry`)
    return response.data
  },

  // Get execution logs
  async getLogs(id: string): Promise<{ outputLog?: string; errorLog?: string }> {
    const execution = await this.get(id);
    return {
      outputLog: execution.outputLog,
      errorLog: execution.errorLog
    };
  },

  // Get retry statistics
  async getRetryStats(filters: { jobQueueId?: string; timeRange?: '24h' | '7d' | '30d' } = {}): Promise<any> {
    const params = new URLSearchParams()

    if (filters.jobQueueId) params.append('jobQueueId', filters.jobQueueId)
    if (filters.timeRange) params.append('timeRange', filters.timeRange)

    const response = await api.get(`/job-executions/retry-stats?${params.toString()}`)
    return response.data
  },

  // Delete execution
  async delete(id: string): Promise<void> {
    await api.delete(`/job-executions/${id}`)
  }
}

export default jobQueuesApi