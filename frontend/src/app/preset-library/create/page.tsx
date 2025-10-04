'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRequireAuth } from '@/hooks/useAuth'
import {
  ArrowLeft,
  Save,
  Package,
  Palette
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


export default function CreateStackPage() {
  const auth = useRequireAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    version: '1.0.0',
    author: ''
  })

  const breadcrumbs = [
    { label: 'Biblioteca de Presets', href: '/preset-library' },
    { label: 'Nova Stack', current: true }
  ]

  const createStackMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/stacks', data)
      return response.data
    },
    onSuccess: (result) => {
      toast.success('Stack criada com sucesso!')
      router.push('/preset-library')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar stack')
    }
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Nome da stack é obrigatório')
      return
    }

    createStackMutation.mutate(formData)
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
              <div className="flex items-center gap-4">
                {/* Ícone da Tecnologia */}
                <div className="space-y-2">
                  <Label>Ícone da Stack</Label>
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.name.slice(0, 2).toUpperCase() || '??'}
                  </div>
                </div>

                {/* Seletor de Cor */}
                <div className="flex-1 space-y-2">
                  <Label>Cor Personalizada</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      className="w-20 h-12 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Cores Sugeridas */}
              <div className="space-y-2">
                <Label>Cores Sugeridas</Label>
                <div className="flex flex-wrap gap-3">
                  {TECHNOLOGY_COLORS.map((tech) => (
                    <button
                      key={tech.color}
                      type="button"
                      onClick={() => handleInputChange('color', tech.color)}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-all ${
                        formData.color === tech.color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: tech.color }}
                      title={tech.name}
                    >
                      {tech.name.slice(0, 2).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-muted rounded-lg border-2 border-dashed">
                <p className="text-sm font-medium text-muted-foreground mb-3">Prévia do Card:</p>
                <div className="bg-card p-4 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: formData.color }}
                    >
                      {formData.name.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <h4 className="font-medium">{formData.name || 'Nome da Stack'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formData.description || 'Descrição da stack'}
                      </p>
                    </div>
                  </div>
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