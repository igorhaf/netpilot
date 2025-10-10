'use client'

import { useState, useEffect } from 'react'
import { PresetFile } from '@/types'
import { Check, Search, Filter } from 'lucide-react'

interface PresetSelectorProps {
  selectedPresetIds: string[]
  onChange: (presetIds: string[]) => void
  excludeStackPresets?: boolean // Apenas presets soltos (sem stack associada)
}

export default function PresetSelector({
  selectedPresetIds,
  onChange,
  excludeStackPresets = true
}: PresetSelectorProps) {
  const [presets, setPresets] = useState<PresetFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    fetchPresets()
  }, [])

  const fetchPresets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/presets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        let data = await response.json()

        // Se excludeStackPresets = true, filtrar apenas presets sem stack
        if (excludeStackPresets) {
          // TODO: Precisamos de um endpoint que retorne apenas presets soltos
          // Por enquanto, vamos mostrar todos
        }

        setPresets(data)
      }
    } catch (error) {
      console.error('Erro ao carregar presets:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePreset = (presetId: string) => {
    const newSelectedIds = selectedPresetIds.includes(presetId)
      ? selectedPresetIds.filter(id => id !== presetId)
      : [...selectedPresetIds, presetId]

    onChange(newSelectedIds)
  }

  const getPresetTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      docker: 'bg-blue-100 text-blue-800 border-blue-200',
      persona: 'bg-purple-100 text-purple-800 border-purple-200',
      config: 'bg-green-100 text-green-800 border-green-200',
      script: 'bg-orange-100 text-orange-800 border-orange-200',
      template: 'bg-pink-100 text-pink-800 border-pink-200'
    }
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getPresetTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      docker: '🐳',
      persona: '👤',
      config: '⚙️',
      script: '📜',
      template: '📄'
    }
    return icons[type] || '📦'
  }

  // Filtros
  const filteredPresets = presets.filter(preset => {
    const matchesSearch = preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         preset.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || preset.type === filterType
    return matchesSearch && matchesType
  })

  // Agrupar por tipo
  const presetsByType = filteredPresets.reduce((acc, preset) => {
    if (!acc[preset.type]) {
      acc[preset.type] = []
    }
    acc[preset.type].push(preset)
    return acc
  }, {} as Record<string, PresetFile[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        Selecione os presets de tecnologia e personas que deseja usar neste projeto
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar presets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Todos os tipos</option>
          <option value="docker">Docker</option>
          <option value="persona">Persona</option>
          <option value="config">Config</option>
          <option value="script">Script</option>
          <option value="template">Template</option>
        </select>
      </div>

      {/* Presets List */}
      {filteredPresets.length === 0 ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">
            {searchTerm || filterType !== 'all'
              ? 'Nenhum preset encontrado com os filtros aplicados'
              : 'Nenhum preset disponível'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(presetsByType).map(([type, typedPresets]) => (
            <div key={type} className="space-y-2">
              {/* Type Header */}
              <div className="flex items-center gap-2 px-2">
                <span className="text-lg">{getPresetTypeIcon(type)}</span>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-600">
                  {type} ({typedPresets.length})
                </h3>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {typedPresets.map((preset) => {
                  const isSelected = selectedPresetIds.includes(preset.id)

                  return (
                    <div
                      key={preset.id}
                      onClick={() => togglePreset(preset.id)}
                      className={`cursor-pointer border rounded-lg p-3 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div
                          className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>

                        {/* Preset Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{preset.name}</h4>
                            <span
                              className={`px-2 py-0.5 text-xs rounded border flex-shrink-0 ${getPresetTypeColor(
                                preset.type
                              )}`}
                            >
                              {preset.type}
                            </span>
                          </div>

                          {preset.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {preset.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            {preset.filename && (
                              <span className="font-mono truncate">{preset.filename}</span>
                            )}
                            <span className="flex-shrink-0">
                              {(preset.size / 1024).toFixed(1)} KB
                            </span>
                          </div>

                          {/* Tags */}
                          {preset.tags && preset.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {preset.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {preset.tags.length > 3 && (
                                <span className="px-1.5 py-0.5 text-xs text-gray-500">
                                  +{preset.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {selectedPresetIds.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-900">
            {selectedPresetIds.length} preset{selectedPresetIds.length > 1 ? 's' : ''} selecionado
            {selectedPresetIds.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-green-700 mt-1">
            Estes presets serão aplicados ao projeto como contexto para a IA
          </p>
        </div>
      )}
    </div>
  )
}
