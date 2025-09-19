'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Globe, CheckCircle, XCircle, Settings, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
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
      toast.success('Domínio excluído com sucesso!')
      setDomainToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir domínio')
    },
  })

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

  const confirmDeleteDomain = () => {
    if (domainToDelete) {
      deleteDomainMutation.mutate(domainToDelete.id)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Domínios</h1>
            <p className="text-muted-foreground">
              Gerencie seus domínios e configurações
            </p>
          </div>
          <button
            onClick={handleCreateDomain}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Domínio
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar domínios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full max-w-md"
          />
        </div>

        {/* Domains Table */}
        <div className="card">
          <div className="card-content p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Domínio</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Auto TLS</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Rotas</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Criado em</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {domains && domains.length > 0 ? (
                    domains.map((domain) => (
                      <tr key={domain.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-400" />
                            <span className="font-medium">{domain.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {domain.description || '-'}
                        </td>
                        <td className="py-3 px-6">
                          {domain.autoTls ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                        </td>
                        <td className="py-3 px-6">
                          <span className={getStatusBadge(domain.isActive ? 'active' : 'inactive')}>
                            {domain.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {(domain.proxyRules?.length || 0) + (domain.redirects?.length || 0)}
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {formatDate(domain.createdAt)}
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditDomain(domain.id)}
                              className="btn-ghost btn-sm text-blue-500 hover:text-blue-600"
                              title="Editar domínio"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDomain(domain)}
                              className="btn-ghost btn-sm text-red-500 hover:text-red-600"
                              title="Excluir domínio"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        Nenhum domínio encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

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

      </div>
    </MainLayout>
  )
}