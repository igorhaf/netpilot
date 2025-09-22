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
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

// Mock data
const mockContainers = [
  {
    id: 'container_1',
    name: 'web-nginx',
    image: 'nginx:alpine',
    image_id: 'sha256:abc123',
    status: 'Up 2 hours',
    state: 'running',
    created: new Date('2024-01-15T10:00:00Z'),
    ports: [
      { private_port: 80, public_port: 8080, type: 'tcp' }
    ],
    labels: { app: 'web' },
    networks: ['bridge'],
    mounts: []
  },
  {
    id: 'container_2',
    name: 'api-backend',
    image: 'node:18-alpine',
    image_id: 'sha256:def456',
    status: 'Exited (0) 5 minutes ago',
    state: 'exited',
    created: new Date('2024-01-15T09:30:00Z'),
    ports: [
      { private_port: 3000, public_port: 3000, type: 'tcp' }
    ],
    labels: { app: 'api' },
    networks: ['bridge'],
    mounts: []
  },
  {
    id: 'container_3',
    name: 'database-postgres',
    image: 'postgres:15',
    image_id: 'sha256:ghi789',
    status: 'Up 1 day',
    state: 'running',
    created: new Date('2024-01-14T15:00:00Z'),
    ports: [
      { private_port: 5432, public_port: 5432, type: 'tcp' }
    ],
    labels: { app: 'database' },
    networks: ['bridge'],
    mounts: []
  }
];

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
    queryFn: () => Promise.resolve({
      data: mockContainers,
      pagination: {
        page: 1,
        limit: 50,
        total: mockContainers.length,
        pages: 1
      }
    }),
    refetchInterval: 5000 // Refresh a cada 5s
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      // Mock API call
      return new Promise((resolve) => {
        setTimeout(() => resolve(`${action} executed`), 1000);
      });
    },
    onSuccess: (_, { action }) => {
      toast({
        title: 'Sucesso',
        description: `Container ${action} executado com sucesso`
      });
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

  const getStatusBadge = (status: string, state: string) => {
    if (state === 'running') {
      return <Badge variant="default" className="bg-green-500">Rodando</Badge>;
    }
    if (state === 'exited') {
      return <Badge variant="secondary">Parado</Badge>;
    }
    if (state === 'paused') {
      return <Badge variant="outline">Pausado</Badge>;
    }
    return <Badge variant="destructive">Erro</Badge>;
  };

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

  return (
    <MainLayout>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Portas</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.map((container: any) => (
                  <TableRow key={container.id}>
                    <TableCell>
                      <Link
                        href={`/docker/containers/${container.id}`}
                        className="font-medium hover:underline"
                      >
                        {container.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {container.image}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(container.status, container.state)}
                    </TableCell>
                    <TableCell>
                      {container.ports?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {container.ports.slice(0, 2).map((port: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {port.public_port ? `${port.public_port}:` : ''}{port.private_port}
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
                      {new Date(container.created).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
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