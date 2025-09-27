'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, RotateCcw, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { useRequireAuth } from '@/hooks/useAuth'
import { formatDate, getStatusBadge } from '@/lib/utils'
import api from '@/lib/api'
import { Redirect, Domain } from '@/types'

export default function RedirectsPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const [redirectToDelete, setRedirectToDelete] = useState<Redirect | null>(null)

  // Get domain filter from URL
  const domainFilter = searchParams.get('domain')

  const { data: allRedirects, isLoading: redirectsLoading } = useQuery<Redirect[]>({
    queryKey: ['redirects', search],
    queryFn: () => api.get(`/redirects?search=${search}`).then(res => res.data),
    enabled: !!auth,
  })

  // Filter by domain if specified
  const redirects = domainFilter
    ? allRedirects?.filter(redirect => redirect.domainId === domainFilter)
    : allRedirects

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/redirects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] })
      toast.success('Redirecionamento removido com sucesso!')
      setRedirectToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover redirecionamento')
    },
  })

  const handleCreateRedirect = () => {
    router.push('/redirects/new')
  }

  const handleDelete = (redirect: Redirect) => {
    setRedirectToDelete(redirect)
  }

  const confirmDeleteRedirect = () => {
    if (redirectToDelete) {
      deleteMutation.mutate(redirectToDelete.id)
    }
  }

  if (!auth) return null

  if (redirectsLoading) {
    return (
      <MainLayout>
        <PageLoading />
      </MainLayout>
    )
  }

  const filteredRedirects = redirects?.filter(redirect =>
    redirect.sourcePattern.toLowerCase().includes(search.toLowerCase()) ||
    redirect.targetUrl.toLowerCase().includes(search.toLowerCase()) ||
    redirect.domain.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  const breadcrumbs = domainFilter
    ? [
        { label: 'Domínios', href: '/domains' },
        { label: 'Redirecionamentos', current: true }
      ]
    : [
        { label: 'Redirecionamentos', current: true }
      ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Redirecionamentos</h1>
            <p className="text-muted-foreground">
              {domainFilter
                ? 'Redirecionamentos para o domínio selecionado'
                : 'Configure redirecionamentos para seus domínios'
              }
            </p>
          </div>
          <button
            onClick={handleCreateRedirect}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Redirecionamento
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar redirecionamentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Redirects List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Redirecionamentos Configurados</h3>
            <p className="card-description">
              {filteredRedirects.length} redirecionamento(s) encontrado(s)
            </p>
          </div>
          <div className="card-content">
            {filteredRedirects.length === 0 ? (
              <div className="text-center py-12">
                <RotateCcw className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Nenhum redirecionamento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro redirecionamento para começar a gerenciar.
                </p>
                <button
                  onClick={handleCreateRedirect}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Redirecionamento
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRedirects.map((redirect) => (
                  <div key={redirect.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-foreground">
                            {redirect.sourcePattern}
                          </h4>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {redirect.targetUrl}
                          </span>
                          <span className={getStatusBadge(redirect.isActive ? 'active' : 'inactive')}>
                            {redirect.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                          <span className={`status-badge ${redirect.type === 'permanent' ? 'status-badge-success' : 'status-badge-warning'}`}>
                            {redirect.type === 'permanent' ? '301' : '302'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Domínio: {redirect.domain.name}</span>
                          <span>Prioridade: {redirect.priority}</span>
                          <span>Criado: {formatDate(redirect.createdAt)}</span>
                        </div>
                        {redirect.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {redirect.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(redirect)}
                          className="btn-secondary text-red-600 hover:text-red-700"
                          disabled={deleteMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!redirectToDelete}
          onClose={() => setRedirectToDelete(null)}
          onConfirm={confirmDeleteRedirect}
          title="Confirmar Exclusão"
          subtitle="Esta ação não pode ser desfeita."
          itemName={redirectToDelete ? `${redirectToDelete.sourcePattern} → ${redirectToDelete.targetUrl}` : ''}
          consequences={[
            'Remover permanentemente o redirecionamento',
            'Parar redirecionamento do padrão especificado',
            'Afetar tráfego direcionado para esta regra'
          ]}
          confirmText="Excluir Redirecionamento"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </MainLayout>
  )
}