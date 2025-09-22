'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useWebSocket } from './useWebSocket'

interface DockerStats {
  timestamp: Date
  cpu: number
  memory: {
    used: number
    available: number
    percentage: number
  }
  network: {
    rx: number
    tx: number
  }
  block: {
    read: number
    write: number
  }
  pids: number
}

interface UseDockerStatsReturn {
  stats: DockerStats | null
  statsHistory: DockerStats[]
  isStreaming: boolean
  error: string | null
  startStreaming: (containerId: string) => void
  stopStreaming: () => void
  clearStats: () => void
}

export function useDockerStats(containerId: string): UseDockerStatsReturn {
  const [stats, setStats] = useState<DockerStats | null>(null)
  const [statsHistory, setStatsHistory] = useState<DockerStats[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentContainerRef = useRef<string | null>(null)
  const maxHistorySize = 60 // Keep last 60 stats entries

  const { dockerStatsStart, dockerStatsStop, on, off, isConnected } = useWebSocket()

  const startStreaming = useCallback((containerId: string) => {
    if (!isConnected) {
      setError('WebSocket não conectado')
      return
    }

    // Stop previous streaming if different container
    if (currentContainerRef.current && currentContainerRef.current !== containerId) {
      dockerStatsStop(currentContainerRef.current)
    }

    currentContainerRef.current = containerId
    setStats(null)
    setStatsHistory([])
    setError(null)
    dockerStatsStart(containerId)
  }, [isConnected, dockerStatsStart, dockerStatsStop])

  const stopStreaming = useCallback(() => {
    if (currentContainerRef.current) {
      dockerStatsStop(currentContainerRef.current)
      currentContainerRef.current = null
    }
  }, [dockerStatsStop])

  const clearStats = useCallback(() => {
    setStats(null)
    setStatsHistory([])
  }, [])

  // Event handlers
  const handleStatsStarted = useCallback((data: { containerId: string }) => {
    if (data.containerId === currentContainerRef.current) {
      setIsStreaming(true)
      setError(null)
    }
  }, [])

  const handleStatsData = useCallback((data: {
    containerId: string;
    timestamp: Date;
    cpu: number;
    memory: { used: number; available: number; percentage: number };
    network: { rx: number; tx: number };
    block: { read: number; write: number };
    pids: number;
  }) => {
    if (data.containerId === currentContainerRef.current) {
      const newStats: DockerStats = {
        timestamp: new Date(data.timestamp),
        cpu: data.cpu,
        memory: data.memory,
        network: data.network,
        block: data.block,
        pids: data.pids
      }

      setStats(newStats)
      setStatsHistory(prev => {
        const updated = [...prev, newStats]
        // Keep only the last maxHistorySize entries
        return updated.slice(-maxHistorySize)
      })
    }
  }, [maxHistorySize])

  const handleStatsError = useCallback((data: { containerId: string; message: string }) => {
    if (data.containerId === currentContainerRef.current) {
      setError(data.message)
      setIsStreaming(false)
    }
  }, [])

  const handleStatsStopped = useCallback((data: { containerId: string }) => {
    if (data.containerId === currentContainerRef.current) {
      setIsStreaming(false)
      currentContainerRef.current = null
    }
  }, [])

  const handleStatsEnded = useCallback((data: { containerId: string }) => {
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
    on('docker:stats:started', handleStatsStarted)
    on('docker:stats:data', handleStatsData)
    on('docker:stats:error', handleStatsError)
    on('docker:stats:stopped', handleStatsStopped)
    on('docker:stats:ended', handleStatsEnded)

    return () => {
      // Cleanup event listeners
      off('docker:stats:started', handleStatsStarted)
      off('docker:stats:data', handleStatsData)
      off('docker:stats:error', handleStatsError)
      off('docker:stats:stopped', handleStatsStopped)
      off('docker:stats:ended', handleStatsEnded)
    }
  }, [isConnected, on, off, handleStatsStarted, handleStatsData, handleStatsError, handleStatsStopped, handleStatsEnded])

  // Auto-start streaming for the provided containerId
  useEffect(() => {
    if (containerId && isConnected && !isStreaming && !currentContainerRef.current) {
      startStreaming(containerId)
    }
  }, [containerId, isConnected, isStreaming, startStreaming])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentContainerRef.current) {
        dockerStatsStop(currentContainerRef.current)
      }
    }
  }, [dockerStatsStop])

  return {
    stats,
    statsHistory,
    isStreaming,
    error,
    startStreaming,
    stopStreaming,
    clearStats
  }
}