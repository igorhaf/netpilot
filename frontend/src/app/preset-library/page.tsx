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
  Package,
  FileCode,
  User,
  Calendar,
  Tag
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function PresetLibraryPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedTechnology, setSelectedTechnology] = useState('')

  const breadcrumbs = [
    { label: 'Biblioteca de Presets', current: true, icon: Library }
  ]

  // Buscar presets do banco de dados
  const { data: presets, isLoading } = useQuery({
    queryKey: ['presets', search, selectedTechnology],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedTechnology) params.append('type', selectedTechnology)
      return api.get(`/presets?${params.toString()}`).then(res => res.data)
    },
    enabled: !!auth
  })

  // Tipos de presets disponíveis
  const presetTypes = ['template', 'config', 'persona', 'docker', 'script']

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleCreatePreset = () => {
    router.push('/preset-library/create')
  }

  const handleViewPreset = (presetId: string) => {
    router.push(`/preset-library/${presetId}`)
  }

  if (!auth) return null

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar presets, tecnologias ou tags..."
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
              <option value="">Todos os tipos</option>
              {presetTypes.map((type: string) => (
                <option key={type} value={type}>{type}</option>
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
                  <p className="text-sm font-medium text-muted-foreground">Total de Presets</p>
                  <p className="text-2xl font-bold">{presets?.length || 0}</p>
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
                  <p className="text-2xl font-bold">{presets?.filter((s: any) => s.isActive).length || 0}</p>
                </div>
                <Library className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tags Únicas</p>
                  <p className="text-2xl font-bold">{presets ? new Set(presets.flatMap((p: any) => p.tags || [])).size : 0}</p>
                </div>
                <Tag className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipos</p>
                  <p className="text-2xl font-bold">{presetTypes.length}</p>
                </div>
                <FileCode className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Presets Grid */}
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
            {presets && presets.length > 0 ? (
              presets.map((preset: any) => (
                <Card
                  key={preset.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleViewPreset(preset.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-500 text-white font-bold text-lg">
                          {preset.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-1">{preset.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {preset.type}
                            </Badge>
                            <Badge
                              variant={preset.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {preset.isActive ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {preset.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <FileCode className="h-4 w-4" />
                          <span>{preset.language || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span>{formatFileSize(preset.size || 0)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {preset.tags && preset.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {preset.tags && preset.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{preset.tags.length - 3}
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
                <h3 className="text-lg font-semibold mb-2">Nenhum preset encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {search || selectedTechnology
                    ? 'Tente ajustar seus filtros de busca'
                    : 'Comece criando seu primeiro preset'}
                </p>
                {!search && !selectedTechnology && (
                  <Button onClick={handleCreatePreset}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Nova Preset
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50 group">
          {/* Tooltip/Label */}
          <button
            onClick={handleCreatePreset}
            className="bg-white dark:bg-gray-800 text-foreground px-4 py-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-sm font-medium border border-border"
          >
            Nova Preset
          </button>

          {/* FAB Button */}
          <button
            onClick={handleCreatePreset}
            className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-110 flex items-center justify-center"
            title="Nova Preset"
          >
            <Plus className="h-6 w-6 transition-transform duration-200 ease-in-out group-hover:rotate-180" />
          </button>
        </div>
      </div>
    </MainLayout>
  )
}