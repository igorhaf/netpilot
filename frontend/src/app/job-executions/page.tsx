'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobExecutionsApi } from '@/lib/api/job-queues';
import io from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
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
import { Checkbox } from '@/components/ui/checkbox';
import { MainLayout } from '@/components/layout/main-layout';
import {
  RotateCw,
  Square,
  Search,
  Filter,
  Clock,
  FileText,
  Download,
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause,
  Calendar,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';


export default function JobExecutionsPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    triggerType: '',
    jobQueueId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  // Conectar ao WebSocket para atualizações em tempo real
  useEffect(() => {
    if (!token) return;

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/jobs`, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('📡 WebSocket conectado - Job Executions');
      // Inscrever para receber todas as notificações
      socket.emit('subscribe:all');
    });

    // Atualizar quando job iniciar
    socket.on('job:notification', (notification: any) => {
      console.log('🔔 Notificação recebida:', notification);

      // Invalidar queries para buscar dados atualizados
      queryClient.invalidateQueries({ queryKey: ['job-executions'] });
    });

    socket.on('disconnect', () => {
      console.log('📡 WebSocket desconectado - Job Executions');
    });

    return () => {
      socket.emit('unsubscribe:all');
      socket.disconnect();
    };
  }, [token, queryClient]);

  // Query para listar execuções APENAS EM FILA (pending/running)
  const { data, isLoading, error } = useQuery({
    queryKey: ['job-executions', filters],
    queryFn: async () => {
      // Filtrar APENAS pending e running via API
      const apiFilters = {
        status: 'pending,running',
        search: filters.search || undefined,
        triggerType: filters.triggerType || undefined,
        page: filters.page,
        limit: filters.limit
      };

      const response = await jobExecutionsApi.list(apiFilters);
      return response;
    },
  });

  // Mutação para cancelar execução
  const cancelMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => jobExecutionsApi.cancel(id),
    onSuccess: () => {
      toast({
        title: 'Execução cancelada',
        description: 'A execução foi cancelada com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['job-executions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cancelar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutação para tentar novamente
  const retryMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => jobExecutionsApi.retry(id),
    onSuccess: () => {
      toast({
        title: 'Execução iniciada',
        description: 'A execução foi adicionada à fila novamente',
      });
      queryClient.invalidateQueries({ queryKey: ['job-executions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao reexecutar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutação para deletar execuções em massa
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => jobExecutionsApi.delete(id)));
    },
    onSuccess: () => {
      toast({
        title: 'Execuções deletadas',
        description: `${selectedIds.length} execução(ões) deletada(s) com sucesso!`,
      });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['job-executions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao deletar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-500">Executando</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelado</Badge>;
      case 'timeout':
        return <Badge variant="destructive">Timeout</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTriggerTypeBadge = (type: string) => {
    const variants = {
      scheduled: 'default',
      manual: 'secondary',
      api: 'outline'
    } as const;

    const icons = {
      scheduled: <Calendar className="h-3 w-3 mr-1" />,
      manual: <Play className="h-3 w-3 mr-1" />,
      api: <FileText className="h-3 w-3 mr-1" />
    };

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'outline'}>
        {icons[type as keyof typeof icons]}
        {type === 'scheduled' ? 'Agendado' : type === 'manual' ? 'Manual' : 'API'}
      </Badge>
    );
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';

    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  };

  const handleCancel = (id: string) => {
    if (confirm('Cancelar execução?')) {
      cancelMutation.mutate({ id });
    }
  };

  const handleRetry = (id: string) => {
    if (confirm('Reexecutar job?')) {
      retryMutation.mutate({ id });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!data?.data) return;

    if (selectedIds.length === data.data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.data.map((exec: any) => exec.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;

    if (confirm(`Deletar ${selectedIds.length} execução(ões) selecionada(s)?`)) {
      deleteMutation.mutate(selectedIds);
    }
  };

  const isAllSelected = data?.data && selectedIds.length === data.data.length && data.data.length > 0;

  if (error) {
    return (
      <MainLayout breadcrumbs={[{ label: "Execuções de Jobs", current: true }]}>
        <div className="text-center text-red-500 p-8">
          Erro ao carregar execuções: {(error as Error).message}
        </div>
      </MainLayout>
    );
  }

  const breadcrumbs = [
    { label: "Execuções de Jobs", current: true, icon: Clock }
  ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Link href="/job-queues">
            <Button variant="outline">
              Voltar para Jobs
            </Button>
          </Link>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome do job"
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
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="running">Executando</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="timeout">Timeout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Disparo</label>
                <Select
                  value={filters.triggerType}
                  onValueChange={(value) => setFilters(f => ({ ...f, triggerType: value, page: 1 }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Início</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value, page: 1 }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ações</label>
                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    search: '', status: '', triggerType: '', jobQueueId: '',
                    startDate: '', endDate: '', page: 1, limit: 20
                  })}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Execuções */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Execuções ({(data as any)?.total || 0})</span>
                {selectedIds.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedIds.length} selecionado(s)
                  </Badge>
                )}
              </CardTitle>
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Selecionados
                </Button>
              )}
            </div>
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
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Iniciado</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Tentativas</TableHead>
                      <TableHead>Disparado Por</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data as any)?.data?.map((execution: any) => (
                      <TableRow key={execution.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(execution.id)}
                            onCheckedChange={() => toggleSelect(execution.id)}
                            aria-label={`Selecionar ${execution.jobQueue.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{execution.jobQueue.name}</div>
                            <Badge variant="outline" className="text-xs">
                              {execution.jobQueue.scriptType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(execution.status)}
                            {execution.retryCount > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {execution.retryCount} tentativas
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTriggerTypeBadge(execution.triggerType)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {execution.startedAt ? (
                              <>
                                <div>{new Date(execution.startedAt).toLocaleDateString('pt-BR')}</div>
                                <div className="text-muted-foreground">
                                  {new Date(execution.startedAt).toLocaleTimeString('pt-BR')}
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {execution.status === 'running' ? (
                              <div className="flex items-center space-x-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                                <span>Executando...</span>
                              </div>
                            ) : (
                              formatDuration(execution.executionTimeMs)
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {execution.retryCount > 0 ? (
                              <Badge variant="outline" className="text-xs">
                                {execution.retryCount + 1}ª tentativa
                              </Badge>
                            ) : (
                              '1ª tentativa'
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {execution.triggeredBy ? (
                              <div>
                                <div>{execution.triggeredBy.name}</div>
                                <div className="text-muted-foreground">Manual</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Sistema</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {execution.status === 'running' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancel(execution.id)}
                                disabled={cancelMutation.isPending}
                              >
                                <Square className="h-4 w-4" />
                              </Button>
                            )}

                            {execution.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetry(execution.id)}
                                disabled={retryMutation.isPending}
                              >
                                <RotateCw className="h-4 w-4" />
                              </Button>
                            )}

                            <Link href={`/job-executions/${execution.id}/logs`}>
                              <Button size="sm" variant="outline">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </Link>

                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {(data as any) && (data as any).pages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((data as any).page - 1) * (data as any).limit + 1} a{' '}
                      {Math.min((data as any).page * (data as any).limit, (data as any).total)} de{' '}
                      {(data as any).total} execuções
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        disabled={(data as any).page === 1}
                        onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        disabled={(data as any).page === (data as any).pages}
                        onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}