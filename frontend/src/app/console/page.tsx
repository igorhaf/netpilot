'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useConsoleSocket } from '@/hooks/useConsoleSocket'
import { useAuth } from '@/hooks/useAuth'
import { Terminal, Wifi, WifiOff, AlertCircle } from 'lucide-react'

interface SshSession {
    id: string
    sessionName: string
    hostname: string
    port: number
    username: string
    status: 'connected' | 'disconnected' | 'connecting'
}

interface CommandResult {
    id: string
    command: string
    output: string
    errorOutput: string
    exitCode: number
    executionTime: number
    status: string
    executedAt: string
}

export default function ConsolePage() {
    // Proteção de autenticação - redireciona para login se não autenticado
    const auth = useAuth()

    const [sessions, setSessions] = useState<SshSession[]>([])
    const [selectedSessionId, setSelectedSessionId] = useState<string>('')
    const [command, setCommand] = useState('')
    const [commandHistory, setCommandHistory] = useState<CommandResult[]>([])
    const [loading, setLoading] = useState(false)

    const {
        isConnected,
        error,
        connectToSession,
        disconnectFromSession,
        executeCommand,
        joinSession,
        leaveSession,
        on,
        off
    } = useConsoleSocket()

    // Não renderizar se não estiver autenticado
    if (!auth.isAuthenticated) {
        return null
    }

    // Effect para configurar listeners do WebSocket
    useEffect(() => {
        // Listener para resultados de comandos
        const handleCommandResult = (data: any) => {
            setCommandHistory(prev => [data, ...prev])
            setLoading(false)
        }

        // Listener para erros de comandos
        const handleCommandError = (data: any) => {
            setCommandHistory(prev => [{
                id: `error_${Date.now()}`,
                command: data.command,
                output: '',
                errorOutput: data.message,
                exitCode: 1,
                executionTime: 0,
                status: 'error',
                executedAt: new Date().toISOString()
            }, ...prev])
            setLoading(false)
        }

        // Listener para conexão de sessão
        const handleSessionConnected = (data: { sessionId: string }) => {
            setSessions(prev => prev.map(session =>
                session.id === data.sessionId
                    ? { ...session, status: 'connected' as const }
                    : session
            ))
        }

        // Listener para desconexão de sessão
        const handleSessionDisconnected = (data: { sessionId: string }) => {
            setSessions(prev => prev.map(session =>
                session.id === data.sessionId
                    ? { ...session, status: 'disconnected' as const }
                    : session
            ))
        }

        // Registrar listeners
        on('command:result', handleCommandResult)
        on('command:error', handleCommandError)
        on('session:connected', handleSessionConnected)
        on('session:disconnected', handleSessionDisconnected)

        // Cleanup
        return () => {
            off('command:result', handleCommandResult)
            off('command:error', handleCommandError)
            off('session:connected', handleSessionConnected)
            off('session:disconnected', handleSessionDisconnected)
        }
    }, [on, off])

    const handleConnectSession = (sessionId: string) => {
        connectToSession(sessionId)
        joinSession(sessionId)
    }

    const handleDisconnectSession = (sessionId: string) => {
        disconnectFromSession(sessionId)
        leaveSession(sessionId)
    }

    const handleExecuteCommand = async () => {
        if (!command.trim() || !selectedSessionId) return

        setLoading(true)
        try {
            await executeCommand(selectedSessionId, command.trim())
            setCommand('')
        } catch (err) {
            setLoading(false)
            console.error('Erro ao executar comando:', err)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleExecuteCommand()
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Terminal className="h-8 w-8 text-green-500" />
                    <h1 className="text-3xl font-bold">Console SSH</h1>
                </div>

                {/* Status de Conexão WebSocket */}
                <div className="flex items-center space-x-2">
                    {isConnected ? (
                        <>
                            <Wifi className="h-5 w-5 text-green-500" />
                            <span className="text-sm text-green-500">WebSocket Conectado</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="h-5 w-5 text-red-500" />
                            <span className="text-sm text-red-500">WebSocket Desconectado</span>
                        </>
                    )}
                </div>
            </div>

            {/* Erro de Conexão */}
            {error && (
                <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-center space-x-2 p-4">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-700 dark:text-red-400">{error}</span>
                    </div>
                </Card>
            )}

            {/* Sessões SSH Mock (para demonstração) */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Sessões SSH</h2>
                <div className="space-y-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Esta é uma demonstração do console SSH. As sessões serão carregadas via API quando implementadas.
                    </p>

                    {/* Mock Session */}
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Servidor Demo</h3>
                                <p className="text-sm text-gray-500">demo@localhost:22</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">
                                    Configuração Necessária
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Terminal Console */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Terminal</h2>

                {/* Command Input */}
                <div className="mb-4 flex space-x-2">
                    <Input
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite um comando SSH..."
                        className="font-mono"
                        disabled={!isConnected || loading}
                    />
                    <Button
                        onClick={handleExecuteCommand}
                        disabled={!command.trim() || !isConnected || loading}
                    >
                        {loading ? 'Executando...' : 'Executar'}
                    </Button>
                </div>

                {/* Command History */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {commandHistory.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Terminal className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>Nenhum comando executado ainda</p>
                            <p className="text-sm mt-1">
                                {isConnected
                                    ? 'WebSocket conectado - pronto para executar comandos'
                                    : 'Aguardando conexão WebSocket...'
                                }
                            </p>
                        </div>
                    ) : (
                        commandHistory.map((result) => (
                            <div
                                key={result.id}
                                className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <code className="text-sm font-medium">$ {result.command}</code>
                                    <span className={`text-xs px-2 py-1 rounded ${result.status === 'success'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {result.status === 'success' ? `Exit ${result.exitCode}` : 'Error'}
                                    </span>
                                </div>

                                {result.output && (
                                    <pre className="text-sm bg-black text-green-400 p-3 rounded overflow-x-auto mb-2">
                                        {result.output}
                                    </pre>
                                )}

                                {result.errorOutput && (
                                    <pre className="text-sm bg-red-900 text-red-100 p-3 rounded overflow-x-auto mb-2">
                                        {result.errorOutput}
                                    </pre>
                                )}

                                <div className="text-xs text-gray-500 flex justify-between">
                                    <span>Executado em: {new Date(result.executedAt).toLocaleString()}</span>
                                    <span>Duração: {result.executionTime}ms</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Instruções */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Console SSH - Status da Implementação
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>✅ WebSocket Gateway implementado com autenticação JWT</li>
                    <li>✅ Frontend conecta ao WebSocket com token</li>
                    <li>✅ Listeners para eventos de comando e sessão configurados</li>
                    <li>⏳ API REST para gerenciar sessões SSH (em desenvolvimento)</li>
                    <li>⏳ Interface para criar/configurar sessões SSH</li>
                    <li>⏳ Terminal interativo com PTY real</li>
                </ul>
            </Card>
        </div>
    )
}
