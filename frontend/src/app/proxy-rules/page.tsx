'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Search, Play, Pause, Plus, Edit, Trash2, Lock, Unlock, Square } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { EmptyState } from '@/components/ui/empty-state'
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
        isLocked: rule.isLocked,
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
    mutationFn: async (rule: ProxyRule) => {
      const response = await api.patch(`/proxy-rules/${rule.id}`, {
        sourcePath: rule.sourcePath,
        targetUrl: rule.targetUrl,
        priority: rule.priority,
        isActive: rule.isActive,
        isLocked: !rule.isLocked,
        maintainQueryStrings: rule.maintainQueryStrings,
        description: rule.description,
        domainId: rule.domainId,
      })
      return response.data
    },
    onSuccess: () => {
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
    toggleLockMutation.mutate(rule)
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
        { label: 'Proxy Reverso', current: true, icon: ArrowRight }
      ]
    : [
        { label: 'Proxy Reverso', current: true, icon: ArrowRight }
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
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar regras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleDiscardChanges}
            disabled={discardChangesMutation.isPending}
            className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
          >
            {discardChangesMutation.isPending ? 'Descartando...' : 'Descartar'}
          </Button>
          <Button
            onClick={handleApplyConfiguration}
            disabled={applyConfigurationMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {applyConfigurationMutation.isPending ? 'Aplicando...' : 'Aplicar'}
          </Button>
        </div>

        {/* Proxy Rules Table or Empty State */}
        {proxyRules && proxyRules.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Origem</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Destino</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Domínio</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Prioridade</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proxyRules.map((rule) => (
                      <tr key={rule.id} className={`border-b border-border hover:bg-muted/50 ${
                        rule.isLocked ? 'bg-muted/30 opacity-70' : ''
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
                          <div className="flex items-center justify-end gap-1">
                            <div className="flex items-center gap-1">
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={ArrowRight}
            title="Nenhuma regra de proxy encontrada"
            description="Configure regras de proxy reverso para direcionar o tráfego de seus domínios."
            actionLabel="Nova Regra"
            onAction={handleCreateProxyRule}
          />
        )}

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

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50 group">
          {/* Tooltip/Label */}
          <button
            onClick={handleCreateProxyRule}
            className="bg-white dark:bg-gray-800 text-foreground px-4 py-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium border border-border"
          >
            Nova Regra
          </button>

          {/* FAB Button */}
          <button
            onClick={handleCreateProxyRule}
            className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-110 flex items-center justify-center"
            title="Nova Regra"
          >
            <Plus className="h-6 w-6 transition-transform duration-200 ease-in-out group-hover:rotate-180" />
          </button>
        </div>

      </div>
    </MainLayout>
  )
}