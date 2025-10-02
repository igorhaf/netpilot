'use client'

import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Server, Shield, Globe, Lock, Unlock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { api } from '@/lib/api'
import { useRequireAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CreateDomainData {
  name: string
  description?: string
  projectId: string
  isActive: boolean
  isLocked?: boolean
  autoTls: boolean
  forceHttps: boolean
  blockExternalAccess: boolean
  enableWwwRedirect: boolean
  bindIp?: string
}

export default function NewDomainPage() {
  useRequireAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<CreateDomainData>({
    name: '',
    description: '',
    projectId: '',
    isActive: true,
    isLocked: false,
    autoTls: true,
    forceHttps: true,
    blockExternalAccess: false,
    enableWwwRedirect: false,
    bindIp: undefined,
  })

  // Buscar projetos disponíveis
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(res => res.data)
  })

  const createDomainMutation = useMutation({
    mutationFn: (data: CreateDomainData) => api.post('/domains', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast.success('Domínio criado com sucesso!')
      router.push('/domains')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar domínio')
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

    createDomainMutation.mutate(cleanedData)
  }

  const handleBack = () => {
    router.push('/domains')
  }

  const breadcrumbs = [
    { label: 'Domínios', href: '/domains' },
    { label: 'Novo Domínio', current: true }
  ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Globe className="h-8 w-8 text-blue-500" />
              Novo Domínio
            </h1>
            <p className="text-muted-foreground">
              Adicione um domínio para gerenciar redirects e certificados SSL automáticos
            </p>
          </div>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
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
            <CardContent>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
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
                  <p className="text-xs text-muted-foreground">
                    Nome do domínio (ex: exemplo.com, www.exemplo.com)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do domínio e sua finalidade..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Descrição opcional para identificar o domínio
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId" className="text-sm font-medium">
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
                  <p className="text-xs text-muted-foreground">
                    Projeto ao qual este domínio pertence
                  </p>
                </div>
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
            <CardContent>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Ativar Domínio
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Quando ativo, o domínio ficará disponível para receber tráfego e configurar redirects
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Switch
                    id="autoTls"
                    checked={formData.autoTls}
                    onCheckedChange={(checked) => setFormData({ ...formData, autoTls: checked })}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="autoTls" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      SSL Automático (Let&apos;s Encrypt)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Gerar e renovar automaticamente certificados SSL gratuitos via Let&apos;s Encrypt
                    </p>
                  </div>
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
            <CardContent>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Switch
                    id="forceHttps"
                    checked={formData.forceHttps}
                    onCheckedChange={(checked) => setFormData({ ...formData, forceHttps: checked })}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="forceHttps" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Forçar HTTPS (Redirecionamento HTTP → HTTPS)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Redireciona automaticamente todo tráfego HTTP para HTTPS (recomendado)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Switch
                    id="blockExternalAccess"
                    checked={formData.blockExternalAccess}
                    onCheckedChange={(checked) => setFormData({ ...formData, blockExternalAccess: checked })}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="blockExternalAccess" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Bloquear Acesso Externo Direto
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Impede acesso direto às portas da aplicação (ex: meadadigital.com:8484) de IPs externos
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Redirecionamento WWW */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-500" />
                <span>Redirecionamento WWW</span>
              </CardTitle>
            </CardHeader>
            <CardContent>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Switch
                    id="enableWwwRedirect"
                    checked={formData.enableWwwRedirect}
                    onCheckedChange={(checked) => setFormData({ ...formData, enableWwwRedirect: checked })}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="enableWwwRedirect" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Ativar Redirecionamento WWW
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Redireciona entre www.dominio.com e dominio.com
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proteção e Travamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-500" />
                <span>Proteção e Travamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Switch
                    id="isLocked"
                    checked={formData.isLocked}
                    onCheckedChange={(checked) => setFormData({ ...formData, isLocked: checked })}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="isLocked" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                      {formData.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      Travar Domínio
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Quando travado, o domínio não poderá ser editado ou excluído
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createDomainMutation.isPending}
            >
              {createDomainMutation.isPending ? 'Criando...' : 'Criar Domínio'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}