'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useWebSocket } from './useWebSocket'

interface LogEntry {
  id: string
  timestamp: Date
  data: string
  stderr?: boolean
}

interface UseDockerLogsReturn {
  logs: LogEntry[]
  isStreaming: boolean
  error: string | null
  startStreaming: (containerId: string, options?: { tail?: number; follow?: boolean }) => void
  stopStreaming: () => void
  clearLogs: () => void
}

export function useDockerLogs(containerId: string): UseDockerLogsReturn {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentContainerRef = useRef<string | null>(null)

  const { dockerLogsStart, dockerLogsStop, on, off, isConnected } = useWebSocket()

  const startStreaming = useCallback((containerId: string, options?: { tail?: number; follow?: boolean }) => {
    if (!isConnected) {
      setError('WebSocket não conectado')
      return
    }

    // Stop previous streaming if different container
    if (currentContainerRef.current && currentContainerRef.current !== containerId) {
      dockerLogsStop(currentContainerRef.current)
    }

    currentContainerRef.current = containerId
    setLogs([])
    setError(null)
    dockerLogsStart(containerId, options)
  }, [isConnected, dockerLogsStart, dockerLogsStop])

  const stopStreaming = useCallback(() => {
    if (currentContainerRef.current) {
      dockerLogsStop(currentContainerRef.current)
      currentContainerRef.current = null
    }
  }, [dockerLogsStop])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  // Event handlers
  const handleLogsStarted = useCallback((data: { containerId: string }) => {
    if (data.containerId === currentContainerRef.current) {
      setIsStreaming(true)
      setError(null)
    }
  }, [])

  const handleLogsData = useCallback((data: {
    containerId: string;
    data: string;
    stderr?: boolean;
    timestamp: Date;
  }) => {
    if (data.containerId === currentContainerRef.current) {
      const logEntry: LogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(data.timestamp),
        data: data.data,
        stderr: data.stderr
      }

      setLogs(prev => [...prev, logEntry])
    }
  }, [])

  const handleLogsError = useCallback((data: { containerId: string; message: string }) => {
    if (data.containerId === currentContainerRef.current) {
      setError(data.message)
      setIsStreaming(false)
    }
  }, [])

  const handleLogsStopped = useCallback((data: { containerId: string }) => {
    if (data.containerId === currentContainerRef.current) {
      setIsStreaming(false)
      currentContainerRef.current = null
    }
  }, [])

  const handleLogsEnded = useCallback((data: { containerId: string }) => {
    if (data.containerId === currentContainerRef.current) {
      setIsStreaming(false)
    }
  }, [])

  useEffect(() => {
    if (!isConnected) {
      setIsStreaming(false)
      return
    }

    // Register event listeners
    on('docker:logs:started', handleLogsStarted)
    on('docker:logs:data', handleLogsData)
    on('docker:logs:error', handleLogsError)
    on('docker:logs:stopped', handleLogsStopped)
    on('docker:logs:ended', handleLogsEnded)

    return () => {
      // Cleanup event listeners
      off('docker:logs:started', handleLogsStarted)
      off('docker:logs:data', handleLogsData)
      off('docker:logs:error', handleLogsError)
      off('docker:logs:stopped', handleLogsStopped)
      off('docker:logs:ended', handleLogsEnded)
    }
  }, [isConnected, on, off, handleLogsStarted, handleLogsData, handleLogsError, handleLogsStopped, handleLogsEnded])

  // Auto-start streaming for the provided containerId
  useEffect(() => {
    if (containerId && isConnected && !isStreaming && !currentContainerRef.current) {
      startStreaming(containerId, { tail: 100, follow: true })
    }
  }, [containerId, isConnected, isStreaming, startStreaming])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentContainerRef.current) {
        dockerLogsStop(currentContainerRef.current)
      }
    }
  }, [dockerLogsStop])

  return {
    logs,
    isStreaming,
    error,
    startStreaming,
    stopStreaming,
    clearLogs
  }
}