'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useWebSocket } from './useWebSocket'

interface TerminalEntry {
  id: string
  timestamp: Date
  data: string
  type: 'input' | 'output'
}

interface UseDockerTerminalReturn {
  output: TerminalEntry[]
  isRunning: boolean
  execId: string | null
  error: string | null
  startExec: (containerId: string, command?: string[], options?: {
    interactive?: boolean
    tty?: boolean
    env?: string[]
  }) => void
  sendInput: (input: string) => void
  resize: (cols: number, rows: number) => void
  stop: () => void
  clear: () => void
}

export function useDockerTerminal(): UseDockerTerminalReturn {
  const [output, setOutput] = useState<TerminalEntry[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [execId, setExecId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const currentExecRef = useRef<string | null>(null)

  const { dockerExecStart, dockerExecInput, dockerExecResize, dockerExecStop, on, off, isConnected } = useWebSocket()

  const startExec = useCallback((
    containerId: string,
    command: string[] = ['/bin/bash'],
    options?: {
      interactive?: boolean
      tty?: boolean
      env?: string[]
    }
  ) => {
    if (!isConnected) {
      setError('WebSocket não conectado')
      return
    }

    // Stop previous exec if running
    if (currentExecRef.current) {
      dockerExecStop(currentExecRef.current)
    }

    setOutput([])
    setError(null)
    dockerExecStart(containerId, command, {
      interactive: options?.interactive !== false,
      tty: options?.tty !== false,
      env: options?.env
    })
  }, [isConnected, dockerExecStart, dockerExecStop])

  const sendInput = useCallback((input: string) => {
    if (currentExecRef.current) {
      dockerExecInput(currentExecRef.current, input)

      // Add input to output for display
      const inputEntry: TerminalEntry = {
        id: `input-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        data: input,
        type: 'input'
      }
      setOutput(prev => [...prev, inputEntry])
    }
  }, [dockerExecInput])

  const resize = useCallback((cols: number, rows: number) => {
    if (currentExecRef.current) {
      dockerExecResize(currentExecRef.current, cols, rows)
    }
  }, [dockerExecResize])

  const stop = useCallback(() => {
    if (currentExecRef.current) {
      dockerExecStop(currentExecRef.current)
    }
  }, [dockerExecStop])

  const clear = useCallback(() => {
    setOutput([])
  }, [])

  // Event handlers
  const handleExecStarted = useCallback((data: { containerId: string; execId: string }) => {
    setIsRunning(true)
    setExecId(data.execId)
    setError(null)
    currentExecRef.current = data.execId
  }, [])

  const handleExecData = useCallback((data: { execId: string; data: string }) => {
    if (data.execId === currentExecRef.current) {
      const outputEntry: TerminalEntry = {
        id: `output-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        data: data.data,
        type: 'output'
      }
      setOutput(prev => [...prev, outputEntry])
    }
  }, [])

  const handleExecError = useCallback((data: { execId: string; message: string }) => {
    if (data.execId === currentExecRef.current) {
      setError(data.message)
      setIsRunning(false)
    }
  }, [])

  const handleExecStopped = useCallback((data: { execId: string }) => {
    if (data.execId === currentExecRef.current) {
      setIsRunning(false)
      setExecId(null)
      currentExecRef.current = null
    }
  }, [])

  const handleExecEnded = useCallback((data: { execId: string; exitCode?: number }) => {
    if (data.execId === currentExecRef.current) {
      setIsRunning(false)

      // Add exit message to output
      const exitMessage = `Process exited with code ${data.exitCode ?? 'unknown'}`
      const exitEntry: TerminalEntry = {
        id: `exit-${Date.now()}`,
        timestamp: new Date(),
        data: exitMessage,
        type: 'output'
      }
      setOutput(prev => [...prev, exitEntry])
    }
  }, [])

  const handleExecResize = useCallback((data: { execId: string; cols: number; rows: number }) => {
    // This event is just for broadcasting resize to other clients
    // We don't need to handle it locally
  }, [])

  useEffect(() => {
    if (!isConnected) {
      setIsRunning(false)
      return
    }

    // Register event listeners
    on('docker:exec:started', handleExecStarted)
    on('docker:exec:data', handleExecData)
    on('docker:exec:error', handleExecError)
    on('docker:exec:stopped', handleExecStopped)
    on('docker:exec:ended', handleExecEnded)
    on('docker:exec:resize', handleExecResize)

    return () => {
      // Cleanup event listeners
      off('docker:exec:started', handleExecStarted)
      off('docker:exec:data', handleExecData)
      off('docker:exec:error', handleExecError)
      off('docker:exec:stopped', handleExecStopped)
      off('docker:exec:ended', handleExecEnded)
      off('docker:exec:resize', handleExecResize)
    }
  }, [
    isConnected,
    on,
    off,
    handleExecStarted,
    handleExecData,
    handleExecError,
    handleExecStopped,
    handleExecEnded,
    handleExecResize
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentExecRef.current) {
        dockerExecStop(currentExecRef.current)
      }
    }
  }, [dockerExecStop])

  return {
    output,
    isRunning,
    execId,
    error,
    startExec,
    sendInput,
    resize,
    stop,
    clear
  }
}