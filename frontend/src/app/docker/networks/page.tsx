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
import { EmptyState } from '@/components/ui/empty-state';
import {
  Network,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Wifi
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { DockerApiService } from '@/lib/docker-api';

export default function NetworksPage() {
  const [filters, setFilters] = useState({
    driver: '',
    scope: '',
    search: '',
    page: 1,
    limit: 10
  });

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['docker', 'networks', filters],
    queryFn: async () => {
      const result = await DockerApiService.listNetworks();

      let filteredNetworks = result.data || [];

      // Apply filters
      if (filters.driver) {
        filteredNetworks = filteredNetworks.filter((net: any) => net.driver === filters.driver);
      }
      if (filters.scope) {
        filteredNetworks = filteredNetworks.filter((net: any) => net.scope === filters.scope);
      }
      if (filters.search) {
        filteredNetworks = filteredNetworks.filter((net: any) =>
          net.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          net.id.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      const total = filteredNetworks.length;
      const start = (filters.page - 1) * filters.limit;
      const end = start + filters.limit;
      const networks = filteredNetworks.slice(start, end);

      return {
        networks,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          pages: Math.ceil(total / filters.limit)
        }
      };
    },
    refetchInterval: 30000
  });

  const removeMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => {
      return DockerApiService.removeNetwork(id, force);
    },
    onSuccess: (_, { id }) => {
      toast({
        title: 'Rede removida',
        description: `Rede removida com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ['docker', 'networks'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover rede',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getDriverBadge = (driver: string) => {
    const variants = {
      bridge: 'default',
      host: 'secondary',
      overlay: 'outline',
      macvlan: 'destructive'
    } as const;

    return <Badge variant={variants[driver as keyof typeof variants] || 'outline'}>{driver}</Badge>;
  };

  const getScopeBadge = (scope: string) => {
    const variants = {
      local: 'default',
      global: 'secondary',
      swarm: 'outline'
    } as const;

    return <Badge variant={variants[scope as keyof typeof variants] || 'outline'}>{scope}</Badge>;
  };

  const handleRemove = (id: string, name: string, containersCount: number) => {
    if (containersCount > 0) {
      const force = confirm(`A rede "${name}" está sendo usada por ${containersCount} container(s). Desconectar e remover?`);
      if (force) {
        removeMutation.mutate({ id, force: true });
      }
    } else {
      const confirm_remove = confirm(`Tem certeza que deseja remover a rede "${name}"?`);
      if (confirm_remove) {
        removeMutation.mutate({ id });
      }
    }
  };

  if (error) {
    return (
      <MainLayout>
        <div className="text-center text-red-500 p-8">
          Erro ao carregar redes: {(error as Error).message}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Redes Docker</h1>
            <p className="text-muted-foreground">
              Gerencie redes Docker para conectividade entre containers
            </p>
          </div>
          <div className="flex space-x-2">
            <Link href="/docker/networks/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Rede
              </Button>
            </Link>
          </div>
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
                    placeholder="Nome ou ID da rede"
                    value={filters.search}
                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Driver</label>
                <Select
                  value={filters.driver}
                  onValueChange={(value) => setFilters(f => ({ ...f, driver: value, page: 1 }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os drivers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os drivers</SelectItem>
                    <SelectItem value="bridge">Bridge</SelectItem>
                    <SelectItem value="host">Host</SelectItem>
                    <SelectItem value="overlay">Overlay</SelectItem>
                    <SelectItem value="macvlan">Macvlan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Escopo</label>
                <Select
                  value={filters.scope}
                  onValueChange={(value) => setFilters(f => ({ ...f, scope: value, page: 1 }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os escopos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os escopos</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="swarm">Swarm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ações</label>
                <Button
                  variant="outline"
                  onClick={() => setFilters({ driver: '', scope: '', search: '', page: 1, limit: 10 })}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de redes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Network className="h-5 w-5" />
              <span>Redes ({(data as any)?.pagination?.total || 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (data as any)?.networks && (data as any).networks.length > 0 ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Escopo</TableHead>
                      <TableHead>Subnet</TableHead>
                      <TableHead>Containers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data as any)?.networks?.map((network: any) => (
                      <TableRow key={network.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{network.name}</p>
                            <p className="text-sm text-muted-foreground">{network.id.substring(0, 12)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getDriverBadge(network.driver)}
                        </TableCell>
                        <TableCell>
                          {getScopeBadge(network.scope)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {network.ipam?.config?.map((config: any, index: number) => (
                              <div key={index} className="text-sm">
                                <div className="font-medium">{config.subnet}</div>
                                {config.gateway && (
                                  <div className="text-muted-foreground">GW: {config.gateway}</div>
                                )}
                              </div>
                            )) || <span className="text-muted-foreground">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{network.containers || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {network.internal ? (
                              <Badge variant="outline" className="text-orange-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Interna
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Externa
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Link href={`/docker/networks/${network.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {!['bridge', 'host', 'none'].includes(network.name) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemove(network.id, network.name, network.containers || 0)}
                                disabled={removeMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {data && (data as any).pagination?.pages > 1 ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((data as any).pagination.page - 1) * (data as any).pagination.limit + 1} a{' '}
                      {Math.min((data as any).pagination.page * (data as any).pagination.limit, (data as any).pagination.total)} de{' '}
                      {(data as any).pagination.total} redes
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        disabled={(data as any).pagination.page === 1}
                        onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        disabled={(data as any).pagination.page === (data as any).pagination.pages}
                        onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={Network}
                  title="Nenhuma rede encontrada"
                  description="Crie redes Docker personalizadas para conectar e isolar seus containers."
                  actionLabel="Nova Rede"
                  onAction={() => window.location.href = '/docker/networks/create'}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}