'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Globe, CheckCircle, XCircle, Settings, Trash2, Eye, Play, Square, RotateCcw, Shield, ShieldX, Network, ExternalLink, Lock, Unlock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
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
import { Domain } from '@/types'

export default function DomainsPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null)

  const { data: domains, isLoading } = useQuery<Domain[]>({
    queryKey: ['domains', search],
    queryFn: () => api.get(`/domains?search=${search}`).then(res => res.data),
    enabled: !!auth,
  })

  const deleteDomainMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/domains/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast({
        title: 'Sucesso',
        description: 'Domínio excluído com sucesso!',
      })
      setDomainToDelete(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao excluir domínio',
        variant: 'destructive',
      })
    },
  })

  const toggleDomainMutation = useMutation({
    mutationFn: ({ domain, isActive }: { domain: Domain; isActive: boolean }) =>
      api.patch(`/domains/${domain.id}`, {
        name: domain.name,
        description: domain.description,
        isActive,
        isLocked: domain.isLocked,
        autoTls: domain.autoTls,
        forceHttps: domain.forceHttps,
        blockExternalAccess: domain.blockExternalAccess,
        enableWwwRedirect: domain.enableWwwRedirect,
        bindIp: domain.bindIp,
        projectId: domain.projectId,
      }),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast({
        title: 'Sucesso',
        description: `Domínio ${isActive ? 'ativado' : 'desativado'} com sucesso!`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao alterar status do domínio',
        variant: 'destructive',
      })
    },
  })

  const toggleLockMutation = useMutation({
    mutationFn: async (domain: Domain) => {
      const response = await api.patch(`/domains/${domain.id}/toggle-lock`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast({
        title: 'Sucesso',
        description: 'Status do travamento atualizado!',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao atualizar travamento',
        variant: 'destructive',
      })
    },
  })

  const restartDomainMutation = useMutation({
    mutationFn: (id: string) => api.post(`/domains/${id}/restart`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast({
        title: 'Sucesso',
        description: 'Domínio reiniciado com sucesso!',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao reiniciar domínio',
        variant: 'destructive',
      })
    },
  })

  const getSSLIcon = (domain: Domain) => {
    if (!domain.sslCertificates || domain.sslCertificates.length === 0) {
      return <Shield className="h-4 w-4" />
    }

    const hasValidCert = domain.sslCertificates.some(cert => cert.status === 'valid')
    const hasExpiredCert = domain.sslCertificates.some(cert => cert.status === 'expired')

    if (hasValidCert) {
      return <Shield className="h-4 w-4" />
    } else if (hasExpiredCert) {
      return <ShieldX className="h-4 w-4" />
    } else {
      return <Shield className="h-4 w-4" />
    }
  }

  if (!auth) return null

  if (isLoading) {
    return (
      <MainLayout>
        <PageLoading />
      </MainLayout>
    )
  }

  const handleCreateDomain = () => {
    router.push('/domains/new')
  }

  const handleEditDomain = (domainId: string) => {
    router.push(`/domains/${domainId}/edit`)
  }

  const handleDeleteDomain = (domain: Domain) => {
    setDomainToDelete(domain)
  }

  const handleToggleDomain = (domain: Domain) => {
    toggleDomainMutation.mutate({ domain, isActive: !domain.isActive })
  }

  const handleToggleLock = (domain: Domain) => {
    toggleLockMutation.mutate(domain)
  }

  const handleRestartDomain = (domain: Domain) => {
    restartDomainMutation.mutate(domain.id)
  }

  const handleViewDomain = (domainId: string) => {
    router.push(`/domains/${domainId}`)
  }

  const handleProxyRules = (domainId: string) => {
    router.push(`/domains/${domainId}/proxy-rules`)
  }

  const handleRedirects = (domainId: string) => {
    router.push(`/domains/${domainId}/redirects`)
  }

  const handleSSLCertificates = (domainId: string) => {
    router.push(`/domains/${domainId}/ssl-certificates`)
  }

  const confirmDeleteDomain = () => {
    if (domainToDelete) {
      deleteDomainMutation.mutate(domainToDelete.id)
    }
  }

  const breadcrumbs = [
    { label: 'Domínios', current: true, icon: Globe }
  ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar domínios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Domains Table or Empty State */}
        {domains && domains.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-3 md:px-6 text-sm font-medium text-muted-foreground">Domínio</th>
                      <th className="text-left py-3 px-3 md:px-6 text-sm font-medium text-muted-foreground hidden sm:table-cell">Auto TLS</th>
                      <th className="text-left py-3 px-3 md:px-6 text-sm font-medium text-muted-foreground hidden md:table-cell">Rotas</th>
                      <th className="text-right py-3 px-3 md:px-6 text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domains.map((domain) => (
                      <tr key={domain.id} className={`border-b border-border hover:bg-muted/50 ${
                        domain.isLocked ? 'bg-muted/30 opacity-70' : ''
                      }`}>
                        <td className="py-3 px-3 md:px-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              domain.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="font-medium text-sm md:text-base">{domain.name}</span>
                              <div className="flex items-center gap-2 sm:hidden">
                                {domain.autoTls ? (
                                  <CheckCircle className="h-3 w-3 text-green-400" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-400" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {(domain.proxyRules?.length || 0) + (domain.redirects?.length || 0)} rotas
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(`https://${domain.name}`, '_blank')}
                                className="h-5 w-5 p-0 sm:h-6 sm:w-6"
                                title={`Acessar ${domain.name}`}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 md:px-6 hidden sm:table-cell">
                          {domain.autoTls ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                        </td>
                        <td className="py-3 px-3 md:px-6 text-muted-foreground hidden md:table-cell">
                          {(domain.proxyRules?.length || 0) + (domain.redirects?.length || 0)}
                        </td>
                        <td className="py-3 px-3 md:px-6">
                          <div className="flex items-center justify-end gap-0.5 md:gap-1">
                            {!domain.isLocked && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleDomain(domain)}
                                  disabled={toggleDomainMutation.isPending}
                                  className="h-8 w-8 md:h-9 md:w-9 p-0"
                                  title={domain.isActive ? 'Parar domínio' : 'Iniciar domínio'}
                                >
                                  {domain.isActive ? <Square className="h-3 w-3 md:h-4 md:w-4" /> : <Play className="h-3 w-3 md:h-4 md:w-4" />}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRestartDomain(domain)}
                                  disabled={restartDomainMutation.isPending}
                                  className="h-8 w-8 md:h-9 md:w-9 p-0"
                                  title="Reiniciar domínio"
                                >
                                  <RotateCcw className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDomain(domain.id)}
                                  className="h-8 w-8 md:h-9 md:w-9 p-0"
                                  title="Ver detalhes do domínio"
                                >
                                  <Eye className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditDomain(domain.id)}
                                  className="h-8 w-8 md:h-9 md:w-9 p-0"
                                  title="Editar domínio"
                                >
                                  <Settings className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteDomain(domain)}
                                  className="text-red-600 hover:text-red-700 h-8 w-8 md:h-9 md:w-9 p-0"
                                  title="Excluir domínio"
                                >
                                  <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleLock(domain)}
                              disabled={toggleLockMutation.isPending}
                              className="h-8 w-8 md:h-9 md:w-9 p-0"
                              title={domain.isLocked ? 'Travado (clique para destravar)' : 'Destravado (clique para travar)'}
                            >
                              {domain.isLocked ? (
                                <Lock className="h-3 w-3 md:h-4 md:w-4" />
                              ) : (
                                <Unlock className="h-3 w-3 md:h-4 md:w-4" />
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
            icon={Globe}
            title="Nenhum domínio encontrado"
            description="Adicione seu primeiro domínio para começar a configurar seus serviços web."
            actionLabel="Adicionar Domínio"
            onAction={handleCreateDomain}
          />
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!domainToDelete}
          onClose={() => setDomainToDelete(null)}
          onConfirm={confirmDeleteDomain}
          title="Confirmar Exclusão"
          subtitle="Esta ação não pode ser desfeita."
          itemName={domainToDelete?.name || ''}
          consequences={[
            'Remover permanentemente o domínio',
            'Excluir todas as regras de proxy associadas',
            'Remover certificados SSL relacionados',
            'Apagar regras de redirecionamento'
          ]}
          confirmText="Excluir Domínio"
          isLoading={deleteDomainMutation.isPending}
        />

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50 group">
          {/* Tooltip/Label */}
          <button
            onClick={handleCreateDomain}
            className="bg-white dark:bg-gray-800 text-foreground px-4 py-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium border border-border"
          >
            Adicionar Domínio
          </button>

          {/* FAB Button */}
          <button
            onClick={handleCreateDomain}
            className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-110 flex items-center justify-center"
            title="Adicionar Domínio"
          >
            <Plus className="h-6 w-6 transition-transform duration-200 ease-in-out group-hover:rotate-180" />
          </button>
        </div>

      </div>
    </MainLayout>
  )
}