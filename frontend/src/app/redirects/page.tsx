'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, RotateCcw, ArrowRight, Edit3, Trash2, ExternalLink, Lock, Unlock } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRequireAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'
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

  const toggleLockMutation = useMutation({
    mutationFn: async (redirect: Redirect) => {
      const response = await api.patch(`/redirects/${redirect.id}`, {
        sourcePattern: redirect.sourcePattern,
        targetUrl: redirect.targetUrl,
        type: redirect.type,
        priority: redirect.priority,
        isActive: redirect.isActive,
        isLocked: !redirect.isLocked,
        description: redirect.description,
        domainId: redirect.domainId,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] })
      toast.success('Status do travamento atualizado!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar travamento')
    },
  })

  const handleCreateRedirect = () => {
    router.push('/redirects/new')
  }

  const handleDelete = (redirect: Redirect) => {
    setRedirectToDelete(redirect)
  }

  const handleToggleLock = (redirect: Redirect) => {
    toggleLockMutation.mutate(redirect)
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
        { label: 'Redirecionamentos', current: true, icon: RotateCcw }
      ]
    : [
        { label: 'Redirecionamentos', current: true, icon: RotateCcw }
      ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar redirecionamentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Redirects List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Redirecionamentos Configurados</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRedirects.length === 0 ? (
              <div className="text-center py-12">
                <RotateCcw className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum redirecionamento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro redirecionamento para começar a gerenciar.
                </p>
                <Button onClick={handleCreateRedirect}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Redirecionamento
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRedirects.map((redirect) => (
                  <div key={redirect.id} className={`border rounded-lg p-4 hover:bg-muted/25 transition-colors ${
                    redirect.isLocked ? 'bg-muted/30 opacity-70' : ''
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                              {redirect.sourcePattern}
                            </code>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={redirect.targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-1"
                            >
                              {redirect.targetUrl}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <Badge variant={redirect.isActive ? "default" : "secondary"}>
                            {redirect.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant={redirect.type === 'permanent' ? "default" : "outline"}>
                            {redirect.type === 'permanent' ? '301 Permanente' : '302 Temporário'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <strong>Domínio:</strong> {redirect.domain.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <strong>Prioridade:</strong> {redirect.priority}
                          </span>
                          <span className="flex items-center gap-1">
                            <strong>Criado:</strong> {formatDate(redirect.createdAt)}
                          </span>
                        </div>

                        {redirect.description && (
                          <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            {redirect.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {!redirect.isLocked && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/redirects/${redirect.id}/edit`)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(redirect)}
                              disabled={deleteMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleLock(redirect)}
                          disabled={toggleLockMutation.isPending}
                          title={redirect.isLocked ? 'Travado (clique para destravar)' : 'Destravado (clique para travar)'}
                        >
                          {redirect.isLocked ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50 group">
          {/* Tooltip/Label */}
          <button
            onClick={handleCreateRedirect}
            className="bg-white dark:bg-gray-800 text-foreground px-4 py-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium border border-border"
          >
            Novo Redirecionamento
          </button>

          {/* FAB Button */}
          <button
            onClick={handleCreateRedirect}
            className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-110 flex items-center justify-center"
            title="Novo Redirecionamento"
          >
            <Plus className="h-6 w-6 transition-transform duration-200 ease-in-out group-hover:rotate-180" />
          </button>
        </div>
      </div>
    </MainLayout>
  )
}