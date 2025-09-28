'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Activity,
  Clock,
  Cpu,
  HardDrive,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  Timer,
  AlertCircle,
  CheckCircle,
  Target
} from 'lucide-react'

interface PerformanceData {
  averageExecutionTime: number
  medianExecutionTime: number
  p95ExecutionTime: number
  p99ExecutionTime: number
  throughput: {
    jobsPerHour: number
    jobsPerDay: number
    trend: number // percentage change
  }
  resourceUsage: {
    avgCpuPercent: number
    avgMemoryMB: number
    peakCpuPercent: number
    peakMemoryMB: number
  }
  reliability: {
    uptimePercent: number
    successRate: number
    mtbf: number // mean time between failures in hours
    mttr: number // mean time to recovery in minutes
  }
  queueMetrics: {
    avgQueueTime: number
    maxQueueTime: number
    queuedJobs: number
    processingJobs: number
  }
  trends: {
    executionTime: Array<{ timestamp: string; value: number }>
    throughput: Array<{ timestamp: string; value: number }>
    errorRate: Array<{ timestamp: string; value: number }>
  }
}

interface PerformanceMetricsProps {
  jobQueueId?: string
  timeRange?: '1h' | '24h' | '7d' | '30d'
  className?: string
}

export function PerformanceMetrics({
  jobQueueId,
  timeRange = '24h',
  className
}: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)

  const loadMetrics = async () => {
    try {
      setLoading(true)
      // Mock data - substituir por chamada real à API
      const mockMetrics: PerformanceData = {
        averageExecutionTime: 45.7,
        medianExecutionTime: 32.1,
        p95ExecutionTime: 125.3,
        p99ExecutionTime: 187.6,
        throughput: {
          jobsPerHour: 156,
          jobsPerDay: 3744,
          trend: 12.3
        },
        resourceUsage: {
          avgCpuPercent: 23.5,
          avgMemoryMB: 512,
          peakCpuPercent: 78.2,
          peakMemoryMB: 1024
        },
        reliability: {
          uptimePercent: 99.2,
          successRate: 94.7,
          mtbf: 168,
          mttr: 4.5
        },
        queueMetrics: {
          avgQueueTime: 2.3,
          maxQueueTime: 45.7,
          queuedJobs: 12,
          processingJobs: 3
        },
        trends: {
          executionTime: [
            { timestamp: '2024-01-24T10:00:00Z', value: 42.1 },
            { timestamp: '2024-01-24T11:00:00Z', value: 45.7 },
            { timestamp: '2024-01-24T12:00:00Z', value: 41.3 },
            { timestamp: '2024-01-24T13:00:00Z', value: 48.9 },
            { timestamp: '2024-01-24T14:00:00Z', value: 43.6 }
          ],
          throughput: [
            { timestamp: '2024-01-24T10:00:00Z', value: 145 },
            { timestamp: '2024-01-24T11:00:00Z', value: 156 },
            { timestamp: '2024-01-24T12:00:00Z', value: 162 },
            { timestamp: '2024-01-24T13:00:00Z', value: 148 },
            { timestamp: '2024-01-24T14:00:00Z', value: 171 }
          ],
          errorRate: [
            { timestamp: '2024-01-24T10:00:00Z', value: 5.2 },
            { timestamp: '2024-01-24T11:00:00Z', value: 4.1 },
            { timestamp: '2024-01-24T12:00:00Z', value: 6.3 },
            { timestamp: '2024-01-24T13:00:00Z', value: 3.8 },
            { timestamp: '2024-01-24T14:00:00Z', value: 5.7 }
          ]
        }
      }
      setMetrics(mockMetrics)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [jobQueueId, selectedTimeRange])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-spin" />
            Carregando métricas...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Erro ao carregar métricas
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`
    return `${(seconds / 3600).toFixed(1)}h`
  }

  const getPerformanceScore = (): { score: number; grade: string; color: string } => {
    const timeScore = Math.max(0, 100 - (metrics.p95ExecutionTime / 60) * 10) // Penaliza tempos longos
    const reliabilityScore = metrics.reliability.successRate
    const uptimeScore = metrics.reliability.uptimePercent

    const overall = (timeScore * 0.3 + reliabilityScore * 0.4 + uptimeScore * 0.3)

    if (overall >= 90) return { score: overall, grade: 'A', color: 'text-green-600' }
    if (overall >= 80) return { score: overall, grade: 'B', color: 'text-blue-600' }
    if (overall >= 70) return { score: overall, grade: 'C', color: 'text-yellow-600' }
    if (overall >= 60) return { score: overall, grade: 'D', color: 'text-orange-600' }
    return { score: overall, grade: 'F', color: 'text-red-600' }
  }

  const performance = getPerformanceScore()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com controles */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Métricas de Performance</h3>
          <p className="text-sm text-muted-foreground">
            Análise detalhada de performance e eficiência
          </p>
        </div>
        <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">1 hora</SelectItem>
            <SelectItem value="24h">24 horas</SelectItem>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Score geral de performance */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-bold">Score de Performance</h4>
              <p className="text-muted-foreground">Avaliação geral do sistema</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${performance.color}`}>
                {performance.grade}
              </div>
              <div className="text-lg text-muted-foreground">
                {performance.score.toFixed(1)}/100
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={performance.score} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Métricas de tempo de execução */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{formatTime(metrics.averageExecutionTime)}</p>
              </div>
              <Timer className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mediana</p>
                <p className="text-2xl font-bold">{formatTime(metrics.medianExecutionTime)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">P95</p>
                <p className="text-2xl font-bold">{formatTime(metrics.p95ExecutionTime)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">P99</p>
                <p className="text-2xl font-bold">{formatTime(metrics.p99ExecutionTime)}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Throughput e Confiabilidade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Throughput
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Jobs/Hora</p>
                <p className="text-2xl font-bold">{metrics.throughput.jobsPerHour}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jobs/Dia</p>
                <p className="text-2xl font-bold">{metrics.throughput.jobsPerDay.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={metrics.throughput.trend > 0 ? "default" : "destructive"}>
                {metrics.throughput.trend > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(metrics.throughput.trend).toFixed(1)}%
              </Badge>
              <span className="text-sm text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Confiabilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Uptime</span>
                <span className="font-medium">{metrics.reliability.uptimePercent}%</span>
              </div>
              <Progress value={metrics.reliability.uptimePercent} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Taxa de Sucesso</span>
                <span className="font-medium">{metrics.reliability.successRate}%</span>
              </div>
              <Progress value={metrics.reliability.successRate} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">MTBF</p>
                <p className="font-medium">{metrics.reliability.mtbf}h</p>
              </div>
              <div>
                <p className="text-muted-foreground">MTTR</p>
                <p className="font-medium">{metrics.reliability.mttr}min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uso de recursos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Uso de Recursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">CPU</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uso Médio</span>
                  <span>{metrics.resourceUsage.avgCpuPercent}%</span>
                </div>
                <Progress value={metrics.resourceUsage.avgCpuPercent} className="h-2" />
              </div>
              <div className="text-sm text-muted-foreground">
                Pico: {metrics.resourceUsage.peakCpuPercent}%
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Memória</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uso Médio</span>
                  <span>{metrics.resourceUsage.avgMemoryMB} MB</span>
                </div>
                <Progress
                  value={(metrics.resourceUsage.avgMemoryMB / 2048) * 100}
                  className="h-2"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Pico: {metrics.resourceUsage.peakMemoryMB} MB
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de fila */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Métricas de Fila
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{metrics.queueMetrics.queuedJobs}</p>
              <p className="text-sm text-muted-foreground">Na Fila</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{metrics.queueMetrics.processingJobs}</p>
              <p className="text-sm text-muted-foreground">Processando</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{formatTime(metrics.queueMetrics.avgQueueTime)}</p>
              <p className="text-sm text-muted-foreground">Tempo Médio</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{formatTime(metrics.queueMetrics.maxQueueTime)}</p>
              <p className="text-sm text-muted-foreground">Tempo Máximo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-2">
        <Button onClick={loadMetrics} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button variant="outline">
          <HardDrive className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>
    </div>
  )
}