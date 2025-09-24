'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Container,
  Play,
  Square,
  RotateCcw,
  ArrowLeft,
  Calendar,
  HardDrive,
  Network,
  Settings,
  Terminal,
  Activity,
  Clock,
  Server,
  Cpu,
  MemoryStick,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { DockerApiService } from '@/lib/docker-api';
import { toast } from '@/hooks/use-toast';

export default function ContainerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const containerId = params.id as string;

  // Query para obter detalhes do container
  const { data: container, isLoading, error } = useQuery({
    queryKey: ['docker', 'container', containerId],
    queryFn: async () => {
      const response = await DockerApiService.listContainers();
      const container = response.data.find((c: any) => c.id === containerId);
      if (!container) {
        throw new Error('Container não encontrado');
      }
      return container;
    },
    refetchInterval: 5000,
    enabled: !!containerId
  });

  // Mutações para ações do container
  const containerActionMutation = useMutation({
    mutationFn: async ({ action }: { action: string }) => {
      switch (action) {
        case 'start':
          return DockerApiService.startContainer(containerId);
        case 'stop':
          return DockerApiService.stopContainer(containerId);
        case 'restart':
          return DockerApiService.restartContainer(containerId);
        default:
          throw new Error('Ação inválida');
      }
    },
    onSuccess: (data, variables) => {
      toast({
        title: 'Sucesso',
        description: `Container ${variables.action === 'start' ? 'iniciado' : variables.action === 'stop' ? 'parado' : 'reiniciado'} com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['docker', 'container', containerId] });
      queryClient.invalidateQueries({ queryKey: ['docker', 'containers'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || `Erro ao executar ação no container.`,
        variant: 'destructive',
      });
    },
  });

  const handleContainerAction = (action: string) => {
    containerActionMutation.mutate({ action });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Texto copiado para a área de transferência.',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'text-green-500';
      case 'exited':
        return 'text-red-500';
      case 'paused':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !container) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertTriangle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold">Container não encontrado</h2>
          <p className="text-muted-foreground">O container solicitado não foi encontrado.</p>
          <Link href="/docker/containers">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Containers
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/docker/containers">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  container.state === 'running' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <h1 className="text-3xl font-bold">{container.names[0].replace('/', '')}</h1>
              </div>
              <div className="flex items-center space-x-2 mt-1 ml-6">
                <p className="text-muted-foreground">{container.id.substring(0, 12)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(container.id)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {container.state === 'running' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleContainerAction('stop')}
                  disabled={containerActionMutation.isPending}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Parar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleContainerAction('restart')}
                  disabled={containerActionMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reiniciar
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleContainerAction('start')}
                disabled={containerActionMutation.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
            )}
          </div>
        </div>

        {/* Status e Informações Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${
                  container.state === 'running' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className={`font-semibold ${getStatusColor(container.state)}`}>
                    {container.state === 'running' ? 'Rodando' : 'Parado'}
                  </p>
                  <p className="text-sm text-muted-foreground">{container.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>Imagem</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium break-all">{container.image}</p>
                <p className="text-sm text-muted-foreground">
                  Container baseado nesta imagem Docker
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Criado</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{container.created ? formatDate(container.created) : 'Não disponível'}</p>
                <p className="text-sm text-muted-foreground">
                  {container.command || 'Comando não disponível'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portas */}
        {container.ports && container.ports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5" />
                <span>Portas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {container.ports.map((port: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {port.PublicPort ? `${port.PublicPort} → ${port.PrivatePort}` : port.PrivatePort}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {port.Type.toUpperCase()} {port.IP && `(${port.IP})`}
                        </p>
                      </div>
                      {port.PublicPort && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`http://localhost:${port.PublicPort}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Redes */}
        {container.networkSettings && container.networkSettings.Networks && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5" />
                <span>Redes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(container.networkSettings.Networks).map(([networkName, networkInfo]: [string, any]) => (
                  <div key={networkName} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="font-medium">{networkName}</p>
                        <p className="text-sm text-muted-foreground">Nome da Rede</p>
                      </div>
                      <div>
                        <p className="font-medium">{networkInfo.IPAddress || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">IP Address</p>
                      </div>
                      <div>
                        <p className="font-medium">{networkInfo.Gateway || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">Gateway</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Volumes/Mounts */}
        {container.mounts && container.mounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5" />
                <span>Volumes & Mounts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {container.mounts.map((mount: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="font-medium">{mount.Type}</p>
                        <p className="text-sm text-muted-foreground">Tipo</p>
                      </div>
                      <div>
                        <p className="font-medium break-all">{mount.Source || mount.Name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">Origem</p>
                      </div>
                      <div>
                        <p className="font-medium break-all">{mount.Destination}</p>
                        <p className="text-sm text-muted-foreground">Destino</p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={mount.RW ? "default" : "secondary"}>
                            {mount.RW ? 'Read/Write' : 'Read-Only'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Labels */}
        {container.labels && Object.keys(container.labels).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Labels</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(container.labels).slice(0, 10).map(([key, value]: [string, any]) => (
                  <div key={key} className="p-3 bg-muted rounded-lg">
                    <p className="font-medium text-sm break-all">{key}</p>
                    <p className="text-xs text-muted-foreground break-all mt-1">{value}</p>
                  </div>
                ))}
                {Object.keys(container.labels).length > 10 && (
                  <div className="p-3 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      +{Object.keys(container.labels).length - 10} labels adicionais
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}