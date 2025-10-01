'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/main-layout';
import {
  ArrowLeft,
  FileText,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy
} from 'lucide-react';
import { jobExecutionsApi } from '@/lib/api/job-queues';
import { toast } from '@/hooks/use-toast';

export default function ExecutionLogsPage() {
  const params = useParams();
  const router = useRouter();
  const executionId = params.id as string;
  const [activeTab, setActiveTab] = useState('output');

  // Query para buscar detalhes da execução
  const { data: execution, isLoading: executionLoading } = useQuery({
    queryKey: ['job-execution', executionId],
    queryFn: () => jobExecutionsApi.get(executionId),
    refetchInterval: 3000 // Refresh a cada 3 segundos se ainda estiver rodando
  });

  // Query para buscar logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['job-execution-logs', executionId],
    queryFn: () => jobExecutionsApi.getLogs(executionId),
    refetchInterval: execution?.status === 'running' ? 2000 : false
  });

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const downloadLogs = () => {
    if (!logs || (!logs.outputLog && !logs.errorLog)) return;

    const content = [
      '=== EXECUTION LOGS ===',
      `Execution ID: ${executionId}`,
      `Job Name: ${execution?.jobQueue?.name || 'Unknown'}`,
      `Status: ${execution?.status || 'Unknown'}`,
      `Started: ${execution?.startedAt ? new Date(execution.startedAt).toLocaleString() : 'Unknown'}`,
      `Completed: ${execution?.completedAt ? new Date(execution.completedAt).toLocaleString() : 'Not completed'}`,
      `Duration: ${execution?.executionTimeMs ? formatTime(execution.executionTimeMs) : 'Unknown'}`,
      '',
      '=== OUTPUT LOG ===',
      logs.outputLog || 'No output log available',
      '',
      '=== ERROR LOG ===',
      logs.errorLog || 'No error log available'
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-execution-${executionId}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copiado!',
        description: 'Log copiado para a área de transferência',
      });
    });
  };

  if (executionLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!execution) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Execução não encontrada</h2>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
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
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Logs de Execução</h1>
              <p className="text-muted-foreground">
                {execution.jobQueue?.name} - {executionId.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={downloadLogs}
              disabled={!logs?.outputLog && !logs?.errorLog}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Informações da Execução</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon(execution.status)}
                  {getStatusBadge(execution.status)}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Trigger</label>
                <p className="text-sm mt-1 capitalize">{execution.triggerType}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Iniciado</label>
                <p className="text-sm mt-1">
                  {execution.startedAt ? new Date(execution.startedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Duração</label>
                <p className="text-sm mt-1">
                  {execution.executionTimeMs ? formatTime(execution.executionTimeMs) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Logs de Execução</CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Carregando logs...</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="output">Output Log</TabsTrigger>
                  <TabsTrigger value="error">Error Log</TabsTrigger>
                </TabsList>

                <TabsContent value="output" className="mt-4">
                  <div className="relative">
                    {logs?.outputLog && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => copyToClipboard(logs.outputLog || '')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                      {logs?.outputLog ? (
                        <pre className="whitespace-pre-wrap">{logs.outputLog}</pre>
                      ) : (
                        <div className="text-muted-foreground">Nenhum output log disponível</div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="error" className="mt-4">
                  <div className="relative">
                    {logs?.errorLog && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => copyToClipboard(logs.errorLog || '')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="bg-black text-red-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                      {logs?.errorLog ? (
                        <pre className="whitespace-pre-wrap">{logs.errorLog}</pre>
                      ) : (
                        <div className="text-muted-foreground">Nenhum error log disponível</div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}