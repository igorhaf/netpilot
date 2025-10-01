'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/main-layout';
import { ArrowLeft, Terminal, RefreshCw, Download, Copy } from 'lucide-react';
import Link from 'next/link';
import { DockerApiService } from '@/lib/docker-api';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';

export default function ContainerLogsPage() {
  const params = useParams();
  const containerId = params.id as string;
  const [autoRefresh, setAutoRefresh] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Query para obter logs
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['docker', 'container', containerId, 'logs'],
    queryFn: async () => {
      const result = await DockerApiService.getContainerLogs(containerId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.logs;
    },
    refetchInterval: autoRefresh ? 3000 : false,
    enabled: !!containerId
  });

  // Query para obter info do container
  const { data: container } = useQuery({
    queryKey: ['docker', 'container', containerId],
    queryFn: async () => {
      const response = await DockerApiService.listContainers();
      return response.data.find((c: any) => c.id === containerId);
    },
    enabled: !!containerId
  });

  // Auto-scroll para o final dos logs
  useEffect(() => {
    if (autoRefresh && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data, autoRefresh]);

  const copyLogsToClipboard = () => {
    if (data) {
      navigator.clipboard.writeText(data);
      toast({
        title: 'Copiado!',
        description: 'Logs copiados para a área de transferência.',
      });
    }
  };

  const downloadLogs = () => {
    if (data) {
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `container-${containerId.substring(0, 12)}-logs.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Download iniciado',
        description: 'Os logs estão sendo baixados.',
      });
    }
  };

  const containerName = container?.names?.[0]?.replace('/', '') || containerId.substring(0, 12);

  const breadcrumbs = [
    { label: 'Docker', href: '/docker' },
    { label: 'Containers', href: '/docker/containers' },
    { label: 'Logs', current: true }
  ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/docker/containers/${containerId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <Terminal className="h-8 w-8" />
                <span>Logs - {containerName}</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Container ID: {containerId.substring(0, 12)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-atualizar' : 'Atualizar Manual'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyLogsToClipboard}
              disabled={!data}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadLogs}
              disabled={!data}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Logs Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Logs do Container</span>
              {autoRefresh && (
                <span className="text-sm text-green-500 font-normal flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Atualização automática ativa
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-2">
                  <p className="text-red-500 font-semibold">Erro ao carregar logs</p>
                  <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
                  <Button onClick={() => refetch()} variant="outline" size="sm">
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-[600px]">
                {data ? (
                  <>
                    <pre className="whitespace-pre-wrap break-all">{data}</pre>
                    <div ref={logsEndRef} />
                  </>
                ) : (
                  <p className="text-gray-500">Nenhum log disponível</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Terminal className="h-4 w-4" />
              <p>
                Os logs são atualizados automaticamente a cada 3 segundos quando a atualização automática está ativa.
                {' '}Use os botões acima para copiar ou baixar os logs completos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
