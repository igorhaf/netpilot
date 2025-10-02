'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertTriangle
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRequireAuth } from '@/hooks/useAuth'
import { formatDate, formatDuration } from '@/lib/utils'
import api from '@/lib/api'
import { Log } from '@/types'

export default function LogDetailPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const params = useParams()
  const logId = params.id as string

  const { data: log, isLoading } = useQuery<Log>({
    queryKey: ['log', logId],
    queryFn: () => api.get(`/logs/${logId}`).then(res => res.data),
    enabled: !!auth && !!logId,
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return CheckCircle
      case 'failed':
      case 'error':
        return XCircle
      case 'running':
      case 'in_progress':
        return Activity
      case 'pending':
      case 'queued':
        return Clock
      case 'warning':
        return AlertTriangle
      default:
        return AlertTriangle
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'text-green-500'
      case 'failed':
      case 'error':
        return 'text-red-500'
      case 'running':
      case 'in_progress':
        return 'text-orange-500'
      case 'pending':
      case 'queued':
        return 'text-blue-500'
      case 'warning':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'deployment': 'Deploy',
      'ssl_renewal': 'SSL',
      'ssl_generation': 'Geração SSL',
      'nginx_reload': 'Nginx',
      'traefik_reload': 'Traefik',
      'system': 'Sistema',
      'project': 'Projeto',
      'project_create': 'Criar Projeto',
      'project_update': 'Atualizar Projeto',
      'project_delete': 'Excluir Projeto',
      'domain': 'Domínio',
      'domain_create': 'Criar Domínio',
      'domain_update': 'Atualizar Domínio',
      'domain_delete': 'Excluir Domínio',
      'proxy_rule': 'Proxy Rule',
      'proxy_rule_create': 'Criar Proxy Rule',
      'proxy_rule_update': 'Atualizar Proxy Rule',
      'proxy_rule_delete': 'Excluir Proxy Rule',
      'redirect': 'Redirect',
      'redirect_create': 'Criar Redirect',
      'redirect_update': 'Atualizar Redirect',
      'redirect_delete': 'Excluir Redirect',
      'queue': 'Fila',
      'queue_job': 'Job de Fila',
      'queue_execution': 'Execução de Fila',
      'queue_success': 'Fila Sucesso',
      'queue_failed': 'Fila Falha'
    }
    return labels[type] || type
  }

  if (!auth) return null

  const breadcrumbs = [
    { label: 'Logs', href: '/logs', icon: FileText },
    { label: 'Detalhes do Log', current: true }
  ]

  if (isLoading) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <PageLoading />
      </MainLayout>
    )
  }

  if (!log) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Log não encontrado</h3>
          <Button onClick={() => router.push('/logs')} className="mt-4">
            Voltar para Logs
          </Button>
        </div>
      </MainLayout>
    )
  }

  const StatusIcon = getStatusIcon(log.status)

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/logs')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Log Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <StatusIcon className={`h-8 w-8 ${getStatusColor(log.status)}`} />
              <div className="flex-1">
                <CardTitle className="text-2xl">{log.action || 'Detalhes do Log'}</CardTitle>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <Badge variant={
                    log.status === 'success' ? 'default' :
                    log.status === 'failed' ? 'destructive' :
                    log.status === 'running' ? 'secondary' :
                    'outline'
                  }>
                    {log.status}
                  </Badge>
                  <Badge variant="outline">
                    {getTypeLabel(log.type)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID</label>
                <p className="mt-1 text-sm text-foreground font-mono">{log.id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <p className="mt-1 text-sm text-foreground">{getTypeLabel(log.type)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={
                    log.status === 'success' ? 'default' :
                    log.status === 'failed' ? 'destructive' :
                    log.status === 'running' ? 'secondary' :
                    'outline'
                  }>
                    {log.status}
                  </Badge>
                </div>
              </div>

              {log.duration && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Duração</label>
                  <p className="mt-1 text-sm text-foreground">{formatDuration(log.duration)}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                <p className="mt-1 text-sm text-foreground">{formatDate(log.createdAt)}</p>
              </div>

              {log.startedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Iniciado em</label>
                  <p className="mt-1 text-sm text-foreground">{formatDate(log.startedAt)}</p>
                </div>
              )}

              {log.completedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Concluído em</label>
                  <p className="mt-1 text-sm text-foreground">{formatDate(log.completedAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message */}
        {log.message && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mensagem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap">{log.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Details */}
        {log.details && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes Técnicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <pre className="text-xs whitespace-pre-wrap font-mono text-foreground overflow-x-auto">
                  {(() => {
                    try {
                      const parsed = JSON.parse(log.details)
                      return JSON.stringify(parsed, null, 2)
                    } catch {
                      return log.details
                    }
                  })()}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raw Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados Completos (JSON)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4">
              <pre className="text-xs whitespace-pre-wrap font-mono text-foreground overflow-x-auto">
                {JSON.stringify(log, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
