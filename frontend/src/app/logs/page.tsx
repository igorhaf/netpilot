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
  Filter
} from 'lucide-react'
import toast from 'react-hot-toast'
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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)
  const queryClient = useQueryClient()

  const { data: logs, isLoading } = useQuery<Log[]>({
    queryKey: ['logs', search, statusFilter, typeFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      return api.get(`/logs?${params.toString()}`).then(res => res.data)
    },
    enabled: !!auth,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

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
      'nginx_reload': 'Nginx',
      'traefik_reload': 'Traefik',
      'system': 'Sistema'
    }
    return labels[type] || type
  }

  if (!auth) return null

  const breadcrumbs = [
    { label: 'Logs', current: true }
  ]

  if (isLoading) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <PageLoading />
      </MainLayout>
    )
  }

  const filteredLogs = logs || []

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              Logs do Sistema
            </h1>
            <p className="text-muted-foreground">
              Visualize e gerencie os logs de atividades do NetPilot
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={() => exportLogsMutation.mutate()}
              disabled={exportLogsMutation.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button
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
                  className="input pl-10"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="deployment">Deploy</option>
                  <option value="ssl_renewal">SSL</option>
                  <option value="nginx_reload">Nginx</option>
                  <option value="traefik_reload">Traefik</option>
                  <option value="system">Sistema</option>
                </select>
              </div>
              <div className="text-sm text-muted-foreground flex items-center">
                {filteredLogs.length} logs
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
                  <p className="text-2xl font-bold">{filteredLogs.length}</p>
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
                    {filteredLogs.filter(log => log.status === 'success').length}
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
                    {filteredLogs.filter(log => log.status === 'failed').length}
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
                    {filteredLogs.filter(log => log.status === 'running').length}
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
            <CardTitle className="text-lg">Registros de Atividade</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
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
              <div className="space-y-4">
                {filteredLogs.map((log) => {
                  const StatusIcon = getStatusIcon(log.status)

                  return (
                    <div
                      key={log.id}
                      className="border rounded-lg p-4 hover:bg-muted/25 transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
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
            )}
          </CardContent>
        </Card>

        {/* Log Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const StatusIcon = getStatusIcon(selectedLog.status)
                      return <StatusIcon className={`h-6 w-6 ${getStatusColor(selectedLog.status)}`} />
                    })()}
                    <h3 className="text-lg font-semibold text-foreground">{selectedLog.action || 'Detalhes do Log'}</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLog(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-96">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          selectedLog.status === 'success' ? 'bg-green-100 text-green-800' :
                          selectedLog.status === 'failed' ? 'bg-red-100 text-red-800' :
                          selectedLog.status === 'running' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedLog.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                      <p className="mt-1 text-sm text-foreground">{getTypeLabel(selectedLog.type)}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                      <p className="mt-1 text-sm text-foreground">{formatDate(selectedLog.createdAt)}</p>
                    </div>

                    {selectedLog.duration && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Duração</label>
                        <p className="mt-1 text-sm text-foreground">{formatDuration(selectedLog.duration)}</p>
                      </div>
                    )}
                  </div>

                  {selectedLog.message && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Mensagem</label>
                      <p className="mt-1 text-sm text-foreground">{selectedLog.message}</p>
                    </div>
                  )}

                  {selectedLog.details && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Detalhes</label>
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <pre className="text-xs whitespace-pre-wrap font-mono text-foreground">
                          {selectedLog.details}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {selectedLog.startedAt && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Iniciado em</label>
                        <p className="mt-1 text-sm text-foreground">{formatDate(selectedLog.startedAt)}</p>
                      </div>
                    )}

                    {selectedLog.completedAt && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Concluído em</label>
                        <p className="mt-1 text-sm text-foreground">{formatDate(selectedLog.completedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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