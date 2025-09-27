import { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'
import { useAuthStore } from '@/store/auth'

type Socket = ReturnType<typeof io>

export interface CommandOutput {
  id: string
  type: 'stdout' | 'stderr' | 'exit' | 'error'
  data: string
  timestamp: string
  command?: string
  exitCode?: number
}

export interface CommandError {
  commandId?: string
  error: string
  timestamp: string
}

export interface CommandStarted {
  commandId: string
  command: string
  timestamp: string
}

export interface UseTerminalOptions {
  onConnect?: () => void
  onDisconnect?: () => void
  onCommandOutput?: (output: CommandOutput) => void
  onCommandError?: (error: CommandError) => void
  onCommandStarted?: (started: CommandStarted) => void
  onCommandKilled?: (data: { commandId: string; timestamp: string }) => void
}

export function useTerminal(options: UseTerminalOptions = {}) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const { token } = useAuthStore()
  const optionsRef = useRef(options)

  // Atualizar referência de options
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    if (!token) return

    setIsConnecting(true)

    // URL do WebSocket
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const socketUrl = WS_URL

    // Criar conexão WebSocket
    console.log('[Terminal] Attempting to connect to:', socketUrl)
    const newSocket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'], // WebSocket primeiro, polling como fallback
      autoConnect: true,
      forceNew: true,
      timeout: 20000, // 20 second timeout como nos outros hooks
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Handlers de conexão
    newSocket.on('connect', () => {
      console.log('✅ Terminal WebSocket conectado com sucesso!')
      console.log('Terminal Socket ID:', newSocket.id)
      setIsConnected(true)
      setIsConnecting(false)
      optionsRef.current.onConnect?.()
    })

    newSocket.on('disconnect', (reason: any) => {
      console.log('Terminal WebSocket desconectado:', reason)
      setIsConnected(false)
      setIsConnecting(false)
      optionsRef.current.onDisconnect?.()
    })

    newSocket.on('connect_error', (error: any) => {
      console.error('❌ Terminal WebSocket connection error:', error)
      console.error('Terminal URL tentada:', socketUrl)
      console.error('Terminal detalhes do erro:', error.message)
      setIsConnected(false)
      setIsConnecting(false)
    })

    // Handlers de comando
    newSocket.on('commandOutput', (output: CommandOutput) => {
      optionsRef.current.onCommandOutput?.(output)
    })

    newSocket.on('commandError', (error: CommandError) => {
      optionsRef.current.onCommandError?.(error)
    })

    newSocket.on('commandStarted', (started: CommandStarted) => {
      optionsRef.current.onCommandStarted?.(started)
    })

    newSocket.on('commandKilled', (data: { commandId: string; timestamp: string }) => {
      optionsRef.current.onCommandKilled?.(data)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [token])

  const executeCommand = (command: string) => {
    if (socket && isConnected) {
      socket.emit('executeCommand', { command })
    }
  }

  const killCommand = (commandId: string) => {
    if (socket && isConnected) {
      socket.emit('killCommand', { commandId })
    }
  }

  const getActiveCommands = () => {
    if (socket && isConnected) {
      socket.emit('getActiveCommands')
    }
  }

  return {
    socket,
    isConnected,
    isConnecting,
    executeCommand,
    killCommand,
    getActiveCommands,
  }
}