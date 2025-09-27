'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useRequireAuth } from '@/hooks/useAuth'
import {
  ArrowLeft,
  Save,
  Package,
  Palette,
  Tag,
  X
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const TECHNOLOGY_COLORS = [
  { name: 'PHP', color: '#8B5CF6' },
  { name: 'JavaScript', color: '#F59E0B' },
  { name: 'Python', color: '#EF4444' },
  { name: 'React', color: '#3B82F6' },
  { name: 'Node.js', color: '#10B981' },
  { name: 'Java', color: '#DC2626' },
  { name: 'Go', color: '#06B6D4' },
  { name: 'Rust', color: '#F97316' },
]

const SUGGESTED_TAGS = [
  'docker', 'nginx', 'mysql', 'postgresql', 'redis', 'mongodb',
  'api', 'frontend', 'backend', 'microservices', 'kubernetes',
  'production', 'development', 'testing', 'ci/cd', 'security'
]

export default function CreateStackPage() {
  const auth = useRequireAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    technology: '',
    color: '#3B82F6',
    version: '1.0.0',
    author: ''
  })

  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const breadcrumbs = [
    { label: 'Biblioteca de Presets', href: '/preset-library' },
    { label: 'Nova Stack', current: true }
  ]

  const createStackMutation = useMutation({
    mutationFn: async (data: typeof formData & { tags: string[] }) => {
      // Simular criação da stack
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { id: 'new-stack-id', ...data }
    },
    onSuccess: (result) => {
      toast.success('Stack criada com sucesso!')
      router.push(`/preset-library/${result.id}`)
    },
    onError: () => {
      toast.error('Erro ao criar stack')
    }
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (tag && !tags.includes(tag)) {
        setTags(prev => [...prev, tag])
        setTagInput('')
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags(prev => [...prev, tag])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Nome da stack é obrigatório')
      return
    }

    if (!formData.technology.trim()) {
      toast.error('Tecnologia é obrigatória')
      return
    }

    createStackMutation.mutate({
      ...formData,
      tags
    })
  }

  const handleBack = () => {
    router.push('/preset-library')
  }

  if (!auth) return null

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              Nova Stack
            </h1>
            <p className="text-muted-foreground">
              Crie uma nova coleção de presets organizados por tecnologia
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Stack *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: PHP Laravel Stack"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technology">Tecnologia *</Label>
                  <Input
                    id="technology"
                    placeholder="Ex: PHP, Node.js, Python"
                    value={formData.technology}
                    onChange={(e) => handleInputChange('technology', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  className="min-h-[100px]"
                  placeholder="Descreva o propósito e conteúdo desta stack..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="version">Versão</Label>
                  <Input
                    id="version"
                    placeholder="1.0.0"
                    value={formData.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Autor</Label>
                  <Input
                    id="author"
                    placeholder="Seu nome ou organização"
                    value={formData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personalização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-500" />
                Personalização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Cor da Stack</Label>
                <div className="flex flex-wrap gap-3">
                  {TECHNOLOGY_COLORS.map((tech) => (
                    <button
                      key={tech.color}
                      type="button"
                      onClick={() => handleInputChange('color', tech.color)}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-transform ${
                        formData.color === tech.color ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: tech.color }}
                    >
                      {tech.name.slice(0, 2).toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <span className="text-sm text-muted-foreground">Ou escolha uma cor personalizada</span>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Prévia:</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.technology.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div>
                    <h4 className="font-medium">{formData.name || 'Nome da Stack'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.technology || 'Tecnologia'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-green-500" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Adicionar Tags</Label>
                <Input
                  id="tags"
                  placeholder="Digite uma tag e pressione Enter ou vírgula"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>

              {/* Current Tags */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags Adicionadas</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="default" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:bg-red-500 rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Tags */}
              <div className="space-y-2">
                <Label>Tags Sugeridas</Label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TAGS.filter(tag => !tags.includes(tag)).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleSuggestedTag(tag)}
                    >
                      + {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleBack}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createStackMutation.isPending}
              className="flex items-center gap-2"
            >
              {createStackMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Criar Stack
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}