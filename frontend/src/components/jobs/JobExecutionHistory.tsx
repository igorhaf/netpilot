'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { FileText, Search, Filter, Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, Eye, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { jobExecutionsApi } from '@/lib/api/job-queues'
import io from 'socket.io-client'
import { useAuthStore } from '@/store/auth'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface JobExecutionHistoryProps {
  jobQueueId?: string
}

export function JobExecutionHistory({ jobQueueId }: JobExecutionHistoryProps) {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    triggerType: '',
    page: 1,
    limit: 20
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const queryClient = useQueryClient()
  const { token } = useAuthStore()

  // WebSocket para atualizações em tempo real
  useEffect(() => {
    if (!token) return

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/jobs`, {
      auth: { token },
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      console.log('📡 WebSocket conectado - Histórico de Execuções')
      if (jobQueueId) {
        socket.emit('subscribe:queue', jobQueueId)
      } else {
        socket.emit('subscribe:all')
      }
    })

    socket.on('job:notification', (notification: any) => {
      console.log('🔔 Notificação recebida (Histórico):', notification)
      queryClient.invalidateQueries({ queryKey: ['job-executions-history'] })
    })

    socket.on('disconnect', () => {
      console.log('📡 WebSocket desconectado - Histórico de Execuções')
    })

    return () => {
      if (jobQueueId) {
        socket.emit('unsubscribe:queue', jobQueueId)
      } else {
        socket.emit('unsubscribe:all')
      }
      socket.disconnect()
    }
  }, [token, jobQueueId, queryClient])

  // Query para listar TODAS as execuções
  const { data, isLoading } = useQuery({
    queryKey: ['job-executions-history', jobQueueId, filters],
    queryFn: async () => {
      const response = await jobExecutionsApi.list({
        jobQueueId,
        status: filters.status || undefined,
        page: filters.page,
        limit: filters.limit
      })

      // Filtrar por triggerType no frontend se necessário
      let filteredData = response.data || []
      if (filters.triggerType) {
        filteredData = filteredData.filter((exec: any) => exec.triggerType === filters.triggerType)
      }
      if (filters.search) {
        filteredData = filteredData.filter((exec: any) =>
          exec.jobQueue?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          exec.id?.toLowerCase().includes(filters.search.toLowerCase())
        )
      }

      return {
        ...response,
        data: filteredData,
        total: filteredData.length
      }
    },
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline',
      cancelled: 'outline'
    }

    const labels: Record<string, string> = {
      completed: 'Concluído',
      failed: 'Falhou',
      running: 'Executando',
      pending: 'Aguardando',
      cancelled: 'Cancelado'
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getTriggerBadge = (triggerType: string) => {
    const labels: Record<string, string> = {
      manual: 'Manual',
      scheduled: 'Agendado',
      webhook: 'Webhook',
      api: 'API'
    }

    return (
      <Badge variant="outline" className="text-xs">
        {labels[triggerType] || triggerType}
      </Badge>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.round((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  const executions = Array.isArray(data?.data) ? data.data : []
  const total = data?.total || 0

  // Funções de seleção
  const toggleSelectAll = () => {
    if (selectedIds.length === executions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(executions.map((exec: any) => exec.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const isAllSelected = executions.length > 0 && selectedIds.length === executions.length
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < executions.length

  // Mutation para exclusão em massa
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => jobExecutionsApi.delete(id)))
    },
    onSuccess: () => {
      toast.success(`${selectedIds.length} execução(ões) deletada(s) com sucesso!`)
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['job-executions-history'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao deletar execuções')
    }
  })

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return

    const confirmed = confirm(`Tem certeza que deseja deletar ${selectedIds.length} execução(ões)?`)
    if (confirmed) {
      deleteMutation.mutate(selectedIds)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Execuções
            </div>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedIds.length} selecionado(s)</Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Selecionados
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por job ou ID..."
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(f => ({ ...f, status: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="pending">Aguardando</SelectItem>
                <SelectItem value="running">Executando</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.triggerType}
              onValueChange={(value) => setFilters(f => ({ ...f, triggerType: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de Trigger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="px-4 py-2 text-sm">
              📡 Tempo Real
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Iniciado</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : executions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma execução encontrada</p>
                  </TableCell>
                </TableRow>
              ) : (
                executions.map((execution: any) => (
                  <TableRow key={execution.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(execution.id)}
                        onCheckedChange={() => toggleSelect(execution.id)}
                        aria-label={`Selecionar ${execution.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {execution.jobQueue?.name || 'Job Desconhecido'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {execution.id.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(execution.status)}
                        {getStatusBadge(execution.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTriggerBadge(execution.triggerType)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {execution.startedAt ? formatDate(execution.startedAt) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {execution.executionTimeMs
                          ? formatDuration(execution.executionTimeMs)
                          : execution.status === 'running'
                          ? <span className="text-blue-500">Em execução...</span>
                          : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/job-executions/${execution.id}/logs`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Logs
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginação */}
      {total > filters.limit && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {executions.length} de {total} execuções
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page === 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page * filters.limit >= total}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
