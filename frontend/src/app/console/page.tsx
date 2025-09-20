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
    // Estado para garantir renderização consistente no cliente
    const [mounted, setMounted] = useState(false)

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

    // Effect para marcar componente como montado no cliente
    useEffect(() => {
        setMounted(true)
    }, [])

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

    // Não renderizar até montagem no cliente ou se não autenticado
    if (!mounted || !auth.isAuthenticated) {
        return <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-500">Carregando...</div>
        </div>
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

            {/* Conectar ao Servidor Local */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Conexão SSH - Servidor Local</h2>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Configure a conexão SSH para acessar o console do servidor onde o NetPilot está executando.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Hostname/IP</label>
                            <Input
                                placeholder="localhost ou IP do servidor"
                                defaultValue="localhost"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Porta SSH</label>
                            <Input
                                placeholder="22"
                                defaultValue="22"
                                type="number"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Usuário</label>
                            <Input
                                placeholder="root, ubuntu, etc."
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Senha</label>
                            <Input
                                placeholder="Senha SSH"
                                type="password"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Button
                            onClick={() => console.log('Conectar SSH - em desenvolvimento')}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={!isConnected}
                        >
                            {isConnected ? 'Criar Sessão SSH' : 'Aguardando WebSocket...'}
                        </Button>

                        <div className="flex items-center space-x-2 text-sm">
                            {isConnected ? (
                                <span className="text-green-600">✅ WebSocket Conectado</span>
                            ) : (
                                <span className="text-red-600">❌ WebSocket Desconectado</span>
                            )}
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
                    Console SSH - Conectar ao Servidor Local
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>✅ WebSocket Gateway implementado com autenticação JWT</li>
                    <li>✅ Interface para conexão SSH ao servidor local</li>
                    <li>✅ Listeners para eventos de comando e sessão configurados</li>
                    <li>✅ Roteamento WebSocket corrigido no Traefik</li>
                    <li>⏳ Implementação da conexão SSH real no backend</li>
                    <li>⏳ Terminal interativo com PTY para servidor local</li>
                </ul>
                <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Próximo passo:</strong> Configure as credenciais SSH acima para conectar
                        ao console do servidor onde o NetPilot está executando (normalmente localhost).
                    </p>
                </div>
            </Card>
        </div>
    )
}
