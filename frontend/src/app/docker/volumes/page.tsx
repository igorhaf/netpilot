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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { EmptyState } from '@/components/ui/empty-state';
import {
  HardDrive,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { DockerApiService } from '@/lib/docker-api';
export default function VolumesPage() {
  const [filters, setFilters] = useState({
    driver: '',
    name: ''
  });

  const queryClient = useQueryClient();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['docker', 'volumes', filters],
    queryFn: async () => {
      const result = await DockerApiService.listVolumes();

      let filteredData = result.data || [];

      // Apply filters
      if (filters.name) {
        filteredData = filteredData.filter((volume: any) =>
          volume.name.toLowerCase().includes(filters.name.toLowerCase())
        );
      }

      if (filters.driver) {
        filteredData = filteredData.filter((volume: any) =>
          volume.driver === filters.driver
        );
      }

      return { data: filteredData, total: filteredData.length };
    },
    refetchInterval: 10000
  });

  const volumes = response?.data || [];

  const removeMutation = useMutation({
    mutationFn: ({ name, force }: { name: string; force?: boolean }) => {
      return DockerApiService.removeVolume(name, force);
    },
    onSuccess: (_, { name }) => {
      toast({
        title: 'Volume removido',
        description: `Volume ${name} foi removido com sucesso`
      });
      queryClient.invalidateQueries({ queryKey: ['docker', 'volumes'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover volume',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const backupMutation = useMutation({
    mutationFn: (volumeName: string) => {
      return DockerApiService.backupVolume(volumeName);
    },
    onSuccess: (_, volumeName) => {
      toast({
        title: 'Backup iniciado',
        description: `Backup do volume ${volumeName} foi iniciado`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar backup',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRemove = (name: string, refCount: number) => {
    if (refCount > 0) {
      const confirmForce = window.confirm(
        `Volume está em uso por ${refCount} container(s). Forçar remoção?`
      );
      if (confirmForce) {
        removeMutation.mutate({ name, force: true });
      }
    } else {
      const confirm = window.confirm(`Tem certeza que deseja remover o volume ${name}?`);
      if (confirm) {
        removeMutation.mutate({ name });
      }
    }
  };

  if (error) {
    return (
      <MainLayout breadcrumbs={[{ label: 'Docker', href: '/docker' }, { label: 'Volumes', current: true }]}>
        <div className="text-center text-red-500 p-8">
          Erro ao carregar volumes: {error.message}
        </div>
      </MainLayout>
    );
  }

  const breadcrumbs = [
    { label: 'Docker', href: '/docker' },
    { label: 'Volumes', current: true }
  ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Volumes</h1>
          <p className="text-muted-foreground">
            Gerencie volumes Docker e seus backups
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Criar Volume
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={filters.name}
                onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Input
              placeholder="Filtrar por driver..."
              value={filters.driver}
              onChange={(e) => setFilters(f => ({ ...f, driver: e.target.value }))}
            />

            <Button
              variant="outline"
              onClick={() => setFilters({ driver: '', name: '' })}
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
          ) : volumes && volumes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Em Uso</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volumes?.map((volume: any) => (
                  <TableRow key={volume.name}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{volume.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{volume.driver}</Badge>
                    </TableCell>
                    <TableCell>
                      {volume.usage?.size ? formatBytes(volume.usage.size) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className={`w-2 h-2 rounded-full ${
                          (volume.usage?.ref_count || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'
                        }`}></span>
                        <span>{volume.usage?.ref_count || 0} container(s)</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {volume.created ? new Date(volume.created).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => backupMutation.mutate(volume.name)}
                          disabled={backupMutation.isPending}
                          title="Criar backup"
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          title="Restaurar backup"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemove(volume.name, volume.usage?.ref_count || 0)}
                          disabled={removeMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                          title="Remover volume"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={HardDrive}
                title="Nenhum volume encontrado"
                description="Crie volumes Docker para persistir dados dos seus containers e aplicações."
                actionLabel="Criar Volume"
                onAction={() => window.location.href = '/docker/volumes/create'}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Volumes</p>
                <p className="text-2xl font-bold">{volumes?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 rounded bg-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Em Uso</p>
                <p className="text-2xl font-bold">
                  {volumes?.filter((v: any) => (v.usage?.ref_count || 0) > 0).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 rounded bg-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Espaço Total</p>
                <p className="text-2xl font-bold">
                  {formatBytes(volumes?.reduce((total: number, v: any) => total + (v.usage?.size || 0), 0) || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </MainLayout>
  );
}