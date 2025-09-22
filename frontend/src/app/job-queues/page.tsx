'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Play,
  Square,
  Plus,
  Search,
  Filter,
  Settings,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Edit,
  Trash2,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

// Mock data para desenvolvimento
const mockJobQueues = [
  {
    id: 'job_1',
    name: 'Análise por IA',
    description: 'Análise automática de logs usando IA para detectar padrões suspeitos',
    scriptType: 'internal',
    cronExpression: '0 */5 * * *',
    isActive: true,
    priority: 1,
    lastExecution: new Date('2024-01-15T10:30:00Z'),
    nextExecution: new Date('2024-01-15T15:30:00Z'),
    status: 'running',
    executionCount: 142,
    successRate: 98.5,
    avgExecutionTime: 2400
  },
  {
    id: 'job_2',
    name: 'Backup Automático',
    description: 'Backup diário do banco PostgreSQL e configurações',
    scriptType: 'shell',
    cronExpression: '0 2 * * *',
    isActive: true,
    priority: 2,
    lastExecution: new Date('2024-01-15T02:00:00Z'),
    nextExecution: new Date('2024-01-16T02:00:00Z'),
    status: 'completed',
    executionCount: 30,
    successRate: 100,
    avgExecutionTime: 45000
  },
  {
    id: 'job_3',
    name: 'Verificação SSL',
    description: 'Monitoramento de certificados SSL próximos ao vencimento',
    scriptType: 'internal',
    cronExpression: '0 8 * * *',
    isActive: true,
    priority: 3,
    lastExecution: new Date('2024-01-15T08:00:00Z'),
    nextExecution: new Date('2024-01-16T08:00:00Z'),
    status: 'failed',
    executionCount: 15,
    successRate: 93.3,
    avgExecutionTime: 3200
  },
  {
    id: 'job_4',
    name: 'Limpeza de Logs',
    description: 'Limpeza automática de logs antigos e rotação',
    scriptType: 'internal',
    cronExpression: '0 3 * * 0',
    isActive: false,
    priority: 4,
    lastExecution: new Date('2024-01-14T03:00:00Z'),
    nextExecution: null,
    status: 'paused',
    executionCount: 8,
    successRate: 87.5,
    avgExecutionTime: 8500
  }
];

const mockStatistics = {
  totalJobs: 4,
  activeJobs: 3,
  completedExecutions: 195,
  failedExecutions: 12,
  averageExecutionTime: 14800,
  upcomingExecutions: 3
};

export default function JobQueuesPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    isActive: '',
    page: 1,
    limit: 10
  });

  const queryClient = useQueryClient();

  // Query para listar job queues
  const { data, isLoading, error } = useQuery({
    queryKey: ['job-queues', filters],
    queryFn: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          let filteredJobs = [...mockJobQueues];

          // Aplicar filtros
          if (filters.search) {
            filteredJobs = filteredJobs.filter(job =>
              job.name.toLowerCase().includes(filters.search.toLowerCase()) ||
              job.description.toLowerCase().includes(filters.search.toLowerCase())
            );
          }

          if (filters.status) {
            filteredJobs = filteredJobs.filter(job => job.status === filters.status);
          }

          if (filters.isActive) {
            const isActive = filters.isActive === 'true';
            filteredJobs = filteredJobs.filter(job => job.isActive === isActive);
          }

          resolve({
            data: filteredJobs,
            statistics: mockStatistics
          });
        }, 500);
      });
    },
    refetchInterval: 30000
  });

  // Mutação para executar job manualmente
  const executeMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(`Job ${id} executado`), 1000);
      });
    },
    onSuccess: (_, { id }) => {
      toast({
        title: 'Job executado',
        description: 'Job foi adicionado à fila de execução',
      });
      queryClient.invalidateQueries({ queryKey: ['job-queues'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao executar job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutação para ativar/desativar job
  const toggleMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(`Job ${id} toggled`), 500);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Status alterado',
        description: 'Status do job foi alterado com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['job-queues'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Desativado</Badge>;
    }

    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-blue-500">Executando</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'paused':
        return <Badge variant="outline">Pausado</Badge>;
      default:
        return <Badge variant="secondary">Aguardando</Badge>;
    }
  };

  const getScriptTypeBadge = (type: string) => {
    const variants = {
      internal: 'default',
      shell: 'secondary',
      node: 'outline',
      python: 'destructive'
    } as const;

    return <Badge variant={variants[type as keyof typeof variants] || 'outline'}>{type}</Badge>;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  const handleExecute = (id: string, name: string) => {
    if (confirm(`Executar job "${name}" agora?`)) {
      executeMutation.mutate({ id });
    }
  };

  const handleToggle = (id: string, name: string, isActive: boolean) => {
    const action = isActive ? 'desativar' : 'ativar';
    if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} job "${name}"?`)) {
      toggleMutation.mutate({ id });
    }
  };

  if (error) {
    return (
      <MainLayout>
        <div className="text-center text-red-500 p-8">
          Erro ao carregar jobs: {(error as Error).message}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Job Queues & Agendamento</h1>
            <p className="text-muted-foreground">
              Gerencie tarefas automatizadas e agendamentos do sistema
            </p>
          </div>
          <div className="flex space-x-2">
            <Link href="/job-queues/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Job
              </Button>
            </Link>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Jobs</p>
                  <p className="text-2xl font-bold">{(data as any)?.statistics?.totalJobs || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">{(data as any)?.statistics?.activeJobs || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Próximas</p>
                  <p className="text-2xl font-bold">{(data as any)?.statistics?.upcomingExecutions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Concluídas</p>
                  <p className="text-2xl font-bold">{(data as any)?.statistics?.completedExecutions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Falhas</p>
                  <p className="text-2xl font-bold">{(data as any)?.statistics?.failedExecutions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio</p>
                  <p className="text-2xl font-bold">
                    {formatTime((data as any)?.statistics?.averageExecutionTime || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou descrição"
                    value={filters.search}
                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(f => ({ ...f, status: value, page: 1 }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="running">Executando</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select
                  value={filters.isActive}
                  onValueChange={(value) => setFilters(f => ({ ...f, isActive: value, page: 1 }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="true">Ativos</SelectItem>
                    <SelectItem value="false">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ações</label>
                <Button
                  variant="outline"
                  onClick={() => setFilters({ search: '', status: '', isActive: '', page: 1, limit: 10 })}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Jobs ({(data as any)?.data?.length || 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Agendamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Última Execução</TableHead>
                      <TableHead>Próxima Execução</TableHead>
                      <TableHead>Taxa de Sucesso</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data as any)?.data?.map((job: any) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <Link
                              href={`/job-queues/${job.id}`}
                              className="font-medium hover:underline"
                            >
                              {job.name}
                            </Link>
                            <p className="text-sm text-muted-foreground">{job.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Prioridade {job.priority}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getScriptTypeBadge(job.scriptType)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <code className="bg-muted px-1 py-0.5 rounded text-xs">
                              {job.cronExpression}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(job.status, job.isActive)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {job.lastExecution ? (
                              <>
                                <div>{new Date(job.lastExecution).toLocaleDateString('pt-BR')}</div>
                                <div className="text-muted-foreground">
                                  {new Date(job.lastExecution).toLocaleTimeString('pt-BR')}
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">Nunca</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {job.nextExecution ? (
                              <>
                                <div>{new Date(job.nextExecution).toLocaleDateString('pt-BR')}</div>
                                <div className="text-muted-foreground">
                                  {new Date(job.nextExecution).toLocaleTimeString('pt-BR')}
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">{job.successRate}%</span>
                            <div className="text-xs text-muted-foreground">
                              ({job.executionCount} exec.)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExecute(job.id, job.name)}
                              disabled={executeMutation.isPending || !job.isActive}
                            >
                              <Play className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggle(job.id, job.name, job.isActive)}
                              disabled={toggleMutation.isPending}
                            >
                              {job.isActive ? (
                                <Square className="h-4 w-4" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </Button>

                            <Link href={`/job-queues/${job.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>

                            <Link href={`/job-queues/${job.id}/edit`}>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}