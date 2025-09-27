'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Search, Play, Pause, Plus, Edit, Trash2, Lock, Unlock, Square } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useRequireAuth } from '@/hooks/useAuth'
import { formatDate, getStatusBadge } from '@/lib/utils'
import api from '@/lib/api'
import { ProxyRule } from '@/types'

export default function ProxyRulesPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [ruleToDelete, setRuleToDelete] = useState<ProxyRule | null>(null)
  const queryClient = useQueryClient()

  // Get domain filter from URL
  const domainFilter = searchParams.get('domain')

  const { data: allProxyRules, isLoading } = useQuery<ProxyRule[]>({
    queryKey: ['proxy-rules', search],
    queryFn: () => api.get(`/proxy-rules?search=${search}`).then(res => res.data),
    enabled: !!auth,
  })

  // Filter by domain if specified
  const proxyRules = domainFilter
    ? allProxyRules?.filter(rule => rule.domainId === domainFilter)
    : allProxyRules

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

  // Mutation para descartar modificações
  const discardChangesMutation = useMutation({
    mutationFn: () => api.post('/proxy-rules/discard-changes'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxy-rules'] })
      toast.success('Modificações descartadas com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao descartar modificações')
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
      setRuleToDelete(null)
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

  const handleDiscardChanges = () => {
    discardChangesMutation.mutate()
  }

  const handleToggleLock = (rule: ProxyRule) => {
    toggleLockMutation.mutate(rule.id)
  }

  const handleEditRule = (rule: ProxyRule) => {
    router.push(`/proxy-rules/${rule.id}/edit`)
  }

  const handleDeleteRule = (rule: ProxyRule) => {
    setRuleToDelete(rule)
  }

  const confirmDeleteRule = () => {
    if (ruleToDelete) {
      deleteRuleMutation.mutate(ruleToDelete.id)
    }
  }

  const handleCreateProxyRule = () => {
    router.push('/proxy-rules/new')
  }

  if (!auth) return null

  const breadcrumbs = domainFilter
    ? [
        { label: 'Domínios', href: '/domains' },
        { label: 'Proxy Reverso', current: true }
      ]
    : [
        { label: 'Proxy Reverso', current: true }
      ]

  if (isLoading) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <PageLoading />
      </MainLayout>
    )
  }

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Proxy Reverso</h1>
            <p className="text-muted-foreground">
              {domainFilter
                ? 'Regras de proxy para o domínio selecionado'
                : 'Configure regras de proxy reverso para seus domínios'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleCreateProxyRule}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
            <Button
              variant="outline"
              onClick={handleDiscardChanges}
              disabled={discardChangesMutation.isPending}
              className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
            >
              {discardChangesMutation.isPending ? 'Descartando...' : 'Descartar Modificações'}
            </Button>
            <Button
              onClick={handleApplyConfiguration}
              disabled={applyConfigurationMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {applyConfigurationMutation.isPending ? 'Aplicando...' : 'Aplicar Configuração'}
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar regras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Origem</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Destino</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Domínio</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Prioridade</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {proxyRules && proxyRules.length > 0 ? (
                    proxyRules.map((rule) => (
                      <tr key={rule.id} className={`border-b border-border hover:bg-muted/50 ${
                        rule.isLocked ? 'bg-gray-50 opacity-60' : ''
                      }`}>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              rule.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
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
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleLock(rule)}
                              disabled={toggleLockMutation.isPending}
                              title={rule.isLocked ? 'Travado (clique para destravar)' : 'Destravado (clique para travar)'}
                            >
                              {rule.isLocked ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </Button>

                            {!rule.isLocked && (
                              <>
                                {rule.isActive ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleProxyRule(rule)}
                                    disabled={toggleProxyRuleMutation.isPending}
                                    title="Desativar regra"
                                  >
                                    <Square className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleToggleProxyRule(rule)}
                                    disabled={toggleProxyRuleMutation.isPending}
                                    title="Ativar regra"
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditRule(rule)}
                                  title="Editar regra"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteRule(rule)}
                                  disabled={deleteRuleMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                  title="Excluir regra"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        Nenhuma regra de proxy encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!ruleToDelete}
          onClose={() => setRuleToDelete(null)}
          onConfirm={confirmDeleteRule}
          title="Confirmar Exclusão"
          subtitle="Esta ação não pode ser desfeita."
          itemName={ruleToDelete?.sourcePath || ''}
          consequences={[
            'Remover permanentemente a regra de proxy',
            'Interromper o redirecionamento configurado',
            'Afetar o acesso aos recursos protegidos'
          ]}
          confirmText="Excluir Regra"
          isLoading={deleteRuleMutation.isPending}
        />

      </div>
    </MainLayout>
  )
}