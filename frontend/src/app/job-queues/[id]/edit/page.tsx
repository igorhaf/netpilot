'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

interface JobQueueFormData {
  id: string;
  name: string;
  description: string;
  scriptType: string;
  scriptContent?: string;
  scriptPath?: string;
  cronExpression: string;
  isActive: boolean;
  priority: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  environment: string;
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    email: string;
  };
}

// Mock data for the job (should be replaced with real API call)
const mockJobData: Record<string, JobQueueFormData> = {
  'job_1': {
    id: 'job_1',
    name: 'Análise por IA',
    description: 'Análise automática de logs usando IA para detectar padrões suspeitos',
    scriptType: 'internal',
    scriptContent: '',
    scriptPath: '',
    cronExpression: '0 */5 * * *',
    isActive: true,
    priority: 1,
    timeout: 2400,
    retryAttempts: 3,
    retryDelay: 60,
    environment: 'production',
    notifications: {
      onSuccess: false,
      onFailure: true,
      email: 'admin@netpilot.local'
    }
  },
  'job_2': {
    id: 'job_2',
    name: 'Backup Automático',
    description: 'Backup diário do banco PostgreSQL e configurações',
    scriptType: 'shell',
    scriptContent: '#!/bin/bash\necho "Running backup..."\npg_dump netpilot > /backups/netpilot_$(date +%Y%m%d).sql',
    scriptPath: '/scripts/backup.sh',
    cronExpression: '0 2 * * *',
    isActive: true,
    priority: 2,
    timeout: 45000,
    retryAttempts: 2,
    retryDelay: 300,
    environment: 'production',
    notifications: {
      onSuccess: true,
      onFailure: true,
      email: 'admin@netpilot.local'
    }
  }
};

export default function EditJobQueuePage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [formData, setFormData] = useState<JobQueueFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Query to fetch job data
  const { data: jobData, isLoading, error } = useQuery({
    queryKey: ['job-queue', jobId],
    queryFn: async () => {
      // Simulate API call
      return new Promise<JobQueueFormData>((resolve, reject) => {
        setTimeout(() => {
          const job = mockJobData[jobId];
          if (job) {
            resolve(job);
          } else {
            reject(new Error('Job não encontrado'));
          }
        }, 500);
      });
    },
    enabled: !!jobId
  });

  // Set form data when job data is loaded
  useEffect(() => {
    if (jobData) {
      setFormData(jobData);
    }
  }, [jobData]);

  const updateMutation = useMutation({
    mutationFn: async (data: JobQueueFormData) => {
      // Simulate API call
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (data.name.length < 3) {
            reject(new Error('Nome deve ter pelo menos 3 caracteres'));
            return;
          }
          resolve(data);
        }, 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Job atualizado com sucesso',
        description: 'As alterações foram salvas.',
      });
      router.push('/job-queues');
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const validateForm = (): boolean => {
    if (!formData) return false;

    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.description.trim()) newErrors.description = 'Descrição é obrigatória';
    if (!formData.cronExpression.trim()) newErrors.cronExpression = 'Expressão cron é obrigatória';

    if (formData.scriptType === 'shell' || formData.scriptType === 'node' || formData.scriptType === 'python') {
      if (!formData.scriptContent && !formData.scriptPath) {
        newErrors.script = 'Conteúdo do script ou caminho é obrigatório';
      }
    }

    if (formData.priority < 1 || formData.priority > 10) {
      newErrors.priority = 'Prioridade deve estar entre 1 e 10';
    }

    if (formData.timeout < 1) {
      newErrors.timeout = 'Timeout deve ser maior que 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData && validateForm()) {
      updateMutation.mutate(formData);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (!formData) return;

    setFormData(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNotificationChange = (field: keyof JobQueueFormData['notifications'], value: any) => {
    if (!formData) return;

    setFormData(prev => prev ? ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value
      }
    }) : null);
  };

  if (error) {
    return (
      <MainLayout>
        <div className="text-center text-red-500 p-8">
          Erro ao carregar job: {(error as Error).message}
        </div>
      </MainLayout>
    );
  }

  if (isLoading || !formData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando job...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  const breadcrumbs = [
    { label: 'Filas de Processo', href: '/job-queues' },
    { label: 'Editar Job', current: true }
  ];

  const cronPresets = [
    { label: 'A cada minuto', value: '* * * * *' },
    { label: 'A cada 5 minutos', value: '*/5 * * * *' },
    { label: 'A cada hora', value: '0 * * * *' },
    { label: 'Diariamente às 00:00', value: '0 0 * * *' },
    { label: 'Semanalmente (domingo)', value: '0 0 * * 0' },
    { label: 'Mensalmente (dia 1)', value: '0 0 1 * *' }
  ];

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Editar Job</h1>
          </div>
          <Link href="/job-queues">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ex: Backup Diário"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade (1-10)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                    className={errors.priority ? 'border-red-500' : ''}
                  />
                  {errors.priority && <p className="text-sm text-red-500">{errors.priority}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descreva o que este job faz..."
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Job ativo</Label>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Script */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Script</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scriptType">Tipo de Script</Label>
                  <Select value={formData.scriptType} onValueChange={(value) => handleChange('scriptType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Interno</SelectItem>
                      <SelectItem value="shell">Shell Script</SelectItem>
                      <SelectItem value="node">Node.js</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Ambiente</Label>
                  <Select value={formData.environment} onValueChange={(value) => handleChange('environment', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Produção</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Desenvolvimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(formData.scriptType === 'shell' || formData.scriptType === 'node' || formData.scriptType === 'python') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="scriptPath">Caminho do Script</Label>
                    <Input
                      id="scriptPath"
                      value={formData.scriptPath || ''}
                      onChange={(e) => handleChange('scriptPath', e.target.value)}
                      placeholder="/path/to/script.sh"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scriptContent">Conteúdo do Script</Label>
                    <Textarea
                      id="scriptContent"
                      value={formData.scriptContent || ''}
                      onChange={(e) => handleChange('scriptContent', e.target.value)}
                      placeholder="#!/bin/bash&#10;echo 'Hello World'"
                      rows={6}
                      className="font-mono"
                    />
                    {errors.script && <p className="text-sm text-red-500">{errors.script}</p>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Agendamento */}
          <Card>
            <CardHeader>
              <CardTitle>Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cronExpression">Expressão Cron *</Label>
                <Input
                  id="cronExpression"
                  value={formData.cronExpression}
                  onChange={(e) => handleChange('cronExpression', e.target.value)}
                  placeholder="0 0 * * *"
                  className={errors.cronExpression ? 'border-red-500' : ''}
                />
                {errors.cronExpression && <p className="text-sm text-red-500">{errors.cronExpression}</p>}
              </div>

              <div className="space-y-2">
                <Label>Presets Comuns</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {cronPresets.map((preset) => (
                    <Button
                      key={preset.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleChange('cronExpression', preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações Avançadas */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (segundos)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="1"
                    value={formData.timeout}
                    onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
                    className={errors.timeout ? 'border-red-500' : ''}
                  />
                  {errors.timeout && <p className="text-sm text-red-500">{errors.timeout}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retryAttempts">Tentativas de Retry</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.retryAttempts}
                    onChange={(e) => handleChange('retryAttempts', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retryDelay">Delay entre Retries (segundos)</Label>
                  <Input
                    id="retryDelay"
                    type="number"
                    min="1"
                    value={formData.retryDelay}
                    onChange={(e) => handleChange('retryDelay', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notifySuccess"
                    checked={formData.notifications.onSuccess}
                    onCheckedChange={(checked) => handleNotificationChange('onSuccess', checked)}
                  />
                  <Label htmlFor="notifySuccess">Notificar em caso de sucesso</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="notifyFailure"
                    checked={formData.notifications.onFailure}
                    onCheckedChange={(checked) => handleNotificationChange('onFailure', checked)}
                  />
                  <Label htmlFor="notifyFailure">Notificar em caso de falha</Label>
                </div>

                {(formData.notifications.onSuccess || formData.notifications.onFailure) && (
                  <div className="space-y-2">
                    <Label htmlFor="notificationEmail">Email para notificações</Label>
                    <Input
                      id="notificationEmail"
                      type="email"
                      value={formData.notifications.email}
                      onChange={(e) => handleNotificationChange('email', e.target.value)}
                      placeholder="admin@example.com"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3">
            <Link href="/job-queues">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}