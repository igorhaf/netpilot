import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, RefreshCw, AlertTriangle, CheckCircle2, Clock, Search, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { jobExecutionsApi } from '@/lib/api/job-queues'

interface JobExecutionLogsProps {
  executionId?: string
  jobQueueId?: string
  autoRefresh?: boolean
}

export function JobExecutionLogs({ executionId, jobQueueId, autoRefresh = false }: JobExecutionLogsProps) {
  const [selectedExecution, setSelectedExecution] = useState<string | null>(executionId || null)
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  })
  const [activeLogTab, setActiveLogTab] = useState('output')

  // Query para listar execuções
  const { data: executions, isLoading } = useQuery({
    queryKey: ['job-executions', jobQueueId, filters],
    queryFn: () => jobExecutionsApi.list({
      jobQueueId,
      status: filters.status || undefined,
      limit: 50
    }),
    refetchInterval: autoRefresh ? 5000 : false
  })

  // Query para logs da execução selecionada
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['job-execution-logs', selectedExecution],
    queryFn: () => selectedExecution ? jobExecutionsApi.getLogs(selectedExecution) : null,
    enabled: !!selectedExecution,
    refetchInterval: autoRefresh ? 3000 : false
  })

  // Query para detalhes da execução selecionada
  const { data: executionDetails } = useQuery({
    queryKey: ['job-execution-details', selectedExecution],
    queryFn: () => selectedExecution ? jobExecutionsApi.get(selectedExecution) : null,
    enabled: !!selectedExecution
  })

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.round(ms / 60000)}m`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'running': return <Clock className="h-4 w-4 text-blue-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const downloadLogs = () => {
    if (!logs || (!logs.outputLog && !logs.errorLog)) return

    const content = [
      '=== EXECUTION LOGS ===',
      `Execution ID: ${selectedExecution}`,
      `Job Queue ID: ${jobQueueId || 'Unknown'}`,
      `Status: ${executionDetails?.status || 'Unknown'}`,
      `Started: ${executionDetails?.startedAt ? new Date(executionDetails.startedAt).toLocaleString() : 'Unknown'}`,
      `Completed: ${executionDetails?.completedAt ? new Date(executionDetails.completedAt).toLocaleString() : 'Not completed'}`,
      `Duration: ${executionDetails?.executionTimeMs ? formatTime(executionDetails.executionTimeMs) : 'Unknown'}`,
      '',
      '=== OUTPUT LOG ===',
      logs.outputLog || 'No output log available',
      '',
      '=== ERROR LOG ===',
      logs.errorLog || 'No error log available'
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `job-execution-${selectedExecution}-logs.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredExecutions = executions?.filter(execution =>
    execution.id.toLowerCase().includes(filters.search.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs de Execução
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
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
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="running">Executando</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Execuções */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">
              Execuções ({filteredExecutions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Carregando execuções...</p>
                </div>
              ) : filteredExecutions.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma execução encontrada</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredExecutions.map((execution) => (
                    <button
                      key={execution.id}
                      onClick={() => setSelectedExecution(execution.id)}
                      className={`w-full p-3 text-left hover:bg-muted/50 transition-colors border-l-2 ${
                        selectedExecution === execution.id
                          ? 'border-primary bg-muted/50'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate">
                          {`Execution ${execution.id.slice(0, 8)}`}
                        </span>
                        {getStatusIcon(execution.status)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {execution.startedAt && new Date(execution.startedAt).toLocaleString()}
                      </div>
                      {execution.executionTimeMs && (
                        <div className="text-xs text-muted-foreground">
                          Duração: {formatTime(execution.executionTimeMs)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detalhes e Logs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {selectedExecution ? 'Logs da Execução' : 'Selecione uma execução'}
              </CardTitle>
              {selectedExecution && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadLogs}
                    disabled={!logs?.outputLog && !logs?.errorLog}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedExecution ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma execução para ver os logs</p>
              </div>
            ) : logsLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Carregando logs...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Informações da Execução */}
                {executionDetails && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(executionDetails.status)}
                        <Badge variant={
                          executionDetails.status === 'completed' ? 'default' :
                          executionDetails.status === 'failed' ? 'destructive' :
                          'secondary'
                        }>
                          {executionDetails.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Trigger</label>
                      <p className="text-sm mt-1">{executionDetails.triggerType}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Iniciado</label>
                      <p className="text-sm mt-1">
                        {executionDetails.startedAt ? new Date(executionDetails.startedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Duração</label>
                      <p className="text-sm mt-1">
                        {executionDetails.executionTimeMs ? formatTime(executionDetails.executionTimeMs) : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Logs */}
                <Tabs value={activeLogTab} onValueChange={setActiveLogTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="output">Output Log</TabsTrigger>
                    <TabsTrigger value="error">Error Log</TabsTrigger>
                  </TabsList>

                  <TabsContent value="output" className="mt-4">
                    <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                      {logs?.outputLog ? (
                        <pre className="whitespace-pre-wrap">{logs.outputLog}</pre>
                      ) : (
                        <div className="text-muted-foreground">Nenhum output log disponível</div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="error" className="mt-4">
                    <div className="bg-black text-red-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                      {logs?.errorLog ? (
                        <pre className="whitespace-pre-wrap">{logs.errorLog}</pre>
                      ) : (
                        <div className="text-muted-foreground">Nenhum error log disponível</div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}