'use client'

import { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Terminal, Send, Square, Trash2, Server, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSSH } from '@/hooks/useSSH'
import { cn, formatDate } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

interface SSHSession {
  id: string
  sessionName: string
  hostname: string
  port: number
  username: string
  authType: 'password' | 'key'
  status: 'active' | 'disconnected' | 'error' | 'connecting'
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function TerminalPage() {
  const [command, setCommand] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Buscar sessões SSH disponíveis
  const { data: sshSessions, isLoading: sessionsLoading } = useQuery<SSHSession[]>({
    queryKey: ['ssh-sessions'],
    queryFn: () => api.get('/console/sessions').then(res => res.data),
  })

  // Hook SSH
  const {
    output,
    isConnected,
    error,
    connect,
    disconnect,
    sendCommand,
    clear,
    currentSessionId
  } = useSSH()

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  // Conectar automaticamente à primeira sessão disponível
  useEffect(() => {
    if (sshSessions && sshSessions.length > 0 && !selectedSessionId) {
      const firstSession = sshSessions[0]
      setSelectedSessionId(firstSession.id)
    }
  }, [sshSessions, selectedSessionId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim() || !isConnected) return

    // Executar comando SSH
    sendCommand(command)
    setCommand('')
  }

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    connect(sessionId)
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const handleClearTerminal = () => {
    clear()
  }

  const getMessageStyle = (type: string, stderr?: boolean) => {
    if (type === 'input') {
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
    }
    if (type === 'output') {
      return stderr
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100'
    }
    if (type === 'system') {
      return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
    }
    return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
  }

  const getMessageIcon = (type: string, stderr?: boolean) => {
    if (type === 'input') return '$'
    if (type === 'output') return stderr ? '!' : '>'
    if (type === 'system') return '◆'
    return '·'
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Terminal className="h-8 w-8" />
              Terminal SSH
            </h1>
            <p className="text-muted-foreground">
              Execute comandos remotamente via SSH
            </p>
          </div>

          {/* Status e controles */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
              isConnected
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            )}>
              <div className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-green-400' : 'bg-red-400'
              )} />
              {isConnected ? 'Conectado' : 'Desconectado'}
            </div>

            {isConnected && (
              <Button
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Desconectar
              </Button>
            )}

            <Button
              onClick={handleClearTerminal}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </div>

        {/* SSH Session Selector */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5" />
              Sessão SSH
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select
                  value={selectedSessionId}
                  onValueChange={handleSessionSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma sessão SSH" />
                  </SelectTrigger>
                  <SelectContent>
                    {sshSessions?.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'h-2 w-2 rounded-full',
                            session.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                          )} />
                          <span>{session.sessionName}</span>
                          <span className="text-muted-foreground text-sm">
                            ({session.username}@{session.hostname}:{session.port})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSessionId && !isConnected && (
                <Button
                  onClick={() => connect(selectedSessionId)}
                  className="flex items-center gap-2"
                >
                  <Terminal className="h-4 w-4" />
                  Conectar
                </Button>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {selectedSessionId && (
              <div className="text-sm text-muted-foreground">
                <p>Sessão atual: {currentSessionId || selectedSessionId}</p>
                <p>Status: {isConnected ? 'Conectado' : 'Desconectado'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terminal */}
        <Card className="h-[calc(100vh-16rem)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-mono">Terminal Output</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full p-0">
            {/* Messages area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {output.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Terminal SSH pronto para comandos</p>
                    <p className="text-sm">Selecione uma sessão SSH e conecte para começar</p>
                  </div>
                ) : (
                  output.map((message) => (
                    <div key={`${message.id}-${message.timestamp.getTime()}`} className="flex gap-3">
                      {/* Icon */}
                      <div className={cn(
                        'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold',
                        getMessageStyle(message.type, message.stderr)
                      )}>
                        {getMessageIcon(message.type, message.stderr)}
                      </div>

                      {/* Message content */}
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          'p-3 rounded-lg border font-mono text-sm break-all',
                          getMessageStyle(message.type, message.stderr)
                        )}>
                          <pre className="whitespace-pre-wrap m-0">{message.data}</pre>
                        </div>

                        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                          <span>{formatDate(message.timestamp, 'PPpp')}</span>
                          {message.stderr && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                              STDERR
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Command input */}
            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-mono text-sm">
                    $
                  </span>
                  <Input
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Digite seu comando aqui..."
                    disabled={!isConnected}
                    className="pl-8 font-mono"
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!command.trim() || !isConnected}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Executar
                </Button>
              </form>

              <p className="text-xs text-muted-foreground mt-2">
                Pressione Enter para executar o comando
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}