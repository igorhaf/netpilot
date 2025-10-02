'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RotateCcw, Globe, Target, Hash, Lock, Unlock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { useRequireAuth } from '@/hooks/useAuth'
import { Domain } from '@/types'

interface CreateRedirectData {
  sourcePattern: string
  targetUrl: string
  type: 'permanent' | 'temporary'
  isActive: boolean
  isLocked?: boolean
  priority: number
  description?: string
  domainId: string
}

export default function NewRedirectPage() {
  useRequireAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<CreateRedirectData>({
    sourcePattern: '',
    targetUrl: '',
    type: 'permanent',
    isActive: true,
    isLocked: false,
    priority: 100,
    description: '',
    domainId: '',
  })

  const { data: domains, isLoading: domainsLoading } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(res => res.data),
  })

  const createRedirectMutation = useMutation({
    mutationFn: (data: CreateRedirectData) => api.post('/redirects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] })
      toast.success('Redirecionamento criado com sucesso!')
      router.push('/redirects')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar redirecionamento')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.sourcePattern.trim()) {
      toast.error('Padrão de origem é obrigatório')
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

    createRedirectMutation.mutate(formData)
  }

  const handleBack = () => {
    router.push('/redirects')
  }

  const breadcrumbs = [
    { label: 'Redirecionamentos', href: '/redirects' },
    { label: 'Novo Redirecionamento', current: true }
  ]

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
                <RotateCcw className="h-8 w-8 text-blue-500" />
                Novo Redirecionamento
              </h1>
              <p className="text-muted-foreground">
                Configure um novo redirecionamento para direcionar tráfego entre URLs
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Configurações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <span>Configurações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domainId" className="text-sm font-medium">
                    Domínio <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.domainId}
                    onValueChange={(value) => setFormData({ ...formData, domainId: value })}
                  >
                    <SelectTrigger>
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
                    Domínio onde o redirecionamento será aplicado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium">
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
                  />
                  <p className="text-sm text-muted-foreground">
                    Menor número = maior prioridade (1-1000)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional do redirecionamento..."
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Descrição opcional para identificar o redirecionamento
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Redirecionamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-green-500" />
                <span>Configurações de Redirecionamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sourcePattern" className="text-sm font-medium">
                  Padrão de Origem <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sourcePattern"
                  type="text"
                  value={formData.sourcePattern}
                  onChange={(e) => setFormData({ ...formData, sourcePattern: e.target.value })}
                  placeholder="/old-path/*, /blog/*, /categoria/*"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Padrão da URL origem. Use * para capturar partes variáveis (ex: /old-path/*)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetUrl" className="text-sm font-medium">
                  URL de Destino <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="targetUrl"
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  placeholder="https://example.com/new-path, /new-path"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  URL completa ou caminho relativo para onde redirecionar
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Tipo de Redirecionamento <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as 'permanent' | 'temporary' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">301 - Permanente (Recomendado)</SelectItem>
                    <SelectItem value="temporary">302 - Temporário</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  301: Permanente (SEO-friendly), 302: Temporário
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configurações Avançadas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
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
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="isActive"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ativar Redirecionamento
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    O redirecionamento ficará ativo imediatamente após a criação
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="isLocked"
                  checked={formData.isLocked}
                  onCheckedChange={(checked) => setFormData({ ...formData, isLocked: !!checked })}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="isLocked"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    {formData.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    Travar Redirecionamento
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Quando travado, o redirecionamento não poderá ser editado ou excluído
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
              disabled={createRedirectMutation.isPending}
            >
              {createRedirectMutation.isPending ? 'Criando...' : 'Criar Redirecionamento'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}