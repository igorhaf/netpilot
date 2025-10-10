'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Server, Shield, Globe, Lock, Container, Eye, Play, Square, RotateCcw, Terminal, FileText, Activity, Trash2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { api } from '@/lib/api'
import { useRequireAuth } from '@/hooks/useAuth'
import { DockerApiService, DockerContainer } from '@/lib/docker-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

interface UpdateDomainData {
  name: string
  description?: string
  projectId: string
  isActive: boolean
  autoTls: boolean
  forceHttps: boolean
  blockExternalAccess: boolean
  enableWwwRedirect: boolean
  bindIp?: string
}

export default function EditDomainPage() {
  useRequireAuth()
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const domainId = params.id as string

  const [formData, setFormData] = useState<UpdateDomainData>({
    name: '',
    description: '',
    projectId: '',
    isActive: true,
    autoTls: true,
    forceHttps: true,
    blockExternalAccess: false,
    enableWwwRedirect: false,
    bindIp: undefined,
  })

  const { data: domain, isLoading } = useQuery({
    queryKey: ['domain', domainId],
    queryFn: () => api.get(`/domains/${domainId}`).then(res => res.data),
    enabled: !!domainId,
  })

  // Buscar projetos disponíveis
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(res => res.data)
  })

  const { data: containersResponse, isLoading: containersLoading } = useQuery({
    queryKey: ['docker', 'containers'],
    queryFn: () => DockerApiService.listContainers(),
    refetchInterval: 10000 // Refresh a cada 10s
  })

  const containerActionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      switch (action) {
        case 'start':
          return await DockerApiService.startContainer(id);
        case 'stop':
          return await DockerApiService.stopContainer(id);
        case 'restart':
          return await DockerApiService.restartContainer(id);
        case 'remove':
          return await DockerApiService.removeContainer(id);
        default:
          throw new Error(`Ação não suportada: ${action}`);
      }
    },
    onSuccess: (result, { action }) => {
      if (result.success) {
        toast.success(result.message || `Container ${action} executado com sucesso`);
      } else {
        toast.error(result.message || 'Erro ao executar ação');
      }
      queryClient.invalidateQueries({ queryKey: ['docker', 'containers'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Falha ao executar ação');
    }
  })

  const handleContainerAction = (containerId: string, action: string) => {
    containerActionMutation.mutate({ id: containerId, action });
  }

  useEffect(() => {
    if (domain) {
      setFormData({
        name: domain.name || '',
        description: domain.description || '',
        projectId: domain.projectId || '',
        isActive: domain.isActive ?? true,
        autoTls: domain.autoTls ?? true,
        forceHttps: domain.forceHttps ?? true,
        blockExternalAccess: domain.blockExternalAccess ?? false,
        enableWwwRedirect: domain.enableWwwRedirect ?? false,
        bindIp: domain.bindIp || undefined,
      })
    }
  }, [domain])

  const updateDomainMutation = useMutation({
    mutationFn: (data: UpdateDomainData) => api.patch(`/domains/${domainId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      queryClient.invalidateQueries({ queryKey: ['domain', domainId] })
      toast.success('Domínio atualizado com sucesso!')
      router.push('/domains')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar domínio')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Nome do domínio é obrigatório')
      return
    }
    if (!formData.projectId) {
      toast.error('Projeto é obrigatório')
      return
    }

    // Clean up empty/undefined fields before sending
    const cleanedData = { ...formData }
    if (!cleanedData.description?.trim()) {
      delete cleanedData.description
    }
    if (!cleanedData.bindIp?.trim()) {
      delete cleanedData.bindIp
    }

    updateDomainMutation.mutate(cleanedData)
  }

  const handleBack = () => {
    router.push('/domains')
  }

  const breadcrumbs = [
    { label: 'Domínios', href: '/domains' },
    { label: domain?.name || 'Carregando...', current: true }
  ]

  if (isLoading) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <PageLoading />
      </MainLayout>
    )
  }

  if (!domain) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground">Domínio não encontrado</h2>
          <p className="text-muted-foreground mt-2">O domínio solicitado não foi encontrado.</p>
          <button
            onClick={handleBack}
            className="btn-primary mt-4"
          >
            Voltar para Domínios
          </button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Globe className="h-8 w-8 text-blue-500" />
                Editar Domínio
              </h1>
              <p className="text-muted-foreground">
                Edite as configurações do domínio {domain.name}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-500" />
                <span>Informações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome do Domínio <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="exemplo.com"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Nome do domínio (ex: exemplo.com, www.exemplo.com)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do domínio e sua finalidade..."
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Descrição opcional para identificar o domínio
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectId">
                  Projeto <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Projeto ao qual este domínio pertence
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Ativação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-500" />
                <span>Configurações de Ativação</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="isActive"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ativar Domínio
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Quando ativo, o domínio ficará disponível para receber tráfego e configurar redirects
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="autoTls"
                  checked={formData.autoTls}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoTls: !!checked })}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="autoTls"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    SSL Automático (Let&apos;s Encrypt)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Gerar e renovar automaticamente certificados SSL gratuitos via Let&apos;s Encrypt
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                <span>Configurações de Segurança</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="forceHttps"
                  checked={formData.forceHttps}
                  onCheckedChange={(checked) => setFormData({ ...formData, forceHttps: !!checked })}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="forceHttps"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Forçar HTTPS (Redirecionamento HTTP → HTTPS)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Redireciona automaticamente todo tráfego HTTP para HTTPS (recomendado)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="blockExternalAccess"
                  checked={formData.blockExternalAccess}
                  onCheckedChange={(checked) => setFormData({ ...formData, blockExternalAccess: !!checked })}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="blockExternalAccess"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Bloquear Acesso Externo Direto
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Impede acesso direto às portas da aplicação (ex: meadadigital.com:8484) de IPs externos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Redirecionamento WWW */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-500" />
                <span>Redirecionamento WWW</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="enableWwwRedirect"
                  checked={formData.enableWwwRedirect}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableWwwRedirect: !!checked })}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="enableWwwRedirect"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ativar Redirecionamento WWW
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Redireciona entre www.dominio.com e dominio.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Containers Atrelados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Container className="h-5 w-5 text-blue-500" />
                <span>Containers Atrelados ao Domínio</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {containersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Portas</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {containersResponse?.data?.map((container: DockerContainer) => (
                          <TableRow key={container.id}>
                            <TableCell>
                              <div className="text-lg flex items-center gap-2">
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
                                    <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                                      {port.PublicPort ? `${port.PublicPort}:` : ''}{port.PrivatePort}
                                    </span>
                                  ))}
                                  {container.ports.length > 2 && (
                                    <span className="text-xs bg-muted px-2 py-1 rounded">
                                      +{container.ports.length - 2}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
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
                                    onClick={() => handleContainerAction(container.id, 'stop')}
                                    disabled={containerActionMutation.isPending}
                                    title="Parar"
                                  >
                                    <Square className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleContainerAction(container.id, 'start')}
                                    disabled={containerActionMutation.isPending}
                                    title="Iniciar"
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContainerAction(container.id, 'restart')}
                                  disabled={containerActionMutation.isPending}
                                  title="Reiniciar"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>

                                <Link href={`/docker/containers/${container.id}/logs`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    title="Ver logs"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </Link>

                                {container.state === 'running' && (
                                  <>
                                    <Link href={`/docker/containers/${container.id}/terminal`}>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        title="Terminal"
                                      >
                                        <Terminal className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                  </>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContainerAction(container.id, 'remove')}
                                  disabled={containerActionMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                  title="Remover"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {containersResponse?.data?.map((container: DockerContainer) => (
                      <div key={container.id} className="border rounded-lg p-4 space-y-3">
                        {/* Container Header */}
                        <div className="flex items-center justify-between">
                          <div className="text-lg flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
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
                              <span className="text-sm">
                                {container.names?.[0]?.replace(/^\//, '') || container.id.substring(0, 12)}
                              </span>
                            </Link>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            container.state === 'running'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {container.state === 'running' ? 'Rodando' : 'Parado'}
                          </span>
                        </div>

                        {/* Ports */}
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Portas:</label>
                          <div className="mt-1">
                            {container.ports?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {container.ports.slice(0, 3).map((port: any, idx: number) => (
                                  <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                                    {port.PublicPort ? `${port.PublicPort}:` : ''}{port.PrivatePort}
                                  </span>
                                ))}
                                {container.ports.length > 3 && (
                                  <span className="text-xs bg-muted px-2 py-1 rounded">
                                    +{container.ports.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/docker/containers/${container.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Detalhes
                            </Button>
                          </Link>

                          {container.state === 'running' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleContainerAction(container.id, 'stop')}
                              disabled={containerActionMutation.isPending}
                            >
                              <Square className="h-3 w-3 mr-1" />
                              Parar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleContainerAction(container.id, 'start')}
                              disabled={containerActionMutation.isPending}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Iniciar
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => handleContainerAction(container.id, 'restart')}
                            disabled={containerActionMutation.isPending}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reiniciar
                          </Button>

                          <Link href={`/docker/containers/${container.id}/logs`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Logs
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(containersResponse?.data?.length || 0) === 0 && (
                    <div className="text-center py-8">
                      <Container className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Nenhum container encontrado</h3>
                      <p className="text-muted-foreground">
                        Containers ativos aparecerão aqui quando estiverem rodando.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateDomainMutation.isPending}
            >
              {updateDomainMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}