'use client'

import { useState } from 'react'
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
  Save,
  CheckCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const AI_MODELS = [
  { value: 'grok', label: 'Grok', description: 'Modelo avançado para raciocínio complexo' },
  { value: 'claude', label: 'Claude', description: 'Modelo confiável para análise e escrita' }
]

export default function IntegrationsPage() {
  const auth = useRequireAuth()

  // Estados para os diferentes casos de uso
  const [promptsModel, setPromptsModel] = useState('')
  const [commitsModel, setCommitsModel] = useState('')
  const [promptImprovementModel, setPromptImprovementModel] = useState('')
  const [translationModel, setTranslationModel] = useState('')
  const [commandsModel, setCommandsModel] = useState('')

  // Estados para configurações do terminal
  const [defaultShell, setDefaultShell] = useState('/bin/bash')
  const [workingDirectory, setWorkingDirectory] = useState('/home/user')
  const [terminalTheme, setTerminalTheme] = useState('dark')
  const [fontSize, setFontSize] = useState('14')
  const [fontFamily, setFontFamily] = useState('monospace')

  const [isSaving, setIsSaving] = useState(false)

  const breadcrumbs = [
    { label: 'Integrações', current: true }
  ]

  const handleSave = async () => {
    setIsSaving(true)

    // Simular salvamento das configurações
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const config = {
        ai: {
          prompts: promptsModel,
          commits: commitsModel,
          promptImprovement: promptImprovementModel,
          translation: translationModel,
          commands: commandsModel
        },
        terminal: {
          defaultShell,
          workingDirectory,
          terminalTheme,
          fontSize: parseInt(fontSize),
          fontFamily
        }
      }

      // Aqui seria feita a chamada à API para salvar as configurações
      console.log('Configurações de IA salvas:', config)

      toast.success('Configurações de IA salvas com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  if (!auth) return null

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Integrações</h1>
            <p className="text-muted-foreground">
              Configure integrações com serviços externos e modelos de IA
            </p>
          </div>
        </div>

        {/* IA Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Terminal Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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

              {/* Tema do Terminal */}
              <div className="space-y-3">
                <Label htmlFor="terminal-theme" className="text-sm font-medium">
                  Tema do Terminal
                </Label>
                <Select value={terminalTheme} onValueChange={setTerminalTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">
                      <div className="flex flex-col">
                        <span className="font-medium">Escuro</span>
                        <span className="text-xs text-muted-foreground">Tema escuro padrão</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="light">
                      <div className="flex flex-col">
                        <span className="font-medium">Claro</span>
                        <span className="text-xs text-muted-foreground">Tema claro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="monokai">
                      <div className="flex flex-col">
                        <span className="font-medium">Monokai</span>
                        <span className="text-xs text-muted-foreground">Tema Monokai colorido</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tamanho da Fonte */}
              <div className="space-y-3">
                <Label htmlFor="font-size" className="text-sm font-medium">
                  Tamanho da Fonte
                </Label>
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12px</SelectItem>
                    <SelectItem value="14">14px</SelectItem>
                    <SelectItem value="16">16px</SelectItem>
                    <SelectItem value="18">18px</SelectItem>
                    <SelectItem value="20">20px</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Família da Fonte */}
              <div className="space-y-3 md:col-span-2">
                <Label htmlFor="font-family" className="text-sm font-medium">
                  Família da Fonte
                </Label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monospace">
                      <div className="flex flex-col">
                        <span className="font-medium">Monospace</span>
                        <span className="text-xs text-muted-foreground">Fonte monoespaçada padrão</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="'Fira Code', monospace">
                      <div className="flex flex-col">
                        <span className="font-medium">Fira Code</span>
                        <span className="text-xs text-muted-foreground">Fonte com ligatures</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="'JetBrains Mono', monospace">
                      <div className="flex flex-col">
                        <span className="font-medium">JetBrains Mono</span>
                        <span className="text-xs text-muted-foreground">Fonte otimizada para código</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="'Source Code Pro', monospace">
                      <div className="flex flex-col">
                        <span className="font-medium">Source Code Pro</span>
                        <span className="text-xs text-muted-foreground">Fonte Adobe</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status das Integrações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Status das Integrações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">API de IA</span>
                </div>
                <span className="text-xs text-green-600 font-medium">Conectado</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Webhook Integration</span>
                </div>
                <span className="text-xs text-yellow-600 font-medium">Configurando</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}