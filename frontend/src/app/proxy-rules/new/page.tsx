'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Server, Route, Target, Hash } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { api } from '@/lib/api'
import { useRequireAuth } from '@/hooks/useAuth'
import { Domain } from '@/types'

interface CreateProxyRuleData {
  sourcePath: string
  targetUrl: string
  priority: number
  isActive: boolean
  maintainQueryStrings: boolean
  description?: string
  domainId: string
}

export default function NewProxyRulePage() {
  useRequireAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<CreateProxyRuleData>({
    sourcePath: '',
    targetUrl: '',
    priority: 100,
    isActive: true,
    maintainQueryStrings: true,
    description: '',
    domainId: '',
  })

  const { data: domains, isLoading: domainsLoading } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(res => res.data),
  })

  const createProxyRuleMutation = useMutation({
    mutationFn: (data: CreateProxyRuleData) => api.post('/proxy-rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxy-rules'] })
      toast.success('Regra de proxy criada com sucesso!')
      router.push('/proxy-rules')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Erro ao criar regra de proxy'
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

    createProxyRuleMutation.mutate(formData)
  }

  const handleBack = () => {
    router.push('/proxy-rules')
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
                Nova Regra de Proxy
              </h1>
              <p className="text-muted-foreground">
                Configure uma nova regra de proxy reverso para direcionar tráfego
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Configurações Básicas */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center space-x-2 mb-6">
                <Server className="h-5 w-5 text-blue-500" />
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
                    Domínio onde a regra será aplicada
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
                  placeholder="Descrição opcional da regra de proxy..."
                  rows={3}
                  className="input w-full resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Descrição opcional para identificar a regra
                </p>
              </div>
            </div>
          </div>

          {/* Configurações de Roteamento */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center space-x-2 mb-6">
                <Route className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Configurações de Roteamento
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="sourcePath" className="block text-sm font-medium text-foreground mb-2">
                    Caminho de Origem <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sourcePath"
                    type="text"
                    value={formData.sourcePath}
                    onChange={(e) => setFormData({ ...formData, sourcePath: e.target.value })}
                    placeholder="/api, /app, /"
                    className="input w-full"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Caminho que será interceptado (ex: /api, /app, /)
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
                    placeholder="http://meadadigital.com:3001, http://api.exemplo.com"
                    className="input w-full"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL completa para onde o tráfego será direcionado
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
                      Ativar Regra
                    </span>
                    <p className="text-sm text-muted-foreground">
                      A regra ficará ativa imediatamente após a criação
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    id="maintainQueryStrings"
                    type="checkbox"
                    checked={formData.maintainQueryStrings}
                    onChange={(e) => setFormData({ ...formData, maintainQueryStrings: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      Manter Query Strings
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Preservar parâmetros da URL (?param=value) no redirecionamento
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
              disabled={createProxyRuleMutation.isPending}
              className="btn-primary"
            >
              {createProxyRuleMutation.isPending ? 'Criando...' : 'Criar Regra'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}