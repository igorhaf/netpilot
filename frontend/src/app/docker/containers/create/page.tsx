'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MainLayout } from '@/components/layout/main-layout';
import { Plus, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

interface PortMapping {
  container_port: string;
  host_port: string;
  protocol: 'tcp' | 'udp';
}

interface VolumeMount {
  source: string;
  target: string;
  type: 'bind' | 'volume';
  readonly: boolean;
}

interface EnvVar {
  key: string;
  value: string;
}

export default function CreateContainerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    restart_policy: 'no',
    command: '',
    networks: [] as string[],
    labels: {} as Record<string, string>
  });

  const [ports, setPorts] = useState<PortMapping[]>([]);
  const [volumes, setVolumes] = useState<VolumeMount[]>([]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [labelInput, setLabelInput] = useState({ key: '', value: '' });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      // Mock API call
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id: 'new-container-123' }), 2000);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Container criado',
        description: 'Container criado com sucesso!'
      });
      router.push('/docker/containers');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao criar container',
        variant: 'destructive'
      });
    }
  });

  const addPort = () => {
    setPorts([...ports, { container_port: '', host_port: '', protocol: 'tcp' }]);
  };

  const removePort = (index: number) => {
    setPorts(ports.filter((_, i) => i !== index));
  };

  const updatePort = (index: number, field: keyof PortMapping, value: string) => {
    const newPorts = [...ports];
    newPorts[index] = { ...newPorts[index], [field]: value };
    setPorts(newPorts);
  };

  const addVolume = () => {
    setVolumes([...volumes, { source: '', target: '', type: 'volume', readonly: false }]);
  };

  const removeVolume = (index: number) => {
    setVolumes(volumes.filter((_, i) => i !== index));
  };

  const updateVolume = (index: number, field: keyof VolumeMount, value: any) => {
    const newVolumes = [...volumes];
    newVolumes[index] = { ...newVolumes[index], [field]: value };
    setVolumes(newVolumes);
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: keyof EnvVar, value: string) => {
    const newEnvVars = [...envVars];
    newEnvVars[index] = { ...newEnvVars[index], [field]: value };
    setEnvVars(newEnvVars);
  };

  const addLabel = () => {
    if (labelInput.key && labelInput.value) {
      setFormData({
        ...formData,
        labels: { ...formData.labels, [labelInput.key]: labelInput.value }
      });
      setLabelInput({ key: '', value: '' });
    }
  };

  const removeLabel = (key: string) => {
    const newLabels = { ...formData.labels };
    delete newLabels[key];
    setFormData({ ...formData, labels: newLabels });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.image) {
      toast({
        title: 'Erro',
        description: 'Nome e imagem são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    const submitData = {
      ...formData,
      command: formData.command ? formData.command.split(' ') : undefined,
      env: envVars.filter(env => env.key && env.value).map(env => `${env.key}=${env.value}`),
      ports: ports.reduce((acc, port) => {
        if (port.container_port && port.host_port) {
          acc[`${port.container_port}/${port.protocol}`] = [{ HostPort: port.host_port }];
        }
        return acc;
      }, {} as Record<string, any>),
      volumes: volumes.filter(vol => vol.source && vol.target)
    };

    createMutation.mutate(submitData);
  };

  const breadcrumbs = [
    { label: 'Docker', href: '/docker' },
    { label: 'Containers', href: '/docker/containers' },
    { label: 'Criar Container', current: true }
  ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/docker/containers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Criar Container</h1>
          <p className="text-muted-foreground">
            Configure um novo container Docker
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Configurações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Container *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="meu-container"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Imagem *</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="nginx:alpine"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restart_policy">Política de Restart</Label>
                <Select
                  value={formData.restart_policy}
                  onValueChange={(value) => setFormData({ ...formData, restart_policy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Não reiniciar</SelectItem>
                    <SelectItem value="always">Sempre reiniciar</SelectItem>
                    <SelectItem value="unless-stopped">Reiniciar (exceto se parado)</SelectItem>
                    <SelectItem value="on-failure">Reiniciar em falha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="command">Comando (opcional)</Label>
                <Input
                  id="command"
                  value={formData.command}
                  onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  placeholder="/bin/bash -c 'echo hello'"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mapeamento de Portas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Mapeamento de Portas
              <Button type="button" variant="outline" size="sm" onClick={addPort}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Porta
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ports.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma porta configurada
              </p>
            ) : (
              <div className="space-y-3">
                {ports.map((port, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Input
                      placeholder="Porta do container"
                      value={port.container_port}
                      onChange={(e) => updatePort(index, 'container_port', e.target.value)}
                    />
                    <span>:</span>
                    <Input
                      placeholder="Porta do host"
                      value={port.host_port}
                      onChange={(e) => updatePort(index, 'host_port', e.target.value)}
                    />
                    <Select
                      value={port.protocol}
                      onValueChange={(value: 'tcp' | 'udp') => updatePort(index, 'protocol', value)}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePort(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Volumes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Volumes
              <Button type="button" variant="outline" size="sm" onClick={addVolume}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Volume
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {volumes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum volume configurado
              </p>
            ) : (
              <div className="space-y-3">
                {volumes.map((volume, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Input
                      placeholder="Origem (volume ou caminho)"
                      value={volume.source}
                      onChange={(e) => updateVolume(index, 'source', e.target.value)}
                    />
                    <span>:</span>
                    <Input
                      placeholder="Destino no container"
                      value={volume.target}
                      onChange={(e) => updateVolume(index, 'target', e.target.value)}
                    />
                    <Select
                      value={volume.type}
                      onValueChange={(value: 'bind' | 'volume') => updateVolume(index, 'type', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="volume">Volume</SelectItem>
                        <SelectItem value="bind">Bind</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={volume.readonly}
                        onCheckedChange={(checked) => updateVolume(index, 'readonly', checked)}
                      />
                      <Label className="text-xs">RO</Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeVolume(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variáveis de Ambiente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Variáveis de Ambiente
              <Button type="button" variant="outline" size="sm" onClick={addEnvVar}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Variável
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {envVars.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma variável de ambiente configurada
              </p>
            ) : (
              <div className="space-y-3">
                {envVars.map((envVar, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Input
                      placeholder="Nome da variável"
                      value={envVar.key}
                      onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                    />
                    <span>=</span>
                    <Input
                      placeholder="Valor"
                      value={envVar.value}
                      onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEnvVar(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Labels */}
        <Card>
          <CardHeader>
            <CardTitle>Labels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Input
                placeholder="Chave"
                value={labelInput.key}
                onChange={(e) => setLabelInput({ ...labelInput, key: e.target.value })}
              />
              <span>=</span>
              <Input
                placeholder="Valor"
                value={labelInput.value}
                onChange={(e) => setLabelInput({ ...labelInput, value: e.target.value })}
              />
              <Button type="button" variant="outline" size="sm" onClick={addLabel}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {Object.keys(formData.labels).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(formData.labels).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="flex items-center space-x-1">
                    <span>{key}={value}</span>
                    <button
                      type="button"
                      onClick={() => removeLabel(key)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end space-x-4">
          <Link href="/docker/containers">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="min-w-32"
          >
            {createMutation.isPending ? 'Criando...' : 'Criar Container'}
          </Button>
        </div>
      </form>
      </div>
    </MainLayout>
  );
}