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
  Calendar,
  Lock,
  Unlock
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

// Enhanced mock data with more realistic Redis queue data
const mockJobQueues = [
  {
    id: 'queue_ssl_monitor',
    name: 'SSL Certificate Monitor',
    scriptType: 'internal',
    cronExpression: '0 6 * * *',
    isActive: true,
    isLocked: false,
    lastExecution: new Date('2025-01-15T06:00:00Z'),
    nextExecution: new Date('2025-01-16T06:00:00Z'),
    status: 'completed',
    executionCount: 247,
    successRate: 99.2,
    avgExecutionTime: 1800,
    queueName: 'ssl_monitor',
    priority: 'high',
    timeout: 300,
    retryAttempts: 3,
    environment: 'production',
    processor: 'SSLCertificateChecker'
  },
  {
    id: 'queue_backup_db',
    name: 'Database Backup',
    scriptType: 'shell',
    cronExpression: '0 2 * * *',
    isActive: true,
    isLocked: false,
    lastExecution: new Date('2025-01-15T02:00:00Z'),
    nextExecution: new Date('2025-01-16T02:00:00Z'),
    status: 'running',
    executionCount: 89,
    successRate: 98.9,
    avgExecutionTime: 45000,
    queueName: 'database_backup',
    priority: 'critical',
    timeout: 3600,
    retryAttempts: 2,
    environment: 'production',
    processor: 'PostgreSQLBackupProcessor'
  },
  {
    id: 'queue_log_cleanup',
    name: 'Log Cleanup',
    scriptType: 'internal',
    cronExpression: '0 3 * * 0',
    isActive: true,
    isLocked: false,
    lastExecution: new Date('2025-01-14T03:00:00Z'),
    nextExecution: new Date('2025-01-21T03:00:00Z'),
    status: 'completed',
    executionCount: 12,
    successRate: 100,
    avgExecutionTime: 8500,
    queueName: 'log_cleanup',
    priority: 'normal',
    timeout: 1800,
    retryAttempts: 1,
    environment: 'production',
    processor: 'LogCleanupProcessor'
  },
  {
    id: 'queue_domain_sync',
    name: 'Domain Configuration Sync',
    scriptType: 'internal',
    cronExpression: '*/15 * * * *',
    isActive: true,
    isLocked: false,
    lastExecution: new Date('2025-01-15T14:30:00Z'),
    nextExecution: new Date('2025-01-15T14:45:00Z'),
    status: 'completed',
    executionCount: 1456,
    successRate: 97.8,
    avgExecutionTime: 2200,
    queueName: 'domain_sync',
    priority: 'high',
    timeout: 600,
    retryAttempts: 3,
    environment: 'production',
    processor: 'DomainSyncProcessor'
  },
  {
    id: 'queue_proxy_health',
    name: 'Proxy Health Check',
    scriptType: 'internal',
    cronExpression: '*/5 * * * *',
    isActive: true,
    isLocked: false,
    lastExecution: new Date('2025-01-15T14:35:00Z'),
    nextExecution: new Date('2025-01-15T14:40:00Z'),
    status: 'running',
    executionCount: 4368,
    successRate: 99.7,
    avgExecutionTime: 800,
    queueName: 'proxy_health_check',
    priority: 'high',
    timeout: 120,
    retryAttempts: 2,
    environment: 'production',
    processor: 'ProxyHealthChecker'
  },
  {
    id: 'queue_log_analysis',
    name: 'Log Analysis & Alerting',
    scriptType: 'python',
    cronExpression: '*/10 * * * *',
    isActive: true,
    isLocked: true,
    lastExecution: new Date('2025-01-15T14:30:00Z'),
    nextExecution: new Date('2025-01-15T14:40:00Z'),
    status: 'failed',
    executionCount: 2184,
    successRate: 95.3,
    avgExecutionTime: 12000,
    queueName: 'log_analysis',
    priority: 'normal',
    timeout: 900,
    retryAttempts: 2,
    environment: 'production',
    processor: 'LogAnalysisProcessor'
  },
  {
    id: 'queue_cert_renewal',
    name: 'SSL Certificate Renewal',
    scriptType: 'shell',
    cronExpression: '0 4 * * 1',
    isActive: false,
    isLocked: false,
    lastExecution: new Date('2025-01-13T04:00:00Z'),
    nextExecution: null,
    status: 'paused',
    executionCount: 45,
    successRate: 93.3,
    avgExecutionTime: 180000,
    queueName: 'cert_renewal',
    priority: 'critical',
    timeout: 7200,
    retryAttempts: 3,
    environment: 'production',
    processor: 'CertRenewalProcessor'
  }
];

const mockStatistics = {
  totalJobs: 7,
  activeJobs: 6,
  completedExecutions: 8401,
  failedExecutions: 234,
  averageExecutionTime: 8900,
  upcomingExecutions: 5,
  queuesProcessing: 2,
  totalQueues: 7,
  successRate: 97.3,
  avgWaitTime: 1200
};

export default function JobQueuesPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    isActive: '',
    page: 1,
    limit: 10
  });

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
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
              job.queueName.toLowerCase().includes(filters.search.toLowerCase()) ||
              job.processor.toLowerCase().includes(filters.search.toLowerCase())
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

  // Mutação para travar/destravar job
  const toggleLockMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(`Job ${id} lock toggled`), 500);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Travamento alterado',
        description: 'Status do travamento foi alterado com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['job-queues'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao alterar travamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive) {
      return 'bg-gray-400';
    }

    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'paused':
        return 'bg-orange-500';
      default:
        return 'bg-gray-400';
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

  const showConfirmModal = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'info' = 'info') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const hideConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      type: 'info'
    });
  };

  const handleExecute = (id: string, name: string) => {
    showConfirmModal(
      'Executar Job',
      `Confirma a execução imediata do job "${name}"?`,
      () => {
        executeMutation.mutate({ id });
        hideConfirmModal();
      },
      'info'
    );
  };

  const handleToggle = (id: string, name: string, isActive: boolean) => {
    const action = isActive ? 'desativar' : 'ativar';
    showConfirmModal(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Job`,
      `Confirma ${action} o job "${name}"?`,
      () => {
        toggleMutation.mutate({ id });
        hideConfirmModal();
      },
      'info'
    );
  };

  const handleToggleLock = (id: string, name: string, isLocked: boolean) => {
    const action = isLocked ? 'destravar' : 'travar';
    showConfirmModal(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Job`,
      `Confirma ${action} o job "${name}"?`,
      () => {
        toggleLockMutation.mutate({ id });
        hideConfirmModal();
      },
      'info'
    );
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

  const breadcrumbs = [
    { label: 'Filas de Processo', current: true }
  ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Filas de Processo & Agendamento</h1>
          </div>
          <div className="flex space-x-2">
            <Link href="/job-queues/create">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
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
                    placeholder="Nome, fila ou processador"
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                        <TableHead className="hidden md:table-cell">Última Execução</TableHead>
                        <TableHead className="hidden md:table-cell">Próxima Execução</TableHead>
                        <TableHead className="hidden lg:table-cell">Taxa de Sucesso</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {(data as any)?.data?.map((job: any) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(job.status, job.isActive)}`} />
                            <div>
                              <button
                                onClick={() => setSelectedJob(job)}
                                className="font-medium hover:underline text-left"
                              >
                                {job.name}
                              </button>
                              <div className="flex items-center space-x-2 mt-1">
                                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                                  {job.cronExpression}
                                </code>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {getScriptTypeBadge(job.scriptType)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
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
                        <TableCell className="hidden md:table-cell">
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
                        <TableCell className="hidden lg:table-cell">
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
                              onClick={() => handleToggleLock(job.id, job.name, job.isLocked)}
                              disabled={toggleLockMutation.isPending}
                              title={job.isLocked ? 'Travado (clique para destravar)' : 'Destravado (clique para travar)'}
                            >
                              {job.isLocked ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </Button>

                            {!job.isLocked && (
                              <>
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

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedJob(job)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

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
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedJob.status, selectedJob.isActive)}`} />
                    <h3 className="text-lg font-semibold text-foreground">{selectedJob.name}</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedJob(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-96">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Descrição</h4>
                    <p className="text-sm text-muted-foreground">{selectedJob.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo de Script</label>
                      <div className="mt-1">
                        {getScriptTypeBadge(selectedJob.scriptType)}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                      <p className="mt-1 text-sm text-foreground">{selectedJob.priority}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedJob.status, selectedJob.isActive)}`} />
                        <span className="text-sm text-foreground">
                          {!selectedJob.isActive ? 'Desativado' :
                           selectedJob.status === 'running' ? 'Executando' :
                           selectedJob.status === 'completed' ? 'Concluído' :
                           selectedJob.status === 'failed' ? 'Falhou' :
                           selectedJob.status === 'paused' ? 'Pausado' :
                           'Aguardando'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ativo</label>
                      <p className="mt-1 text-sm text-foreground">{selectedJob.isActive ? 'Sim' : 'Não'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Agendamento (Cron)</label>
                    <div className="mt-1">
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {selectedJob.cronExpression}
                      </code>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Última Execução</label>
                      <p className="mt-1 text-sm text-foreground">
                        {selectedJob.lastExecution ?
                          new Date(selectedJob.lastExecution).toLocaleString('pt-BR') :
                          'Nunca'
                        }
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Próxima Execução</label>
                      <p className="mt-1 text-sm text-foreground">
                        {selectedJob.nextExecution ?
                          new Date(selectedJob.nextExecution).toLocaleString('pt-BR') :
                          'N/A'
                        }
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Execuções Totais</label>
                      <p className="mt-1 text-sm text-foreground">{selectedJob.executionCount}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</label>
                      <p className="mt-1 text-sm text-foreground">{selectedJob.successRate}%</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tempo Médio de Execução</label>
                      <p className="mt-1 text-sm text-foreground">{formatTime(selectedJob.avgExecutionTime)}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Travado</label>
                      <p className="mt-1 text-sm text-foreground">{selectedJob.isLocked ? 'Sim' : 'Não'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">{confirmModal.title}</h3>
                <p className="text-sm text-muted-foreground mb-6">{confirmModal.message}</p>
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={hideConfirmModal}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant={confirmModal.type === 'danger' ? 'destructive' : 'default'}
                    onClick={confirmModal.onConfirm}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}