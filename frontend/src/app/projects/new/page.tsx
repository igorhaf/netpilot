'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRequireAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { CreateProjectDto } from '@/types'
import StackSelector from '@/components/projects/StackSelector'

export default function NewProjectPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState<CreateProjectDto>({
    name: '',
    alias: '',
    description: '',
    isActive: true,
    technologies: [],
    repository: '',
    documentation: '',
    mainDomain: '',
    defaultPromptTemplate: '',
    executionMode: 'queue',
    stackIds: [],
    presetIds: [],
    metadata: {}
  })

  const [newTechnology, setNewTechnology] = useState('')

  // Buscar domínios
  const { data: domains } = useQuery({
    queryKey: ['domains'],
    queryFn: () => api.get('/domains').then(res => res.data),
    enabled: !!auth
  })

  // Verificar se voltou da criação de domínio
  useEffect(() => {
    const newDomainName = searchParams.get('newDomain')
    if (newDomainName) {
      setFormData(prev => ({ ...prev, mainDomain: newDomainName }))
    }
  }, [searchParams])

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectDto) => api.post('/projects', data),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Projeto criado com sucesso!'
      })
      router.push('/projects')
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao criar projeto',
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

    if (!formData.alias.trim()) {
      toast({
        title: 'Erro',
        description: 'Apelido/pasta raiz é obrigatório',
        variant: 'destructive'
      })
      return
    }

    // Validar formato do apelido
    const aliasRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
    if (!aliasRegex.test(formData.alias)) {
      toast({
        title: 'Erro',
        description: 'Apelido deve conter apenas letras minúsculas, números e hifens. Não pode começar ou terminar com hífen.',
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

    createMutation.mutate(formData)
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

  const breadcrumbs = [
    { label: 'Projetos', href: '/projects' },
    { label: 'Novo Projeto', current: true }
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
              <h1 className="text-3xl font-bold text-foreground">Novo Projeto</h1>
              <p className="text-muted-foreground">
                Crie um novo projeto para organizar seus domínios
              </p>
            </div>
          </div>
        </div>

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
                  <Label htmlFor="alias">Apelido/Pasta Raiz *</Label>
                  <Input
                    id="alias"
                    value={formData.alias}
                    onChange={(e) => setFormData(prev => ({ ...prev, alias: e.target.value.toLowerCase() }))}
                    placeholder="Ex: netpilot-system, e-commerce, blog"
                    required
                    pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta será a pasta raiz do projeto. Use apenas letras minúsculas, números e hifens.
                    <strong> Não pode ser alterado após criação.</strong>
                  </p>
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
                  <div className="flex gap-2">
                    <Select
                      value={formData.mainDomain || ""}
                      onValueChange={(value) => {
                        if (value === '_create_new') {
                          router.push('/domains/new?returnTo=/projects/new')
                        } else {
                          setFormData(prev => ({ ...prev, mainDomain: value }))
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um domínio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_create_new">
                          + Criar Novo Domínio
                        </SelectItem>
                        {domains && domains.length > 0 ? (
                          domains.map((domain: any) => (
                            <SelectItem key={domain.id} value={domain.name}>
                              {domain.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="_no_domains">
                            Nenhum domínio cadastrado
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
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
                    O repositório será clonado automaticamente para a pasta do projeto.
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

              </CardContent>
            </Card>
          </div>

          {/* Stack Selection */}
          <StackSelector
            selectedStackIds={formData.stackIds || []}
            onChange={(stackIds) => setFormData(prev => ({ ...prev, stackIds }))}
          />

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
              disabled={createMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Criando...' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}