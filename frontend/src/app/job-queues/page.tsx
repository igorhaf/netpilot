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
import { EmptyState } from '@/components/ui/empty-state';
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
  Bell,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { jobQueuesApi, type JobQueue, type JobStatistics } from '@/lib/api/job-queues';
import { JobsDashboard } from '@/components/jobs/JobsDashboard';
import { JobExecutionLogs } from '@/components/jobs/JobExecutionLogs';
import { RetryPolicyConfig } from '@/components/jobs/RetryPolicyConfig';
import { RetryStats } from '@/components/jobs/RetryStats';
import { PerformanceMetrics } from '@/components/jobs/PerformanceMetrics';
import { JobNotifications } from '@/components/jobs/JobNotifications';

export default function JobQueuesPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    isActive: '',
    page: 1,
    limit: 10
  });

  const [selectedJob, setSelectedJob] = useState<JobQueue | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'logs' | 'retry' | 'performance' | 'notifications'>('jobs');
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
    queryFn: () => jobQueuesApi.list(filters),
    refetchInterval: 30000
  });

  // Mutação para executar job manualmente
  const executeMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => jobQueuesApi.execute(id),
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
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutação para ativar/desativar job
  const toggleMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => jobQueuesApi.toggleActive(id),
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
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutação para deletar job
  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => jobQueuesApi.delete(id),
    onSuccess: () => {
      toast({
        title: 'Job removido',
        description: 'Job foi removido com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['job-queues'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover job',
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: string | undefined, isActive: boolean) => {
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

  const formatTime = (ms: number | undefined) => {
    if (!ms) return 'N/A';
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

  const handleDelete = (id: string, name: string) => {
    showConfirmModal(
      'Remover Job',
      `Confirma a remoção do job "${name}"? Esta ação não pode ser desfeita.`,
      () => {
        deleteMutation.mutate({ id });
        hideConfirmModal();
      },
      'danger'
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

        {/* Navegação por Abas */}
        <div className="flex space-x-1 border-b">
          {[
            { id: 'jobs', label: 'Jobs', icon: Settings },
            { id: 'logs', label: 'Logs', icon: Eye },
            { id: 'retry', label: 'Retry Stats', icon: RotateCcw },
            { id: 'performance', label: 'Performance', icon: Activity },
            { id: 'notifications', label: 'Notificações', icon: Bell }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo baseado na aba ativa */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <JobExecutionLogs />
          </div>
        )}

        {activeTab === 'retry' && (
          <div className="space-y-6">
            <RetryStats />
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <PerformanceMetrics />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6 flex justify-center">
            <JobNotifications />
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-6">

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
            ) : (data as any)?.data && (data as any).data.length > 0 ? (
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
                              onClick={() => handleExecute(job.id, job.name)}
                              disabled={executeMutation.isPending || !job.isActive}
                              title="Executar job manualmente"
                            >
                              <Play className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggle(job.id, job.name, job.isActive)}
                              disabled={toggleMutation.isPending}
                              title={job.isActive ? 'Desativar job' : 'Ativar job'}
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
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Link href={`/job-queues/${job.id}/edit`}>
                              <Button size="sm" variant="outline" title="Editar job">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(job.id, job.name)}
                              disabled={deleteMutation.isPending}
                              title="Remover job"
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
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="Nenhum job encontrado"
                description="Crie novos jobs para automatizar tarefas e processos agendados no sistema."
                actionLabel="Novo Job"
                onAction={() => window.location.href = '/job-queues/create'}
              />
            )}
          </CardContent>
        </Card>
          </div>
        )}

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
                    <label className="text-sm font-medium text-muted-foreground">Comando/Script</label>
                    <div className="mt-1">
                      <code className="bg-muted px-3 py-2 rounded text-sm block overflow-x-auto">
                        {selectedJob.scriptPath || 'Não especificado'}
                      </code>
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
                      <label className="text-sm font-medium text-muted-foreground">Timeout</label>
                      <p className="mt-1 text-sm text-foreground">{selectedJob.timeout}s</p>
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