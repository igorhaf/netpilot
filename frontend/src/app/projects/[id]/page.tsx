'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Globe, GitBranch, FileText, Calendar, Tag, ExternalLink, Terminal, Info, MessageSquare, Settings, Send, Bot, Loader2, GitPullRequest, Key, Copy, Trash2, Check } from 'lucide-react'
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
import { Input } from '@/components/ui/input'

export default function ProjectDetailsPage() {
  const auth = useRequireAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id as string
  const [activeTab, setActiveTab] = useState('chat')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [copiedKey, setCopiedKey] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(res => res.data),
    enabled: !!projectId
  })

  // Query para buscar jobs/executions do projeto
  const { data: jobExecutions } = useQuery({
    queryKey: ['project-jobs', projectId],
    queryFn: () => api.get(`/job-executions?projectId=${projectId}`).then(res => res.data),
    enabled: !!projectId && activeTab === 'chat',
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  })

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

  // Mutation para criar job de prompt
  const sendPromptMutation = useMutation({
    mutationFn: async (promptMessage: string) => {
      const jobData = {
        name: `AI Prompt - ${project.name}`,
        description: `Prompt enviado pelo usuário: ${promptMessage.substring(0, 50)}...`,
        scriptType: 'internal',
        scriptPath: 'ai-prompt-handler',
        isActive: true,
        priority: 5,
        environmentVars: {
          PROJECT_ID: projectId,
          PROJECT_NAME: project.name,
          USER_PROMPT: promptMessage,
          TIMESTAMP: new Date().toISOString()
        },
        metadata: {
          type: 'ai-prompt',
          projectId: projectId,
          userPrompt: promptMessage
        }
      }

      const response = await api.post('/job-queues', jobData)
      const jobId = response.data.id

      // Executar o job imediatamente
      await api.post(`/job-queues/${jobId}/execute`)

      return response.data
    },
    onSuccess: () => {
      toast.success('Prompt enviado para processamento!')
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['project-jobs', projectId] })

      // Adicionar mensagem do usuário ao histórico
      setMessages(prev => [...prev, {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }])
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar prompt')
    },
  })

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, jobExecutions])

  // Atualizar mensagens com resultados dos jobs
  useEffect(() => {
    if (jobExecutions && jobExecutions.length > 0) {
      const aiMessages = jobExecutions
        .filter((job: any) => job.metadata?.type === 'ai-prompt')
        .map((job: any) => ({
          role: 'assistant',
          content: job.outputLog || job.errorLog || 'Processando...',
          status: job.status,
          timestamp: job.completedAt || job.startedAt || job.createdAt,
          executionId: job.id
        }))

      // Mesclar com mensagens existentes (evitar duplicatas)
      setMessages(prev => {
        const existing = prev.filter(m => m.role === 'user')
        return [...existing, ...aiMessages].sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      })
    }
  }, [jobExecutions])

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
        <div className="flex space-x-1 border-b">
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'options', label: 'Opções', icon: Settings },
            { id: 'overview', label: 'Informações Gerais', icon: Info },
            { id: 'terminal', label: 'Terminal', icon: Terminal }
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
            <Card className="h-full flex flex-col">
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center space-y-3">
                      <Bot className="h-16 w-16 mx-auto text-muted-foreground/50" />
                      <p className="text-lg">Inicie uma conversa</p>
                      <p className="text-sm">Envie um prompt para gerar comandos Claude através dos jobs.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-muted border'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {msg.role === 'assistant' && (
                              <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 space-y-2">
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                              <div className="flex items-center gap-2 text-xs opacity-70">
                                <span>
                                  {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {msg.status && (
                                  <Badge
                                    variant={
                                      msg.status === 'completed'
                                        ? 'default'
                                        : msg.status === 'failed'
                                        ? 'destructive'
                                        : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {msg.status === 'completed'
                                      ? 'Concluído'
                                      : msg.status === 'failed'
                                      ? 'Falhou'
                                      : msg.status === 'running'
                                      ? 'Executando'
                                      : 'Pendente'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </CardContent>
              <div className="p-2 border-t">
                <div className="flex gap-2 items-end">
                  <Textarea
                    placeholder="Digite seu prompt..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="min-h-[36px] max-h-[120px] resize-none py-2"
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