'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Search, RefreshCw, CheckCircle, AlertTriangle, XCircle, Trash2, Lock, Unlock } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useRequireAuth } from '@/hooks/useAuth'
import { formatDate, getStatusBadge, formatRelativeTime } from '@/lib/utils'
import api from '@/lib/api'
import { SslCertificate } from '@/types'

export default function SslCertificatesPage() {
  const auth = useRequireAuth()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const [certificateToDelete, setCertificateToDelete] = useState<SslCertificate | null>(null)
  const [certificateToRenew, setCertificateToRenew] = useState<SslCertificate | null>(null)
  const [showRenewExpiredModal, setShowRenewExpiredModal] = useState(false)

  // Get domain filter from URL
  const domainFilter = searchParams.get('domain')

  const { data: allCertificates, isLoading } = useQuery<SslCertificate[]>({
    queryKey: ['ssl-certificates', search],
    queryFn: () => api.get('/ssl-certificates').then(res => res.data),
    enabled: !!auth,
  })

  // Filter by domain if specified
  const certificates = domainFilter
    ? allCertificates?.filter(cert => cert.domainId === domainFilter)
    : allCertificates

  // Mutation para renovar certificado individual
  const renewCertificateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ssl-certificates/${id}/renew`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ssl-certificates'] })
      toast.success('Certificado renovado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao renovar certificado')
    },
  })

  // Mutation para renovar certificados expirados
  const renewExpiredMutation = useMutation({
    mutationFn: () => api.post('/ssl-certificates/renew-expired'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ssl-certificates'] })
      toast.success('Certificados expirados renovados com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao renovar certificados')
    },
  })

  // Mutation para excluir certificado
  const deleteCertificateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ssl-certificates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ssl-certificates'] })
      toast.success('Certificado excluído com sucesso!')
      setCertificateToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir certificado')
    },
  })

  // Mutation para travar/destravar certificado
  const toggleLockMutation = useMutation({
    mutationFn: async (certificate: SslCertificate) => {
      const response = await api.post(`/ssl-certificates/${certificate.id}/toggle-lock`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ssl-certificates'] })
      toast.success('Status do travamento atualizado!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar travamento')
    },
  })

  const handleRenewCertificate = (certificate: SslCertificate) => {
    setCertificateToRenew(certificate)
  }

  const handleRenewExpired = () => {
    setShowRenewExpiredModal(true)
  }

  const confirmRenewCertificate = () => {
    if (certificateToRenew) {
      renewCertificateMutation.mutate(certificateToRenew.id)
      setCertificateToRenew(null)
    }
  }

  const confirmRenewExpired = () => {
    renewExpiredMutation.mutate()
    setShowRenewExpiredModal(false)
  }

  const handleDeleteCertificate = (certificate: SslCertificate) => {
    setCertificateToDelete(certificate)
  }

  const handleToggleLock = (certificate: SslCertificate) => {
    toggleLockMutation.mutate(certificate)
  }

  const confirmDeleteCertificate = () => {
    if (certificateToDelete) {
      deleteCertificateMutation.mutate(certificateToDelete.id)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'expiring':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case 'expired':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />
    }
  }

  const breadcrumbs = domainFilter
    ? [
        { label: 'Domínios', href: '/domains' },
        { label: 'Certificados SSL', current: true, icon: Shield }
      ]
    : [
        { label: 'Certificados SSL', current: true, icon: Shield }
      ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar certificados..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* SSL Certificates Table or Empty State */}
        {certificates && certificates.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Domínio Principal</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Expira em</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Auto Renovação</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((cert) => (
                      <tr key={cert.id} className={`border-b border-border hover:bg-muted/50 ${
                        cert.isLocked ? 'bg-muted/30 opacity-70' : ''
                      }`}>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${
                              cert.status === 'valid' ? 'bg-green-500' :
                              cert.status === 'expiring' ? 'bg-yellow-500' :
                              cert.status === 'expired' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`} />
                            <div>
                              <div className="font-medium text-foreground">{cert.primaryDomain}</div>
                              {cert.sanDomains && cert.sanDomains.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  +{cert.sanDomains.length} domínio{cert.sanDomains.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {cert.expiresAt ? formatRelativeTime(cert.expiresAt) : '-'}
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            {cert.autoRenew ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-muted-foreground">Ativo</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-muted-foreground">Desativo</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center justify-end gap-1">
                            {!cert.isLocked && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRenewCertificate(cert)}
                                  disabled={renewCertificateMutation.isPending}
                                  title="Renovar certificado"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteCertificate(cert)}
                                  disabled={deleteCertificateMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                  title="Excluir certificado"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleLock(cert)}
                              disabled={toggleLockMutation.isPending}
                              title={cert.isLocked ? 'Travado (clique para destravar)' : 'Destravado (clique para travar)'}
                            >
                              {cert.isLocked ? (
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
            icon={Shield}
            title="Nenhum certificado SSL encontrado"
            description="Configure certificados SSL para seus domínios para garantir conexões seguras HTTPS."
            actionLabel="Renovar Expirados"
            onAction={handleRenewExpired}
          />
        )}

        {/* Confirmation Modals */}
        <ConfirmationModal
          isOpen={!!certificateToDelete}
          onClose={() => setCertificateToDelete(null)}
          onConfirm={confirmDeleteCertificate}
          title="Confirmar Exclusão"
          subtitle="Esta ação não pode ser desfeita."
          itemName={`Certificado SSL para ${certificateToDelete?.primaryDomain}`}
          consequences={[
            'Remover permanentemente o certificado SSL',
            'Desabilitar HTTPS para este domínio',
            'Exigir nova configuração de certificado se necessário'
          ]}
          confirmText="Excluir Certificado"
          isLoading={deleteCertificateMutation.isPending}
        />

        <ConfirmationModal
          isOpen={!!certificateToRenew}
          onClose={() => setCertificateToRenew(null)}
          onConfirm={confirmRenewCertificate}
          title="Confirmar Renovação"
          subtitle="O certificado será renovado automaticamente."
          itemName={`Certificado SSL para ${certificateToRenew?.primaryDomain}`}
          consequences={[
            'Solicitar novo certificado SSL via Let\'s Encrypt',
            'Atualizar automaticamente as configurações do servidor',
            'Manter o domínio online durante o processo'
          ]}
          isLoading={renewCertificateMutation.isPending}
          confirmText="Renovar"
        />

        <ConfirmationModal
          isOpen={showRenewExpiredModal}
          onClose={() => setShowRenewExpiredModal(false)}
          onConfirm={confirmRenewExpired}
          title="Confirmar Renovação em Massa"
          subtitle="Todos os certificados expirados serão renovados automaticamente."
          itemName="Certificados SSL expirados"
          consequences={[
            'Identificar todos os certificados expirados',
            'Solicitar novos certificados via Let\'s Encrypt',
            'Atualizar configurações automaticamente',
            'Processo pode levar alguns minutos'
          ]}
          isLoading={renewExpiredMutation.isPending}
          confirmText="Renovar Todos"
        />

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50 group">
          {/* Tooltip/Label */}
          <button
            onClick={handleRenewExpired}
            className="bg-white dark:bg-gray-800 text-foreground px-4 py-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium border border-border"
          >
            Renovar Expirados
          </button>

          {/* FAB Button */}
          <button
            onClick={handleRenewExpired}
            disabled={renewExpiredMutation.isPending}
            className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-110 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            title="Renovar Certificados Expirados"
          >
            <RefreshCw className={`h-6 w-6 transition-transform duration-200 ease-in-out ${renewExpiredMutation.isPending ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          </button>
        </div>
      </div>
    </MainLayout>
  )
}