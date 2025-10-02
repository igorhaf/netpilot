'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Container,
  Network,
  HardDrive,
  Image as ImageIcon,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Play,
  Square,
  RotateCcw,
  Eye,
  Trash2,
  Terminal,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { DockerApiService } from '@/lib/docker-api';
import { toast } from '@/hooks/use-toast';

export default function DockerDashboard() {
  const queryClient = useQueryClient();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['docker', 'summary'],
    queryFn: () => DockerApiService.getDashboardData(),
    refetchInterval: 30000 // Refresh a cada 30s
  });

  const { data: containersResponse, isLoading: containersLoading } = useQuery({
    queryKey: ['docker', 'containers'],
    queryFn: () => DockerApiService.listContainers(),
    refetchInterval: 10000 // Refresh a cada 10s para containers
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      switch (action) {
        case 'start':
          return await DockerApiService.startContainer(id);
        case 'stop':
          return await DockerApiService.stopContainer(id);
        case 'restart':
          return await DockerApiService.restartContainer(id);
        case 'remove':
          return await DockerApiService.removeContainer(id);
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    },
    onSuccess: (result, { action }) => {
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: result.message
        });
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive'
        });
      }
      queryClient.invalidateQueries({ queryKey: ['docker', 'containers'] });
      queryClient.invalidateQueries({ queryKey: ['docker', 'summary'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao executar ação',
        variant: 'destructive'
      });
    }
  });

  const handleAction = (containerId: string, action: string) => {
    actionMutation.mutate({ id: containerId, action });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  const breadcrumbs = [
    { label: 'Docker', current: true, icon: Container }
  ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Containers</CardTitle>
            <Container className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.containers?.total || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>{summary?.containers?.running || 0} rodando</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span>{summary?.containers?.stopped || 0} parados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volumes</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.volumes?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.volumes?.used_space || '0 B'} em uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redes</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.networks?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.networks?.custom || 0} personalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imagens</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.images?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.images?.total_size || '0 B'} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Containers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Container className="h-5 w-5" />
              <span>Containers Ativos</span>
            </CardTitle>
            <Link href="/docker/containers">
              <Button variant="outline" size="sm">
                Ver Todos
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {containersLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto border rounded-lg">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px] w-[200px]">Nome</TableHead>
                      <TableHead className="min-w-[150px] w-[200px] hidden sm:table-cell">Imagem</TableHead>
                      <TableHead className="min-w-[100px] w-[120px] hidden md:table-cell">Portas</TableHead>
                      <TableHead className="text-right min-w-[200px] w-[250px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {containersResponse?.data?.filter((container: any) => container.state === 'running').slice(0, 10).map((container: any) => (
                    <TableRow key={container.id}>
                      <TableCell className="min-w-[150px] w-[200px]">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            container.state === 'running' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">
                              {container.names[0].replace('/', '')}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {container.id.substring(0, 12)}
                            </div>
                            {/* Mostrar imagem em mobile */}
                            <div className="text-xs text-muted-foreground sm:hidden mt-1 truncate">
                              {container.image.length > 30 ? container.image.substring(0, 30) + '...' : container.image}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[150px] w-[200px] hidden sm:table-cell">
                        <div className="text-sm font-mono truncate" title={container.image}>
                          {container.image.length > 40
                            ? container.image.substring(0, 40) + '...'
                            : container.image
                          }
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[100px] w-[120px] hidden md:table-cell">
                        <div className="text-sm">
                          {container.ports?.length > 0 ? (
                            <div className="space-y-1">
                              {container.ports.slice(0, 2).map((port: any, index: number) => (
                                <div key={index} className="font-mono text-xs">
                                  {port.PublicPort ? `${port.PublicPort}:${port.PrivatePort}` : port.PrivatePort}
                                </div>
                              ))}
                              {container.ports.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{container.ports.length - 2} mais
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right min-w-[200px] w-[250px]">
                        {/* Mobile: apenas ações essenciais */}
                        <div className="flex items-center justify-end gap-1 md:hidden">
                          <Link href={`/docker/containers/${container.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Ver detalhes"
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          {container.state === 'running' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(container.id, 'stop')}
                              disabled={actionMutation.isPending}
                              title="Parar"
                              className="h-8 w-8 p-0"
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(container.id, 'start')}
                              disabled={actionMutation.isPending}
                              title="Iniciar"
                              className="h-8 w-8 p-0"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Desktop: todas as ações */}
                        <div className="hidden md:flex items-center justify-end gap-1 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Link href={`/docker/containers/${container.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Ver detalhes"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>

                            {container.state === 'running' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(container.id, 'stop')}
                                disabled={actionMutation.isPending}
                                title="Parar"
                                className="h-8 w-8 p-0"
                              >
                                <Square className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(container.id, 'start')}
                                disabled={actionMutation.isPending}
                                title="Iniciar"
                                className="h-8 w-8 p-0"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(container.id, 'restart')}
                              disabled={actionMutation.isPending}
                              title="Reiniciar"
                              className="h-8 w-8 p-0"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-1">
                            <Link href={`/docker/containers/${container.id}/logs`}>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Ver logs"
                                className="h-8 w-8 p-0"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </Link>

                            {container.state === 'running' && (
                              <Link href={`/docker/containers/${container.id}/terminal`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title="Terminal"
                                  className="h-8 w-8 p-0"
                                >
                                  <Terminal className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(container.id, 'remove')}
                              disabled={actionMutation.isPending}
                              className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </div>

              {(containersResponse?.data?.filter((container: any) => container.state === 'running').length || 0) > 0 && (
                <div className="flex justify-center mt-4">
                  <Link href="/docker/containers">
                    <Button variant="outline">
                      Ver Todos os Containers
                    </Button>
                  </Link>
                </div>
              )}

              {(containersResponse?.data?.filter((container: any) => container.state === 'running').length || 0) === 0 && (
                <div className="text-center py-8">
                  <Container className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Nenhum container ativo</h3>
                  <p className="text-muted-foreground">
                    Containers ativos aparecerão aqui quando estiverem rodando.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jobs Ativos */}
      {summary?.active_jobs && summary.active_jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Jobs Ativos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.active_jobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">{job.type} - {job.resource_id}</p>
                      <p className="text-sm text-muted-foreground">{job.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{job.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/docker/containers">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center space-x-3 p-6">
              <Container className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-semibold">Containers</h3>
                <p className="text-sm text-muted-foreground">Gerenciar containers</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/docker/volumes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center space-x-3 p-6">
              <HardDrive className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-semibold">Volumes</h3>
                <p className="text-sm text-muted-foreground">Gerenciar volumes</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/docker/networks">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center space-x-3 p-6">
              <Network className="h-8 w-8 text-purple-500" />
              <div>
                <h3 className="font-semibold">Redes</h3>
                <p className="text-sm text-muted-foreground">Gerenciar redes</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/docker/images">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center space-x-3 p-6">
              <ImageIcon className="h-8 w-8 text-orange-500" />
              <div>
                <h3 className="font-semibold">Imagens</h3>
                <p className="text-sm text-muted-foreground">Gerenciar imagens</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50 group">
        {/* Tooltip/Label */}
        <Link href="/docker/containers/create">
          <button
            className="bg-white dark:bg-gray-800 text-foreground px-4 py-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium border border-border"
          >
            Novo Container
          </button>
        </Link>

        {/* FAB Button */}
        <Link href="/docker/containers/create">
          <button
            className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-110 flex items-center justify-center"
            title="Novo Container"
          >
            <Plus className="h-6 w-6 transition-transform duration-200 ease-in-out group-hover:rotate-180" />
          </button>
        </Link>
      </div>
      </div>
    </MainLayout>
  );
}