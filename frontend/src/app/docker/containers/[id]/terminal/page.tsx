'use client'

import { useState, useEffect, useRef, KeyboardEvent, use } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { useConsoleSocket } from '@/hooks/useConsoleSocket'
import { Terminal, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { DockerApiService } from '@/lib/docker-api'
import Link from 'next/link'

// Converter códigos ANSI para classes CSS
const parseAnsiColors = (text: string): JSX.Element[] => {
  const ansiRegex = /\x1b\[([0-9;]+)m/g
  const parts: JSX.Element[] = []
  let lastIndex = 0
  let currentClasses: string[] = []

  const colorMap: { [key: string]: string } = {
    '30': 'text-gray-800',
    '31': 'text-red-400',
    '32': 'text-green-400',
    '33': 'text-yellow-300',
    '34': 'text-blue-400',
    '35': 'text-purple-400',
    '36': 'text-cyan-400',
    '37': 'text-gray-300',
    '90': 'text-gray-600',
    '91': 'text-red-300',
    '92': 'text-green-300',
    '93': 'text-yellow-200',
    '94': 'text-blue-300',
    '95': 'text-purple-300',
    '96': 'text-cyan-300',
    '97': 'text-white',
    '1': 'font-bold',
    '2': 'opacity-60',
    '3': 'italic',
    '4': 'underline',
  }

  let match
  while ((match = ansiRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textPart = text.slice(lastIndex, match.index)
      parts.push(
        <span key={lastIndex} className={currentClasses.length > 0 ? currentClasses.join(' ') : 'text-gray-200'}>
          {textPart}
        </span>
      )
    }

    const codes = match[1].split(';')
    if (codes.includes('0')) {
      currentClasses = []
    } else {
      codes.forEach(code => {
        if (colorMap[code]) {
          currentClasses.push(colorMap[code])
        }
      })
    }

    lastIndex = ansiRegex.lastIndex
  }

  if (lastIndex < text.length) {
    const textPart = text.slice(lastIndex)
    parts.push(
      <span key={lastIndex} className={currentClasses.length > 0 ? currentClasses.join(' ') : 'text-gray-200'}>
        {textPart}
      </span>
    )
  }

  return parts.length > 0 ? parts : [<span key="0" className="text-gray-200">{text}</span>]
}

export default function ContainerTerminalPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const containerId = resolvedParams.id

    const [currentLine, setCurrentLine] = useState('')
    const [cursorPosition, setCursorPosition] = useState(0)
    const [terminalOutput, setTerminalOutput] = useState<string[]>([
        '╔═══════════════════════════════════════════════════════════════════════╗',
        '║                   TERMINAL DO CONTAINER DOCKER                         ║',
        '╠═══════════════════════════════════════════════════════════════════════╣',
        '║  Console interativo conectado ao container via Docker Exec            ║',
        '║                                                                       ║',
        '║  • Comandos executados dentro do container                            ║',
        '║  • Terminal interativo com suporte a cores ANSI                       ║',
        '║  • Digite comandos e pressione Enter                                  ║',
        '╚═══════════════════════════════════════════════════════════════════════╝',
        '',
        'Conectando ao container...',
        ''
    ])
    const [isConnected, setIsConnected] = useState(false)
    const [sessionStarted, setSessionStarted] = useState(false)
    const [containerName, setContainerName] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const terminalRef = useRef<HTMLDivElement>(null)

    // Buscar informações do container
    const { data: containersData } = useQuery({
        queryKey: ['docker', 'containers'],
        queryFn: () => DockerApiService.listContainers(),
        enabled: !!containerId
    })

    useEffect(() => {
        if (containersData?.data) {
            const container = containersData.data.find(c => c.id === containerId || c.id.startsWith(containerId))
            if (container) {
                const name = container.names[0]?.replace('/', '') || containerId.substring(0, 12)
                setContainerName(name)
            } else {
                setContainerName(containerId.substring(0, 12))
            }
        }
    }, [containersData, containerId])

    const {
        isConnected: wsConnected,
        error: wsError,
        executeCommand,
        connectToSession,
        on,
        off
    } = useConsoleSocket()

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [terminalOutput])

    // Focus no terminal quando clicar
    useEffect(() => {
        const handleClick = () => {
            terminalRef.current?.focus()
        }
        const terminal = terminalRef.current?.parentElement
        terminal?.addEventListener('click', handleClick)
        return () => terminal?.removeEventListener('click', handleClick)
    }, [])

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
                setTerminalOutput(prev => [...prev, '✓ Conectado ao container com sucesso!', ''])
            }
        }

        if (wsConnected && containerId) {
            on('terminal:output', handleTerminalOutput)
            on('terminal:error', handleTerminalError)
            on('ssh:status', handleConnectionStatus)

            // Conectar ao container quando WebSocket conectar
            if (!sessionStarted) {
                setSessionStarted(true)
                setTimeout(() => {
                    // Usar o ID do container como sessionId
                    connectToSession(`container:${containerId}`)
                }, 500)
            }
        }

        return () => {
            if (wsConnected) {
                off('terminal:output', handleTerminalOutput)
                off('terminal:error', handleTerminalError)
                off('ssh:status', handleConnectionStatus)
            }
        }
    }, [wsConnected, containerId, on, off, connectToSession, sessionStarted])

    const handleTerminalKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (!wsConnected || !isConnected) return

        if (e.key === 'Enter') {
            e.preventDefault()
            if (currentLine.trim()) {
                const promptPrefix = containerName ? `${containerName}` : containerId.substring(0, 12)
                setTerminalOutput(prev => [...prev, `root@${promptPrefix}:/# ${currentLine}`])
                executeCommand(`container:${containerId}`, currentLine.trim())
                setCurrentLine('')
                setCursorPosition(0)
            }
        } else if (e.key === 'Backspace') {
            e.preventDefault()
            if (cursorPosition > 0) {
                setCurrentLine(prev => prev.slice(0, cursorPosition - 1) + prev.slice(cursorPosition))
                setCursorPosition(prev => prev - 1)
            }
        } else if (e.key === 'Delete') {
            e.preventDefault()
            if (cursorPosition < currentLine.length) {
                setCurrentLine(prev => prev.slice(0, cursorPosition) + prev.slice(cursorPosition + 1))
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            setCursorPosition(prev => Math.max(0, prev - 1))
        } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            setCursorPosition(prev => Math.min(currentLine.length, prev + 1))
        } else if (e.key === 'Home') {
            e.preventDefault()
            setCursorPosition(0)
        } else if (e.key === 'End') {
            e.preventDefault()
            setCursorPosition(currentLine.length)
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault()
            setCurrentLine(prev => prev.slice(0, cursorPosition) + e.key + prev.slice(cursorPosition))
            setCursorPosition(prev => prev + 1)
        }
    }

    const breadcrumbs = [
        { label: "Docker", href: "/docker" },
        { label: "Containers", href: "/docker/containers" },
        { label: containerName || containerId.substring(0, 12), href: `/docker/containers/${containerId}` },
        { label: "Terminal", current: true, icon: Terminal }
    ]

    return (
        <MainLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Link href={`/docker/containers/${containerId}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Terminal do Container</h1>
                        <p className="text-sm text-muted-foreground">
                            {containerName || containerId}
                        </p>
                    </div>
                </div>

                <div className="h-[calc(100vh-240px)]">
                    <Card className="h-full flex flex-col">
                        <CardContent
                            className="flex-1 overflow-y-auto p-6 space-y-1 bg-gray-950 font-mono text-sm cursor-text"
                            ref={terminalRef}
                            tabIndex={0}
                            onKeyDown={handleTerminalKeyDown}
                        >
                            {terminalOutput.map((line, idx) => (
                                <div key={idx} className="whitespace-pre-wrap break-words leading-relaxed">
                                    {parseAnsiColors(line)}
                                </div>
                            ))}

                            {/* Prompt atual */}
                            {isConnected && (
                                <div className="flex items-center">
                                    <span className="text-red-400 font-bold">root</span>
                                    <span className="text-gray-500">@</span>
                                    <span className="text-sky-400 font-bold">
                                        {containerName || containerId.substring(0, 12)}
                                    </span>
                                    <span className="text-gray-500">:</span>
                                    <span className="text-blue-400">/</span>
                                    <span className="text-purple-400 font-bold">#&nbsp;</span>
                                    <span className="flex-1 text-gray-200">
                                        {currentLine.slice(0, cursorPosition)}
                                        <span className="bg-gray-200 text-gray-950">
                                            {cursorPosition < currentLine.length ? currentLine[cursorPosition] : ' '}
                                        </span>
                                        {currentLine.slice(cursorPosition + 1)}
                                    </span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </CardContent>

                        <div className="p-3 border-t bg-gray-900">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                {wsConnected ? (
                                    <>
                                        <div className="flex items-center gap-1">
                                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                            <span>{isConnected ? 'Conectado' : 'Aguardando...'}</span>
                                        </div>
                                        <span className="text-gray-600">|</span>
                                        <span>Digite comandos e pressione Enter</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                            <span>Desconectado</span>
                                        </div>
                                        {wsError && (
                                            <>
                                                <span className="text-gray-600">|</span>
                                                <span className="text-red-400">{wsError}</span>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </MainLayout>
    )
}
