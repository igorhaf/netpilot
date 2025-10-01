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
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { JobsDashboard } from '@/components/jobs/JobsDashboard'
import { getStatusColor, formatRelativeTime } from '@/lib/utils'
import api from '@/lib/api'
import { DashboardStats, Log, SslCertificate } from '@/types'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(res => res.data),
  })

  const { data: recentLogs, isLoading: logsLoading } = useQuery<Log[]>({
    queryKey: ['dashboard-recent-logs'],
    queryFn: () => api.get('/dashboard/recent-logs?limit=5').then(res => res.data),
  })

  const { data: expiringCerts, isLoading: certsLoading } = useQuery<SslCertificate[]>({
    queryKey: ['dashboard-expiring-certificates'],
    queryFn: () => api.get('/dashboard/expiring-certificates').then(res => res.data),
  })

  if (statsLoading) {
    return (
      <MainLayout>
        <PageLoading />
      </MainLayout>
    )
  }

  const SystemStatusCard = ({ name, status, uptime }: any) => (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="font-medium">{name}</span>
      </div>
      <div className="text-right">
        <Badge variant={status === 'online' ? "default" : "destructive"}>
          {status === 'online' ? 'Online' : 'Offline'}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">{uptime}</p>
      </div>
    </div>
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: 'Dashboard', current: true }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do sistema NetPilot
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Domínios Ativos</p>
                  <p className="text-2xl font-bold">{stats?.domains.active || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.domains.total || 0} total
                  </p>
                </div>
                <Globe className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Regras de Proxy</p>
                  <p className="text-2xl font-bold">{stats?.proxyRules.active || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.proxyRules.total || 0} total
                  </p>
                </div>
                <ArrowRight className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Certificados Válidos</p>
                  <p className="text-2xl font-bold">{stats?.sslCertificates.valid || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.sslCertificates.expiring || 0} expirando
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Logs Sucesso</p>
                  <p className="text-2xl font-bold">{stats?.logs.success || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.logs.failed || 0} falhas
                  </p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

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
            <CardContent className="space-y-3">
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

        {/* Expiring Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Certificados Expirando
            </CardTitle>
          </CardHeader>
          <CardContent>
            {certsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando certificados...
              </div>
            ) : expiringCerts && expiringCerts.length > 0 ? (
              <div className="space-y-3">
                {expiringCerts.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-yellow-900/20">
                    <div>
                      <p className="font-medium">{cert.primaryDomain}</p>
                      <p className="text-sm text-muted-foreground">
                        Expira em {formatRelativeTime(cert.expiresAt!)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Expirando
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p className="text-muted-foreground">Todos os certificados estão válidos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}