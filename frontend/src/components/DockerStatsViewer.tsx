'use client'

import React from 'react'
import { useDockerStats } from '@/hooks/useDockerStats'

interface DockerStatsViewerProps {
  containerId: string
  className?: string
}

export function DockerStatsViewer({ containerId, className = '' }: DockerStatsViewerProps) {
  const { stats, isStreaming, error, startStreaming, stopStreaming } = useDockerStats(containerId)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">Container Stats</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            isStreaming
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {isStreaming ? 'Live' : 'Stopped'}
          </span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => startStreaming(containerId)}
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
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Display */}
      <div className="p-4">
        {!stats ? (
          <div className="text-gray-500 text-center py-8">
            {isStreaming ? 'Loading stats...' : 'No stats available. Click Start to begin monitoring.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPU Usage */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">CPU Usage</h4>
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(stats.cpu)}
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(stats.cpu, 100)}%` }}
                />
              </div>
            </div>

            {/* Memory Usage */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-green-800 mb-2">Memory Usage</h4>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(stats.memory.percentage)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.available)}
              </div>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(stats.memory.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Network I/O */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-800 mb-2">Network I/O</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">RX:</span>
                  <span className="font-medium text-purple-600">
                    {formatBytes(stats.network.rx)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TX:</span>
                  <span className="font-medium text-purple-600">
                    {formatBytes(stats.network.tx)}
                  </span>
                </div>
              </div>
            </div>

            {/* Block I/O */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Block I/O</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Read:</span>
                  <span className="font-medium text-orange-600">
                    {formatBytes(stats.block.read)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Write:</span>
                  <span className="font-medium text-orange-600">
                    {formatBytes(stats.block.write)}
                  </span>
                </div>
              </div>
            </div>

            {/* PIDs */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Processes</h4>
              <div className="text-2xl font-bold text-gray-600">
                {stats.pids}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Active PIDs
              </div>
            </div>

            {/* Timestamp */}
            <div className="bg-gray-50 p-4 rounded-lg md:col-span-2 lg:col-span-3">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Last Update</h4>
              <div className="text-sm text-gray-600">
                {new Intl.DateTimeFormat('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'medium'
                }).format(stats.timestamp)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}