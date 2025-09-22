'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RotateCcw, Globe, Target, Hash } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { api } from '@/lib/api'
import { useRequireAuth } from '@/hooks/useAuth'
import { Domain } from '@/types'

interface CreateRedirectData {
  sourcePattern: string
  targetUrl: string
  type: 'permanent' | 'temporary'
  isActive: boolean
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

  return (
    <MainLayout>
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
              <h1 className="text-3xl font-bold text-foreground">
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
          <div className="card">
            <div className="card-content">
              <div className="flex items-center space-x-2 mb-6">
                <Globe className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Configurações Básicas
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="domainId" className="block text-sm font-medium text-foreground mb-2">
                    Domínio <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="domainId"
                    value={formData.domainId}
                    onChange={(e) => setFormData({ ...formData, domainId: e.target.value })}
                    className="input w-full"
                    required
                  >
                    <option value="">Selecione um domínio</option>
                    {domains?.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Domínio onde o redirecionamento será aplicado
                  </p>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-2">
                    Prioridade <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="priority"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
                    placeholder="100"
                    className="input w-full"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Menor número = maior prioridade (1-1000)
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional do redirecionamento..."
                  rows={3}
                  className="input w-full resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Descrição opcional para identificar o redirecionamento
                </p>
              </div>
            </div>
          </div>

          {/* Configurações de Redirecionamento */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center space-x-2 mb-6">
                <RotateCcw className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Configurações de Redirecionamento
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="sourcePattern" className="block text-sm font-medium text-foreground mb-2">
                    Padrão de Origem <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sourcePattern"
                    type="text"
                    value={formData.sourcePattern}
                    onChange={(e) => setFormData({ ...formData, sourcePattern: e.target.value })}
                    placeholder="/old-path/*, /blog/*, /categoria/*"
                    className="input w-full"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Padrão da URL origem. Use * para capturar partes variáveis (ex: /old-path/*)
                  </p>
                </div>

                <div>
                  <label htmlFor="targetUrl" className="block text-sm font-medium text-foreground mb-2">
                    URL de Destino <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="targetUrl"
                    type="url"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    placeholder="https://example.com/new-path, /new-path"
                    className="input w-full"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL completa ou caminho relativo para onde redirecionar
                  </p>
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-foreground mb-2">
                    Tipo de Redirecionamento <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'permanent' | 'temporary' })}
                    className="input w-full"
                    required
                  >
                    <option value="permanent">301 - Permanente (Recomendado)</option>
                    <option value="temporary">302 - Temporário</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    301: Permanente (SEO-friendly), 302: Temporário
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Configurações Avançadas */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center space-x-2 mb-6">
                <Hash className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Configurações Avançadas
                </h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      Ativar Redirecionamento
                    </span>
                    <p className="text-sm text-muted-foreground">
                      O redirecionamento ficará ativo imediatamente após a criação
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-border">
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createRedirectMutation.isPending}
              className="btn-primary"
            >
              {createRedirectMutation.isPending ? 'Criando...' : 'Criar Redirecionamento'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}