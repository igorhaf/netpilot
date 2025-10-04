'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  AlertTriangle,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import { jobExecutionsApi } from '@/lib/api/job-queues'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface RetryStatsData {
  totalExecutions: number
  failedExecutions: number
  retriedExecutions: number
  successAfterRetry: number
  maxRetryCount: number
  avgRetryCount: number
  retrySuccessRate: number
  commonFailureCodes: Array<{ code: number; count: number }>
  retryTrends: Array<{ date: string; retries: number; success: number }>
}

interface RetryStatsProps {
  jobQueueId?: string
  timeRange?: '24h' | '7d' | '30d'
  className?: string
}

export function RetryStats({
  jobQueueId,
  timeRange = '24h',
  className
}: RetryStatsProps) {
  const [stats, setStats] = useState<RetryStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  const retryMutation = useMutation({
    mutationFn: (executionId: string) => jobExecutionsApi.retry(executionId),
    onSuccess: () => {
      toast({
        title: "Job reexecutado",
        description: "Job foi adicionado à fila para nova execução"
      })
      queryClient.invalidateQueries({ queryKey: ['job-executions'] })
      loadStats()
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao reexecutar",
        description: error.response?.data?.message || "Erro interno do servidor",
        variant: "destructive"
      })
    }
  })

  const loadStats = async () => {
    try {
      setLoading(true)
      // Buscar dados reais da API
      const data = await jobExecutionsApi.getRetryStats({
        jobQueueId,
        timeRange
      })
      setStats(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      toast({
        title: "Erro ao carregar estatísticas",
        description: "Não foi possível carregar as estatísticas de retry",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [jobQueueId, timeRange])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-spin" />
            Carregando estatísticas...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro ao carregar dados
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  const failureRate = Math.round((stats.failedExecutions / stats.totalExecutions) * 100)
  const retryRate = Math.round((stats.retriedExecutions / stats.failedExecutions) * 100)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Métricas principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Falha</p>
                <p className="text-2xl font-bold">{failureRate}%</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Retry</p>
                <p className="text-2xl font-bold">{retryRate}%</p>
              </div>
              <RotateCcw className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sucesso após Retry</p>
                <p className="text-2xl font-bold">{stats.retrySuccessRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Média de Retries</p>
                <p className="text-2xl font-bold">{stats.avgRetryCount.toFixed(1)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Estatísticas de Retry
          </CardTitle>
          <CardDescription>
            Análise detalhada dos padrões de retry no período de {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Distribuição de execuções */}
          <div className="space-y-3">
            <h4 className="font-medium">Distribuição de Execuções</h4>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sucessos ({stats.totalExecutions - stats.failedExecutions})</span>
                <span>{Math.round(((stats.totalExecutions - stats.failedExecutions) / stats.totalExecutions) * 100)}%</span>
              </div>
              <Progress
                value={((stats.totalExecutions - stats.failedExecutions) / stats.totalExecutions) * 100}
                className="h-2 bg-green-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Falhas ({stats.failedExecutions})</span>
                <span>{failureRate}%</span>
              </div>
              <Progress
                value={failureRate}
                className="h-2 bg-red-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Com Retry ({stats.retriedExecutions})</span>
                <span>{retryRate}%</span>
              </div>
              <Progress
                value={retryRate}
                className="h-2 bg-orange-100"
              />
            </div>
          </div>

          <Separator />

          {/* Códigos de falha comuns */}
          <div className="space-y-3">
            <h4 className="font-medium">Códigos de Falha Mais Comuns</h4>
            <div className="grid grid-cols-2 gap-3">
              {stats.commonFailureCodes.map((item) => (
                <div
                  key={item.code}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <Badge variant="destructive">Código {item.code}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getErrorCodeDescription(item.code)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{item.count}</p>
                    <p className="text-sm text-muted-foreground">ocorrências</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tendências */}
          <div className="space-y-3">
            <h4 className="font-medium">Tendência de Retries (Últimos 5 dias)</h4>
            <div className="space-y-2">
              {stats.retryTrends.map((trend, index) => {
                const successRate = trend.retries > 0 ? Math.round((trend.success / trend.retries) * 100) : 0
                return (
                  <div key={trend.date} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                    <span className="text-sm">{new Date(trend.date).toLocaleDateString('pt-BR')}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{trend.retries} retries</Badge>
                      <Badge variant={successRate >= 70 ? "default" : "destructive"}>
                        {successRate}% sucesso
                      </Badge>
                      {successRate >= 80 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : successRate >= 50 ? (
                        <Activity className="h-4 w-4 text-orange-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ações rápidas */}
          <Separator />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => loadStats()}
              disabled={loading}
            >
              <Activity className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Retry em Lote
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getErrorCodeDescription(code: number): string {
  const descriptions: Record<number, string> = {
    1: 'Erro geral',
    2: 'Uso incorreto do comando',
    126: 'Comando não executável',
    127: 'Comando não encontrado',
    128: 'Argumento inválido para exit',
    130: 'Script interrompido (Ctrl+C)'
  }

  return descriptions[code] || 'Erro desconhecido'
}