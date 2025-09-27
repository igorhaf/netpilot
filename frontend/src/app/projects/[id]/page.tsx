'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, Globe, GitBranch, FileText, Calendar, Tag, ExternalLink } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useRequireAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Project, Domain } from '@/types'

export default function ProjectDetailsPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id as string

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(res => res.data),
    enabled: !!projectId
  })

  if (!auth) return null

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando projeto...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Projeto não encontrado</h2>
            <p className="text-muted-foreground mb-4">O projeto solicitado não existe ou foi removido.</p>
            <Button onClick={() => router.push('/projects')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Projetos
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const breadcrumbs = [
    { label: 'Projetos', href: '/projects' },
    { label: project.name, current: true }
  ]

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
                <Badge variant={project.isActive ? "default" : "secondary"}>
                  {project.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Alias: <code className="bg-muted px-1 py-0.5 rounded text-xs">{project.alias}</code>
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/projects/${project.id}/edit`)}
            size="sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="text-foreground">{project.description}</p>
                </div>
              )}

              {project.mainDomain && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Domínio Principal</label>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{project.mainDomain}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://${project.mainDomain}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Repositório</label>
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span className="break-all">{project.repository}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(project.repository, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {project.documentation && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Documentação</label>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="break-all">{project.documentation}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(project.documentation!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações Técnicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Técnicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.technologies && project.technologies.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tecnologias</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.technologies.map((tech: string) => (
                      <Badge key={tech} variant="outline" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(project.createdAt)}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Última atualização</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Domínios Associados */}
        {project.domains && project.domains.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Domínios Associados ({project.domains.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.domains.map((domain: Domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{domain.name}</p>
                        {domain.description && (
                          <p className="text-sm text-muted-foreground">{domain.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={domain.isActive ? "default" : "secondary"}>
                        {domain.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/domains/${domain.id}`)}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        {project.metadata && Object.keys(project.metadata).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Metadados</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(project.metadata, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}