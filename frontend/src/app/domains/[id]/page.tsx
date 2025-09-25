'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Container,
  Eye,
  Play,
  Square,
  RotateCcw,
  Terminal,
  FileText,
  Activity,
  Trash2,
  Image as ImageIcon,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  Settings,
  ExternalLink
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { PageLoading } from '@/components/ui/loading'
import { api } from '@/lib/api'
import { useRequireAuth } from '@/hooks/useAuth'
import { DockerApiService } from '@/lib/docker-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Domain } from '@/types'

export default function DomainDetailPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const domainId = params.id as string

  const { data: domain, isLoading: domainLoading } = useQuery<Domain>({
    queryKey: ['domain', domainId],
    queryFn: () => api.get(`/domains/${domainId}`).then(res => res.data),
    enabled: !!auth && !!domainId,
  })

  // Query containers and filter by domain
  const { data: containersResponse, isLoading: containersLoading } = useQuery({
    queryKey: ['docker', 'containers', domainId],
    queryFn: async () => {
      try {
        const response = await DockerApiService.listContainers()
        if (response.data && domain) {
          // Filter containers that are related to this domain
          // This could be by labels, names, or environment variables that reference the domain
          const filteredContainers = response.data.filter((container: any) => {
            // Check if container name contains domain name
            const containerName = container.names?.[0]?.replace('/', '') || ''
            const domainName = domain.name.toLowerCase()

            // Check container name, labels, or environment for domain references
            const matchesName = containerName.toLowerCase().includes(domainName) ||
                               containerName.toLowerCase().includes(domainName.replace(/\./g, '-')) ||
                               containerName.toLowerCase().includes(domainName.replace(/\./g, '_'))

            // Check labels for domain references
            const matchesLabels = container.labels && Object.values(container.labels).some((value: any) =>
              typeof value === 'string' && value.toLowerCase().includes(domainName)
            )

            // Check if container has ports that might be proxied by this domain
            const hasExposedPorts = container.ports && container.ports.length > 0

            return matchesName || matchesLabels || (hasExposedPorts && matchesName)
          })

          return {
            ...response,
            data: filteredContainers
          }
        }
        return response
      } catch (error) {
        console.error('Error fetching containers:', error)
        return { data: [], total: 0, message: 'Error fetching containers', error: String(error) }
      }
    },
    enabled: !!auth && !!domain,
    refetchInterval: 10000
  })

  // Container action mutations
  const containerActionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      switch (action) {
        case 'start':
          return await DockerApiService.startContainer(id)
        case 'stop':
          return await DockerApiService.stopContainer(id)
        case 'restart':
          return await DockerApiService.restartContainer(id)
        case 'remove':
          return await DockerApiService.removeContainer(id)
        default:
          throw new Error(`Ação não suportada: ${action}`)
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
      queryClient.invalidateQueries({ queryKey: ['docker', 'containers', domainId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao executar ação')
    }
  })

  const handleContainerAction = (containerId: string, action: string) => {
    containerActionMutation.mutate({ id: containerId, action })
  }

  if (!auth) return null

  if (domainLoading) {
    return (
      <MainLayout>
        <PageLoading />
      </MainLayout>
    )
  }

  if (!domain) {
    return (
      <MainLayout>
        <div className="text-center text-red-500 p-8">
          Domínio não encontrado
        </div>
      </MainLayout>
    )
  }

  const breadcrumbs = [
    { label: 'Domínios', href: '/domains' },
    { label: domain.name, current: true }
  ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push('/domains')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  domain.isActive ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <h1 className="text-3xl font-bold">{domain.name}</h1>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(`https://${domain.name}`, '_blank')}
                  className="h-8 w-8 p-0"
                  title={`Acessar ${domain.name}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              {domain.description && (
                <p className="text-muted-foreground">{domain.description}</p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/domains/${domain.id}/edit`}>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </Link>
          </div>
        </div>

        {/* Domain Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <span>Status do Domínio</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={domain.isActive ? "default" : "secondary"}>
                    {domain.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Auto TLS</span>
                  {domain.autoTls ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Force HTTPS</span>
                  {domain.forceHttps ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Certificados SSL</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {domain.sslCertificates?.length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Certificados</p>
                </div>
                <div className="flex items-center justify-center">
                  <Link href={`/domains/${domain.id}/ssl-certificates`}>
                    <Button variant="outline" size="sm">
                      Gerenciar SSL
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Container className="h-5 w-5 text-purple-500" />
                <span>Containers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {(containersResponse?.data?.length) || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Relacionados</p>
                </div>
                <div className="flex items-center justify-center">
                  <Link href="/docker/containers">
                    <Button variant="outline" size="sm">
                      Ver Docker
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Domain Containers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Container className="h-5 w-5" />
              <span>Containers Relacionados ao Domínio</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {containersLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (containersResponse?.data && containersResponse.data.length > 0) ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden sm:table-cell">Imagem</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead className="hidden md:table-cell">Portas</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {containersResponse?.data?.map((container: any) => (
                      <TableRow key={container.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              container.state === 'running' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <div>
                              <div className="font-medium">
                                {container.names[0]?.replace('/', '') || 'Sem nome'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {container.id.substring(0, 12)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="text-sm">
                            {container.image.length > 30
                              ? container.image.substring(0, 30) + '...'
                              : container.image
                            }
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={container.state === 'running' ? 'default' : 'secondary'}>
                            {container.state === 'running' ? 'Rodando' : 'Parado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">
                            {container.ports?.length > 0 ? (
                              container.ports.slice(0, 2).map((port: any, index: number) => (
                                <div key={index}>
                                  {port.PublicPort ? `${port.PublicPort}:${port.PrivatePort}` : port.PrivatePort}
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link href={`/docker/containers/${container.id}`}>
                              <Button size="sm" variant="outline" title="Ver detalhes">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>

                            {container.state === 'running' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleContainerAction(container.id, 'stop')}
                                disabled={containerActionMutation.isPending}
                                title="Parar"
                              >
                                <Square className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleContainerAction(container.id, 'start')}
                                disabled={containerActionMutation.isPending}
                                title="Iniciar"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContainerAction(container.id, 'restart')}
                              disabled={containerActionMutation.isPending}
                              title="Reiniciar"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>

                            {container.state === 'running' && (
                              <>
                                <Link href={`/docker/containers/${container.id}/logs`}>
                                  <Button size="sm" variant="outline" title="Ver logs">
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </Link>

                                <Link href={`/docker/containers/${container.id}/terminal`}>
                                  <Button size="sm" variant="outline" title="Terminal">
                                    <Terminal className="h-4 w-4" />
                                  </Button>
                                </Link>

                                <Link href={`/docker/containers/${container.id}/stats`}>
                                  <Button size="sm" variant="outline" title="Estatísticas">
                                    <Activity className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Container className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Nenhum container relacionado</h3>
                <p className="text-muted-foreground mb-4">
                  Não foram encontrados containers relacionados a este domínio.
                </p>
                <Link href="/docker/containers">
                  <Button variant="outline">
                    Ver Todos os Containers
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href={`/domains/${domain.id}/proxy-rules`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center space-x-3 p-6">
                <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                  <ArrowLeft className="h-4 w-4 text-blue-600 rotate-180" />
                </div>
                <div>
                  <h3 className="font-semibold">Regras de Proxy</h3>
                  <p className="text-sm text-muted-foreground">Configurar proxy reverso</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/domains/${domain.id}/redirects`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center space-x-3 p-6">
                <div className="h-8 w-8 bg-green-100 rounded flex items-center justify-center">
                  <RotateCcw className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Redirecionamentos</h3>
                  <p className="text-sm text-muted-foreground">Gerenciar redirects</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/domains/${domain.id}/ssl-certificates`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center space-x-3 p-6">
                <div className="h-8 w-8 bg-purple-100 rounded flex items-center justify-center">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Certificados SSL</h3>
                  <p className="text-sm text-muted-foreground">Gerenciar certificados</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}