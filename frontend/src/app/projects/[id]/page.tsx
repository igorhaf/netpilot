'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Globe, GitBranch, FileText, Calendar, Tag, ExternalLink, Terminal, Info, MessageSquare, Settings, Send, Bot, Loader2, GitPullRequest, Key, Copy, Trash2, Check, Layers } from 'lucide-react'
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
            { id: 'git', label: 'Git Clone', icon: GitBranch },
            { id: 'ssh', label: 'SSH Keys', icon: Key },
            { id: 'stack', label: 'Stack & Config', icon: Layers },
            { id: 'terminal', label: 'Terminal', icon: Terminal },
            { id: 'options', label: 'Opções', icon: Settings },
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
                      <div key={idx} className="mb-2">
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

        {/* Aba Git Clone */}
        {activeTab === 'git' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Git Clone - Clonar Repositório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL do Repositório</label>
                <input
                  type="text"
                  placeholder="https://github.com/usuario/repositorio.git"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Diretório de Destino</label>
                <input
                  type="text"
                  value="./code"
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O repositório será clonado em: /home/{project?.alias}/code
                </p>
              </div>
              <Button className="w-full">
                <GitBranch className="h-4 w-4 mr-2" />
                Clonar Repositório
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Aba SSH Keys */}
        {activeTab === 'ssh' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Gerenciador de Chaves SSH
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!project?.hasSshKey ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma chave SSH configurada. Gere uma para usar com repositórios Git.
                  </p>
                  <Button className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Gerar Par de Chaves SSH
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      ✓ Chaves SSH configuradas
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fingerprint: {project.sshKeyFingerprint}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chave Pública</label>
                    <div className="relative">
                      <textarea
                        value={project.sshPublicKey}
                        readOnly
                        rows={4}
                        className="w-full bg-muted px-3 py-2 rounded-lg text-xs font-mono resize-none"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Adicione esta chave no GitHub/GitLab para autenticação SSH
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Aba Stack & Configurações */}
        {activeTab === 'stack' && (
          <div className="space-y-6">
            {/* Frontend Stack */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-blue-500" />
                  </div>
                  Frontend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Vite', 'Tailwind'].map(tech => (
                    <div
                      key={tech}
                      onClick={() => toggleTech('frontend', tech)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        stackConfig.frontend.includes(tech)
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-border hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{tech}</span>
                        <Switch
                          checked={stackConfig.frontend.includes(tech)}
                          onCheckedChange={() => toggleTech('frontend', tech)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Backend Stack */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Terminal className="h-4 w-4 text-green-500" />
                  </div>
                  Backend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Node.js', 'Python', 'PHP', 'Ruby', 'Java', 'Go', 'Rust', '.NET'].map(tech => (
                    <div
                      key={tech}
                      onClick={() => toggleTech('backend', tech)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        stackConfig.backend.includes(tech)
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-border hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{tech}</span>
                        <Switch
                          checked={stackConfig.backend.includes(tech)}
                          onCheckedChange={() => toggleTech('backend', tech)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Database Stack */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-purple-500" />
                  </div>
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'MariaDB', 'Elasticsearch', 'Cassandra'].map(tech => (
                    <div
                      key={tech}
                      onClick={() => toggleTech('database', tech)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        stackConfig.database.includes(tech)
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{tech}</span>
                        <Switch
                          checked={stackConfig.database.includes(tech)}
                          onCheckedChange={() => toggleTech('database', tech)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Services (Docker) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Layers className="h-4 w-4 text-cyan-500" />
                  </div>
                  Services & DevOps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Docker', 'Kubernetes', 'Nginx', 'Apache', 'Traefik', 'RabbitMQ', 'Kafka', 'MinIO'].map(tech => (
                    <div
                      key={tech}
                      onClick={() => toggleTech('services', tech)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        stackConfig.services.includes(tech)
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-border hover:border-cyan-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{tech}</span>
                        <Switch
                          checked={stackConfig.services.includes(tech)}
                          onCheckedChange={() => toggleTech('services', tech)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Personas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-orange-500" />
                  </div>
                  Personas de IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Senior Dev', 'Code Reviewer', 'DevOps Expert', 'UI/UX Designer', 'DBA Specialist', 'Security Analyst', 'QA Tester', 'Arquiteto'].map(tech => (
                    <div
                      key={tech}
                      onClick={() => toggleTech('personas', tech)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        stackConfig.personas.includes(tech)
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-border hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{tech}</span>
                        <Switch
                          checked={stackConfig.personas.includes(tech)}
                          onCheckedChange={() => toggleTech('personas', tech)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Scripts de Automação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scripts de Automação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pre-prompt Script</label>
                  <Textarea
                    placeholder="#!/bin/bash&#10;# Executado ANTES do Claude processar&#10;echo 'Setup do ambiente...'"
                    rows={4}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Executado antes da IA processar (setup, validações, etc)
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Post-prompt Script</label>
                  <Textarea
                    placeholder="#!/bin/bash&#10;# Executado DEPOIS do Claude processar&#10;npm run format && git add ."
                    rows={4}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Executado após a IA processar (formatação, testes, deploy, etc)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <Button className="w-full" size="lg">
              <Settings className="h-4 w-4 mr-2" />
              Salvar Configurações do Stack
            </Button>
          </div>
        )}

        {activeTab === 'options' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Repositório</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    URL do Repositório
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={project.repository || ''}
                      disabled={project.cloned}
                      placeholder="git@github.com:usuario/repositorio.git"
                      className="flex-1"
                      readOnly
                    />
                    {project.repository && !project.cloned && (
                      <Button
                        onClick={() => cloneRepositoryMutation.mutate()}
                        disabled={cloneRepositoryMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        {cloneRepositoryMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Clonando...
                          </>
                        ) : (
                          <>
                            <GitPullRequest className="h-4 w-4" />
                            Clonar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {project.cloned && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                      <Badge variant="default" className="bg-green-600">
                        Clonado
                      </Badge>
                      <span>Repositório clonado em /home/{project.alias}/code</span>
                    </div>
                  )}
                  {!project.repository && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nenhum repositório configurado para este projeto
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Chaves SSH (Git)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!project.hasSshKey ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Nenhuma chave SSH configurada para este projeto. Gere uma chave SSH para usar com repositórios Git.
                    </p>
                    <Button
                      onClick={() => generateSshKeyMutation.mutate()}
                      disabled={generateSshKeyMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {generateSshKeyMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4" />
                          Gerar Chave SSH
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Badge variant="default" className="bg-green-600">
                        Configurado
                      </Badge>
                      <span>Chaves armazenadas em /home/{project.alias}/.ssh/</span>
                    </div>

                    <Separator />

                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Fingerprint
                      </label>
                      <code className="bg-muted px-3 py-2 rounded text-sm block break-all">
                        {project.sshKeyFingerprint}
                      </code>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
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
                          className="absolute top-2 right-2 flex items-center gap-1"
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
                      <p className="text-sm text-muted-foreground">
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
                      className="flex items-center gap-2"
                    >
                      {deleteSshKeyMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Deletando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
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
    </MainLayout>
  )
}