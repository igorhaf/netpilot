'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Search, Play, Pause, Plus, Edit, Trash2, Lock, Unlock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { useRequireAuth } from '@/hooks/useAuth'
import { formatDate, getStatusBadge } from '@/lib/utils'
import api from '@/lib/api'
import { ProxyRule } from '@/types'

export default function ProxyRulesPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: proxyRules, isLoading } = useQuery<ProxyRule[]>({
    queryKey: ['proxy-rules', search],
    queryFn: () => api.get(`/proxy-rules?search=${search}`).then(res => res.data),
    enabled: !!auth,
  })

  // Mutation para ativar/desativar proxy rule
  const toggleProxyRuleMutation = useMutation({
    mutationFn: ({ rule, isActive }: { rule: ProxyRule; isActive: boolean }) =>
      api.patch(`/proxy-rules/${rule.id}`, {
        sourcePath: rule.sourcePath,
        targetUrl: rule.targetUrl,
        priority: rule.priority,
        isActive,
        maintainQueryStrings: rule.maintainQueryStrings,
        description: rule.description,
        domainId: rule.domainId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxy-rules'] })
      toast.success('Status da regra de proxy atualizado!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar regra de proxy')
    },
  })

  // Mutation para aplicar configuração
  const applyConfigurationMutation = useMutation({
    mutationFn: () => api.post('/proxy-rules/apply-configuration'),
    onSuccess: () => {
      toast.success('Configuração aplicada com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao aplicar configuração')
    },
  })

  // Mutation para travar/destravar regra
  const toggleLockMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/proxy-rules/${id}/toggle-lock`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['proxy-rules'] })
      toast.success('Status do travamento atualizado!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar travamento')
    },
  })

  // Mutation para excluir regra
  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/proxy-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxy-rules'] })
      toast.success('Regra de proxy excluída com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir regra de proxy')
    },
  })

  const handleToggleProxyRule = (rule: ProxyRule) => {
    toggleProxyRuleMutation.mutate({
      rule,
      isActive: !rule.isActive,
    })
  }

  const handleApplyConfiguration = () => {
    applyConfigurationMutation.mutate()
  }

  const handleToggleLock = (rule: ProxyRule) => {
    toggleLockMutation.mutate(rule.id)
  }

  const handleEditRule = (rule: ProxyRule) => {
    router.push(`/proxy-rules/${rule.id}/edit`)
  }

  const handleDeleteRule = (rule: ProxyRule) => {
    if (window.confirm('Tem certeza que deseja excluir esta regra de proxy?')) {
      deleteRuleMutation.mutate(rule.id)
    }
  }

  const handleCreateProxyRule = () => {
    router.push('/proxy-rules/new')
  }

  if (!auth) return null

  if (isLoading) {
    return (
      <MainLayout>
        <PageLoading />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Proxy Reverso</h1>
            <p className="text-muted-foreground">
              Configure regras de proxy reverso para seus domínios
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateProxyRule}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Regra
            </button>
            <button
              onClick={handleApplyConfiguration}
              disabled={applyConfigurationMutation.isPending}
              className="btn-primary"
            >
              {applyConfigurationMutation.isPending ? 'Aplicando...' : 'Aplicar Configuração'}
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar regras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full max-w-md"
          />
        </div>

        <div className="card">
          <div className="card-content p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Origem</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Destino</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Domínio</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Prioridade</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Travamento</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {proxyRules && proxyRules.length > 0 ? (
                    proxyRules.map((rule) => (
                      <tr key={rule.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-400" />
                            <code className="text-sm bg-muted px-2 py-1 rounded">{rule.sourcePath}</code>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <code className="text-sm text-muted-foreground">{rule.targetUrl}</code>
                        </td>
                        <td className="py-3 px-6 font-medium">
                          {rule.domain?.name}
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {rule.priority}
                        </td>
                        <td className="py-3 px-6">
                          <span className={getStatusBadge(rule.isActive ? 'active' : 'inactive')}>
                            {rule.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleLock(rule)}
                              disabled={toggleLockMutation.isPending}
                              className={`btn-ghost btn-sm ${
                                rule.isLocked
                                  ? 'text-red-500 hover:text-red-600'
                                  : 'text-gray-500 hover:text-gray-600'
                              }`}
                              title={rule.isLocked ? 'Travado (clique para destravar)' : 'Destravado (clique para travar)'}
                            >
                              {rule.isLocked ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </button>
                            {rule.isLocked && (
                              <span className="text-xs text-red-500 font-medium">TRAVADO</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            {!rule.isLocked && (
                              <>
                                <button
                                  onClick={() => handleToggleProxyRule(rule)}
                                  disabled={toggleProxyRuleMutation.isPending}
                                  className={`btn-ghost btn-sm ${
                                    rule.isActive
                                      ? 'text-red-500 hover:text-red-600'
                                      : 'text-green-500 hover:text-green-600'
                                  }`}
                                  title={rule.isActive ? 'Desativar regra' : 'Ativar regra'}
                                >
                                  {rule.isActive ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleEditRule(rule)}
                                  className="btn-ghost btn-sm text-blue-500 hover:text-blue-600"
                                  title="Editar regra"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRule(rule)}
                                  disabled={deleteRuleMutation.isPending}
                                  className="btn-ghost btn-sm text-red-500 hover:text-red-600"
                                  title="Excluir regra"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        Nenhuma regra de proxy encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}