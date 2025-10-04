'use client'

import { useState, useEffect } from 'react'
import { Stack, PresetFile } from '@/types'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'

interface StackSelectorProps {
  selectedStackIds: string[]
  onChange: (stackIds: string[]) => void
}

export default function StackSelector({ selectedStackIds, onChange }: StackSelectorProps) {
  const [stacks, setStacks] = useState<Stack[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedStacks, setExpandedStacks] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchStacks()
  }, [])

  const fetchStacks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/stacks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStacks(data)
      }
    } catch (error) {
      console.error('Erro ao carregar stacks:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStack = (stackId: string) => {
    const newSelectedIds = selectedStackIds.includes(stackId)
      ? selectedStackIds.filter(id => id !== stackId)
      : [...selectedStackIds, stackId]

    onChange(newSelectedIds)
  }

  const toggleExpanded = (stackId: string) => {
    const newExpanded = new Set(expandedStacks)
    if (newExpanded.has(stackId)) {
      newExpanded.delete(stackId)
    } else {
      newExpanded.add(stackId)
    }
    setExpandedStacks(newExpanded)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (stacks.length === 0) {
    return (
      <div className="text-center p-8 bg-muted rounded-lg">
        <p className="text-muted-foreground">Nenhuma stack disponível</p>
        <p className="text-sm text-muted-foreground mt-2">
          Crie stacks em <a href="/preset-library" className="text-blue-600 hover:underline">Preset Library</a>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-2">
        Selecione as stacks de tecnologia para este projeto
      </div>

      {stacks.map((stack) => {
        const isSelected = selectedStackIds.includes(stack.id)
        const isExpanded = expandedStacks.has(stack.id)

        return (
          <div
            key={stack.id}
            className={`border rounded-lg transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Stack Header */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleStack(stack.id)}
                  className={`flex-shrink-0 mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>

                {/* Stack Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{stack.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{stack.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {stack.technology} • v{stack.version}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-2">
                    {stack.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {stack.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Presets Count */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span>{stack.presets?.length || 0} presets incluídos</span>
                    {stack.author && <span>Por {stack.author}</span>}
                  </div>
                </div>

                {/* Expand Button */}
                {stack.presets && stack.presets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(stack.id)}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Presets List (Expandable) */}
            {isExpanded && stack.presets && stack.presets.length > 0 && (
              <div className="border-t border-gray-200 bg-white p-4">
                <h4 className="font-medium text-sm mb-3">Presets incluídos:</h4>
                <div className="space-y-2">
                  {stack.presets.map((preset: PresetFile) => (
                    <div
                      key={preset.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-gray-50"
                    >
                      <span className="text-lg">{getPresetTypeIcon(preset.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{preset.name}</span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded border ${getPresetTypeColor(
                              preset.type
                            )}`}
                          >
                            {preset.type}
                          </span>
                        </div>
                        {preset.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {preset.description}
                          </p>
                        )}
                        {preset.filename && (
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            {preset.filename}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(preset.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Summary */}
      {selectedStackIds.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            {selectedStackIds.length} stack{selectedStackIds.length > 1 ? 's' : ''} selecionada
            {selectedStackIds.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Todos os presets destas stacks serão aplicados ao projeto
          </p>
        </div>
      )}
    </div>
  )
}
