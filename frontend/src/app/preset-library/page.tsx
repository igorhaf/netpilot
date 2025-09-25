'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRequireAuth } from '@/hooks/useAuth'
import {
  Library,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Package,
  FileCode,
  User,
  Calendar,
  Tag
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Stack } from '@/types'

// Mock data for demonstration
const mockStacks: Stack[] = [
  {
    id: '1',
    name: 'PHP Laravel Stack',
    description: 'Conjunto completo de presets para desenvolvimento Laravel com Docker, Nginx e MySQL',
    technology: 'PHP',
    color: '#8B5CF6',
    icon: 'php',
    presets: [],
    isActive: true,
    version: '1.0.0',
    author: 'NetPilot Team',
    tags: ['php', 'laravel', 'docker', 'nginx', 'mysql'],
    totalPresets: 12,
    totalSize: 48576,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z'
  },
  {
    id: '2',
    name: 'Node.js Express Stack',
    description: 'Stack moderno para aplicações Node.js com Express, TypeScript e Docker',
    technology: 'Node.js',
    color: '#10B981',
    icon: 'nodejs',
    presets: [],
    isActive: true,
    version: '2.1.0',
    author: 'Dev Community',
    tags: ['nodejs', 'express', 'typescript', 'docker'],
    totalPresets: 8,
    totalSize: 32144,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-25T11:45:00Z'
  },
  {
    id: '3',
    name: 'Python Django Stack',
    description: 'Presets otimizados para projetos Django com PostgreSQL e Redis',
    technology: 'Python',
    color: '#EF4444',
    icon: 'python',
    presets: [],
    isActive: true,
    version: '1.5.2',
    author: 'Python Guild',
    tags: ['python', 'django', 'postgresql', 'redis'],
    totalPresets: 15,
    totalSize: 67891,
    createdAt: '2024-01-05T14:20:00Z',
    updatedAt: '2024-01-22T16:15:00Z'
  },
  {
    id: '4',
    name: 'React Next.js Stack',
    description: 'Stack completo para aplicações React com Next.js, Tailwind e Vercel',
    technology: 'React',
    color: '#3B82F6',
    icon: 'react',
    presets: [],
    isActive: false,
    version: '0.8.0',
    author: 'Frontend Team',
    tags: ['react', 'nextjs', 'tailwind', 'typescript'],
    totalPresets: 6,
    totalSize: 24567,
    createdAt: '2024-01-18T08:30:00Z',
    updatedAt: '2024-01-24T10:00:00Z'
  }
]

export default function PresetLibraryPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedTechnology, setSelectedTechnology] = useState('')

  const breadcrumbs = [
    { label: 'Biblioteca de Presets', current: true }
  ]

  // Mock query
  const { data: stacks, isLoading } = useQuery({
    queryKey: ['stacks', search, selectedTechnology],
    queryFn: () => {
      return new Promise<Stack[]>((resolve) => {
        setTimeout(() => {
          let filteredStacks = [...mockStacks]

          if (search) {
            filteredStacks = filteredStacks.filter(stack =>
              stack.name.toLowerCase().includes(search.toLowerCase()) ||
              stack.description.toLowerCase().includes(search.toLowerCase()) ||
              stack.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
            )
          }

          if (selectedTechnology) {
            filteredStacks = filteredStacks.filter(stack =>
              stack.technology === selectedTechnology
            )
          }

          resolve(filteredStacks)
        }, 300)
      })
    },
    enabled: !!auth
  })

  const technologies = Array.from(new Set(mockStacks.map(stack => stack.technology)))

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleCreateStack = () => {
    router.push('/preset-library/create')
  }

  const handleViewStack = (stackId: string) => {
    router.push(`/preset-library/${stackId}`)
  }

  const handleImportStack = () => {
    // Implementar modal de import
    console.log('Import stack')
  }

  if (!auth) return null

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Library className="h-8 w-8 text-blue-500" />
              Biblioteca de Presets
            </h1>
            <p className="text-muted-foreground">
              Gerencie coleções organizadas de presets por tecnologia
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleImportStack}>
              <Upload className="h-4 w-4 mr-2" />
              Importar Stack
            </Button>
            <Button onClick={handleCreateStack} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nova Stack
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar stacks, tecnologias ou tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedTechnology}
              onChange={(e) => setSelectedTechnology(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-sm"
            >
              <option value="">Todas as tecnologias</option>
              {technologies.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Stacks</p>
                  <p className="text-2xl font-bold">{mockStacks.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                  <p className="text-2xl font-bold">{mockStacks.filter(s => s.isActive).length}</p>
                </div>
                <Library className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tecnologias</p>
                  <p className="text-2xl font-bold">{technologies.length}</p>
                </div>
                <Tag className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Presets</p>
                  <p className="text-2xl font-bold">{mockStacks.reduce((acc, stack) => acc + stack.totalPresets, 0)}</p>
                </div>
                <FileCode className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stacks Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stacks && stacks.length > 0 ? (
              stacks.map((stack) => (
                <Card
                  key={stack.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleViewStack(stack.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: stack.color }}
                        >
                          {stack.technology.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-1">{stack.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              v{stack.version}
                            </Badge>
                            <Badge
                              variant={stack.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {stack.isActive ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {stack.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <FileCode className="h-4 w-4" />
                          <span>{stack.totalPresets} presets</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>{formatFileSize(stack.totalSize)}</span>
                        </div>
                      </div>

                      {stack.author && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{stack.author}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {stack.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {stack.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{stack.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Library className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma stack encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {search || selectedTechnology
                    ? 'Tente ajustar seus filtros de busca'
                    : 'Comece criando sua primeira stack de presets'}
                </p>
                {!search && !selectedTechnology && (
                  <Button onClick={handleCreateStack}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Nova Stack
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}