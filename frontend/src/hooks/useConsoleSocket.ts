'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import io from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth'

interface ConsoleSocketEvents {
    'session:connected': (data: { sessionId: string }) => void
    'session:disconnected': (data: { sessionId: string }) => void
    'session:error': (data: { sessionId: string; message: string }) => void
    'command:result': (data: {
        requestId?: string
        logId: string
        command: string
        output: string
        errorOutput: string
        exitCode: number
        executionTime: number
        status: string
        executedAt: string
    }) => void
    'command:error': (data: {
        requestId?: string
        command: string
        sessionId: string
        message: string
    }) => void
    'session:stats': (data: any) => void
}

interface UseConsoleSocketReturn {
    socket: any | null
    isConnected: boolean
    error: string | null
    connectToSession: (sessionId: string) => void
    disconnectFromSession: (sessionId: string) => void
    executeCommand: (sessionId: string, command: string, options?: {
        workingDirectory?: string
        environment?: Record<string, string>
    }) => Promise<void>
    joinSession: (sessionId: string) => void
    leaveSession: (sessionId: string) => void
    on: <K extends keyof ConsoleSocketEvents>(event: K, callback: ConsoleSocketEvents[K]) => void
    off: <K extends keyof ConsoleSocketEvents>(event: K, callback: ConsoleSocketEvents[K]) => void
}

export function useConsoleSocket(): UseConsoleSocketReturn {
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const socketRef = useRef<any | null>(null)
    const { token } = useAuthStore()

    const connectSocket = useCallback(() => {
        if (!token) {
            setError('Token não encontrado para conectar WebSocket')
            return
        }

        // Limpar conexão anterior se existir
        if (socketRef.current) {
            socketRef.current.disconnect()
        }

        try {
            // Conectar ao namespace console com token JWT
            const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/console`, {
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

            // Event listeners de conexão
            socket.on('connect', () => {
                console.log('Console WebSocket conectado:', socket.id)
                setIsConnected(true)
                setError(null)
            })

            socket.on('disconnect', (reason: any) => {
                console.log('Console WebSocket desconectado:', reason)
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

            // Event listeners específicos do console
            socket.on('session:stats', (stats: any) => {
                console.log('Session stats received:', stats)
            })

        } catch (err) {
            console.error('Erro ao criar socket:', err)
            setError('Erro ao criar conexão WebSocket')
        }
    }, [token])

    useEffect(() => {
        // Só conectar se tivermos token e não estivermos conectados
        if (token && !socketRef.current) {
            connectSocket()
        }

        // Desconectar se não há token mas há conexão
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

    const connectToSession = useCallback((sessionId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('session:connect', { sessionId })
        }
    }, [])

    const disconnectFromSession = useCallback((sessionId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('session:disconnect', { sessionId })
        }
    }, [])

    const executeCommand = useCallback(async (
        sessionId: string,
        command: string,
        options?: {
            workingDirectory?: string
            environment?: Record<string, string>
        }
    ) => {
        if (!socketRef.current) {
            throw new Error('Socket não conectado')
        }

        const requestId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        socketRef.current.emit('command:execute', {
            sessionId,
            command,
            workingDirectory: options?.workingDirectory,
            environment: options?.environment,
            requestId
        })
    }, [])

    const joinSession = useCallback((sessionId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('session:join', { sessionId })
        }
    }, [])

    const leaveSession = useCallback((sessionId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('session:leave', { sessionId })
        }
    }, [])

    const on = useCallback(<K extends keyof ConsoleSocketEvents>(
        event: K,
        callback: ConsoleSocketEvents[K]
    ) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback)
        }
    }, [])

    const off = useCallback(<K extends keyof ConsoleSocketEvents>(
        event: K,
        callback: ConsoleSocketEvents[K]
    ) => {
        if (socketRef.current) {
            socketRef.current.off(event, callback)
        }
    }, [])

    return {
        socket: socketRef.current,
        isConnected,
        error,
        connectToSession,
        disconnectFromSession,
        executeCommand,
        joinSession,
        leaveSession,
        on,
        off
    }
}
