'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Globe, GitBranch, FileText, Calendar, Tag, ExternalLink, Terminal, Info, MessageSquare, Settings, Send, Bot, Loader2, GitPullRequest, Key, Copy, Trash2, Check, Layers, Upload, Download, RefreshCw } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProjectTerminal } from '@/components/terminal/ProjectTerminal'
import { useRequireAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { Project, Domain } from '@/types'
import toast from 'react-hot-toast'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer'
import { TerminalMessage } from '@/components/chat/TerminalMessage'

export default function ProjectDetailsPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id as string
  const [activeTab, setActiveTab] = useState('chat')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [copiedKey, setCopiedKey] = useState(false)
  const [isTerminalMode, setIsTerminalMode] = useState(false) // true = terminal, false = AI
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([])
  const [userPromptText, setUserPromptText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [finalPromptText, setFinalPromptText] = useState('')
  const [activePromptTab, setActivePromptTab] = useState<'context' | 'prompt' | 'final'>('prompt')
  const [commits, setCommits] = useState<string[]>([])
  const [newCommit, setNewCommit] = useState('')
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageModalSrc, setImageModalSrc] = useState('')

  // Git tab states
  const [activeGitTab, setActiveGitTab] = useState<'status' | 'commit' | 'config'>('status')
  const [gitStatus, setGitStatus] = useState<any>(null)
  const [gitDiff, setGitDiff] = useState('')
  const [commitMessage, setCommitMessage] = useState('')
  const [stagedFiles, setStagedFiles] = useState<string[]>([])
  const [generatingCommitMessage, setGeneratingCommitMessage] = useState(false)
  const [repositoryUrl, setRepositoryUrl] = useState('')

  // Stack configuration states
  const [stackConfig, setStackConfig] = useState({
    frontend: [] as string[],
    backend: [] as string[],
    database: [] as string[],
    services: [] as string[],
    personas: [] as string[]
  })

  const toggleTech = (category: keyof typeof stackConfig, tech: string) => {
    setStackConfig(prev => ({
      ...prev,
      [category]: prev[category].includes(tech)
        ? prev[category].filter(t => t !== tech)
        : [...prev[category], tech]
    }))
  }

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(res => res.data),
    enabled: !!projectId
  })

  // Query para buscar presets do projeto
  const { data: projectPresets } = useQuery({
    queryKey: ['project-presets', projectId],
    queryFn: () => api.get(`/projects/${projectId}/presets`).then(res => res.data),
    enabled: !!projectId && activeTab === 'stack',
  })

  // Query para buscar TODOS os presets disponíveis
  const { data: allPresets } = useQuery({
    queryKey: ['all-presets'],
    queryFn: () => api.get('/presets').then(res => res.data),
    enabled: activeTab === 'stack',
  })

  // Mutation para salvar contextos de prompt
  const savePresetsMutation = useMutation({
    mutationFn: async (presetIds: string[]) => {
      return api.patch(`/projects/${projectId}/presets`, { presetIds }).then(res => res.data)
    },
    onSuccess: () => {
      toast.success('Contextos de prompt atualizados com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['project-presets', projectId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar contextos')
    },
  })

  // Inicializar selectedPresetIds quando projectPresets carregar
  useEffect(() => {
    if (projectPresets?.presets) {
      const ids = projectPresets.presets.map((p: any) => p.id)
      setSelectedPresetIds(ids)
    }
  }, [projectPresets])

  // Query para buscar mensagens do chat
  const { data: chatMessages } = useQuery({
    queryKey: ['chat-messages', projectId],
    queryFn: () => api.get(`/chat/project/${projectId}?limit=100`).then(res => res.data),
    enabled: !!projectId && activeTab === 'chat',
    refetchInterval: 3000, // Atualizar a cada 3 segundos
  })

  // Atualizar messages baseado em chatMessages
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      const formattedMessages = chatMessages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
        status: msg.status,
        isCommand: msg.metadata?.isCommand,
        isCommandOutput: msg.metadata?.isCommandOutput,
      }))
      setMessages(formattedMessages)
    }
  }, [chatMessages])

  // Mutation para clonar repositório
  const cloneRepositoryMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/projects/${projectId}/clone`).then(res => res.data)
    },
    onSuccess: () => {
      toast.success('Repositório clonado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao clonar repositório')
    },
  })

  // Mutation para gerar chave SSH
  const generateSshKeyMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/projects/${projectId}/ssh/generate`).then(res => res.data)
    },
    onSuccess: () => {
      toast.success('Chave SSH gerada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao gerar chave SSH')
    },
  })

  // Mutation para deletar chave SSH
  const deleteSshKeyMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/projects/${projectId}/ssh`).then(res => res.data)
    },
    onSuccess: () => {
      toast.success('Chave SSH deletada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao deletar chave SSH')
    },
  })

  // Query para buscar git status
  const { data: gitStatusData, refetch: refetchGitStatus } = useQuery({
    queryKey: ['git-status', projectId],
    queryFn: () => api.get(`/projects/${projectId}/git/status`).then(res => res.data),
    enabled: !!projectId && activeTab === 'git' && project?.cloned,
    refetchInterval: 5000,
  })

  // Mutation para git pull
  const gitPullMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/projects/${projectId}/git/pull`).then(res => res.data)
    },
    onSuccess: () => {
      toast.success('Pull realizado com sucesso!')
      refetchGitStatus()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao fazer pull')
    },
  })

  // Mutation para git commit
  const gitCommitMutation = useMutation({
    mutationFn: async (message: string) => {
      return api.post(`/projects/${projectId}/git/commit`, { message }).then(res => res.data)
    },
    onSuccess: () => {
      toast.success('Commit realizado com sucesso!')
      setCommitMessage('')
      setStagedFiles([])
      refetchGitStatus()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao fazer commit')
    },
  })

  // Mutation para git push
  const gitPushMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/projects/${projectId}/git/push`).then(res => res.data)
    },
    onSuccess: () => {
      toast.success('Push realizado com sucesso!')
      refetchGitStatus()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao fazer push')
    },
  })

  // Mutation para stage/unstage arquivos
  const gitStageMutation = useMutation({
    mutationFn: async ({ file, stage }: { file: string; stage: boolean }) => {
      return api.post(`/projects/${projectId}/git/stage`, { file, stage }).then(res => res.data)
    },
    onSuccess: () => {
      refetchGitStatus()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao stage/unstage arquivo')
    },
  })

  // Mutation para gerar mensagem de commit com IA
  const generateCommitMessageMutation = useMutation({
    mutationFn: async (diff: string) => {
      return api.post(`/projects/${projectId}/git/generate-commit-message`, { diff }).then(res => res.data)
    },
    onSuccess: (data) => {
      setCommitMessage(data.message)
      toast.success('Mensagem de commit gerada!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao gerar mensagem de commit')
    },
  })

  // Query para buscar diff
  const { data: gitDiffData } = useQuery({
    queryKey: ['git-diff', projectId],
    queryFn: () => api.get(`/projects/${projectId}/git/diff`).then(res => res.data),
    enabled: !!projectId && activeTab === 'git' && activeGitTab === 'commit' && project?.cloned,
  })

  // Inicializar repositoryUrl quando project carregar
  useEffect(() => {
    if (project?.repository) {
      setRepositoryUrl(project.repository)
    }
  }, [project])

  // Função para copiar chave pública
  const handleCopyPublicKey = () => {
    if (project?.sshPublicKey) {
      navigator.clipboard.writeText(project.sshPublicKey)
      setCopiedKey(true)
      toast.success('Chave pública copiada!')
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }

  // Mutation para enviar mensagem (AI ou Terminal)
  const sendPromptMutation = useMutation({
    mutationFn: async (promptMessage: string) => {
      // MODO TERMINAL: executar comando shell direto
      if (isTerminalMode) {
        const response = await api.post(`/projects/${projectId}/execute-command`, {
          command: promptMessage
        })
        return response.data
      }

      // MODO AI: executar prompt com Claude Code
      const response = await api.post(`/projects/${projectId}/execute-prompt`, {
        prompt: promptMessage
      })

      return response.data
    },
    onSuccess: (data) => {
      // Invalidar chat messages para recarregar
      queryClient.invalidateQueries({ queryKey: ['chat-messages', projectId] })

      toast.success(data.success ? 'Executado com sucesso!' : 'Executado com erros')
      setMessage('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar mensagem')
    },
  })

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (!message.trim()) return
    sendPromptMutation.mutate(message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const togglePreset = (presetId: string) => {
    setSelectedPresetIds(prev =>
      prev.includes(presetId)
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    )
  }

  const handleSavePresets = () => {
    savePresetsMutation.mutate(selectedPresetIds)
  }

  // Gerar contexto com base nos presets selecionados
  const generateContext = () => {
    if (!allPresets || selectedPresetIds.length === 0) return ''

    let context = '## CONTEXTO DO DESENVOLVIMENTO\n\n'

    const selectedPresets = allPresets.filter((p: any) => selectedPresetIds.includes(p.id))

    // Frontend
    const frontend = selectedPresets.filter((p: any) => p.tags?.includes('frontend'))
    if (frontend.length > 0) {
      context += '### Frontend:\n'
      frontend.forEach((p: any) => {
        context += `- ${p.name}\n`
      })
      context += '\n'
    }

    // Backend
    const backend = selectedPresets.filter((p: any) => p.tags?.includes('backend'))
    if (backend.length > 0) {
      context += '### Backend:\n'
      backend.forEach((p: any) => {
        context += `- ${p.name}\n`
      })
      context += '\n'
    }

    // Database
    const database = selectedPresets.filter((p: any) => p.tags?.includes('database'))
    if (database.length > 0) {
      context += '### Database:\n'
      database.forEach((p: any) => {
        context += `- ${p.name}\n`
      })
      context += '\n'
    }

    // Personas
    const personas = selectedPresets.filter((p: any) => p.type === 'persona')
    if (personas.length > 0) {
      context += '### Persona:\n'
      personas.forEach((p: any) => {
        context += `${p.name}\n`
      })
      context += '\n'
    }

    return context
  }

  // Gerar prompt final
  const generateFinalPrompt = () => {
    let finalPrompt = generateContext()

    if (uploadedFiles.length > 0) {
      finalPrompt += '### Arquivos Anexados:\n'
      uploadedFiles.forEach(file => {
        finalPrompt += `- ${file.name} (${file.type})\n`
      })
      finalPrompt += '\n'
    }

    if (userPromptText.trim()) {
      finalPrompt += '## REQUISIÇÃO\n\n'
      finalPrompt += userPromptText
    }

    return finalPrompt || 'Configure o contexto e digite seu prompt...'
  }

  // Atualizar prompt final automaticamente quando contextos mudarem
  useEffect(() => {
    setFinalPromptText(generateFinalPrompt())
  }, [selectedPresetIds, uploadedFiles, userPromptText, allPresets])

  // Upload de arquivos
  const handleFileUpload = (files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const fileObj = {
          name: file.name,
          type: file.type,
          content: e.target?.result,
          size: file.size
        }

        setUploadedFiles(prev => [...prev, fileObj])
      }

      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file)
      } else {
        reader.readAsText(file)
      }
    })
  }

  // Paste event para imagens
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== 'stack') return

      const items = e.clipboardData?.items
      if (!items) return

      for (let item of Array.from(items)) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile()
          if (file) handleFileUpload([file])
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [activeTab])

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const copyFinalPrompt = () => {
    navigator.clipboard.writeText(finalPromptText)
    toast.success('Prompt copiado!')
  }

  const regenerateFinalPrompt = () => {
    setFinalPromptText(generateFinalPrompt())
    toast.success('Prompt regenerado!')
  }

  const translateToEnglish = () => {
    const currentText = finalPromptText
    const translatedPrompt = `Translate the following prompt to English and return only the translated version:\n\n${currentText}`
    setFinalPromptText(translatedPrompt)
    toast.success('Instrução de tradução adicionada!')
  }

  const addCommit = () => {
    if (newCommit.trim()) {
      setCommits(prev => [...prev, newCommit.trim()])
      setNewCommit('')
    }
  }

  const removeCommit = (index: number) => {
    setCommits(prev => prev.filter((_, i) => i !== index))
  }

  const openImageModal = (src: string) => {
    setImageModalSrc(src)
    setImageModalOpen(true)
  }

  const closeImageModal = () => {
    setImageModalOpen(false)
    setImageModalSrc('')
  }

  if (!auth) return null

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando projeto...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Projeto não encontrado</h2>
            <p className="text-muted-foreground mb-4">O projeto solicitado não existe ou foi removido.</p>
            <Button onClick={() => router.push('/projects')} variant="outline">
              Voltar para Projetos
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const breadcrumbs = [
    { label: 'Projetos', href: '/projects' },
    { label: project.name, current: true, icon: Bot }
  ]

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-4">
        {/* Navegação por Abas */}
        <div className="flex space-x-1 border-b overflow-x-auto">
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'git', label: 'Git', icon: GitBranch },
            { id: 'stack', label: 'Contextos de Prompt', icon: Layers },
            { id: 'terminal', label: 'Terminal', icon: Terminal },
            { id: 'overview', label: 'Info', icon: Info }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo baseado na aba ativa */}
        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-180px)]">
            <Card className="h-full flex flex-col bg-black border-gray-800">
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-black text-gray-100">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center space-y-3">
                      {isTerminalMode ? (
                        <>
                          <Terminal className="h-16 w-16 mx-auto text-green-500/50" />
                          <p className="text-lg font-mono">Terminal Shell Interativo</p>
                          <p className="text-sm">Execute comandos Linux no diretório do projeto</p>
                          <div className="text-xs text-muted-foreground/70 font-mono bg-muted/50 rounded px-3 py-2 inline-block">
                            <div>$ ls -la</div>
                            <div>$ cat package.json</div>
                            <div>$ npm install</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Bot className="h-16 w-16 mx-auto text-blue-500/50" />
                          <p className="text-lg">Inicie uma conversa com a IA</p>
                          <p className="text-sm">Envie um prompt para gerar código com Claude AI</p>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <div key={idx} className="mb-4">
                        {msg.isTyping ? (
                          <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <span className="animate-bounce inline-block" style={{ animationDelay: '0ms' }}>.</span>
                            <span className="animate-bounce inline-block" style={{ animationDelay: '150ms' }}>.</span>
                            <span className="animate-bounce inline-block" style={{ animationDelay: '300ms' }}>.</span>
                          </div>
                        ) : (
                          <div className="font-mono text-xs">
                            <MarkdownRenderer content={msg.content} />
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </CardContent>
              <div className="p-2 border-t border-gray-800 space-y-2 bg-black">
                {/* Toggle Terminal/AI Mode */}
                <div className="flex items-center justify-between px-2">
                  <label className="text-xs font-medium text-gray-400">
                    Tipo de Interação
                  </label>
                  <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-lg">
                    <button
                      onClick={() => setIsTerminalMode(true)}
                      className={`text-xs px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                        isTerminalMode
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'hover:bg-muted-foreground/10 text-muted-foreground'
                      }`}
                    >
                      <Terminal className="h-3 w-3" />
                      Terminal
                    </button>
                    <button
                      onClick={() => setIsTerminalMode(false)}
                      className={`text-xs px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                        !isTerminalMode
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'hover:bg-muted-foreground/10 text-muted-foreground'
                      }`}
                    >
                      <Bot className="h-3 w-3" />
                      IA
                    </button>
                  </div>
                </div>


                <div className="flex gap-2 items-end">
                  <Textarea
                    placeholder={isTerminalMode ? "$ Digite um comando Linux (ex: ls, pwd, cat arquivo.txt)..." : "Digite seu prompt para a IA..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="min-h-[36px] max-h-[120px] resize-none py-2 font-mono bg-transparent border-white text-white placeholder:text-gray-500"
                    rows={1}
                    disabled={sendPromptMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendPromptMutation.isPending}
                    size="sm"
                    className="h-9 w-9 flex-shrink-0 p-0"
                  >
                    {sendPromptMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Aba Contextos de Prompt */}
        {activeTab === 'stack' && (
          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {!projectPresets || !allPresets ? (
              <div className="flex items-center justify-center w-full p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Sidebar - Três Seções com Scroll Independente */}
                <div className="w-56 border-r border-border flex flex-col h-full">

                  {/* Seção 1: Commits */}
                  <div className="border-b border-border p-4 max-h-[30%] overflow-y-auto">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                      <GitBranch className="h-3 w-3" />
                      Commits
                    </h3>
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        <Input
                          type="text"
                          value={newCommit}
                          onChange={(e) => setNewCommit(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCommit()}
                          placeholder="Hash ou mensagem..."
                          className="text-xs h-7"
                        />
                        <Button
                          onClick={addCommit}
                          size="sm"
                          className="h-7 px-2"
                        >
                          +
                        </Button>
                      </div>
                      {commits.length > 0 && (
                        <div className="space-y-1">
                          {commits.map((commit, index) => (
                            <div key={index} className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1">
                              <span className="text-xs truncate flex-1">{commit}</span>
                              <button
                                onClick={() => removeCommit(index)}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seção 2: Arquivos Anexados */}
                  {uploadedFiles.length > 0 && (
                    <div className="border-b border-border p-4 max-h-[30%] overflow-y-auto">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Arquivos Anexados ({uploadedFiles.length})
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            {file.type.startsWith('image/') ? (
                              <div
                                onClick={() => openImageModal(file.content)}
                                className="relative rounded border border-border overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary transition-all"
                                style={{ width: '32px', height: '32px' }}
                              >
                                <img
                                  src={file.content}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeFile(index)
                                  }}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px] hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div
                                className="relative rounded border border-border bg-muted/50 flex items-center justify-center"
                                style={{ width: '32px', height: '32px' }}
                              >
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <button
                                  onClick={() => removeFile(index)}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px] hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seção 3: Presets (Conteúdo Atual) */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-6">
                      {/* Frontend */}
                      {allPresets.filter((p: any) => p.tags?.includes('frontend')).length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                            <Layers className="h-3 w-3" />
                            Frontend
                          </h3>
                          <div className="space-y-1">
                            {allPresets
                              .filter((p: any) => p.tags?.includes('frontend'))
                              .map((preset: any) => {
                                const isSelected = selectedPresetIds.includes(preset.id)
                                return (
                                  <button
                                    key={preset.id}
                                    onClick={() => togglePreset(preset.id)}
                                    className={`w-full p-2 rounded text-xs transition-all text-left ${
                                      isSelected
                                        ? 'bg-blue-500/10 border border-blue-500/50 text-foreground'
                                        : 'bg-muted/50 border border-transparent hover:bg-muted text-foreground'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-blue-500' : 'bg-muted-foreground/30'}`} />
                                      <span className="truncate">{preset.name}</span>
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Backend */}
                      {allPresets.filter((p: any) => p.tags?.includes('backend')).length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                            <Layers className="h-3 w-3" />
                            Backend
                          </h3>
                          <div className="space-y-1">
                            {allPresets
                              .filter((p: any) => p.tags?.includes('backend'))
                              .map((preset: any) => {
                                const isSelected = selectedPresetIds.includes(preset.id)
                                return (
                                  <button
                                    key={preset.id}
                                    onClick={() => togglePreset(preset.id)}
                                    className={`w-full p-2 rounded text-xs transition-all text-left ${
                                      isSelected
                                        ? 'bg-green-500/10 border border-green-500/50 text-foreground'
                                        : 'bg-muted/50 border border-transparent hover:bg-muted text-foreground'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                                      <span className="truncate">{preset.name}</span>
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Database */}
                      {allPresets.filter((p: any) => p.tags?.includes('database')).length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                            <Layers className="h-3 w-3" />
                            Database
                          </h3>
                          <div className="space-y-1">
                            {allPresets
                              .filter((p: any) => p.tags?.includes('database'))
                              .map((preset: any) => {
                                const isSelected = selectedPresetIds.includes(preset.id)
                                return (
                                  <button
                                    key={preset.id}
                                    onClick={() => togglePreset(preset.id)}
                                    className={`w-full p-2 rounded text-xs transition-all text-left ${
                                      isSelected
                                        ? 'bg-orange-500/10 border border-orange-500/50 text-foreground'
                                        : 'bg-muted/50 border border-transparent hover:bg-muted text-foreground'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-orange-500' : 'bg-muted-foreground/30'}`} />
                                      <span className="truncate">{preset.name}</span>
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {/* Personas */}
                      {allPresets.filter((p: any) => p.type === 'persona').length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                            <Bot className="h-3 w-3" />
                            Personas
                          </h3>
                          <div className="space-y-1">
                            {allPresets
                              .filter((p: any) => p.type === 'persona')
                              .map((preset: any) => {
                                const isSelected = selectedPresetIds.includes(preset.id)
                                return (
                                  <button
                                    key={preset.id}
                                    onClick={() => togglePreset(preset.id)}
                                    className={`w-full p-2 rounded text-xs transition-all text-left ${
                                      isSelected
                                        ? 'bg-purple-500/10 border border-purple-500/50 text-foreground'
                                        : 'bg-muted/50 border border-transparent hover:bg-muted text-foreground'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-purple-500' : 'bg-muted-foreground/30'}`} />
                                      <span className="truncate">{preset.name}</span>
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Content Area - Prompt Builder */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Sub-Tabs Navigation */}
                  <div className="flex space-x-1 border-b mb-4">
                    <button
                      onClick={() => setActivePromptTab('context')}
                      className={`px-3 py-2 text-xs font-medium rounded-t transition-colors ${
                        activePromptTab === 'context'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Contexto Gerado
                    </button>
                    <button
                      onClick={() => setActivePromptTab('prompt')}
                      className={`px-3 py-2 text-xs font-medium rounded-t transition-colors ${
                        activePromptTab === 'prompt'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Seu Prompt
                    </button>
                    <button
                      onClick={() => setActivePromptTab('final')}
                      className={`px-3 py-2 text-xs font-medium rounded-t transition-colors ${
                        activePromptTab === 'final'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Prompt Final
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto">
                    {activePromptTab === 'context' && (
                      <div>
                        <Textarea
                          value={generateContext()}
                          readOnly
                          className="min-h-[400px] font-mono text-xs bg-muted/50 resize-none"
                          placeholder="Selecione contextos na barra lateral..."
                        />
                      </div>
                    )}

                    {activePromptTab === 'prompt' && (
                      <div>
                        <div
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('ring-2', 'ring-primary')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('ring-2', 'ring-primary')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('ring-2', 'ring-primary')
                            handleFileUpload(e.dataTransfer.files)
                          }}
                        >
                          <Textarea
                            value={userPromptText}
                            onChange={(e) => setUserPromptText(e.target.value)}
                            className="min-h-[400px] resize-none"
                            placeholder="Digite seu prompt aqui... (Arraste arquivos ou Ctrl+V para colar imagens)"
                          />
                        </div>
                      </div>
                    )}

                    {activePromptTab === 'final' && (
                      <div className="space-y-4">
                        <div
                          className="relative group"
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('ring-2', 'ring-primary')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('ring-2', 'ring-primary')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('ring-2', 'ring-primary')
                            handleFileUpload(e.dataTransfer.files)
                          }}
                        >
                          <Textarea
                            value={finalPromptText}
                            onChange={(e) => setFinalPromptText(e.target.value)}
                            className="min-h-[400px] font-mono text-xs resize-none"
                            placeholder="O prompt contextualizado aparecerá aqui... (Arraste arquivos ou Ctrl+V para colar imagens)"
                          />
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              onClick={translateToEnglish}
                              variant="secondary"
                              size="sm"
                              className="h-7 text-xs"
                            >
                              🌐 EN
                            </Button>
                            <Button
                              onClick={regenerateFinalPrompt}
                              variant="secondary"
                              size="sm"
                              className="h-7 text-xs"
                            >
                              <Loader2 className="h-3 w-3 mr-1" />
                              Regenerar
                            </Button>
                          </div>
                        </div>
                        <Button
                          onClick={copyFinalPrompt}
                          className="w-full"
                          variant="default"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar Prompt Contextualizado
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'git' && (
          <div className="flex flex-col h-[calc(100vh-200px)]">
            {/* Sub-Tabs Git */}
            <div className="flex space-x-1 border-b mb-4">
              <button
                onClick={() => setActiveGitTab('status')}
                className={`px-3 py-2 text-xs font-medium rounded-t transition-colors ${
                  activeGitTab === 'status'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Status & Pull
              </button>
              <button
                onClick={() => setActiveGitTab('commit')}
                className={`px-3 py-2 text-xs font-medium rounded-t transition-colors ${
                  activeGitTab === 'commit'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Commit & Push
              </button>
              <button
                onClick={() => setActiveGitTab('config')}
                className={`px-3 py-2 text-xs font-medium rounded-t transition-colors ${
                  activeGitTab === 'config'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Configuração
              </button>
            </div>

            {/* Git Status & Pull Tab */}
            {activeGitTab === 'status' && (
              <div className="flex-1 overflow-y-auto space-y-4">
                {!project.cloned ? (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-muted-foreground text-center">Repositório ainda não clonado. Configure na aba Configuração.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Ações Git */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => gitPullMutation.mutate()}
                        disabled={gitPullMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        {gitPullMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Pull
                      </Button>
                      <Button
                        onClick={() => refetchGitStatus()}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Atualizar
                      </Button>
                    </div>

                    {/* Git Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Status do Repositório</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {gitStatusData ? (
                          <div className="space-y-4">
                            {/* Modified Files */}
                            {gitStatusData.modified && gitStatusData.modified.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-amber-600 mb-2">Modificados ({gitStatusData.modified.length})</h4>
                                <div className="space-y-1">
                                  {gitStatusData.modified.map((file: string, idx: number) => (
                                    <div key={idx} className="text-xs font-mono bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                                      {file}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Untracked Files */}
                            {gitStatusData.untracked && gitStatusData.untracked.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-gray-600 mb-2">Não Rastreados ({gitStatusData.untracked.length})</h4>
                                <div className="space-y-1">
                                  {gitStatusData.untracked.map((file: string, idx: number) => (
                                    <div key={idx} className="text-xs font-mono bg-gray-50 dark:bg-gray-950/20 p-2 rounded">
                                      {file}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Deleted Files */}
                            {gitStatusData.deleted && gitStatusData.deleted.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-red-600 mb-2">Deletados ({gitStatusData.deleted.length})</h4>
                                <div className="space-y-1">
                                  {gitStatusData.deleted.map((file: string, idx: number) => (
                                    <div key={idx} className="text-xs font-mono bg-red-50 dark:bg-red-950/20 p-2 rounded">
                                      {file}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Clean State */}
                            {(!gitStatusData.modified || gitStatusData.modified.length === 0) &&
                              (!gitStatusData.untracked || gitStatusData.untracked.length === 0) &&
                              (!gitStatusData.deleted || gitStatusData.deleted.length === 0) && (
                                <p className="text-sm text-green-600 flex items-center gap-2">
                                  <Check className="h-4 w-4" />
                                  Árvore de trabalho limpa
                                </p>
                              )}

                            {/* Branch Info */}
                            {gitStatusData.branch && (
                              <div className="pt-4 border-t">
                                <p className="text-xs text-muted-foreground">
                                  Branch: <span className="font-mono font-semibold">{gitStatusData.branch}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* Git Commit & Push Tab */}
            {activeGitTab === 'commit' && (
              <div className="flex-1 overflow-y-auto space-y-4">
                {!project.cloned ? (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-muted-foreground text-center">Repositório ainda não clonado. Configure na aba Configuração.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Diff Viewer */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>Alterações (Diff)</span>
                          <Button
                            onClick={() => generateCommitMessageMutation.mutate(gitDiffData?.diff || '')}
                            disabled={generateCommitMessageMutation.isPending || !gitDiffData?.diff}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            {generateCommitMessageMutation.isPending ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Bot className="h-3 w-3 mr-1" />
                            )}
                            Gerar Mensagem com IA
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {gitDiffData?.diff ? (
                          <pre className="text-xs font-mono bg-muted p-4 rounded max-h-[300px] overflow-auto whitespace-pre-wrap">
                            {gitDiffData.diff}
                          </pre>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhuma alteração para commit</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Commit Message */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Mensagem do Commit</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Textarea
                          value={commitMessage}
                          onChange={(e) => setCommitMessage(e.target.value)}
                          placeholder="Digite a mensagem do commit..."
                          className="min-h-[100px] font-mono text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => gitCommitMutation.mutate(commitMessage)}
                            disabled={gitCommitMutation.isPending || !commitMessage.trim()}
                            className="flex items-center gap-2"
                          >
                            {gitCommitMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Commit
                          </Button>
                          <Button
                            onClick={() => gitPushMutation.mutate()}
                            disabled={gitPushMutation.isPending}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            {gitPushMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            Push
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* Git Configuration Tab */}
            {activeGitTab === 'config' && (
              <div className="flex-1 overflow-y-auto space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      Repositório Git
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        URL do Repositório
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={repositoryUrl}
                          onChange={(e) => setRepositoryUrl(e.target.value)}
                          placeholder="git@github.com:usuario/repositorio.git"
                          className="flex-1 text-xs"
                        />
                        {project.repository && !project.cloned && (
                          <Button
                            onClick={() => cloneRepositoryMutation.mutate()}
                            disabled={cloneRepositoryMutation.isPending}
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            {cloneRepositoryMutation.isPending ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Clonando...
                              </>
                            ) : (
                              <>
                                <GitPullRequest className="h-3 w-3" />
                                Clonar
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      {project.cloned && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                          <Badge variant="default" className="bg-green-600 text-xs">
                            Clonado
                          </Badge>
                          <span>Repositório clonado em /home/{project.alias}/code</span>
                        </div>
                      )}
                      {!project.repository && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Nenhum repositório configurado para este projeto
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Chaves SSH
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!project.hasSshKey ? (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Nenhuma chave SSH configurada para este projeto. Gere uma chave SSH para usar com repositórios Git.
                        </p>
                        <Button
                          onClick={() => generateSshKeyMutation.mutate()}
                          disabled={generateSshKeyMutation.isPending}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {generateSshKeyMutation.isPending ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <Key className="h-3 w-3" />
                              Gerar Chave SSH
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <Badge variant="default" className="bg-green-600 text-xs">
                            Configurado
                          </Badge>
                          <span>Chaves armazenadas em /home/{project.alias}/.ssh/</span>
                        </div>

                        <Separator />

                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-2 block">
                            Fingerprint
                          </label>
                          <code className="bg-muted px-3 py-2 rounded text-xs block break-all">
                            {project.sshKeyFingerprint}
                          </code>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-2 block">
                            Chave Pública
                          </label>
                          <div className="relative">
                            <textarea
                              value={project.sshPublicKey}
                              readOnly
                              rows={6}
                              className="w-full bg-muted px-3 py-2 rounded text-xs font-mono resize-none"
                            />
                            <Button
                              onClick={handleCopyPublicKey}
                              size="sm"
                              variant="secondary"
                              className="absolute top-2 right-2 flex items-center gap-1 text-xs h-6"
                            >
                              {copiedKey ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  Copiar
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Adicione esta chave pública nas configurações SSH do seu repositório Git (GitHub, GitLab, etc.)
                          </p>
                        </div>

                        <Separator />

                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            Chave privada: <code className="bg-muted px-2 py-1 rounded text-xs">/home/{project.alias}/.ssh/id_rsa</code>
                          </p>
                        </div>

                        <Button
                          onClick={() => {
                            if (confirm('Tem certeza que deseja deletar as chaves SSH deste projeto?')) {
                              deleteSshKeyMutation.mutate()
                            }
                          }}
                          disabled={deleteSshKeyMutation.isPending}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {deleteSshKeyMutation.isPending ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Deletando...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3" />
                              Deletar Chaves SSH
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome do Projeto</label>
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-semibold">{project.name}</p>
                      <Badge variant={project.isActive ? "default" : "secondary"}>
                        {project.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Alias</label>
                    <code className="bg-muted px-2 py-1 rounded text-sm">{project.alias}</code>
                  </div>

                  {project.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                      <p className="text-foreground">{project.description}</p>
                    </div>
                  )}

                  {project.mainDomain && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Domínio Principal</label>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>{project.mainDomain}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://${project.mainDomain}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Repositório</label>
                    <div className="flex items-center space-x-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <span className="break-all">{project.repository}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(project.repository, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {project.documentation && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Documentação</label>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="break-all">{project.documentation}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(project.documentation!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Domínios Associados */}
            {project.domains && project.domains.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Domínios Associados ({project.domains.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.domains.map((domain: Domain) => (
                      <div
                        key={domain.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{domain.name}</p>
                            {domain.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{domain.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={domain.isActive ? "default" : "secondary"}>
                            {domain.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/domains/${domain.id}`)}
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            {project.metadata && Object.keys(project.metadata).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metadados</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(project.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="space-y-6">
            <ProjectTerminal
              projectId={project.id}
              projectAlias={project.alias}
            />
          </div>
        )}
      </div>

      {/* Modal de Imagem */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeImageModal}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl font-bold"
            >
              ✕
            </button>
            <img
              src={imageModalSrc}
              alt="Imagem ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </MainLayout>
  )
}