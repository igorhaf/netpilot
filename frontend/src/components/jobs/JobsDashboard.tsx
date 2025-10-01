import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Clock, CheckCircle2, AlertTriangle, Zap, TrendingUp, Timer, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { jobQueuesApi, jobExecutionsApi } from '@/lib/api/job-queues'
import io from 'socket.io-client'

interface JobsDashboardProps {
  compact?: boolean
}

export function JobsDashboard({ compact = false }: JobsDashboardProps) {
  const [realtimeStats, setRealtimeStats] = useState<any>(null)
  const [socket, setSocket] = useState<any>(null)

  // Queries para dados atualizados
  const { data: statistics } = useQuery({
    queryKey: ['job-statistics'],
    queryFn: () => jobQueuesApi.getStatistics(),
    refetchInterval: 5000 // Atualiza a cada 5 segundos
  })

  const { data: runningExecutions } = useQuery({
    queryKey: ['running-executions'],
    queryFn: () => jobExecutionsApi.list({ status: 'running', limit: 10 }),
    refetchInterval: 2000 // Atualiza a cada 2 segundos
  })

  const { data: recentExecutions } = useQuery({
    queryKey: ['recent-executions'],
    queryFn: () => jobExecutionsApi.list({ limit: 20 }),
    refetchInterval: 10000 // Atualiza a cada 10 segundos
  })

  // WebSocket para atualizações em tempo real
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_API_URL || 'https://netpilot.meadadigital.com'
    const newSocket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket'],
      query: { type: 'jobs-dashboard' }
    })

    newSocket.on('connect', () => {
      console.log('Connected to jobs dashboard WebSocket')
    })

    newSocket.on('job:started', (data: any) => {
      setRealtimeStats((prev: any) => ({
        ...prev,
        runningJobs: (prev?.runningJobs || 0) + 1,
        lastActivity: new Date()
      }))
    })

    newSocket.on('job:completed', (data: any) => {
      setRealtimeStats((prev: any) => ({
        ...prev,
        runningJobs: Math.max(0, (prev?.runningJobs || 0) - 1),
        completedToday: (prev?.completedToday || 0) + 1,
        lastActivity: new Date()
      }))
    })

    newSocket.on('job:failed', (data: any) => {
      setRealtimeStats((prev: any) => ({
        ...prev,
        runningJobs: Math.max(0, (prev?.runningJobs || 0) - 1),
        failedToday: (prev?.failedToday || 0) + 1,
        lastActivity: new Date()
      }))
    })

    newSocket.on('job:metrics', (data: any) => {
      setRealtimeStats((prev: any) => ({
        ...prev,
        ...data
      }))
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  // Calcular métricas avançadas
  const successRate = statistics ?
    Math.round((statistics.completedExecutions / (statistics.completedExecutions + statistics.failedExecutions)) * 100) || 0
    : 0

  const avgExecutionTime = statistics?.averageExecutionTime || 0
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.round(ms / 60000)}m`
  }

  if (compact) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Executando</p>
                <p className="text-2xl font-bold text-blue-600">
                  {realtimeStats?.runningJobs || runningExecutions?.data?.length || 0}
                </p>
              </div>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-green-600">{successRate}%</p>
              </div>
              <Target className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jobs Ativos</p>
                <p className="text-2xl font-bold">{statistics?.activeJobs || 0}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{formatTime(avgExecutionTime)}</p>
              </div>
              <Timer className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jobs em Execução</p>
                <p className="text-3xl font-bold text-blue-600">
                  {realtimeStats?.runningJobs || runningExecutions?.data?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {realtimeStats?.lastActivity &&
                    `Atualizado há ${Math.floor((Date.now() - new Date(realtimeStats.lastActivity).getTime()) / 1000)}s`
                  }
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-3xl font-bold text-green-600">{successRate}%</p>
                <Progress value={successRate} className="mt-2" />
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Executados</p>
                <p className="text-3xl font-bold">{statistics?.completedExecutions || 0}</p>
                <p className="text-xs text-green-600 mt-1">
                  +{realtimeStats?.completedToday || 0} hoje
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-3xl font-bold">{formatTime(avgExecutionTime)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Por execução
                </p>
              </div>
              <Timer className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs em Execução */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Jobs em Execução ({runningExecutions?.data?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!runningExecutions?.data || runningExecutions.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum job em execução no momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runningExecutions.data.map((execution: any) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium">{execution.jobQueue?.name || 'Job'}</p>
                      <p className="text-sm text-muted-foreground">
                        Iniciado há {Math.floor((Date.now() - new Date(execution.startedAt).getTime()) / 1000)}s
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{execution.triggerType}</Badge>
                    <div className="text-right">
                      <p className="text-sm font-medium">Executando</p>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentExecutions?.data?.slice(0, 10).map((execution: any) => (
              <div
                key={execution.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    execution.status === 'completed' ? 'bg-green-500' :
                    execution.status === 'failed' ? 'bg-red-500' :
                    execution.status === 'running' ? 'bg-blue-500' :
                    'bg-gray-400'
                  }`}></div>
                  <div>
                    <p className="font-medium">{execution.jobQueue?.name || 'Job'}</p>
                    <p className="text-sm text-muted-foreground">
                      {execution.completedAt ?
                        `Finalizado em ${formatTime(execution.executionTimeMs || 0)}` :
                        `Iniciado há ${Math.floor((Date.now() - new Date(execution.startedAt).getTime()) / 1000)}s`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    execution.status === 'completed' ? 'default' :
                    execution.status === 'failed' ? 'destructive' :
                    execution.status === 'running' ? 'secondary' :
                    'outline'
                  }>
                    {execution.status === 'completed' ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : execution.status === 'failed' ? (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    ) : execution.status === 'running' ? (
                      <Clock className="h-3 w-3 mr-1" />
                    ) : null}
                    {execution.status}
                  </Badge>
                  <Badge variant="outline">{execution.triggerType}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}