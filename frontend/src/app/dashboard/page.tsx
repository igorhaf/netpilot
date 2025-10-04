'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Globe,
  ArrowRight,
  Shield,
  FileText,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { JobsDashboard } from '@/components/jobs/JobsDashboard'
import { getStatusColor, formatRelativeTime } from '@/lib/utils'
import api from '@/lib/api'
import { DashboardStats, Log } from '@/types'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(res => res.data),
    refetchInterval: 10000, // Auto-refresh a cada 10 segundos
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const { data: recentLogs, isLoading: logsLoading, error: logsError } = useQuery<Log[]>({
    queryKey: ['dashboard-recent-logs'],
    queryFn: () => api.get('/dashboard/recent-logs?limit=6').then(res => res.data),
    retry: 1,
    refetchInterval: 5000, // Auto-refresh a cada 5 segundos
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const breadcrumbs = [
    { label: 'Dashboard', current: true, icon: BarChart3 }
  ]

  if (statsLoading) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <PageLoading />
      </MainLayout>
    )
  }

  const SystemStatusCard = ({ name, status, uptime }: any) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="text-right">
        <Badge variant={status === 'online' ? "default" : "destructive"} className="text-xs">
          {status === 'online' ? 'Online' : 'Offline'}
        </Badge>
        {uptime && <p className="text-xs text-muted-foreground mt-0.5">{uptime}</p>}
      </div>
    </div>
  )

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Jobs Statistics */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Jobs</h2>
          <JobsDashboard compact />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <SystemStatusCard
                name="Nginx"
                status={stats?.systemStatus.nginx.status}
                uptime={stats?.systemStatus.nginx.uptime}
              />
              <SystemStatusCard
                name="Traefik"
                status={stats?.systemStatus.traefik.status}
                uptime={stats?.systemStatus.traefik.uptime}
              />
              <SystemStatusCard
                name="Database"
                status={stats?.systemStatus.database.status}
                uptime={stats?.systemStatus.database.uptime}
              />
              <SystemStatusCard
                name="WebSocket"
                status={(stats?.systemStatus as any)?.websocket?.status || 'online'}
                uptime={(stats?.systemStatus as any)?.websocket?.uptime}
              />
              <SystemStatusCard
                name="Docker"
                status={(stats?.systemStatus as any)?.docker?.status || 'online'}
                uptime={(stats?.systemStatus as any)?.docker?.uptime}
              />
            </CardContent>
          </Card>

          {/* Recent Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Logs Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando logs...
                </div>
              ) : logsError ? (
                <div className="text-center py-8 text-red-500">
                  Erro ao carregar logs: {(logsError as Error).message}
                </div>
              ) : recentLogs && recentLogs.length > 0 ? (
                <div className="space-y-3">
                  {recentLogs.map((log) => {
                    const StatusIcon = log.status === 'success' ? CheckCircle :
                                     log.status === 'failed' ? XCircle :
                                     log.status === 'running' ? Activity : AlertTriangle

                    return (
                      <div key={log.id} className="flex items-center gap-3 py-2">
                        <StatusIcon className={`h-4 w-4 ${getStatusColor(log.status)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{log.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(log.createdAt)}
                          </p>
                        </div>
                        <Badge variant={log.status === 'success' ? "default" : log.status === 'failed' ? "destructive" : "secondary"}>
                          {log.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="Nenhum log encontrado"
                  description="Quando houver atividade no sistema, os logs aparecerão aqui."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}