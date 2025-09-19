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

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="card">
      <div className="card-content">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </div>
  )

  const SystemStatusCard = ({ name, status, uptime }: any) => (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="font-medium">{name}</span>
      </div>
      <div className="text-right">
        <span className={`text-sm font-medium ${getStatusColor(status)}`}>
          {status === 'online' ? 'Online' : 'Offline'}
        </span>
        <p className="text-xs text-muted-foreground">{uptime}</p>
      </div>
    </div>
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema NetPilot
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Domínios Ativos"
            value={stats?.domains.active || 0}
            subtitle={`${stats?.domains.total || 0} total`}
            icon={Globe}
            color="text-green-400"
          />
          <StatCard
            title="Regras de Proxy"
            value={stats?.proxyRules.active || 0}
            subtitle={`${stats?.proxyRules.total || 0} total`}
            icon={ArrowRight}
            color="text-blue-400"
          />
          <StatCard
            title="Certificados Válidos"
            value={stats?.sslCertificates.valid || 0}
            subtitle={`${stats?.sslCertificates.expiring || 0} expirando`}
            icon={Shield}
            color="text-green-400"
          />
          <StatCard
            title="Logs Recentes"
            value={stats?.logs.success || 0}
            subtitle={`${stats?.logs.failed || 0} falhas`}
            icon={FileText}
            color="text-gray-400"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* System Status */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                <h3 className="card-title">Status do Sistema</h3>
              </div>
              <p className="card-description">
                Uptime dos serviços principais
              </p>
            </div>
            <div className="card-content space-y-3">
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
            </div>
          </div>

          {/* Recent Logs */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <h3 className="card-title">Logs Recentes</h3>
              </div>
              <p className="card-description">
                Últimas atividades do sistema
              </p>
            </div>
            <div className="card-content">
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
                        <span className={`text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum log encontrado
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expiring Certificates */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <h3 className="card-title">Certificados Expirando</h3>
            </div>
            <p className="card-description">
              Certificados que expiram nos próximos 30 dias
            </p>
          </div>
          <div className="card-content">
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
                    <span className="status-badge-warning">
                      Expirando
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-400" />
                <p>Todos os certificados estão válidos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}