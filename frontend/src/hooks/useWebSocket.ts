'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import io from 'socket.io-client'
import type { Socket as SocketIOSocket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth'

// SSH Events
interface SshSocketEvents {
  'ssh:connected': (data: { sessionId: string }) => void
  'ssh:disconnected': (data: { sessionId: string }) => void
  'ssh:error': (data: { sessionId: string; message: string }) => void
  'ssh:data': (data: { sessionId: string; data: string; stderr?: boolean }) => void
  'ssh:joined': (data: { sessionId: string }) => void
  'ssh:left': (data: { sessionId: string }) => void
  'ssh:status': (data: { sessionId: string; status: string }) => void
  'ssh:command:sent': (data: { sessionId: string; requestId?: string; command: string; timestamp: Date }) => void
  'ssh:resize': (data: { sessionId: string; cols: number; rows: number }) => void
}

// Docker Events
interface DockerSocketEvents {
  'docker:logs:started': (data: { containerId: string }) => void
  'docker:logs:stopped': (data: { containerId: string }) => void
  'docker:logs:data': (data: { containerId: string; data: string; stderr?: boolean; timestamp: Date }) => void
  'docker:logs:error': (data: { containerId: string; message: string }) => void
  'docker:logs:ended': (data: { containerId: string }) => void

  'docker:stats:started': (data: { containerId: string }) => void
  'docker:stats:stopped': (data: { containerId: string }) => void
  'docker:stats:data': (data: {
    containerId: string;
    timestamp: Date;
    cpu: number;
    memory: { used: number; available: number; percentage: number };
    network: { rx: number; tx: number };
    block: { read: number; write: number };
    pids: number;
  }) => void
  'docker:stats:error': (data: { containerId: string; message: string }) => void
  'docker:stats:ended': (data: { containerId: string }) => void

  'docker:exec:started': (data: { containerId: string; execId: string }) => void
  'docker:exec:stopped': (data: { execId: string }) => void
  'docker:exec:data': (data: { execId: string; data: string }) => void
  'docker:exec:error': (data: { execId: string; message: string }) => void
  'docker:exec:ended': (data: { execId: string; exitCode?: number }) => void
  'docker:exec:resize': (data: { execId: string; cols: number; rows: number }) => void
}

// General Events
interface GeneralSocketEvents {
  'connection:established': (data: { clientId: string; userId: string; timestamp: Date }) => void
  'pong': (data: { timestamp: Date }) => void
  'error': (data: { message: string }) => void
  'room:joined': (data: { room: string }) => void
  'room:left': (data: { room: string }) => void
}

type AllSocketEvents = SshSocketEvents & DockerSocketEvents & GeneralSocketEvents

interface UseWebSocketReturn {
  socket: any | null
  isConnected: boolean
  error: string | null

  // SSH Methods
  sshConnect: (sessionId: string) => void
  sshDisconnect: (sessionId: string) => void
  sshCommand: (sessionId: string, command: string, requestId?: string) => void
  sshResize: (sessionId: string, cols: number, rows: number) => void
  sshJoin: (sessionId: string) => void
  sshLeave: (sessionId: string) => void

  // Docker Methods
  dockerLogsStart: (containerId: string, options?: { tail?: number; follow?: boolean }) => void
  dockerLogsStop: (containerId: string) => void
  dockerStatsStart: (containerId: string) => void
  dockerStatsStop: (containerId: string) => void
  dockerExecStart: (containerId: string, command: string[], options?: {
    interactive?: boolean;
    tty?: boolean;
    env?: string[]
  }) => void
  dockerExecInput: (execId: string, input: string) => void
  dockerExecResize: (execId: string, cols: number, rows: number) => void
  dockerExecStop: (execId: string) => void

  // General Methods
  ping: () => void
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
  on: <K extends keyof AllSocketEvents>(event: K, callback: AllSocketEvents[K]) => void
  off: <K extends keyof AllSocketEvents>(event: K, callback: AllSocketEvents[K]) => void
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<any | null>(null)
  const { token } = useAuthStore()

  const connectSocket = useCallback(() => {
    if (!token) {
      setError('Token não encontrado para conectar WebSocket')
      return
    }

    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    try {
      const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
        auth: {
          token: token
        },
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      })

      socketRef.current = socket

      socket.on('connect', () => {
        console.log('WebSocket conectado:', socket.id)
        setIsConnected(true)
        setError(null)
      })

      socket.on('disconnect', (reason: any) => {
        console.log('WebSocket desconectado:', reason)
        setIsConnected(false)
      })

      socket.on('connect_error', (error: any) => {
        console.error('Erro de conexão WebSocket:', error.message)
        setError(`Erro de conexão: ${error.message}`)
        setIsConnected(false)
      })

      socket.on('error', (error: any) => {
        console.error('Erro WebSocket:', error)
        setError(error.message || 'Erro desconhecido')
      })

      socket.on('connection:established', (data: any) => {
        console.log('Conexão estabelecida:', data)
      })

    } catch (err) {
      console.error('Erro ao criar socket:', err)
      setError('Erro ao criar conexão WebSocket')
    }
  }, [token])

  useEffect(() => {
    if (token && !socketRef.current) {
      connectSocket()
    }

    if (!token && socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [token, connectSocket])

  // SSH Methods
  const sshConnect = useCallback((sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('ssh:connect', { sessionId })
    }
  }, [])

  const sshDisconnect = useCallback((sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('ssh:disconnect', { sessionId })
    }
  }, [])

  const sshCommand = useCallback((sessionId: string, command: string, requestId?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('ssh:command', { sessionId, command, requestId })
    }
  }, [])

  const sshResize = useCallback((sessionId: string, cols: number, rows: number) => {
    if (socketRef.current) {
      socketRef.current.emit('ssh:resize', { sessionId, cols, rows })
    }
  }, [])

  const sshJoin = useCallback((sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('ssh:join', { sessionId })
    }
  }, [])

  const sshLeave = useCallback((sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('ssh:leave', { sessionId })
    }
  }, [])

  // Docker Methods
  const dockerLogsStart = useCallback((containerId: string, options?: { tail?: number; follow?: boolean }) => {
    if (socketRef.current) {
      socketRef.current.emit('docker:logs:start', { containerId, ...options })
    }
  }, [])

  const dockerLogsStop = useCallback((containerId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('docker:logs:stop', { containerId })
    }
  }, [])

  const dockerStatsStart = useCallback((containerId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('docker:stats:start', { containerId })
    }
  }, [])

  const dockerStatsStop = useCallback((containerId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('docker:stats:stop', { containerId })
    }
  }, [])

  const dockerExecStart = useCallback((containerId: string, command: string[], options?: {
    interactive?: boolean;
    tty?: boolean;
    env?: string[]
  }) => {
    if (socketRef.current) {
      socketRef.current.emit('docker:exec:start', {
        containerId,
        command,
        interactive: options?.interactive !== false,
        tty: options?.tty !== false,
        env: options?.env
      })
    }
  }, [])

  const dockerExecInput = useCallback((execId: string, input: string) => {
    if (socketRef.current) {
      socketRef.current.emit('docker:exec:input', { execId, input })
    }
  }, [])

  const dockerExecResize = useCallback((execId: string, cols: number, rows: number) => {
    if (socketRef.current) {
      socketRef.current.emit('docker:exec:resize', { execId, cols, rows })
    }
  }, [])

  const dockerExecStop = useCallback((execId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('docker:exec:stop', { execId })
    }
  }, [])

  // General Methods
  const ping = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('ping')
    }
  }, [])

  const joinRoom = useCallback((room: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join:room', { room })
    }
  }, [])

  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave:room', { room })
    }
  }, [])

  const on = useCallback(<K extends keyof AllSocketEvents>(
    event: K,
    callback: AllSocketEvents[K]
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }, [])

  const off = useCallback(<K extends keyof AllSocketEvents>(
    event: K,
    callback: AllSocketEvents[K]
  ) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    error,

    // SSH Methods
    sshConnect,
    sshDisconnect,
    sshCommand,
    sshResize,
    sshJoin,
    sshLeave,

    // Docker Methods
    dockerLogsStart,
    dockerLogsStop,
    dockerStatsStart,
    dockerStatsStop,
    dockerExecStart,
    dockerExecInput,
    dockerExecResize,
    dockerExecStop,

    // General Methods
    ping,
    joinRoom,
    leaveRoom,
    on,
    off
  }
}