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
  RotateCcw,
  Trash2,
  Terminal,
  FileText,
  Activity,
  Plus,
  Search,
  Filter,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Square as StopIcon,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { DockerApiService, DockerContainer } from '@/lib/docker-api';


export default function ContainersPage() {
  const [filters, setFilters] = useState({
    status: '',
    image: '',
    name: '',
    page: 1
  });

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['docker', 'containers', filters],
    queryFn: async () => {
      const response = await DockerApiService.listContainers();

      let filteredData = response.data;

      // Aplicar filtros localmente
      if (filters.name) {
        filteredData = filteredData.filter(container =>
          container.names.some(name =>
            name.toLowerCase().includes(filters.name.toLowerCase())
          )
        );
      }

      if (filters.image) {
        filteredData = filteredData.filter(container =>
          container.image.toLowerCase().includes(filters.image.toLowerCase())
        );
      }

      if (filters.status) {
        filteredData = filteredData.filter(container =>
          container.state === filters.status
        );
      }

      return {
        data: filteredData,
        pagination: {
          page: 1,
          limit: 50,
          total: filteredData.length,
          pages: 1
        },
        message: response.message,
        error: response.error
      };
    },
    refetchInterval: 5000 // Refresh a cada 5s
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

  if (error) {
    return (
      <MainLayout>
        <div className="text-center text-red-500 p-8">
          Erro ao carregar containers: {error.message}
        </div>
      </MainLayout>
    );
  }

  const breadcrumbs = [
    { label: 'Docker', href: '/docker' },
    { label: 'Containers', current: true }
  ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Containers</h1>
          <p className="text-muted-foreground">
            Gerencie containers Docker
          </p>
        </div>
        <Link href="/docker/containers/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Container
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={filters.name}
                onChange={(e) => setFilters(f => ({ ...f, name: e.target.value, page: 1 }))}
                className="pl-10"
              />
            </div>

            <Input
              placeholder="Filtrar por imagem..."
              value={filters.image}
              onChange={(e) => setFilters(f => ({ ...f, image: e.target.value, page: 1 }))}
            />

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(f => ({ ...f, status: value, page: 1 }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="running">Rodando</SelectItem>
                <SelectItem value="exited">Parado</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="created">Criado</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setFilters({ status: '', image: '', name: '', page: 1 })}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Nome</TableHead>
                  <TableHead className="w-[110px]">Portas</TableHead>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="text-right w-[220px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.map((container: DockerContainer) => (
                  <TableRow key={container.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          container.state === 'running'
                            ? 'bg-green-500'
                            : container.state === 'exited'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                        }`}></div>
                        <Link
                          href={`/docker/containers/${container.id}`}
                          className="font-medium hover:underline"
                        >
                          <span
                            className="max-w-[120px] truncate inline-block"
                            title={container.names?.[0]?.replace(/^\//, '') || container.id}
                          >
                            {container.names?.[0]?.replace(/^\//, '') || container.id.substring(0, 12)}
                          </span>
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      {container.ports?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {container.ports.slice(0, 2).map((port: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {port.PublicPort ? `${port.PublicPort}:` : ''}{port.PrivatePort}
                            </Badge>
                          ))}
                          {container.ports.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{container.ports.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="font-mono text-xs" title={container.id}>
                        {container.id.substring(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/docker/containers/${container.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>

                        <Link href={`/docker/images`}>
                          <Button
                            size="sm"
                            variant="outline"
                            title={`Ver imagem: ${container.image}`}
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </Link>

                        {container.state === 'running' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(container.id, 'stop')}
                            disabled={actionMutation.isPending}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(container.id, 'start')}
                            disabled={actionMutation.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(container.id, 'restart')}
                          disabled={actionMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>

                        <Link href={`/docker/containers/${container.id}/logs`}>
                          <Button size="sm" variant="outline">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>

                        {container.state === 'running' && (
                          <>
                            <Link href={`/docker/containers/${container.id}/terminal`}>
                              <Button size="sm" variant="outline">
                                <Terminal className="h-4 w-4" />
                              </Button>
                            </Link>

                            <Link href={`/docker/containers/${container.id}/stats`}>
                              <Button size="sm" variant="outline">
                                <Activity className="h-4 w-4" />
                              </Button>
                            </Link>
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(container.id, 'remove')}
                          disabled={actionMutation.isPending}
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
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {data?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {data.pagination.page} de {data.pagination.pages} páginas
            ({data.pagination.total} containers)
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              disabled={data.pagination.page === 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={data.pagination.page === data.pagination.pages}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
      </div>
    </MainLayout>
  );
}