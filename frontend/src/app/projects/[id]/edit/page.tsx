'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useRequireAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Project } from '@/types'

interface UpdateProjectDto {
  name: string
  description?: string
  isActive?: boolean
  technologies?: string[]
  repository: string
  documentation?: string
  mainDomain?: string
  metadata?: Record<string, any>
}

export default function EditProjectPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const projectId = params?.id as string

  const [formData, setFormData] = useState<UpdateProjectDto>({
    name: '',
    description: '',
    isActive: true,
    technologies: [],
    repository: '',
    documentation: '',
    mainDomain: '',
    metadata: {}
  })

  const [newTechnology, setNewTechnology] = useState('')

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(res => res.data),
    enabled: !!projectId
  })

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        isActive: project.isActive ?? true,
        technologies: project.technologies || [],
        repository: project.repository || '',
        documentation: project.documentation || '',
        mainDomain: project.mainDomain || '',
        metadata: project.metadata || {}
      })
    }
  }, [project])

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProjectDto) => api.patch(`/projects/${projectId}`, data),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Projeto atualizado com sucesso!'
      })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      router.push(`/projects/${projectId}`)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao atualizar projeto',
        variant: 'destructive'
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do projeto é obrigatório',
        variant: 'destructive'
      })
      return
    }

    if (!formData.repository.trim()) {
      toast({
        title: 'Erro',
        description: 'Repositório é obrigatório',
        variant: 'destructive'
      })
      return
    }

    // Validar formato básico do URL do repositório
    const isValidUrl = formData.repository.startsWith('http://') ||
                      formData.repository.startsWith('https://') ||
                      formData.repository.startsWith('git@')

    if (!isValidUrl) {
      toast({
        title: 'Erro',
        description: 'Repositório deve ser uma URL válida (http://, https:// ou git@)',
        variant: 'destructive'
      })
      return
    }

    updateMutation.mutate(formData)
  }

  const addTechnology = () => {
    if (newTechnology.trim() && !formData.technologies?.includes(newTechnology.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...(prev.technologies || []), newTechnology.trim()]
      }))
      setNewTechnology('')
    }
  }

  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies?.filter(t => t !== tech) || []
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTechnology()
    }
  }

  if (!auth) return null

  if (isLoading || !project) {
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

  const breadcrumbs = [
    { label: 'Projetos', href: '/projects' },
    { label: project.name, href: `/projects/${project.id}` },
    { label: 'Editar', current: true }
  ]

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
              <h1 className="text-3xl font-bold text-foreground">Editar Projeto</h1>
              <p className="text-muted-foreground">
                Editando: {project.name}
              </p>
            </div>
          </div>
        </div>

        {/* Informação sobre campos não editáveis */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 rounded-full bg-amber-500 mt-0.5 flex-shrink-0"></div>
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-200">Campos não editáveis</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  O <strong>apelido (alias)</strong> e a <strong>pasta do projeto</strong> não podem ser alterados após a criação.
                  Atualmente: <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded text-xs">{project.alias}</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Projeto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: NetPilot, E-commerce, Blog..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva brevemente o projeto..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainDomain">Domínio Principal</Label>
                  <Input
                    id="mainDomain"
                    value={formData.mainDomain}
                    onChange={(e) => setFormData(prev => ({ ...prev, mainDomain: e.target.value }))}
                    placeholder="exemplo.com"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, isActive: checked as boolean }))
                    }
                  />
                  <Label htmlFor="isActive">Projeto ativo</Label>
                </div>
              </CardContent>
            </Card>

            {/* Informações Técnicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Técnicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repository">Repositório *</Label>
                  <Input
                    id="repository"
                    value={formData.repository}
                    onChange={(e) => setFormData(prev => ({ ...prev, repository: e.target.value }))}
                    placeholder="https://github.com/usuario/projeto"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Alterar o repositório não afeta a pasta já clonada.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentation">Documentação</Label>
                  <Input
                    id="documentation"
                    value={formData.documentation}
                    onChange={(e) => setFormData(prev => ({ ...prev, documentation: e.target.value }))}
                    placeholder="Link para documentação"
                  />
                </div>

                {/* Technologies */}
                <div className="space-y-2">
                  <Label>Tecnologias</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={newTechnology}
                      onChange={(e) => setNewTechnology(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ex: React, Node.js, Docker..."
                      className="flex-1"
                    />
                    <Button type="button" onClick={addTechnology} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {formData.technologies && formData.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="flex items-center gap-1">
                          {tech}
                          <button
                            type="button"
                            onClick={() => removeTechnology(tech)}
                            className="ml-1 hover:bg-red-200 rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}