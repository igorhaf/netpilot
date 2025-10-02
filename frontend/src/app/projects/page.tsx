'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, FolderOpen, Globe, Settings, Trash2, Edit, Bot } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { useRequireAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { Project } from '@/types'

export default function ProjectsPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects', search],
    queryFn: () => api.get(`/projects?search=${search}`).then(res => res.data),
    enabled: !!auth,
  })

  const { data: stats } = useQuery({
    queryKey: ['projects-stats'],
    queryFn: () => api.get('/projects/stats').then(res => res.data),
    enabled: !!auth,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects-stats'] })
      toast({
        title: 'Sucesso',
        description: 'Projeto removido com sucesso!'
      })
      setProjectToDelete(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao remover projeto',
        variant: 'destructive'
      })
    },
  })

  const handleCreateProject = () => {
    router.push('/projects/new')
  }

  const handleDelete = (project: Project) => {
    setProjectToDelete(project)
  }

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete.id)
    }
  }

  if (!auth) return null

  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(search.toLowerCase()) ||
    project.description?.toLowerCase().includes(search.toLowerCase()) ||
    project.technologies?.some(tech => tech.toLowerCase().includes(search.toLowerCase()))
  ) || []

  const breadcrumbs = [
    { label: 'Projetos', current: true, icon: FolderOpen }
  ]

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                    <p className="text-2xl font-bold">{stats.active}</p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Domínios</p>
                    <p className="text-2xl font-bold">{stats.totalDomains}</p>
                  </div>
                  <Globe className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Média Domínios</p>
                    <p className="text-2xl font-bold">{stats.avgDomainsPerProject}</p>
                  </div>
                  <Settings className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar projetos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        project.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Link href={`/projects/${project.id}`}>
                        <Button size="sm" variant="outline" title="Chat AI & Operações">
                          <Bot className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/projects/${project.id}/edit`}>
                        <Button size="sm" variant="outline" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(project)}
                        className="text-red-600 hover:text-red-700"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Technologies */}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.slice(0, 3).map((tech, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {project.technologies.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.technologies.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Domains Count */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span>{project.domains?.length || 0} domínio(s)</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(project.createdAt)}
                      </span>
                    </div>

                    {/* Main Domain */}
                    {project.mainDomain && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Domínio principal: </span>
                        <span className="font-medium">{project.mainDomain}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? 'Tente ajustar seus filtros de busca'
                : 'Crie seu primeiro projeto para começar a organizar seus domínios'}
            </p>
            {!search && (
              <Button onClick={handleCreateProject}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Projeto
              </Button>
            )}
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!projectToDelete}
          onClose={() => setProjectToDelete(null)}
          onConfirm={confirmDeleteProject}
          title="Confirmar Exclusão"
          subtitle="Esta ação não pode ser desfeita."
          itemName={`Projeto "${projectToDelete?.name}"`}
          consequences={[
            'Remover permanentemente o projeto',
            'Domínios associados ficarão sem projeto',
            'Dados de sessão de IA serão perdidos'
          ]}
          confirmText="Excluir Projeto"
          isLoading={deleteMutation.isPending}
        />

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50 group">
          {/* Tooltip/Label */}
          <button
            onClick={handleCreateProject}
            className="bg-white dark:bg-gray-800 text-foreground px-4 py-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium border border-border"
          >
            Adicionar Projeto
          </button>

          {/* FAB Button */}
          <button
            onClick={handleCreateProject}
            className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-110 flex items-center justify-center"
            title="Adicionar Projeto"
          >
            <Plus className="h-6 w-6 transition-transform duration-200 ease-in-out group-hover:rotate-180" />
          </button>
        </div>
      </div>
    </MainLayout>
  )
}