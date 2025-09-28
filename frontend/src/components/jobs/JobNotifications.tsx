'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import {
  Bell,
  BellOff,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  AlertTriangle,
  Trash2,
  Settings,
  Activity,
  Pause,
  Play
} from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface JobNotification {
  id: string
  type: 'job:started' | 'job:completed' | 'job:failed' | 'job:retry' | 'job:cancelled'
  jobQueueId: string
  executionId: string
  jobName: string
  status: string
  timestamp: Date
  metadata?: any
  error?: string
  executionTime?: number
  read: boolean
}

interface QueueNotification {
  id: string
  type: 'queue:created' | 'queue:updated' | 'queue:deleted' | 'queue:enabled' | 'queue:disabled'
  queueId: string
  queueName: string
  timestamp: Date
  metadata?: any
  read: boolean
}

interface SystemNotification {
  id: string
  type: 'system:performance' | 'system:error' | 'system:maintenance'
  message: string
  level: 'info' | 'warning' | 'error'
  timestamp: Date
  metadata?: any
  read: boolean
}

type Notification = JobNotification | QueueNotification | SystemNotification

interface NotificationSettings {
  enabled: boolean
  jobStarted: boolean
  jobCompleted: boolean
  jobFailed: boolean
  jobRetry: boolean
  jobCancelled: boolean
  queueChanges: boolean
  systemAlerts: boolean
  soundEnabled: boolean
  desktopNotifications: boolean
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  jobStarted: false,
  jobCompleted: true,
  jobFailed: true,
  jobRetry: true,
  jobCancelled: true,
  queueChanges: false,
  systemAlerts: true,
  soundEnabled: true,
  desktopNotifications: true
}

export function JobNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  // Sons de notificação
  useEffect(() => {
    if (typeof window !== 'undefined' && !audio) {
      setAudio(new Audio('/sounds/notification.mp3'))
    }
  }, [])

  // Conexão WebSocket
  useEffect(() => {
    if (!settings.enabled) return

    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001'
    const newSocket = io(`${wsUrl}/jobs`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      console.log('Conectado ao WebSocket de notificações')
      setConnected(true)

      // Inscrever em todas as notificações
      newSocket.emit('subscribe:all')
    })

    newSocket.on('disconnect', () => {
      console.log('Desconectado do WebSocket')
      setConnected(false)
    })

    // Escutar notificações de jobs
    newSocket.on('job:notification', (data: any) => {
      const shouldNotify = shouldShowNotification(data.type)
      if (shouldNotify) {
        addNotification({
          id: `${data.type}-${data.executionId}-${Date.now()}`,
          ...data,
          read: false
        })
        playNotificationSound()
        showDesktopNotification(data)
      }
    })

    // Escutar notificações de filas
    newSocket.on('queue:notification', (data: any) => {
      if (settings.queueChanges) {
        addNotification({
          id: `${data.type}-${data.queueId}-${Date.now()}`,
          ...data,
          read: false
        })
        playNotificationSound()
      }
    })

    // Escutar notificações de sistema
    newSocket.on('system:notification', (data: any) => {
      if (settings.systemAlerts) {
        addNotification({
          id: `${data.type}-${Date.now()}`,
          ...data,
          read: false
        })
        playNotificationSound()

        // Notificações de sistema importantes via toast
        if (data.level === 'error') {
          toast({
            title: "Erro do Sistema",
            description: data.message,
            variant: "destructive"
          })
        }
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [settings])

  const shouldShowNotification = (type: string): boolean => {
    switch (type) {
      case 'job:started': return settings.jobStarted
      case 'job:completed': return settings.jobCompleted
      case 'job:failed': return settings.jobFailed
      case 'job:retry': return settings.jobRetry
      case 'job:cancelled': return settings.jobCancelled
      default: return true
    }
  }

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 99)]) // Manter apenas 100 notificações
  }

  const playNotificationSound = () => {
    if (settings.soundEnabled && audio) {
      audio.play().catch(() => {
        // Ignora erro se não conseguir tocar o som
      })
    }
  }

  const showDesktopNotification = (data: any) => {
    if (!settings.desktopNotifications || !('Notification' in window)) return

    if (Notification.permission === 'granted') {
      new Notification(`NetPilot - ${getNotificationTitle(data.type)}`, {
        body: `${data.jobName || data.queueName || data.message}`,
        icon: '/favicon.ico',
        tag: data.executionId || data.queueId
      })
    } else if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const getNotificationTitle = (type: string): string => {
    const titles: Record<string, string> = {
      'job:started': 'Job Iniciado',
      'job:completed': 'Job Concluído',
      'job:failed': 'Job Falhou',
      'job:retry': 'Job em Retry',
      'job:cancelled': 'Job Cancelado',
      'queue:created': 'Fila Criada',
      'queue:updated': 'Fila Atualizada',
      'queue:deleted': 'Fila Removida',
      'system:error': 'Erro do Sistema',
      'system:maintenance': 'Manutenção'
    }
    return titles[type] || 'Notificação'
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job:started': return <Clock className="h-4 w-4 text-blue-500" />
      case 'job:completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'job:failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'job:retry': return <RotateCcw className="h-4 w-4 text-orange-500" />
      case 'job:cancelled': return <Pause className="h-4 w-4 text-gray-500" />
      case 'system:error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date()
    const diff = now.getTime() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d atrás`
    if (hours > 0) return `${hours}h atrás`
    if (minutes > 0) return `${minutes}min atrás`
    return 'Agora'
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (showSettings) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Notificação
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(false)}
          >
            Voltar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Notificações Ativas</Label>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
            />
          </div>

          {settings.enabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Eventos de Job</h4>
                {[
                  { key: 'jobStarted', label: 'Job Iniciado' },
                  { key: 'jobCompleted', label: 'Job Concluído' },
                  { key: 'jobFailed', label: 'Job Falhou' },
                  { key: 'jobRetry', label: 'Job Retry' },
                  { key: 'jobCancelled', label: 'Job Cancelado' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm">{label}</Label>
                    <Switch
                      checked={settings[key as keyof NotificationSettings] as boolean}
                      onCheckedChange={(value) =>
                        setSettings(prev => ({ ...prev, [key]: value }))
                      }
                    />
                  </div>
                ))}
              </div>

              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Outros</h4>
                {[
                  { key: 'queueChanges', label: 'Mudanças em Filas' },
                  { key: 'systemAlerts', label: 'Alertas do Sistema' },
                  { key: 'soundEnabled', label: 'Som' },
                  { key: 'desktopNotifications', label: 'Notificações Desktop' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm">{label}</Label>
                    <Switch
                      checked={settings[key as keyof NotificationSettings] as boolean}
                      onCheckedChange={(value) =>
                        setSettings(prev => ({ ...prev, [key]: value }))
                      }
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {connected ? (
              <Activity className="h-5 w-5 text-green-500" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          {connected ? 'Conectado - Recebendo atualizações' : 'Desconectado'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Marcar todas como lidas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearNotifications}
            disabled={notifications.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notification.read
                      ? 'bg-muted/50 border-muted'
                      : 'bg-background border-primary/20'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-2">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">
                          {getNotificationTitle(notification.type)}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {'jobName' in notification && notification.jobName}
                        {'queueName' in notification && notification.queueName}
                        {'message' in notification && notification.message}
                      </p>
                      {'error' in notification && notification.error && (
                        <p className="text-xs text-red-600 mt-1 truncate">
                          {notification.error}
                        </p>
                      )}
                      {'executionTime' in notification && notification.executionTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Executado em {(notification.executionTime / 1000).toFixed(1)}s
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}