'use client'

import React, { useEffect, useRef } from 'react'
import { useDockerLogs } from '@/hooks/useDockerLogs'

interface DockerLogsViewerProps {
  containerId: string
  className?: string
}

export function DockerLogsViewer({ containerId, className = '' }: DockerLogsViewerProps) {
  const { logs, isStreaming, error, startStreaming, stopStreaming, clearLogs } = useDockerLogs(containerId)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp)
  }

  return (
    <div className={`flex flex-col bg-gray-900 text-white rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Container Logs</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            isStreaming
              ? 'bg-green-600 text-green-100'
              : 'bg-gray-600 text-gray-300'
          }`}>
            {isStreaming ? 'Streaming' : 'Stopped'}
          </span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => startStreaming(containerId, { tail: 100, follow: true })}
            disabled={isStreaming}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Start
          </button>
          <button
            onClick={stopStreaming}
            disabled={!isStreaming}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Stop
          </button>
          <button
            onClick={clearLogs}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900 border-l-4 border-red-500">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Logs Container */}
      <div className="flex-1 overflow-y-auto max-h-96 p-4 space-y-1 font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            {isStreaming ? 'Waiting for logs...' : 'No logs available. Click Start to begin streaming.'}
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex space-x-2">
              <span className="text-gray-500 shrink-0 w-20">
                {formatTimestamp(log.timestamp)}
              </span>
              <span className={
                log.stderr
                  ? 'text-red-400'
                  : 'text-green-400'
              }>
                {log.data}
              </span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Footer with Stats */}
      <div className="p-2 border-t border-gray-700 text-xs text-gray-400">
        <span>{logs.length} lines</span>
        {isStreaming && <span className="ml-4">● Live streaming</span>}
      </div>
    </div>
  )
}