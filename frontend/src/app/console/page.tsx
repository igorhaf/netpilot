'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { useConsoleSocket } from '@/hooks/useConsoleSocket'
import { Terminal, Server, Wifi, WifiOff, Activity, Settings } from 'lucide-react'

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
    const [command, setCommand] = useState('')
    const [terminalOutput, setTerminalOutput] = useState<string[]>(['Conectando ao servidor...'])
    const [isConnected, setIsConnected] = useState(false)
    const [activeTab, setActiveTab] = useState('console')

    const {
        isConnected: wsConnected,
        error: wsError,
        executeCommand,
        on,
        off
    } = useConsoleSocket()

    useEffect(() => {
        // Listeners para output do terminal
        const handleTerminalOutput = (data: any) => {
            setTerminalOutput(prev => [...prev, data.output])
        }

        const handleTerminalError = (data: any) => {
            setTerminalOutput(prev => [...prev, `ERROR: ${data.message}`])
        }

        const handleConnectionStatus = (data: any) => {
            setIsConnected(data.connected)
            if (data.connected) {
                setTerminalOutput(prev => [...prev, 'Conectado ao servidor NetPilot'])
            } else {
                setTerminalOutput(prev => [...prev, 'Desconectado do servidor'])
            }
        }

        if (wsConnected) {
            on('terminal:output', handleTerminalOutput)
            on('terminal:error', handleTerminalError)
            on('ssh:status', handleConnectionStatus)
        }

        return () => {
            if (wsConnected) {
                off('terminal:output', handleTerminalOutput)
                off('terminal:error', handleTerminalError)
                off('ssh:status', handleConnectionStatus)
            }
        }
    }, [wsConnected, on, off])

    const handleExecuteCommand = async () => {
        if (!command.trim() || !wsConnected) return

        try {
            setTerminalOutput(prev => [...prev, `$ ${command}`])
            await executeCommand('default', command.trim())
            setCommand('')
        } catch (err) {
            setTerminalOutput(prev => [...prev, `Erro: ${err}`])
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleExecuteCommand()
        }
    }

    const tabs = [
        {
            id: 'console',
            label: 'Console',
            icon: Terminal,
            color: 'text-green-500'
        },
        {
            id: 'status',
            label: 'Status da Conexão',
            icon: Activity,
            color: 'text-blue-500'
        },
        {
            id: 'implementation',
            label: 'Status da Implementação',
            icon: Settings,
            color: 'text-purple-500'
        }
    ]

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Console SSH</h1>
                        <p className="text-muted-foreground">
                            Acesse o terminal do servidor via SSH
                        </p>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-border">
                    <nav className="flex space-x-8 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                        isActive
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? tab.color : ''}`} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === 'console' && (
                        <div className="card">
                            <div className="card-header">
                                <div className="flex items-center gap-2">
                                    <Terminal className="h-5 w-5 text-green-500" />
                                    <h3 className="card-title">Terminal SSH</h3>
                                </div>
                                <p className="card-description">
                                    Terminal interativo do servidor NetPilot
                                </p>
                            </div>
                            <div className="card-content">
                                {/* Terminal Output */}
                                <div className="bg-black rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto mb-4">
                                    {terminalOutput.map((line, index) => (
                                        <div key={index} className="text-green-400 mb-1">
                                            {line}
                                        </div>
                                    ))}
                                    {wsConnected && isConnected && (
                                        <div className="flex items-center text-green-400">
                                            <span className="text-blue-400">root@netpilot:~$&nbsp;</span>
                                            <div className="w-2 h-4 bg-green-400 animate-pulse"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Command Input */}
                                <div className="flex gap-2">
                                    <div className="flex items-center bg-black text-green-400 px-3 py-2 rounded font-mono text-sm">
                                        root@netpilot:~$
                                    </div>
                                    <input
                                        type="text"
                                        value={command}
                                        onChange={(e) => setCommand(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={wsConnected ? "Digite um comando..." : "Aguarde conexão..."}
                                        className="input flex-1 font-mono"
                                        disabled={!wsConnected || !isConnected}
                                    />
                                    <button
                                        onClick={handleExecuteCommand}
                                        disabled={!command.trim() || !wsConnected || !isConnected}
                                        className="btn-secondary"
                                    >
                                        Executar
                                    </button>
                                </div>

                                {!wsConnected && (
                                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                            Aguardando conexão WebSocket...
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'status' && (
                        <div className="card">
                            <div className="card-header">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    <h3 className="card-title">Status da Conexão</h3>
                                </div>
                                <p className="card-description">
                                    Informações do servidor e WebSocket
                                </p>
                            </div>
                            <div className="card-content space-y-4">
                                {/* Status WebSocket */}
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {wsConnected ? (
                                            <Wifi className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <WifiOff className="h-5 w-5 text-red-500" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">WebSocket</p>
                                            <p className="text-xs text-muted-foreground">
                                                {wsConnected ? 'Conectado' : 'Desconectado'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`status-badge ${wsConnected ? 'status-badge-success' : 'status-badge-error'}`}>
                                        {wsConnected ? 'Online' : 'Offline'}
                                    </div>
                                </div>

                                {/* Status SSH */}
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Server className="h-5 w-5 text-blue-500" />
                                        <div>
                                            <p className="text-sm font-medium">Servidor SSH</p>
                                            <p className="text-xs text-muted-foreground">
                                                NetPilot Host
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`status-badge ${isConnected ? 'status-badge-success' : 'status-badge-warning'}`}>
                                        {isConnected ? 'Conectado' : 'Conectando'}
                                    </div>
                                </div>

                                {wsError && (
                                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            Erro: {wsError}
                                        </p>
                                    </div>
                                )}

                                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                        <strong>Configuração automática:</strong> Conecta automaticamente ao servidor
                                        onde o NetPilot está executando usando chave SSH configurada.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'implementation' && (
                        <div className="card bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                            <div className="card-header">
                                <div className="flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-purple-500" />
                                    <h3 className="card-title text-blue-900 dark:text-blue-100">Status da Implementação</h3>
                                </div>
                                <p className="card-description text-blue-700 dark:text-blue-300">
                                    Estado atual das funcionalidades do sistema SSH
                                </p>
                            </div>
                            <div className="card-content">
                                <div className="grid gap-2 text-sm text-blue-800 dark:text-blue-200 md:grid-cols-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-500">✅</span>
                                        <span>WebSocket Gateway implementado</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-500">✅</span>
                                        <span>Interface de configuração SSH</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-500">✅</span>
                                        <span>Listeners de eventos configurados</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-500">✅</span>
                                        <span>Roteamento WebSocket corrigido</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-500">⏳</span>
                                        <span>Conexão SSH real no backend</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-500">⏳</span>
                                        <span>Terminal interativo com PTY</span>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <strong>Conexão Automática:</strong> O terminal conecta automaticamente ao servidor
                                        onde o NetPilot está executando usando configurações do ambiente (.env).
                                        A autenticação é feita via chave SSH configurada no servidor.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    )
}
