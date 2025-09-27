'use client'

import { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Terminal, Send, Square, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTerminal } from '@/hooks/useTerminal'
import { cn, formatDate } from '@/lib/utils'

export interface TerminalMessage {
  id: string
  type: 'stdout' | 'stderr' | 'exit' | 'error' | 'command'
  data: string
  timestamp: Date
  command?: string
  exitCode?: number
}

export default function TerminalPage() {
  const [command, setCommand] = useState('')
  const [messages, setMessages] = useState<TerminalMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [shellStarted, setShellStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { socket, executeCommand, killCommand, isConnecting } = useTerminal({
    onConnect: () => {
      setIsConnected(true)
      // Automaticamente iniciar um shell bash quando conectar
      if (!shellStarted) {
        setShellStarted(true)
        setTimeout(() => {
          executeCommand('bash')
        }, 500) // Pequeno delay para garantir que a conexão está estável
      }
    },
    onDisconnect: () => {
      setIsConnected(false)
      setShellStarted(false)
    },
    onCommandOutput: (output) => {
      setMessages(prev => [...prev, {
        id: output.id,
        type: output.type,
        data: output.data,
        timestamp: new Date(output.timestamp),
        command: output.command,
        exitCode: output.exitCode,
      }])
    },
    onCommandError: (error) => {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        type: 'error',
        data: error.error,
        timestamp: new Date(error.timestamp),
      }])
    }
  })

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim() || !isConnected) return

    // Adicionar comando à lista de mensagens
    const commandMessage: TerminalMessage = {
      id: `cmd-${Date.now()}`,
      type: 'command',
      data: command,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, commandMessage])

    // Executar comando
    executeCommand(command)
    setCommand('')
  }

  const handleClearTerminal = () => {
    setMessages([])
  }

  const getMessageStyle = (type: TerminalMessage['type']) => {
    switch (type) {
      case 'command':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
      case 'stdout':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100'
      case 'stderr':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100'
      case 'exit':
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
    }
  }

  const getMessageIcon = (type: TerminalMessage['type']) => {
    switch (type) {
      case 'command':
        return '$'
      case 'stdout':
        return '>'
      case 'stderr':
        return '!'
      case 'error':
        return '✗'
      case 'exit':
        return '◆'
      default:
        return '·'
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Terminal className="h-8 w-8" />
              Terminal
            </h1>
            <p className="text-muted-foreground">
              Execute comandos Linux em tempo real
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
              {isConnecting ? 'Conectando...' : isConnected ? 'Conectado' : 'Desconectado'}
            </div>

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

        {/* Terminal */}
        <Card className="h-[calc(100vh-16rem)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-mono">Terminal Output</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full p-0">
            {/* Messages area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Terminal pronto para comandos</p>
                    <p className="text-sm">Digite um comando abaixo para começar</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={`${message.id}-${message.timestamp.getTime()}`} className="flex gap-3">
                      {/* Icon */}
                      <div className={cn(
                        'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold',
                        getMessageStyle(message.type)
                      )}>
                        {getMessageIcon(message.type)}
                      </div>

                      {/* Message content */}
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          'p-3 rounded-lg border font-mono text-sm break-all',
                          getMessageStyle(message.type)
                        )}>
                          <pre className="whitespace-pre-wrap m-0">{message.data}</pre>
                        </div>

                        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                          <span>{formatDate(message.timestamp, 'PPpp')}</span>
                          {message.exitCode !== undefined && (
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium',
                              message.exitCode === 0
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            )}>
                              Exit {message.exitCode}
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