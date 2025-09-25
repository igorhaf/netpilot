'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Server, Route, Target, Hash, Container } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { api } from '@/lib/api'
import { DockerApiService } from '@/lib/docker-api'
import { useRequireAuth } from '@/hooks/useAuth'
import { Domain } from '@/types'

interface CreateProxyRuleData {
  sourcePath: string
  targetUrl: string
  priority: number
  isActive: boolean
  maintainQueryStrings: boolean
  description?: string
  domainId: string
}

export default function NewProxyRulePage() {
  useRequireAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<CreateProxyRuleData>({
    sourcePath: '',
    targetUrl: '',
    priority: 100,
    isActive: true,
    maintainQueryStrings: true,
    description: '',
    domainId: '',
  })

  const [selectedContainer, setSelectedContainer] = useState('')
  const [selectedPort, setSelectedPort] = useState('')
  const [availablePorts, setAvailablePorts] = useState<any[]>([])
  const [selectedContainerName, setSelectedContainerName] = useState('')

  const { data: domains, isLoading: domainsLoading } = useQuery<Domain[]>({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(res => res.data),
  })

  const { data: containersResponse, isLoading: containersLoading } = useQuery({
    queryKey: ['docker', 'containers'],
    queryFn: () => DockerApiService.listContainers(),
  })

  // Função para extrair nome limpo do container
  const getContainerName = (container: any) => {
    return container.names[0].replace('/', '')
  }

  // Effect para atualizar as portas quando um container for selecionado
  useEffect(() => {
    if (selectedContainer && containersResponse?.data) {
      const container = containersResponse.data.find((c: any) => c.id === selectedContainer)
      if (container) {
        const containerName = getContainerName(container)
        setSelectedContainerName(containerName)

        // Para rede interna Docker, sempre temos as portas expostas pelo container
        // Mesmo que não estejam mapeadas para o host, estão disponíveis na rede interna
        const internalPorts = container.ports || []

        // Se não há portas definidas, assume algumas comuns baseado na imagem
        if (internalPorts.length === 0) {
          // Detecta portas comuns baseado na imagem
          const commonPorts = getCommonPortsFromImage(container.image)
          setAvailablePorts(commonPorts)
        } else {
          setAvailablePorts(internalPorts)
        }

        setSelectedPort('')
        setFormData({ ...formData, targetUrl: '' })
      }
    }
  }, [selectedContainer, containersResponse])

  // Effect para construir a URL quando container e porta forem selecionados
  useEffect(() => {
    if (selectedContainerName && selectedPort) {
      // URL usando nome do container na rede interna Docker
      const targetUrl = `http://${selectedContainerName}:${selectedPort}`
      setFormData({ ...formData, targetUrl })
    }
  }, [selectedContainerName, selectedPort])

  // Função para detectar portas comuns baseado na imagem Docker
  const getCommonPortsFromImage = (imageName: string) => {
    const image = imageName.toLowerCase()
    const commonPorts: any[] = []

    if (image.includes('nginx')) {
      commonPorts.push({ PrivatePort: 80, Type: 'tcp' }, { PrivatePort: 443, Type: 'tcp' })
    } else if (image.includes('apache') || image.includes('httpd')) {
      commonPorts.push({ PrivatePort: 80, Type: 'tcp' }, { PrivatePort: 443, Type: 'tcp' })
    } else if (image.includes('node')) {
      commonPorts.push({ PrivatePort: 3000, Type: 'tcp' }, { PrivatePort: 8080, Type: 'tcp' })
    } else if (image.includes('mysql')) {
      commonPorts.push({ PrivatePort: 3306, Type: 'tcp' })
    } else if (image.includes('postgres')) {
      commonPorts.push({ PrivatePort: 5432, Type: 'tcp' })
    } else if (image.includes('redis')) {
      commonPorts.push({ PrivatePort: 6379, Type: 'tcp' })
    } else {
      // Portas padrão genéricas
      commonPorts.push({ PrivatePort: 80, Type: 'tcp' }, { PrivatePort: 3000, Type: 'tcp' }, { PrivatePort: 8080, Type: 'tcp' })
    }

    return commonPorts
  }

  const createProxyRuleMutation = useMutation({
    mutationFn: (data: CreateProxyRuleData) => api.post('/proxy-rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxy-rules'] })
      toast.success('Regra de proxy criada com sucesso!')
      router.push('/proxy-rules')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Erro ao criar regra de proxy'
      toast.error(errorMessage)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.sourcePath.trim()) {
      toast.error('Caminho de origem é obrigatório')
      return
    }
    if (!selectedContainer) {
      toast.error('Container Docker é obrigatório')
      return
    }
    if (!selectedPort) {
      toast.error('Porta é obrigatória')
      return
    }
    if (!formData.targetUrl.trim()) {
      toast.error('Erro na geração da URL de destino')
      return
    }
    if (!formData.domainId) {
      toast.error('Domínio é obrigatório')
      return
    }
    if (formData.priority < 1 || formData.priority > 1000) {
      toast.error('Prioridade deve estar entre 1 e 1000')
      return
    }

    createProxyRuleMutation.mutate(formData)
  }

  const handleBack = () => {
    router.push('/proxy-rules')
  }

  const breadcrumbs = [
    { label: 'Proxy Reverso', href: '/proxy-rules' },
    { label: 'Nova Regra', current: true }
  ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
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
                Nova Regra de Proxy
              </h1>
              <p className="text-muted-foreground">
                Configure uma nova regra de proxy reverso para direcionar tráfego
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Configurações Básicas */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center space-x-2 mb-6">
                <Server className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Configurações Básicas
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="domainId" className="block text-sm font-medium text-foreground mb-2">
                    Domínio <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="domainId"
                    value={formData.domainId}
                    onChange={(e) => setFormData({ ...formData, domainId: e.target.value })}
                    className="input w-full"
                    required
                  >
                    <option value="">Selecione um domínio</option>
                    {domains?.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Domínio onde a regra será aplicada
                  </p>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-2">
                    Prioridade <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="priority"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
                    placeholder="100"
                    className="input w-full"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Menor número = maior prioridade (1-1000)
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional da regra de proxy..."
                  rows={3}
                  className="input w-full resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Descrição opcional para identificar a regra
                </p>
              </div>
            </div>
          </div>

          {/* Configurações de Roteamento */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center space-x-2 mb-6">
                <Container className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Configurações de Roteamento
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="sourcePath" className="block text-sm font-medium text-foreground mb-2">
                    Caminho de Origem <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sourcePath"
                    type="text"
                    value={formData.sourcePath}
                    onChange={(e) => setFormData({ ...formData, sourcePath: e.target.value })}
                    placeholder="/api, /app, /"
                    className="input w-full"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Caminho que será interceptado (ex: /api, /app, /)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="selectedContainer" className="block text-sm font-medium text-foreground mb-2">
                      Container Docker <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="selectedContainer"
                      value={selectedContainer}
                      onChange={(e) => setSelectedContainer(e.target.value)}
                      className="input w-full"
                      required
                      disabled={containersLoading}
                    >
                      <option value="">Selecione um container</option>
                      {containersResponse?.data?.filter((container: any) => container.state === 'running').map((container: any) => (
                        <option key={container.id} value={container.id}>
                          {container.names[0].replace('/', '')} - {container.image}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Container ativo para onde o tráfego será direcionado
                    </p>
                  </div>

                  <div>
                    <label htmlFor="selectedPort" className="block text-sm font-medium text-foreground mb-2">
                      Porta <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="selectedPort"
                      value={selectedPort}
                      onChange={(e) => setSelectedPort(e.target.value)}
                      className="input w-full"
                      required
                      disabled={!selectedContainer || availablePorts.length === 0}
                    >
                      <option value="">Selecione uma porta</option>
                      {availablePorts.map((port: any, index: number) => {
                        const containerPort = port.PrivatePort
                        return (
                          <option key={index} value={containerPort}>
                            Porta {containerPort} - {port.Type.toUpperCase()}
                            {port.PublicPort ? ` (exposta no host:${port.PublicPort})` : ' (rede interna)'}
                          </option>
                        )
                      })}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Porta do container para receber o tráfego
                    </p>
                  </div>
                </div>

                {/* Configuração gerada automaticamente */}
                {formData.targetUrl && selectedContainerName && selectedPort && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Resolução de Rede Interna Docker
                    </label>
                    <div className="space-y-3 p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Container className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Container:</span>
                        <code className="text-sm font-mono text-foreground bg-background px-2 py-1 rounded">
                          {selectedContainerName}
                        </code>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">URL de Destino:</span>
                        <code className="text-sm font-mono text-foreground bg-background px-2 py-1 rounded">
                          {formData.targetUrl}
                        </code>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Route className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Roteamento:</span>
                        <span className="text-sm text-muted-foreground">
                          Domínio → Proxy Reverso → Container na Rede Interna
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border bg-blue-50 p-3 rounded">
                        <p className="font-medium text-blue-800 mb-2">🐳 Como funciona a Rede Interna Docker:</p>
                        <div className="space-y-1 text-blue-700">
                          <p>• <strong>Múltiplos containers</strong> podem usar a mesma porta (ex: 80)</p>
                          <p>• <strong>Cada container</strong> tem seu próprio hostname na rede interna</p>
                          <p>• <strong>Sem conflitos</strong> porque cada container é isolado</p>
                          <p>• <strong>Proxy reverso</strong> resolve pelo nome do container</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="text-xs text-blue-600">
                            <strong>Exemplo:</strong> nginx-site-x:80, nginx-site-y:80, nginx-site-z:80 todos funcionam simultaneamente!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Configurações Avançadas */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center space-x-2 mb-6">
                <Hash className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Configurações Avançadas
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
                      Ativar Regra
                    </span>
                    <p className="text-sm text-muted-foreground">
                      A regra ficará ativa imediatamente após a criação
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    id="maintainQueryStrings"
                    type="checkbox"
                    checked={formData.maintainQueryStrings}
                    onChange={(e) => setFormData({ ...formData, maintainQueryStrings: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      Manter Query Strings
                    </span>
                    <p className="text-sm text-muted-foreground">
                      Preservar parâmetros da URL (?param=value) no redirecionamento
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
              disabled={createProxyRuleMutation.isPending}
              className="btn-primary"
            >
              {createProxyRuleMutation.isPending ? 'Criando...' : 'Criar Regra'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}