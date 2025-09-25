'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Search, RefreshCw, CheckCircle, AlertTriangle, XCircle, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useRequireAuth } from '@/hooks/useAuth'
import { formatDate, getStatusBadge, formatRelativeTime } from '@/lib/utils'
import api from '@/lib/api'
import { SslCertificate } from '@/types'

export default function SslCertificatesPage() {
  const auth = useRequireAuth()
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const [certificateToDelete, setCertificateToDelete] = useState<SslCertificate | null>(null)

  const { data: certificates, isLoading } = useQuery<SslCertificate[]>({
    queryKey: ['ssl-certificates', search],
    queryFn: () => api.get('/ssl-certificates').then(res => res.data),
    enabled: !!auth,
  })

  const { data: stats } = useQuery({
    queryKey: ['ssl-certificates-stats'],
    queryFn: () => api.get('/ssl-certificates/stats').then(res => res.data),
    enabled: !!auth,
  })

  // Mutation para renovar certificado individual
  const renewCertificateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ssl-certificates/${id}/renew`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ssl-certificates'] })
      queryClient.invalidateQueries({ queryKey: ['ssl-certificates-stats'] })
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
      queryClient.invalidateQueries({ queryKey: ['ssl-certificates-stats'] })
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
      queryClient.invalidateQueries({ queryKey: ['ssl-certificates-stats'] })
      toast.success('Certificado excluído com sucesso!')
      setCertificateToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir certificado')
    },
  })

  const handleRenewCertificate = (certificateId: string) => {
    renewCertificateMutation.mutate(certificateId)
  }

  const handleRenewExpired = () => {
    renewExpiredMutation.mutate()
  }

  const handleDeleteCertificate = (certificate: SslCertificate) => {
    setCertificateToDelete(certificate)
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

  const breadcrumbs = [
    { label: 'Certificados SSL', current: true }
  ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Certificados SSL</h1>
            <p className="text-muted-foreground">
              Gerencie certificados SSL e renovações automáticas
            </p>
          </div>
          <Button
            onClick={handleRenewExpired}
            disabled={renewExpiredMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {renewExpiredMutation.isPending ? 'Renovando...' : 'Renovar Expirados'}
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Válidos</p>
                    <p className="text-2xl font-bold text-green-500">{stats.valid}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expirando</p>
                    <p className="text-2xl font-bold text-orange-500">{stats.expiring}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expirados</p>
                    <p className="text-2xl font-bold text-red-500">{stats.expired}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Domínio Principal</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Expira em</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Auto Renovação</th>
                    <th className="text-left py-3 px-6 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates && certificates.length > 0 ? (
                    certificates.map((cert) => (
                      <tr key={cert.id} className="border-b border-border hover:bg-muted/50">
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRenewCertificate(cert.id)}
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
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-muted-foreground">
                        Nenhum certificado encontrado
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
      </div>
    </MainLayout>
  )
}