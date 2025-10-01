'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Server, Route, Target, Hash, Lock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { useRequireAuth } from '@/hooks/useAuth'
import { Domain, ProxyRule } from '@/types'

interface UpdateProxyRuleData {
  sourcePath: string
  targetUrl: string
  priority: number
  isActive: boolean
  isLocked: boolean
  maintainQueryStrings: boolean
  description?: string
  domainId: string
}

export default function EditProxyRulePage() {
  useRequireAuth()
  const router = useRouter()
  const params = useParams()
  const ruleId = params.id as string
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<UpdateProxyRuleData>({
    sourcePath: '',
    targetUrl: '',
    priority: 100,
    isActive: true,
    isLocked: false,
    maintainQueryStrings: true,
    description: '',
    domainId: '',
  })

  // Buscar regra de proxy existente
  const { data: proxyRule, isLoading: ruleLoading } = useQuery<ProxyRule>({
    queryKey: ['proxy-rule', ruleId],
    queryFn: () => api.get(`/proxy-rules/${ruleId}`).then(res => res.data),
    enabled: !!ruleId,
  })

  const { data: domains, isLoading: domainsLoading } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(res => res.data),
  })

  // Preencher formulário quando regra for carregada
  useEffect(() => {
    if (proxyRule) {
      setFormData({
        sourcePath: proxyRule.sourcePath,
        targetUrl: proxyRule.targetUrl,
        priority: proxyRule.priority,
        isActive: proxyRule.isActive,
        isLocked: proxyRule.isLocked,
        maintainQueryStrings: proxyRule.maintainQueryStrings,
        description: proxyRule.description || '',
        domainId: proxyRule.domainId,
      })
    }
  }, [proxyRule])

  const updateProxyRuleMutation = useMutation({
    mutationFn: (data: UpdateProxyRuleData) => api.patch(`/proxy-rules/${ruleId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxy-rules'] })
      queryClient.invalidateQueries({ queryKey: ['proxy-rule', ruleId] })
      toast.success('Regra de proxy atualizada com sucesso!')
      router.push('/proxy-rules')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar regra de proxy'
      toast.error(errorMessage)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.sourcePath.trim()) {
      toast.error('Caminho de origem é obrigatório')
      return
    }
    if (!formData.targetUrl.trim()) {
      toast.error('URL de destino é obrigatória')
      return
    }
    if (!formData.domainId) {
      toast.error('Domínio é obrigatório')
      return
    }
    if (formData.priority < 1 || formData.priority > 1000) {
      toast.error('Prioridade deve estar entre 1 e 1000')
      return
    }

    updateProxyRuleMutation.mutate(formData)
  }

  const handleBack = () => {
    router.push('/proxy-rules')
  }

  const breadcrumbs = [
    { label: 'Proxy Reverso', href: '/proxy-rules' },
    { label: proxyRule?.sourcePath || 'Carregando...', current: true }
  ]

  if (ruleLoading || domainsLoading) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <PageLoading />
      </MainLayout>
    )
  }

  if (!proxyRule) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Regra de proxy não encontrada</p>
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
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                Editar Regra de Proxy
                {proxyRule.isLocked && (
                  <span className="text-red-500 text-sm flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    TRAVADA
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground">
                {proxyRule.isLocked
                  ? 'Esta regra está travada. Apenas o travamento pode ser alterado.'
                  : 'Edite as configurações da regra de proxy reverso'
                }
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Configurações de Travamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-red-500" />
                <span>Controle de Travamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="isLocked"
                  checked={formData.isLocked}
                  onCheckedChange={(checked) => setFormData({ ...formData, isLocked: !!checked })}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="isLocked"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Travar Regra
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Quando travada, a regra não pode ser editada ou excluída acidentalmente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-blue-500" />
                <span>Configurações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domainId">
                    Domínio <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.domainId}
                    onValueChange={(value) => setFormData({ ...formData, domainId: value })}
                  >
                    <SelectTrigger disabled={proxyRule.isLocked && !formData.isLocked}>
                      <SelectValue placeholder="Selecione um domínio" />
                    </SelectTrigger>
                    <SelectContent>
                      {domains?.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id}>
                          {domain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Domínio onde a regra será aplicada
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Prioridade <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
                    placeholder="100"
                    required
                    disabled={proxyRule.isLocked && !formData.isLocked}
                  />
                  <p className="text-sm text-muted-foreground">
                    Menor número = maior prioridade (1-1000)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional da regra de proxy..."
                  rows={3}
                  disabled={proxyRule.isLocked && !formData.isLocked}
                />
                <p className="text-sm text-muted-foreground">
                  Descrição opcional para identificar a regra
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Roteamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Route className="h-5 w-5 text-green-500" />
                <span>Configurações de Roteamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sourcePath">
                  Caminho de Origem <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sourcePath"
                  type="text"
                  value={formData.sourcePath}
                  onChange={(e) => setFormData({ ...formData, sourcePath: e.target.value })}
                  placeholder="/api, /app, /"
                  required
                  disabled={proxyRule.isLocked && !formData.isLocked}
                />
                <p className="text-sm text-muted-foreground">
                  Caminho que será interceptado (ex: /api, /app, /)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetUrl">
                  URL de Destino <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="targetUrl"
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  placeholder="http://meadadigital.com:3001, http://api.exemplo.com"
                  required
                  disabled={proxyRule.isLocked && !formData.isLocked}
                />
                <p className="text-sm text-muted-foreground">
                  URL completa para onde o tráfego será direcionado
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configurações Avançadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-purple-500" />
                <span>Configurações Avançadas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                  disabled={proxyRule.isLocked && !formData.isLocked}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="isActive"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ativar Regra
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    A regra ficará ativa imediatamente após a atualização
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="maintainQueryStrings"
                  checked={formData.maintainQueryStrings}
                  onCheckedChange={(checked) => setFormData({ ...formData, maintainQueryStrings: !!checked })}
                  disabled={proxyRule.isLocked && !formData.isLocked}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="maintainQueryStrings"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Manter Query Strings
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Preservar parâmetros da URL (?param=value) no redirecionamento
                  </p>
                </div>
              </div>
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
              disabled={updateProxyRuleMutation.isPending}
            >
              {updateProxyRuleMutation.isPending ? 'Atualizando...' : 'Atualizar Regra'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}