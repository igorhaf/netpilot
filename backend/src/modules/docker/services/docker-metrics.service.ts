import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class DockerMetricsService {
  private readonly containerActionsTotal = new Counter({
    name: 'docker_container_actions_total',
    help: 'Total number of container actions performed',
    labelNames: ['action', 'status', 'user_id'],
    registers: [register]
  });

  private readonly containerActionDuration = new Histogram({
    name: 'docker_container_action_duration_seconds',
    help: 'Duration of container actions in seconds',
    labelNames: ['action'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    registers: [register]
  });

  private readonly activeContainers = new Gauge({
    name: 'docker_active_containers',
    help: 'Number of active containers by state',
    labelNames: ['state'],
    registers: [register]
  });

  private readonly volumeUsage = new Gauge({
    name: 'docker_volume_usage_bytes',
    help: 'Volume usage in bytes',
    labelNames: ['volume_name'],
    registers: [register]
  });

  private readonly jobsActive = new Gauge({
    name: 'docker_jobs_active',
    help: 'Number of active Docker jobs by type',
    labelNames: ['type'],
    registers: [register]
  });

  private readonly apiRequestsTotal = new Counter({
    name: 'docker_api_requests_total',
    help: 'Total number of Docker API requests',
    labelNames: ['method', 'endpoint', 'status_code'],
    registers: [register]
  });

  recordContainerAction(action: string, status: 'success' | 'error', userId: string, duration?: number): void {
    this.containerActionsTotal.inc({ action, status, user_id: userId });

    if (duration !== undefined) {
      this.containerActionDuration.observe({ action }, duration);
    }
  }

  updateContainerStats(containers: any[]): void {
    const states = containers.reduce((acc, container) => {
      acc[container.state] = (acc[container.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Reset all states
    ['running', 'exited', 'paused', 'created', 'restarting'].forEach(state => {
      this.activeContainers.set({ state }, states[state] || 0);
    });
  }

  updateVolumeUsage(volumes: any[]): void {
    volumes.forEach(volume => {
      if (volume.usage?.size) {
        this.volumeUsage.set({ volume_name: volume.name }, volume.usage.size);
      }
    });
  }

  updateJobsStats(jobs: any[]): void {
    const jobsByType = jobs.reduce((acc, job) => {
      if (job.status === 'running' || job.status === 'pending') {
        acc[job.type] = (acc[job.type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    ['backup', 'restore', 'pull', 'prune'].forEach(type => {
      this.jobsActive.set({ type }, jobsByType[type] || 0);
    });
  }

  recordApiRequest(method: string, endpoint: string, statusCode: number): void {
    this.apiRequestsTotal.inc({ method, endpoint, status_code: statusCode.toString() });
  }
}