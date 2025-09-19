'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Server, Shield, Globe, Lock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { api } from '@/lib/api'
import { useRequireAuth } from '@/hooks/useAuth'

interface UpdateDomainData {
  name: string
  description?: string
  isActive: boolean
  autoTls: boolean
  forceHttps: boolean
  blockExternalAccess: boolean
  enableWwwRedirect: boolean
  bindIp?: string
}

export default function EditDomainPage() {
  useRequireAuth()
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const domainId = params.id as string

  const [formData, setFormData] = useState<UpdateDomainData>({
    name: '',
    description: '',
    isActive: true,
    autoTls: true,
    forceHttps: true,
    blockExternalAccess: false,
    enableWwwRedirect: false,
    bindIp: '',
  })

  const { data: domain, isLoading } = useQuery({
    queryKey: ['domain', domainId],
    queryFn: () => api.get(`/domains/${domainId}`).then(res => res.data),
    enabled: !!domainId,
  })

  useEffect(() => {
    if (domain) {
      setFormData({
        name: domain.name || '',
        description: domain.description || '',
        isActive: domain.isActive ?? true,
        autoTls: domain.autoTls ?? true,
        forceHttps: domain.forceHttps ?? true,
        blockExternalAccess: domain.blockExternalAccess ?? false,
        enableWwwRedirect: domain.enableWwwRedirect ?? false,
        bindIp: domain.bindIp || '',
      })
    }
  }, [domain])

  const updateDomainMutation = useMutation({
    mutationFn: (data: UpdateDomainData) => api.patch(`/domains/${domainId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      queryClient.invalidateQueries({ queryKey: ['domain', domainId] })
      toast.success('Domínio atualizado com sucesso!')
      router.push('/domains')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar domínio')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Nome do domínio é obrigatório')
      return
    }
    updateDomainMutation.mutate(formData)
  }

  const handleBack = () => {
    router.push('/domains')
  }

  if (isLoading) {
    return (
      <MainLayout>
        <PageLoading />
      </MainLayout>
    )
  }

  if (!domain) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground">Domínio não encontrado</h2>
          <p className="text-muted-foreground mt-2">O domínio solicitado não foi encontrado.</p>
          <button
            onClick={handleBack}
            className="btn-primary mt-4"
          >
            Voltar para Domínios
          </button>
        </div>
      </MainLayout>
    )
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
                Editar Domínio
              </h1>
              <p className="text-muted-foreground">
                Edite as configurações do domínio {domain.name}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center space-x-2 mb-6">
                <Server className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Informações Básicas
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Nome do Domínio <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="exemplo.com"
                    className="input w-full"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Nome do domínio (ex: exemplo.com, www.exemplo.com)
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                    Descrição
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do domínio e sua finalidade..."
                    rows={3}
                    className="input w-full resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Descrição opcional para identificar o domínio
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Configurações de Ativação */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center space-x-2 mb-6">
                <Globe className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Configurações de Ativação
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
                      Ativar Domínio
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Quando ativo, o domínio ficará disponível para receber tráfego e configurar redirects
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    id="autoTls"
                    type="checkbox"
                    checked={formData.autoTls}
                    onChange={(e) => setFormData({ ...formData, autoTls: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      SSL Automático (Let&apos;s Encrypt)
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Gerar e renovar automaticamente certificados SSL gratuitos via Let&apos;s Encrypt
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Configurações de Segurança */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Configurações de Segurança
                </h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    id="forceHttps"
                    type="checkbox"
                    checked={formData.forceHttps}
                    onChange={(e) => setFormData({ ...formData, forceHttps: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      Forçar HTTPS (Redirecionamento HTTP → HTTPS)
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Redireciona automaticamente todo tráfego HTTP para HTTPS (recomendado)
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    id="blockExternalAccess"
                    type="checkbox"
                    checked={formData.blockExternalAccess}
                    onChange={(e) => setFormData({ ...formData, blockExternalAccess: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      Bloquear Acesso Externo Direto
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Impede acesso direto às portas da aplicação (ex: localhost:8484) de IPs externos
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Redirecionamento WWW */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center space-x-2 mb-6">
                <Lock className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Redirecionamento WWW
                </h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    id="enableWwwRedirect"
                    type="checkbox"
                    checked={formData.enableWwwRedirect}
                    onChange={(e) => setFormData({ ...formData, enableWwwRedirect: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      Ativar Redirecionamento WWW
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Redireciona entre www.dominio.com e dominio.com
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
              disabled={updateDomainMutation.isPending}
              className="btn-primary"
            >
              {updateDomainMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}