'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useWebSocket } from './useWebSocket'

interface SshOutput {
  id: string
  timestamp: Date
  data: string
  stderr?: boolean
  type: 'output' | 'input' | 'system'
}

interface UseSSHReturn {
  output: SshOutput[]
  isConnected: boolean
  error: string | null
  connect: (sessionId: string) => void
  disconnect: () => void
  sendCommand: (command: string) => void
  resize: (cols: number, rows: number) => void
  join: (sessionId: string) => void
  leave: () => void
  clear: () => void
  currentSessionId: string | null
}

export function useSSH(): UseSSHReturn {
  const [output, setOutput] = useState<SshOutput[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const currentSessionRef = useRef<string | null>(null)

  const { sshConnect, sshDisconnect, sshCommand, sshResize, sshJoin, sshLeave, on, off, isConnected: wsConnected } = useWebSocket()

  const connect = useCallback((sessionId: string) => {
    if (!wsConnected) {
      setError('WebSocket não conectado')
      return
    }

    // Disconnect from previous session if connected
    if (currentSessionRef.current) {
      sshDisconnect(currentSessionRef.current)
    }

    currentSessionRef.current = sessionId
    setCurrentSessionId(sessionId)
    setOutput([])
    setError(null)
    sshConnect(sessionId)
  }, [wsConnected, sshConnect, sshDisconnect])

  const disconnect = useCallback(() => {
    if (currentSessionRef.current) {
      sshDisconnect(currentSessionRef.current)
      currentSessionRef.current = null
      setCurrentSessionId(null)
    }
  }, [sshDisconnect])

  const sendCommand = useCallback((command: string) => {
    if (currentSessionRef.current) {
      const requestId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sshCommand(currentSessionRef.current, command, requestId)

      // Add command to output for display
      const commandEntry: SshOutput = {
        id: `input-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        data: `$ ${command}`,
        type: 'input'
      }
      setOutput(prev => [...prev, commandEntry])
    }
  }, [sshCommand])

  const resize = useCallback((cols: number, rows: number) => {
    if (currentSessionRef.current) {
      sshResize(currentSessionRef.current, cols, rows)
    }
  }, [sshResize])

  const join = useCallback((sessionId: string) => {
    if (wsConnected) {
      sshJoin(sessionId)
      setCurrentSessionId(sessionId)
      currentSessionRef.current = sessionId
    }
  }, [wsConnected, sshJoin])

  const leave = useCallback(() => {
    if (currentSessionRef.current) {
      sshLeave(currentSessionRef.current)
      currentSessionRef.current = null
      setCurrentSessionId(null)
    }
  }, [sshLeave])

  const clear = useCallback(() => {
    setOutput([])
  }, [])

  // Event handlers
  const handleSshConnected = useCallback((data: { sessionId: string }) => {
    if (data.sessionId === currentSessionRef.current) {
      setIsConnected(true)
      setError(null)

      const connectEntry: SshOutput = {
        id: `system-${Date.now()}`,
        timestamp: new Date(),
        data: 'SSH connection established',
        type: 'system'
      }
      setOutput(prev => [...prev, connectEntry])
    }
  }, [])

  const handleSshDisconnected = useCallback((data: { sessionId: string }) => {
    if (data.sessionId === currentSessionRef.current) {
      setIsConnected(false)

      const disconnectEntry: SshOutput = {
        id: `system-${Date.now()}`,
        timestamp: new Date(),
        data: 'SSH connection closed',
        type: 'system'
      }
      setOutput(prev => [...prev, disconnectEntry])
    }
  }, [])

  const handleSshData = useCallback((data: {
    sessionId: string;
    data: string;
    stderr?: boolean;
  }) => {
    if (data.sessionId === currentSessionRef.current) {
      const outputEntry: SshOutput = {
        id: `output-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        data: data.data,
        stderr: data.stderr,
        type: 'output'
      }
      setOutput(prev => [...prev, outputEntry])
    }
  }, [])

  const handleSshError = useCallback((data: { sessionId: string; message: string }) => {
    if (data.sessionId === currentSessionRef.current) {
      setError(data.message)
      setIsConnected(false)

      const errorEntry: SshOutput = {
        id: `error-${Date.now()}`,
        timestamp: new Date(),
        data: `Error: ${data.message}`,
        type: 'system'
      }
      setOutput(prev => [...prev, errorEntry])
    }
  }, [])

  const handleSshJoined = useCallback((data: { sessionId: string }) => {
    if (data.sessionId === currentSessionRef.current) {
      const joinEntry: SshOutput = {
        id: `system-${Date.now()}`,
        timestamp: new Date(),
        data: `Joined SSH session ${data.sessionId}`,
        type: 'system'
      }
      setOutput(prev => [...prev, joinEntry])
    }
  }, [])

  const handleSshLeft = useCallback((data: { sessionId: string }) => {
    if (data.sessionId === currentSessionRef.current) {
      const leaveEntry: SshOutput = {
        id: `system-${Date.now()}`,
        timestamp: new Date(),
        data: `Left SSH session ${data.sessionId}`,
        type: 'system'
      }
      setOutput(prev => [...prev, leaveEntry])
    }
  }, [])

  const handleSshStatus = useCallback((data: { sessionId: string; status: string }) => {
    if (data.sessionId === currentSessionRef.current) {
      setIsConnected(data.status === 'connected')

      const statusEntry: SshOutput = {
        id: `status-${Date.now()}`,
        timestamp: new Date(),
        data: `SSH status: ${data.status}`,
        type: 'system'
      }
      setOutput(prev => [...prev, statusEntry])
    }
  }, [])

  const handleCommandSent = useCallback((data: {
    sessionId: string;
    requestId?: string;
    command: string;
    timestamp: Date;
  }) => {
    // This is just confirmation that command was sent
    // We already added it to output in sendCommand
  }, [])

  const handleSshResize = useCallback((data: { sessionId: string; cols: number; rows: number }) => {
    // This event is just for broadcasting resize to other clients
    // We don't need to handle it locally
  }, [])

  useEffect(() => {
    if (!wsConnected) {
      setIsConnected(false)
      return
    }

    // Register event listeners
    on('ssh:connected', handleSshConnected)
    on('ssh:disconnected', handleSshDisconnected)
    on('ssh:data', handleSshData)
    on('ssh:error', handleSshError)
    on('ssh:joined', handleSshJoined)
    on('ssh:left', handleSshLeft)
    on('ssh:status', handleSshStatus)
    on('ssh:command:sent', handleCommandSent)
    on('ssh:resize', handleSshResize)

    return () => {
      // Cleanup event listeners
      off('ssh:connected', handleSshConnected)
      off('ssh:disconnected', handleSshDisconnected)
      off('ssh:data', handleSshData)
      off('ssh:error', handleSshError)
      off('ssh:joined', handleSshJoined)
      off('ssh:left', handleSshLeft)
      off('ssh:status', handleSshStatus)
      off('ssh:command:sent', handleCommandSent)
      off('ssh:resize', handleSshResize)
    }
  }, [
    wsConnected,
    on,
    off,
    handleSshConnected,
    handleSshDisconnected,
    handleSshData,
    handleSshError,
    handleSshJoined,
    handleSshLeft,
    handleSshStatus,
    handleCommandSent,
    handleSshResize
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentSessionRef.current) {
        sshDisconnect(currentSessionRef.current)
      }
    }
  }, [sshDisconnect])

  return {
    output,
    isConnected,
    error,
    connect,
    disconnect,
    sendCommand,
    resize,
    join,
    leave,
    clear,
    currentSessionId
  }
}