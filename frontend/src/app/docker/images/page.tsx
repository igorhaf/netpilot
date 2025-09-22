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
  Image as ImageIcon,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  Download,
  Upload,
  Play,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { formatBytes } from '@/lib/utils';

// Mock data para imagens Docker
const mockImages = [
  {
    id: 'sha256:abc123def456',
    repo_tags: ['nginx:alpine', 'nginx:1.21-alpine'],
    repo_digests: ['nginx@sha256:xyz789'],
    parent_id: '',
    comment: '',
    created: '2024-01-15T10:30:00Z',
    container: '',
    container_config: {},
    docker_version: '20.10.21',
    author: '',
    config: {
      hostname: '',
      domainname: '',
      user: '',
      attach_stdin: false,
      attach_stdout: false,
      attach_stderr: false,
      exposed_ports: {
        '80/tcp': {}
      },
      tty: false,
      open_stdin: false,
      stdin_once: false,
      env: [
        'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        'NGINX_VERSION=1.21.6'
      ],
      cmd: ['nginx', '-g', 'daemon off;'],
      image: 'sha256:parent123',
      volumes: null,
      working_dir: '',
      entrypoint: ['/docker-entrypoint.sh'],
      network_disabled: false,
      mac_address: '',
      on_build: null,
      labels: {
        'maintainer': 'NGINX Docker Maintainers <docker-maint@nginx.com>'
      }
    },
    architecture: 'amd64',
    os: 'linux',
    size: 23068856,
    virtual_size: 23068856,
    graph_driver: {
      data: {
        merged_dir: '/var/lib/docker/overlay2/abc123/merged',
        upper_dir: '/var/lib/docker/overlay2/abc123/diff',
        work_dir: '/var/lib/docker/overlay2/abc123/work'
      },
      name: 'overlay2'
    },
    root_fs: {
      type: 'layers',
      layers: [
        'sha256:layer1',
        'sha256:layer2',
        'sha256:layer3'
      ]
    },
    metadata: {
      last_tag_time: '2024-01-15T10:30:00Z'
    },
    containers: 2
  },
  {
    id: 'sha256:def456ghi789',
    repo_tags: ['node:18-alpine'],
    repo_digests: ['node@sha256:abc456'],
    parent_id: '',
    comment: '',
    created: '2024-01-14T15:45:00Z',
    container: '',
    container_config: {},
    docker_version: '20.10.21',
    author: '',
    config: {
      hostname: '',
      domainname: '',
      user: 'node',
      attach_stdin: false,
      attach_stdout: false,
      attach_stderr: false,
      exposed_ports: {},
      tty: false,
      open_stdin: false,
      stdin_once: false,
      env: [
        'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        'NODE_VERSION=18.19.0'
      ],
      cmd: ['node'],
      image: 'sha256:parent456',
      volumes: null,
      working_dir: '/app',
      entrypoint: ['docker-entrypoint.sh'],
      network_disabled: false,
      mac_address: '',
      on_build: null,
      labels: {}
    },
    architecture: 'amd64',
    os: 'linux',
    size: 171234567,
    virtual_size: 171234567,
    graph_driver: {
      data: {
        merged_dir: '/var/lib/docker/overlay2/def456/merged',
        upper_dir: '/var/lib/docker/overlay2/def456/diff',
        work_dir: '/var/lib/docker/overlay2/def456/work'
      },
      name: 'overlay2'
    },
    root_fs: {
      type: 'layers',
      layers: [
        'sha256:layer4',
        'sha256:layer5',
        'sha256:layer6',
        'sha256:layer7'
      ]
    },
    metadata: {
      last_tag_time: '2024-01-14T15:45:00Z'
    },
    containers: 1
  },
  {
    id: 'sha256:ghi789jkl012',
    repo_tags: ['postgres:15-alpine'],
    repo_digests: ['postgres@sha256:def789'],
    parent_id: '',
    comment: '',
    created: '2024-01-13T08:20:00Z',
    container: '',
    container_config: {},
    docker_version: '20.10.21',
    author: '',
    config: {
      hostname: '',
      domainname: '',
      user: 'postgres',
      attach_stdin: false,
      attach_stdout: false,
      attach_stderr: false,
      exposed_ports: {
        '5432/tcp': {}
      },
      tty: false,
      open_stdin: false,
      stdin_once: false,
      env: [
        'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/lib/postgresql/15/bin',
        'POSTGRES_VERSION=15.5'
      ],
      cmd: ['postgres'],
      image: 'sha256:parent789',
      volumes: {
        '/var/lib/postgresql/data': {}
      },
      working_dir: '',
      entrypoint: ['docker-entrypoint.sh'],
      network_disabled: false,
      mac_address: '',
      on_build: null,
      labels: {}
    },
    architecture: 'amd64',
    os: 'linux',
    size: 234567890,
    virtual_size: 234567890,
    graph_driver: {
      data: {
        merged_dir: '/var/lib/docker/overlay2/ghi789/merged',
        upper_dir: '/var/lib/docker/overlay2/ghi789/diff',
        work_dir: '/var/lib/docker/overlay2/ghi789/work'
      },
      name: 'overlay2'
    },
    root_fs: {
      type: 'layers',
      layers: [
        'sha256:layer8',
        'sha256:layer9',
        'sha256:layer10'
      ]
    },
    metadata: {
      last_tag_time: '2024-01-13T08:20:00Z'
    },
    containers: 1
  },
  {
    id: 'sha256:jkl012mno345',
    repo_tags: ['<none>:<none>'],
    repo_digests: [],
    parent_id: 'sha256:abc123def456',
    comment: '',
    created: '2024-01-10T12:00:00Z',
    container: '',
    container_config: {},
    docker_version: '20.10.21',
    author: '',
    config: {},
    architecture: 'amd64',
    os: 'linux',
    size: 45678901,
    virtual_size: 45678901,
    graph_driver: {
      data: {
        merged_dir: '/var/lib/docker/overlay2/jkl012/merged',
        upper_dir: '/var/lib/docker/overlay2/jkl012/diff',
        work_dir: '/var/lib/docker/overlay2/jkl012/work'
      },
      name: 'overlay2'
    },
    root_fs: {
      type: 'layers',
      layers: [
        'sha256:layer11'
      ]
    },
    metadata: {
      last_tag_time: '0001-01-01T00:00:00Z'
    },
    containers: 0
  }
];

export default function ImagesPage() {
  const [filters, setFilters] = useState({
    tag: '',
    dangling: '',
    search: '',
    page: 1,
    limit: 10
  });

  const queryClient = useQueryClient();

  // Simulação da query para listar imagens
  const { data, isLoading, error } = useQuery({
    queryKey: ['docker', 'images', filters],
    queryFn: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          let filteredImages = [...mockImages];

          // Aplicar filtros
          if (filters.dangling === 'true') {
            filteredImages = filteredImages.filter(img => img.repo_tags.includes('<none>:<none>'));
          } else if (filters.dangling === 'false') {
            filteredImages = filteredImages.filter(img => !img.repo_tags.includes('<none>:<none>'));
          }

          if (filters.search) {
            filteredImages = filteredImages.filter(img =>
              img.repo_tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase())) ||
              img.id.toLowerCase().includes(filters.search.toLowerCase())
            );
          }

          const total = filteredImages.length;
          const start = (filters.page - 1) * filters.limit;
          const end = start + filters.limit;
          const images = filteredImages.slice(start, end);

          resolve({
            images,
            pagination: {
              page: filters.page,
              limit: filters.limit,
              total,
              pages: Math.ceil(total / filters.limit)
            },
            summary: {
              total_images: mockImages.length,
              total_size: mockImages.reduce((acc, img) => acc + img.size, 0),
              dangling: mockImages.filter(img => img.repo_tags.includes('<none>:<none>')).length
            }
          });
        }, 500);
      });
    },
    refetchInterval: 30000
  });

  // Mutação para remover imagem
  const removeMutation = useMutation({
    mutationFn: ({ id, force, noprune }: { id: string; force?: boolean; noprune?: boolean }) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simular erro se imagem estiver em uso
          const image = mockImages.find(img => img.id === id);
          if (image?.containers && image.containers > 0 && !force) {
            reject(new Error('Imagem está sendo usada por containers'));
          } else {
            resolve(`Imagem ${id} removida`);
          }
        }, 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Imagem removida',
        description: 'Imagem removida com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['docker', 'images'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover imagem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutação para fazer pull de imagem
  const pullMutation = useMutation({
    mutationFn: ({ name }: { name: string }) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(`Pull de ${name} concluído`), 3000);
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Pull concluído',
        description: `Imagem ${variables.name} baixada com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ['docker', 'images'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no pull',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const formatImageName = (repoTags: string[]) => {
    const validTags = repoTags.filter(tag => tag !== '<none>:<none>');
    if (validTags.length === 0) {
      return '<none>:<none>';
    }
    return validTags[0];
  };

  const formatCreatedAt = (created: string) => {
    const date = new Date(created);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoje';
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} semanas atrás`;
    } else {
      return `${Math.floor(diffDays / 30)} meses atrás`;
    }
  };

  const handleRemove = (id: string, name: string, containers: number) => {
    if (containers > 0) {
      const force = confirm(`A imagem "${name}" está sendo usada por ${containers} container(s). Forçar remoção?`);
      if (force) {
        removeMutation.mutate({ id, force: true });
      }
    } else {
      const confirm_remove = confirm(`Tem certeza que deseja remover a imagem "${name}"?`);
      if (confirm_remove) {
        removeMutation.mutate({ id });
      }
    }
  };

  const handlePull = () => {
    const imageName = prompt('Digite o nome da imagem para fazer pull (ex: nginx:alpine):');
    if (imageName) {
      pullMutation.mutate({ name: imageName });
    }
  };

  if (error) {
    return (
      <MainLayout>
        <div className="text-center text-red-500 p-8">
          Erro ao carregar imagens: {(error as Error).message}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Imagens Docker</h1>
            <p className="text-muted-foreground">
              Gerencie imagens Docker disponíveis no sistema
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handlePull} disabled={pullMutation.isPending}>
              <Download className="h-4 w-4 mr-2" />
              {pullMutation.isPending ? 'Baixando...' : 'Pull Image'}
            </Button>
            <Link href="/docker/images/build">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Build Image
              </Button>
            </Link>
          </div>
        </div>

        {/* Resumo */}
        {data && (data as any)?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{(data as any).summary.total_images}</p>
                    <p className="text-sm text-muted-foreground">Total de Imagens</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{formatBytes((data as any).summary.total_size)}</p>
                    <p className="text-sm text-muted-foreground">Espaço Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{(data as any).summary.dangling}</p>
                    <p className="text-sm text-muted-foreground">Imagens Órfãs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                    placeholder="Nome da imagem ou ID"
                    value={filters.search}
                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={filters.dangling}
                  onValueChange={(value) => setFilters(f => ({ ...f, dangling: value, page: 1 }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as imagens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as imagens</SelectItem>
                    <SelectItem value="false">Com tag</SelectItem>
                    <SelectItem value="true">Órfãs (dangling)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ações em lote</label>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const confirmPrune = confirm('Tem certeza que deseja remover todas as imagens órfãs?');
                    if (confirmPrune) {
                      toast({
                        title: 'Limpeza iniciada',
                        description: 'Removendo imagens órfãs...',
                      });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Órfãs
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Limpar filtros</label>
                <Button
                  variant="outline"
                  onClick={() => setFilters({ tag: '', dangling: '', search: '', page: 1, limit: 10 })}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de imagens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5" />
              <span>Imagens ({(data as any)?.pagination?.total || 0})</span>
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
                      <TableHead>Imagem</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Criada</TableHead>
                      <TableHead>Containers</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data as any)?.images?.map((image: any) => (
                      <TableRow key={image.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatImageName(image.repo_tags)}</p>
                            {image.repo_tags.length > 1 && !image.repo_tags.includes('<none>:<none>') && (
                              <div className="text-xs text-muted-foreground mt-1">
                                +{image.repo_tags.length - 1} tags adicionais
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {image.id.substring(7, 19)}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{formatBytes(image.size)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatCreatedAt(image.created)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{image.containers || 0}</span>
                            {image.containers > 0 && (
                              <Badge variant="outline" className="text-blue-600">
                                <Play className="h-3 w-3 mr-1" />
                                Em uso
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {image.repo_tags.includes('<none>:<none>') ? (
                            <Badge variant="outline" className="text-orange-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Órfã
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Tagged
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Link href={`/docker/images/${image.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemove(image.id, formatImageName(image.repo_tags), image.containers)}
                              disabled={removeMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                      {(data as any).pagination.total} imagens
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
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}