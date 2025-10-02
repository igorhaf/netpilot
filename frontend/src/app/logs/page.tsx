'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  Search,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertTriangle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRequireAuth } from '@/hooks/useAuth'
import { formatDate, formatRelativeTime, getStatusColor, formatDuration } from '@/lib/utils'
import api from '@/lib/api'
import { Log } from '@/types'

export default function LogsPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)
  const queryClient = useQueryClient()
  const itemsPerPage = 30

  const { data: logsData, isLoading } = useQuery<{logs: Log[], total: number}>({
    queryKey: ['logs', search, statusFilter, typeFilter, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      params.append('page', page.toString())
      params.append('limit', itemsPerPage.toString())
      return api.get(`/logs?${params.toString()}`).then(res => res.data)
    },
    enabled: !!auth,
    refetchInterval: 5000, // Auto-refresh a cada 5 segundos
    refetchOnMount: true, // Atualiza ao montar o componente
    refetchOnWindowFocus: true, // Atualiza ao focar na janela
  })

  const logs = logsData?.logs || []
  const totalLogs = logsData?.total || 0
  const totalPages = Math.ceil(totalLogs / itemsPerPage)

  const clearLogsMutation = useMutation({
    mutationFn: () => api.post('/logs/clear'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      toast.success('Logs removidos com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover logs')
    },
  })

  const exportLogsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(`/logs?${new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter })
      }).toString()}`)
      return response.data
    },
    onSuccess: (logs) => {
      // Create CSV content
      const header = [
        'ID',
        'Tipo',
        'Status',
        'Ação',
        'Mensagem',
        'Detalhes',
        'Duração (ms)',
        'Iniciado em',
        'Concluído em',
        'Criado em',
      ].join(',')

      const rows = logs.map((log: any) => [
        `"${log.id}"`,
        `"${log.type}"`,
        `"${log.status}"`,
        `"${log.action?.replace(/"/g, '""') || ''}"`,
        `"${log.message?.replace(/"/g, '""') || ''}"`,
        `"${log.details?.replace(/"/g, '""') || ''}"`,
        log.duration || '',
        log.startedAt ? `"${new Date(log.startedAt).toISOString()}"` : '',
        log.completedAt ? `"${new Date(log.completedAt).toISOString()}"` : '',
        `"${new Date(log.createdAt).toISOString()}"`,
      ].join(','))

      const csvContent = [header, ...rows].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `netpilot-logs-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Logs exportados com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao exportar logs')
    },
  })

  const handleClearLogs = () => {
    setShowClearConfirmation(true)
  }

  const confirmClearLogs = () => {
    clearLogsMutation.mutate()
    setShowClearConfirmation(false)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['logs'] })
    toast.success('Logs atualizados!')
  }

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
    { label: 'Logs', current: true, icon: FileText }
  ]

  if (isLoading) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <PageLoading />
      </MainLayout>
    )
  }

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input pl-10"
                >
                  <option value="all">Todos os Status</option>
                  <option value="success">Sucesso</option>
                  <option value="failed">Falha</option>
                  <option value="running">Executando</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="input pl-10 pr-4"
                >
                  <option value="all">Todos os Tipos</option>
                  <optgroup label="Sistema">
                    <option value="deployment">Deploy</option>
                    <option value="nginx_reload">Nginx</option>
                    <option value="traefik_reload">Traefik</option>
                    <option value="system">Sistema</option>
                  </optgroup>
                  <optgroup label="SSL">
                    <option value="ssl_renewal">Renovação SSL</option>
                    <option value="ssl_generation">Geração SSL</option>
                  </optgroup>
                  <optgroup label="Projetos">
                    <option value="project">Projeto (Todos)</option>
                    <option value="project_create">Criar Projeto</option>
                    <option value="project_update">Atualizar Projeto</option>
                    <option value="project_delete">Excluir Projeto</option>
                  </optgroup>
                  <optgroup label="Domínios">
                    <option value="domain">Domínio (Todos)</option>
                    <option value="domain_create">Criar Domínio</option>
                    <option value="domain_update">Atualizar Domínio</option>
                    <option value="domain_delete">Excluir Domínio</option>
                  </optgroup>
                  <optgroup label="Proxy Rules">
                    <option value="proxy_rule">Proxy Rule (Todos)</option>
                    <option value="proxy_rule_create">Criar Proxy Rule</option>
                    <option value="proxy_rule_update">Atualizar Proxy Rule</option>
                    <option value="proxy_rule_delete">Excluir Proxy Rule</option>
                  </optgroup>
                  <optgroup label="Redirects">
                    <option value="redirect">Redirect (Todos)</option>
                    <option value="redirect_create">Criar Redirect</option>
                    <option value="redirect_update">Atualizar Redirect</option>
                    <option value="redirect_delete">Excluir Redirect</option>
                  </optgroup>
                  <optgroup label="Filas">
                    <option value="queue">Fila (Todos)</option>
                    <option value="queue_job">Job de Fila</option>
                    <option value="queue_execution">Execução de Fila</option>
                    <option value="queue_success">Fila Sucesso</option>
                    <option value="queue_failed">Fila Falha</option>
                  </optgroup>
                </select>
              </div>
              <div className="text-sm text-muted-foreground flex items-center">
                {totalLogs} logs
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Logs</p>
                  <p className="text-2xl font-bold">{totalLogs}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sucessos</p>
                  <p className="text-2xl font-bold">
                    {logs.filter((log: Log) => log.status === 'success').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Falhas</p>
                  <p className="text-2xl font-bold">
                    {logs.filter((log: Log) => log.status === 'failed').length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Executando</p>
                  <p className="text-2xl font-bold">
                    {logs.filter((log: Log) => log.status === 'running').length}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Registros de Atividade</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportLogsMutation.mutate()}
                  disabled={exportLogsMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearLogs}
                  className="text-red-600 hover:text-red-700"
                  disabled={clearLogsMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Logs
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum log encontrado</h3>
                <p className="text-muted-foreground">
                  {search || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Tente ajustar os filtros para ver mais resultados.'
                    : 'Os logs aparecerão aqui conforme as atividades do sistema.'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {logs.map((log) => {
                    const StatusIcon = getStatusIcon(log.status)

                    return (
                      <div
                        key={log.id}
                        className="border rounded-lg p-4 hover:bg-muted/25 transition-colors cursor-pointer"
                        onClick={() => router.push(`/logs/${log.id}`)}
                      >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <StatusIcon className={`h-5 w-5 ${getStatusColor(log.status)}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="font-medium text-foreground truncate">
                              {log.action}
                            </h4>
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

                          {log.message && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {log.message}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span>
                              {formatRelativeTime(log.createdAt)}
                            </span>
                            <span>
                              {formatDate(log.createdAt)}
                            </span>
                            {log.duration && (
                              <span>
                                Duração: {formatDuration(log.duration)}
                              </span>
                            )}
                            {log.startedAt && (
                              <span>
                                Iniciado: {formatDate(log.startedAt)}
                              </span>
                            )}
                            {log.completedAt && (
                              <span>
                                Concluído: {formatDate(log.completedAt)}
                              </span>
                            )}
                          </div>

                          {log.details && (
                            <details className="mt-3">
                              <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                                Ver detalhes
                              </summary>
                              <div className="mt-2 p-3 bg-muted rounded-md">
                                <pre className="text-xs whitespace-pre-wrap font-mono">
                                  {log.details}
                                </pre>
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Página {page} de {totalPages} ({totalLogs} registros)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Clear Logs Confirmation Modal */}
        <ConfirmationModal
          isOpen={showClearConfirmation}
          onClose={() => setShowClearConfirmation(false)}
          onConfirm={confirmClearLogs}
          title="Confirmar Limpeza"
          subtitle="Esta ação não pode ser desfeita."
          itemName="Todos os logs do sistema"
          consequences={[
            'Remover permanentemente todos os registros de log',
            'Perder histórico completo de atividades do sistema',
            'Impossibilitar auditoria e troubleshooting futuro',
            'Não será possível recuperar os dados removidos'
          ]}
          confirmText="Limpar Logs"
          isLoading={clearLogsMutation.isPending}
        />

      </div>
    </MainLayout>
  )
}