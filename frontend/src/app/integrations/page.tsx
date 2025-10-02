'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRequireAuth } from '@/hooks/useAuth'
import {
  Zap,
  Bot,
  GitCommit,
  MessageSquare,
  Languages,
  Terminal,
  Settings,
  Save
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'

const AI_MODELS = [
  { value: 'grok', label: 'Grok', description: 'Modelo avançado para raciocínio complexo' },
  { value: 'claude', label: 'Claude', description: 'Modelo confiável para análise e escrita' }
]

export default function IntegrationsPage() {
  const auth = useRequireAuth()
  const queryClient = useQueryClient()

  // Estados para os diferentes casos de uso
  const [promptsModel, setPromptsModel] = useState('')
  const [commitsModel, setCommitsModel] = useState('')
  const [promptImprovementModel, setPromptImprovementModel] = useState('')
  const [translationModel, setTranslationModel] = useState('')
  const [commandsModel, setCommandsModel] = useState('')

  // Estados para configurações do terminal
  const [defaultShell, setDefaultShell] = useState('/bin/bash')
  const [workingDirectory, setWorkingDirectory] = useState('/home/user')

  const breadcrumbs = [
    { label: 'Integrações', current: true, icon: Zap }
  ]

  // Buscar configurações salvas
  const { data: settings, isLoading } = useQuery({
    queryKey: ['integration-settings'],
    queryFn: () => api.get('/settings/integrations').then(res => res.data),
    enabled: !!auth,
  })

  // Carregar configurações quando disponíveis
  useEffect(() => {
    if (settings) {
      if (settings.ai) {
        setPromptsModel(settings.ai.prompts || '')
        setCommitsModel(settings.ai.commits || '')
        setPromptImprovementModel(settings.ai.promptImprovement || '')
        setTranslationModel(settings.ai.translation || '')
        setCommandsModel(settings.ai.commands || '')
      }
      if (settings.terminal) {
        setDefaultShell(settings.terminal.defaultShell || '/bin/bash')
        setWorkingDirectory(settings.terminal.workingDirectory || '/home/user')
      }
    }
  }, [settings])

  // Mutation para salvar configurações de IA
  const saveAiMutation = useMutation({
    mutationFn: (data: any) => api.post('/settings/integrations/ai', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-settings'] })
      toast.success('Configurações de IA salvas com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao salvar configurações de IA')
    },
  })

  // Mutation para salvar configurações do terminal
  const saveTerminalMutation = useMutation({
    mutationFn: (data: any) => api.post('/settings/integrations/terminal', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-settings'] })
      toast.success('Configurações do terminal salvas com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao salvar configurações do terminal')
    },
  })

  const handleSaveAi = () => {
    const config = {
      prompts: promptsModel,
      commits: commitsModel,
      promptImprovement: promptImprovementModel,
      translation: translationModel,
      commands: commandsModel
    }
    saveAiMutation.mutate(config)
  }

  const handleSaveTerminal = () => {
    const config = {
      defaultShell,
      workingDirectory
    }
    saveTerminalMutation.mutate(config)
  }

  if (!auth) return null

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* IA Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              Configuração de Modelos de IA
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Selecione os modelos de IA para diferentes casos de uso no sistema
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Grid de configurações */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Prompts Gerais */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <Label htmlFor="prompts-model" className="text-sm font-medium">
                    Prompts Gerais
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Modelo usado para processamento geral de prompts e análises
                </p>
                <Select value={promptsModel} onValueChange={setPromptsModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Commits */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <GitCommit className="h-4 w-4 text-purple-500" />
                  <Label htmlFor="commits-model" className="text-sm font-medium">
                    Geração de Commits
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Modelo usado para gerar mensagens de commit automáticas
                </p>
                <Select value={commitsModel} onValueChange={setCommitsModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Melhoria de Prompts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <Label htmlFor="improvement-model" className="text-sm font-medium">
                    Melhoria de Prompts
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Modelo usado para otimizar e melhorar prompts existentes
                </p>
                <Select value={promptImprovementModel} onValueChange={setPromptImprovementModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tradução */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-orange-500" />
                  <Label htmlFor="translation-model" className="text-sm font-medium">
                    Tradução de Prompts
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Modelo usado para traduzir prompts entre idiomas
                </p>
                <Select value={translationModel} onValueChange={setTranslationModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Comandos */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="commands-model" className="text-sm font-medium">
                    Geração de Comandos
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Modelo usado para gerar e interpretar comandos automatizados
                </p>
                <Select value={commandsModel} onValueChange={setCommandsModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botão de Salvar */}
            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                onClick={handleSaveAi}
                disabled={saveAiMutation.isPending}
                className="flex items-center gap-2"
              >
                {saveAiMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Configurações de IA
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Terminal Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-500" />
              Configurações do Terminal
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure o shell padrão e personalização do terminal SSH
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Shell Padrão */}
              <div className="space-y-3">
                <Label htmlFor="default-shell" className="text-sm font-medium">
                  Shell Padrão
                </Label>
                <Select value={defaultShell} onValueChange={setDefaultShell}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o shell" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/bin/bash">
                      <div className="flex flex-col">
                        <span className="font-medium">Bash</span>
                        <span className="text-xs text-muted-foreground">/bin/bash</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="/bin/zsh">
                      <div className="flex flex-col">
                        <span className="font-medium">Zsh</span>
                        <span className="text-xs text-muted-foreground">/bin/zsh</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="/bin/sh">
                      <div className="flex flex-col">
                        <span className="font-medium">Shell</span>
                        <span className="text-xs text-muted-foreground">/bin/sh</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="/bin/fish">
                      <div className="flex flex-col">
                        <span className="font-medium">Fish</span>
                        <span className="text-xs text-muted-foreground">/bin/fish</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Diretório de Trabalho */}
              <div className="space-y-3">
                <Label htmlFor="working-directory" className="text-sm font-medium">
                  Diretório de Trabalho
                </Label>
                <Input
                  id="working-directory"
                  value={workingDirectory}
                  onChange={(e) => setWorkingDirectory(e.target.value)}
                  placeholder="/home/user"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Botão de Salvar */}
            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                onClick={handleSaveTerminal}
                disabled={saveTerminalMutation.isPending}
                className="flex items-center gap-2"
              >
                {saveTerminalMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Configurações do Terminal
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}