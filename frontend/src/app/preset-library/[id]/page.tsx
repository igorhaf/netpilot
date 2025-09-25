'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRequireAuth } from '@/hooks/useAuth'
import {
  ArrowLeft,
  Edit,
  Download,
  Upload,
  Plus,
  Search,
  FileCode,
  FileText,
  Settings,
  Package,
  Trash2,
  Copy,
  Eye,
  Calendar,
  User,
  Tag,
  Activity
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Stack, PresetFile } from '@/types'

// Mock data expandida
const mockStackDetails: Stack = {
  id: '1',
  name: 'PHP Laravel Stack',
  description: 'Conjunto completo de presets para desenvolvimento Laravel com Docker, Nginx e MySQL. Inclui configurações otimizadas para produção e desenvolvimento.',
  technology: 'PHP',
  color: '#8B5CF6',
  icon: 'php',
  isActive: true,
  version: '1.0.0',
  author: 'NetPilot Team',
  tags: ['php', 'laravel', 'docker', 'nginx', 'mysql', 'production', 'development'],
  totalPresets: 12,
  totalSize: 48576,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T15:30:00Z',
  presets: [
    {
      id: '1',
      name: 'Laravel Dockerfile',
      description: 'Dockerfile otimizado para aplicações Laravel com PHP 8.2 e extensões necessárias',
      type: 'docker',
      content: `FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \\
    git \\
    curl \\
    libpng-dev \\
    oniguruma-dev \\
    libxml2-dev \\
    zip \\
    unzip

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

RUN composer install --optimize-autoloader --no-dev

EXPOSE 9000
CMD ["php-fpm"]`,
      language: 'dockerfile',
      filename: 'Dockerfile',
      tags: ['docker', 'php', 'laravel'],
      size: 1024,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z'
    },
    {
      id: '2',
      name: 'Nginx Configuration',
      description: 'Configuração Nginx otimizada para aplicações Laravel',
      type: 'config',
      content: `server {
    listen 80;
    server_name localhost;
    root /var/www/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \\.php$ {
        fastcgi_pass php:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\\.ht {
        deny all;
    }
}`,
      language: 'nginx',
      filename: 'nginx.conf',
      tags: ['nginx', 'laravel', 'webserver'],
      size: 512,
      createdAt: '2024-01-15T11:00:00Z',
      updatedAt: '2024-01-18T09:15:00Z'
    },
    {
      id: '3',
      name: 'Laravel Development Persona',
      description: 'Persona especializada em desenvolvimento Laravel com melhores práticas',
      type: 'persona',
      content: `Você é um desenvolvedor sênior Laravel especializado em:

## Expertise
- Laravel Framework (8.x, 9.x, 10.x, 11.x)
- Eloquent ORM e Query Builder
- Artisan Commands e Service Providers
- Laravel Sail e Docker
- Testing com PHPUnit e Pest
- API Development com Laravel Sanctum
- Queue Jobs e Broadcasting

## Melhores Práticas
- Seguir PSR-12 e convenções Laravel
- Implementar Repository Pattern quando necessário
- Usar Form Requests para validação
- Implementar Feature Tests abrangentes
- Otimizar queries com eager loading
- Aplicar princípios SOLID

## Foco em
- Performance e escalabilidade
- Segurança (CSRF, XSS, SQL Injection)
- Manutenibilidade do código
- Documentação clara e concisa`,
      language: 'markdown',
      filename: 'laravel-persona.md',
      tags: ['persona', 'laravel', 'development'],
      size: 2048,
      createdAt: '2024-01-16T14:30:00Z',
      updatedAt: '2024-01-19T16:45:00Z'
    }
  ]
}

export default function StackDetailPage() {
  const auth = useRequireAuth()
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<PresetFile | null>(null)

  const stackId = params.id as string

  const breadcrumbs = [
    { label: 'Biblioteca de Presets', href: '/preset-library' },
    { label: mockStackDetails.name, current: true }
  ]

  // Mock queries
  const { data: stack, isLoading } = useQuery({
    queryKey: ['stack', stackId],
    queryFn: () => {
      return new Promise<Stack>((resolve) => {
        setTimeout(() => resolve(mockStackDetails), 300)
      })
    },
    enabled: !!auth && !!stackId
  })

  const exportStackMutation = useMutation({
    mutationFn: async (stackId: string) => {
      // Simular exportação
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true }
    },
    onSuccess: () => {
      toast.success('Stack exportada com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao exportar stack')
    }
  })

  const deletePresetMutation = useMutation({
    mutationFn: async (presetId: string) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true }
    },
    onSuccess: () => {
      toast.success('Preset excluído com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['stack', stackId] })
    },
    onError: () => {
      toast.error('Erro ao excluir preset')
    }
  })

  const filteredPresets = stack?.presets.filter(preset =>
    preset.name.toLowerCase().includes(search.toLowerCase()) ||
    preset.description?.toLowerCase().includes(search.toLowerCase()) ||
    preset.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  ) || []

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getPresetIcon = (type: string) => {
    switch (type) {
      case 'docker': return <Package className="h-4 w-4" />
      case 'persona': return <User className="h-4 w-4" />
      case 'template': return <FileText className="h-4 w-4" />
      case 'script': return <FileCode className="h-4 w-4" />
      case 'config': return <Settings className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getPresetTypeColor = (type: string) => {
    switch (type) {
      case 'docker': return 'bg-blue-500'
      case 'persona': return 'bg-purple-500'
      case 'template': return 'bg-green-500'
      case 'script': return 'bg-orange-500'
      case 'config': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const handleBack = () => {
    router.push('/preset-library')
  }

  const handleEditStack = () => {
    router.push(`/preset-library/${stackId}/edit`)
  }

  const handleCreatePreset = () => {
    router.push(`/preset-library/${stackId}/presets/create`)
  }

  const handleEditPreset = (presetId: string) => {
    router.push(`/preset-library/${stackId}/presets/${presetId}/edit`)
  }

  const handleExportStack = () => {
    exportStackMutation.mutate(stackId)
  }

  const handleDeletePreset = (presetId: string) => {
    if (confirm('Tem certeza que deseja excluir este preset?')) {
      deletePresetMutation.mutate(presetId)
    }
  }

  const handleCopyPreset = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Conteúdo copiado para a área de transferência!')
  }

  if (!auth) return null

  if (isLoading) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!stack) {
    return (
      <MainLayout breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Stack não encontrada</h2>
          <p className="text-muted-foreground mt-2">A stack solicitada não foi encontrada.</p>
          <Button onClick={handleBack} className="mt-4">
            Voltar à Biblioteca
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: stack.color }}
              >
                {stack.technology.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{stack.name}</h1>
                <p className="text-muted-foreground text-lg">{stack.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">v{stack.version}</Badge>
                  <Badge variant={stack.isActive ? "default" : "secondary"}>
                    {stack.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <Badge variant="secondary">{stack.technology}</Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportStack} disabled={exportStackMutation.isPending}>
              <Download className="h-4 w-4 mr-2" />
              {exportStackMutation.isPending ? 'Exportando...' : 'Exportar'}
            </Button>
            <Button variant="outline" onClick={handleEditStack}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Stack
            </Button>
            <Button onClick={handleCreatePreset}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Preset
            </Button>
          </div>
        </div>

        {/* Stack Info */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Presets</p>
                  <p className="text-xl font-bold">{stack.totalPresets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Tamanho Total</p>
                  <p className="text-xl font-bold">{formatFileSize(stack.totalSize)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Autor</p>
                  <p className="text-xl font-bold">{stack.author || 'Desconhecido'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Atualizado</p>
                  <p className="text-xl font-bold">
                    {new Date(stack.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stack.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Presets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Presets ({filteredPresets.length})
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar presets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPresets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPresets.map((preset) => (
                  <Card key={preset.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${getPresetTypeColor(preset.type)} flex items-center justify-center text-white`}>
                            {getPresetIcon(preset.type)}
                          </div>
                          <div>
                            <h4 className="font-medium line-clamp-1">{preset.name}</h4>
                            <p className="text-xs text-muted-foreground capitalize">{preset.type}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {preset.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>{formatFileSize(preset.size)}</span>
                        {preset.language && (
                          <Badge variant="outline" className="text-xs">
                            {preset.language}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPreset(preset)}
                          className="flex-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyPreset(preset.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPreset(preset.id)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePreset(preset.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum preset encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {search ? 'Tente ajustar sua busca' : 'Comece adicionando presets a esta stack'}
                </p>
                <Button onClick={handleCreatePreset}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Preset
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preset Preview Modal */}
        {selectedPreset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="text-lg font-semibold">{selectedPreset.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPreset.filename}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyPreset(selectedPreset.content)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedPreset(null)}>
                    Fechar
                  </Button>
                </div>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{selectedPreset.content}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}