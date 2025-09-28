'use client'

import { useState } from 'react'
import { Settings, User, Shield, Bell, Monitor, LogOut, RefreshCw, Edit3, Key, Download, Upload, Check, X, Clock, Database, Wifi } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { useRequireAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function SettingsPage() {
    const auth = useRequireAuth()
    const { logout } = useAuthStore()
    const router = useRouter()

    // Estados para configurações
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [notifications, setNotifications] = useState(true)
    const [darkMode, setDarkMode] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Estados para modais
    const [profileModalOpen, setProfileModalOpen] = useState(false)
    const [securityModalOpen, setSecurityModalOpen] = useState(false)
    const [notificationModalOpen, setNotificationModalOpen] = useState(false)
    const [systemModalOpen, setSystemModalOpen] = useState(false)
    const [backupModalOpen, setBackupModalOpen] = useState(false)
    const [integrationModalOpen, setIntegrationModalOpen] = useState(false)

    // Estados para formulários
    const [profileData, setProfileData] = useState({
        name: 'Administrador',
        email: 'admin@netpilot.local',
        role: 'Administrador'
    })

    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: false,
        sessionTimeout: 7,
        lockoutEnabled: true,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        ipWhitelist: '',
        loginAlerts: true,
        securityQuestions: []
    })

    const [notificationSettings, setNotificationSettings] = useState({
        // Canais de comunicação
        emailNotifications: true,
        smsNotifications: false,
        slackNotifications: false,
        discordNotifications: false,
        webhookNotifications: false,

        // Tipos de alertas
        sslExpiry: true,
        systemAlerts: true,
        deploymentStatus: true,
        errorLogs: true,
        performanceAlerts: true,
        securityEvents: true,
        backupStatus: true,
        resourceUsage: false,

        // Configurações avançadas
        emailAddress: 'admin@netpilot.local',
        phoneNumber: '',
        slackWebhook: '',
        discordWebhook: '',
        customWebhook: '',

        // Horários e frequência
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        maxNotificationsPerHour: 10,
        escalationEnabled: true,
        escalationDelay: 15,

        // Filtros
        minimumSeverity: 'medium',
        ignoreTestEnvironments: true,
        groupSimilarAlerts: true,
        rateLimitingEnabled: true
    })

    const [systemSettings, setSystemSettings] = useState({
        // Backup e Manutenção
        autoBackup: true,
        backupSchedule: '03:00',
        backupRetention: 7,
        maintenanceMode: false,
        maintenanceMessage: 'Sistema em manutenção. Tente novamente em alguns minutos.',

        // Logs e Debug
        logRetention: 30,
        debugMode: false,
        verboseLogging: false,
        logLevel: 'info',
        logCompression: true,

        // Performance
        maxConnections: 100,
        connectionTimeout: 30,
        requestTimeout: 60,
        enableCaching: true,
        cacheExpiration: 3600,

        // Monitoramento
        healthCheckInterval: 30,
        metricsRetention: 90,
        alertThreshold: 80,
        autoScaling: false,

        // SSL e Segurança
        sslAutoRenewal: true,
        sslCheckInterval: 24,
        forceHttps: true,
        securityHeaders: true,

        // Database
        dbConnectionPool: 20,
        dbQueryTimeout: 30,
        dbAutoVacuum: true,
        dbBackupEnabled: true,

        // Docker
        dockerAutoUpdate: false,
        dockerCleanup: true,
        dockerPruneSchedule: 'weekly',
        containerRestartPolicy: 'unless-stopped',

        // API
        apiRateLimit: 1000,
        apiCorsEnabled: true,
        apiVersioning: true,
        apiDocumentation: true
    })

    // Dados fictícios para histórico de segurança
    const [securityLogs] = useState([
        {
            id: 1,
            action: 'Login bem-sucedido',
            ip: '192.168.1.100',
            userAgent: 'Chrome 131.0.0.0',
            timestamp: '2025-01-27 14:30:15',
            status: 'success'
        },
        {
            id: 2,
            action: 'Alteração de senha',
            ip: '192.168.1.100',
            userAgent: 'Chrome 131.0.0.0',
            timestamp: '2025-01-26 09:15:42',
            status: 'success'
        },
        {
            id: 3,
            action: 'Tentativa de login falhada',
            ip: '203.0.113.45',
            userAgent: 'Firefox 119.0',
            timestamp: '2025-01-25 22:45:33',
            status: 'failed'
        },
        {
            id: 4,
            action: 'Ativação 2FA',
            ip: '192.168.1.100',
            userAgent: 'Chrome 131.0.0.0',
            timestamp: '2025-01-24 16:20:11',
            status: 'success'
        }
    ])

    // Histórico de notificações
    const [notificationHistory] = useState([
        {
            id: 1,
            type: 'SSL Expiry',
            message: 'Certificado SSL para netpilot.com expira em 7 dias',
            severity: 'warning',
            channel: 'email',
            timestamp: '2025-01-27 15:45:30',
            status: 'sent',
            recipient: 'admin@netpilot.local'
        },
        {
            id: 2,
            type: 'System Alert',
            message: 'Container netpilot-backend reiniciado automaticamente',
            severity: 'info',
            channel: 'email',
            timestamp: '2025-01-27 14:20:15',
            status: 'sent',
            recipient: 'admin@netpilot.local'
        },
        {
            id: 3,
            type: 'Security Event',
            message: 'Tentativa de login falhada detectada - IP: 203.0.113.45',
            severity: 'high',
            channel: 'email',
            timestamp: '2025-01-25 22:45:33',
            status: 'sent',
            recipient: 'admin@netpilot.local'
        },
        {
            id: 4,
            type: 'Error Log',
            message: 'Erro crítico na conexão com banco de dados PostgreSQL',
            severity: 'critical',
            channel: 'email',
            timestamp: '2025-01-24 10:30:22',
            status: 'failed',
            recipient: 'admin@netpilot.local'
        },
        {
            id: 5,
            type: 'Backup Status',
            message: 'Backup diário executado com sucesso - 127 MB',
            severity: 'info',
            channel: 'email',
            timestamp: '2025-01-27 03:00:15',
            status: 'sent',
            recipient: 'admin@netpilot.local'
        }
    ])

    // Templates de notificação
    const [notificationTemplates] = useState([
        {
            id: 'ssl_expiry',
            name: 'Expiração de SSL',
            subject: '⚠️ Certificado SSL expirando - {{domain}}',
            body: 'O certificado SSL para {{domain}} expira em {{days_remaining}} dias.',
            enabled: true
        },
        {
            id: 'system_alert',
            name: 'Alerta do Sistema',
            subject: '🔔 Alerta do Sistema - {{service}}',
            body: 'Detectada uma alteração no status do serviço {{service}}: {{message}}',
            enabled: true
        },
        {
            id: 'security_event',
            name: 'Evento de Segurança',
            subject: '🚨 Evento de Segurança Detectado',
            body: 'Foi detectado um evento de segurança: {{event_type}} - {{details}}',
            enabled: true
        }
    ])

    // Dados de monitoramento do sistema
    const [systemMetrics] = useState({
        cpu: { usage: 45, cores: 4, temperature: 68 },
        memory: { used: 12.4, total: 16, percentage: 78 },
        disk: { used: 124, total: 500, percentage: 25 },
        network: { inbound: 1.2, outbound: 0.8, connections: 45 },
        database: { connections: 15, queries: 1247, size: 2.1 },
        docker: { containers: 8, images: 12, volumes: 5 },
        ssl: { certificates: 3, expiring: 1, renewed: 2 },
        uptime: { days: 15, hours: 8, minutes: 24 }
    })

    // Dados de serviços do sistema
    const [systemServices] = useState([
        { name: 'NetPilot Backend', status: 'running', port: 3001, uptime: '15d 8h', memory: '256 MB' },
        { name: 'NetPilot Frontend', status: 'running', port: 3000, uptime: '15d 8h', memory: '128 MB' },
        { name: 'PostgreSQL', status: 'running', port: 5432, uptime: '15d 8h', memory: '512 MB' },
        { name: 'Redis', status: 'running', port: 6379, uptime: '15d 8h', memory: '64 MB' },
        { name: 'Traefik', status: 'running', port: 8080, uptime: '15d 8h', memory: '32 MB' },
        { name: 'Nginx', status: 'running', port: 3010, uptime: '15d 8h', memory: '16 MB' }
    ])

    // Configurações de ambiente
    const [environmentInfo] = useState({
        nodeVersion: 'v18.19.0',
        npmVersion: '10.2.3',
        dockerVersion: '24.0.7',
        osVersion: 'Ubuntu 22.04.3 LTS',
        architecture: 'x86_64',
        timezone: 'America/Sao_Paulo',
        hostname: 'netpilot-server',
        kernelVersion: '5.15.0-91-generic'
    })

    // Dados de integrações disponíveis
    const [integrations] = useState([
        // Integrações Core (Sistema)
        {
            id: 'docker',
            name: 'Docker Engine',
            category: 'core',
            icon: '🐳',
            version: '24.0.7',
            status: 'connected',
            description: 'Container runtime e orquestração',
            endpoint: '/var/run/docker.sock',
            health: 'healthy',
            lastCheck: '2025-01-27 19:30:15',
            metrics: { containers: 8, images: 12, volumes: 5, networks: 3 }
        },
        {
            id: 'traefik',
            name: 'Traefik Proxy',
            category: 'core',
            icon: '🚀',
            version: '3.0',
            status: 'active',
            description: 'Reverse proxy e load balancer',
            endpoint: 'http://localhost:8080',
            health: 'healthy',
            lastCheck: '2025-01-27 19:29:45',
            metrics: { routes: 15, services: 6, middlewares: 8 }
        },
        {
            id: 'postgresql',
            name: 'PostgreSQL',
            category: 'database',
            icon: '🐘',
            version: '15.4',
            status: 'online',
            description: 'Banco de dados principal',
            endpoint: 'postgresql://localhost:5432/netpilot',
            health: 'healthy',
            lastCheck: '2025-01-27 19:30:10',
            metrics: { connections: 15, queries: 1247, size: '2.1GB' }
        },
        {
            id: 'redis',
            name: 'Redis Cache',
            category: 'cache',
            icon: '📦',
            version: '7.2',
            status: 'online',
            description: 'Cache distribuído e sessões',
            endpoint: 'redis://localhost:6379',
            health: 'healthy',
            lastCheck: '2025-01-27 19:30:05',
            metrics: { keys: 342, memory: '64MB', hits: '98.5%' }
        },
        {
            id: 'nginx',
            name: 'Nginx',
            category: 'proxy',
            icon: '🌐',
            version: '1.25',
            status: 'active',
            description: 'Web server e proxy reverso',
            endpoint: 'http://localhost:3010',
            health: 'healthy',
            lastCheck: '2025-01-27 19:29:55',
            metrics: { requests: 2847, uptime: '15d 8h', workers: 4 }
        },

        // Integrações Externas (Monitoramento)
        {
            id: 'prometheus',
            name: 'Prometheus',
            category: 'monitoring',
            icon: '📊',
            version: '2.45.0',
            status: 'disconnected',
            description: 'Sistema de monitoramento e alertas',
            endpoint: 'http://localhost:9090',
            health: 'unhealthy',
            lastCheck: '2025-01-27 18:15:30',
            metrics: { targets: 0, rules: 0, alerts: 0 }
        },
        {
            id: 'grafana',
            name: 'Grafana',
            category: 'monitoring',
            icon: '📈',
            version: '10.2.0',
            status: 'disconnected',
            description: 'Dashboards e visualização',
            endpoint: 'http://localhost:3001',
            health: 'unhealthy',
            lastCheck: '2025-01-27 18:15:25',
            metrics: { dashboards: 0, users: 0, datasources: 0 }
        },

        // Integrações CI/CD
        {
            id: 'github',
            name: 'GitHub',
            category: 'ci_cd',
            icon: '🐙',
            version: 'API v4',
            status: 'disconnected',
            description: 'Repositórios e automação',
            endpoint: 'https://api.github.com',
            health: 'unknown',
            lastCheck: null,
            metrics: { repos: 0, webhooks: 0, actions: 0 }
        },
        {
            id: 'gitlab',
            name: 'GitLab',
            category: 'ci_cd',
            icon: '🦊',
            version: 'API v4',
            status: 'disconnected',
            description: 'DevOps e pipelines',
            endpoint: 'https://gitlab.com/api/v4',
            health: 'unknown',
            lastCheck: null,
            metrics: { projects: 0, pipelines: 0, runners: 0 }
        },

        // Integrações de Notificação
        {
            id: 'slack_integration',
            name: 'Slack',
            category: 'notification',
            icon: '💬',
            version: 'Webhook',
            status: 'configured',
            description: 'Notificações em tempo real',
            endpoint: 'https://hooks.slack.com/services/...',
            health: 'healthy',
            lastCheck: '2025-01-27 19:25:40',
            metrics: { messages: 156, channels: 3, success: '99.2%' }
        },
        {
            id: 'discord_integration',
            name: 'Discord',
            category: 'notification',
            icon: '🎮',
            version: 'Webhook',
            status: 'disconnected',
            description: 'Alertas para equipe',
            endpoint: 'https://discord.com/api/webhooks/...',
            health: 'unknown',
            lastCheck: null,
            metrics: { messages: 0, guilds: 0, success: '0%' }
        },

        // Integrações Cloud
        {
            id: 'aws',
            name: 'Amazon AWS',
            category: 'cloud',
            icon: '☁️',
            version: 'SDK v3',
            status: 'disconnected',
            description: 'Serviços cloud AWS',
            endpoint: 'https://aws.amazon.com',
            health: 'unknown',
            lastCheck: null,
            metrics: { services: 0, regions: 0, costs: '$0' }
        },
        {
            id: 'digitalocean',
            name: 'DigitalOcean',
            category: 'cloud',
            icon: '🌊',
            version: 'API v2',
            status: 'disconnected',
            description: 'Droplets e recursos cloud',
            endpoint: 'https://api.digitalocean.com/v2',
            health: 'unknown',
            lastCheck: null,
            metrics: { droplets: 0, volumes: 0, snapshots: 0 }
        }
    ])

    // Configurações das integrações
    const [integrationSettings, setIntegrationSettings] = useState({
        // GitHub
        githubToken: '',
        githubWebhookSecret: '',
        githubOrganization: '',

        // GitLab
        gitlabToken: '',
        gitlabWebhookSecret: '',
        gitlabUrl: 'https://gitlab.com',

        // Slack
        slackWebhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        slackChannel: '#netpilot-alerts',
        slackUsername: 'NetPilot Bot',

        // Discord
        discordWebhookUrl: '',
        discordUsername: 'NetPilot Bot',

        // Prometheus
        prometheusUrl: 'http://localhost:9090',
        prometheusInterval: 15,
        prometheusRetention: '15d',

        // Grafana
        grafanaUrl: 'http://localhost:3001',
        grafanaApiKey: '',
        grafanaOrganization: 'Main Org.',

        // AWS
        awsAccessKey: '',
        awsSecretKey: '',
        awsRegion: 'us-east-1',

        // DigitalOcean
        doApiToken: '',
        doRegion: 'nyc1'
    })

    if (!auth) return null

    const handleLogout = () => {
        logout()
        router.push('/login')
        toast.success('Logout realizado com sucesso!')
    }

    const handleRefreshData = async () => {
        setIsLoading(true)
        try {
            // Simular refresh dos dados
            await new Promise(resolve => setTimeout(resolve, 2000))
            toast.success('Dados atualizados com sucesso!')
        } catch (error) {
            toast.error('Erro ao atualizar dados')
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfigChange = (setting: string, value: boolean) => {
        // Salvar configuração no localStorage
        localStorage.setItem(`netpilot_${setting}`, value.toString())
        toast.success(`Configuração ${setting} ${value ? 'ativada' : 'desativada'}`)
    }

    const handleProfileSave = async () => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success('Perfil atualizado com sucesso!')
            setProfileModalOpen(false)
        } catch (error) {
            toast.error('Erro ao atualizar perfil')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordChange = async () => {
        if (securityData.newPassword !== securityData.confirmPassword) {
            toast.error('Senhas não coincidem')
            return
        }

        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success('Senha alterada com sucesso!')
            setSecurityData({...securityData, currentPassword: '', newPassword: '', confirmPassword: ''})
            setSecurityModalOpen(false)
        } catch (error) {
            toast.error('Erro ao alterar senha')
        } finally {
            setIsLoading(false)
        }
    }

    const handleBackupCreate = async () => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 2000))
            toast.success('Backup criado com sucesso!')
        } catch (error) {
            toast.error('Erro ao criar backup')
        } finally {
            setIsLoading(false)
        }
    }

    const handleBackupRestore = async () => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 3000))
            toast.success('Backup restaurado com sucesso!')
        } catch (error) {
            toast.error('Erro ao restaurar backup')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRevokeAllSessions = async () => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            toast.success('Todas as sessões foram revogadas!')
        } catch (error) {
            toast.error('Erro ao revogar sessões')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClearLoginHistory = async () => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success('Histórico de login limpo com sucesso!')
        } catch (error) {
            toast.error('Erro ao limpar histórico')
        } finally {
            setIsLoading(false)
        }
    }

    const handleReset2FA = async () => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            setSecurityData({...securityData, twoFactorEnabled: false})
            toast.success('Configurações 2FA resetadas!')
        } catch (error) {
            toast.error('Erro ao resetar 2FA')
        } finally {
            setIsLoading(false)
        }
    }

    const handleExportSecurityLog = () => {
        const csvContent = securityLogs.map(log =>
            `${log.timestamp},${log.action},${log.ip},${log.userAgent},${log.status}`
        ).join('\n')

        const blob = new Blob([`Timestamp,Action,IP,UserAgent,Status\n${csvContent}`],
            { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'netpilot-security-log.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Log de segurança exportado!')
    }

    const handleTestNotification = async (channel: string) => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 2000))
            toast.success(`Notificação de teste enviada via ${channel}!`)
        } catch (error) {
            toast.error(`Erro ao enviar notificação via ${channel}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveNotificationSettings = async () => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            toast.success('Configurações de notificação salvas!')
            setNotificationModalOpen(false)
        } catch (error) {
            toast.error('Erro ao salvar configurações')
        } finally {
            setIsLoading(false)
        }
    }

    const handleExportNotificationHistory = () => {
        const csvContent = notificationHistory.map(notification =>
            `${notification.timestamp},"${notification.type}","${notification.message}",${notification.severity},${notification.channel},${notification.status},"${notification.recipient}"`
        ).join('\n')

        const blob = new Blob([`Timestamp,Type,Message,Severity,Channel,Status,Recipient\n${csvContent}`],
            { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'netpilot-notification-history.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Histórico de notificações exportado!')
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
            case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'
            case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
            case 'medium': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
            case 'info': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
            default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
        }
    }

    const handleSystemRestart = async () => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 3000))
            toast.success('Sistema reiniciado com sucesso!')
        } catch (error) {
            toast.error('Erro ao reiniciar sistema')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSystemCleanup = async () => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 2000))
            toast.success('Limpeza do sistema concluída!')
        } catch (error) {
            toast.error('Erro na limpeza do sistema')
        } finally {
            setIsLoading(false)
        }
    }

    const handleHealthCheck = async () => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            toast.success('Verificação de saúde: Sistema OK!')
        } catch (error) {
            toast.error('Problemas detectados na verificação')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCacheClear = async () => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success('Cache limpo com sucesso!')
        } catch (error) {
            toast.error('Erro ao limpar cache')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveSystemSettings = async () => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            toast.success('Configurações do sistema salvas!')
            setSystemModalOpen(false)
        } catch (error) {
            toast.error('Erro ao salvar configurações')
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
            case 'stopped': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
            case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
            default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
        }
    }

    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-red-500'
        if (percentage >= 75) return 'bg-yellow-500'
        if (percentage >= 50) return 'bg-blue-500'
        return 'bg-green-500'
    }

    const handleIntegrationConnect = async (integrationId: string) => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 2000))
            toast.success(`Integração ${integrationId} conectada com sucesso!`)
        } catch (error) {
            toast.error(`Erro ao conectar integração ${integrationId}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleIntegrationDisconnect = async (integrationId: string) => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            toast.success(`Integração ${integrationId} desconectada!`)
        } catch (error) {
            toast.error(`Erro ao desconectar integração ${integrationId}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleIntegrationTest = async (integrationId: string) => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const integration = integrations.find(i => i.id === integrationId)
            if (integration?.health === 'healthy') {
                toast.success(`Teste da integração ${integration.name}: OK!`)
            } else {
                toast.error(`Teste da integração ${integration?.name}: Falha`)
            }
        } catch (error) {
            toast.error(`Erro no teste da integração`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveIntegrationSettings = async () => {
        setIsLoading(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            toast.success('Configurações de integrações salvas!')
            setIntegrationModalOpen(false)
        } catch (error) {
            toast.error('Erro ao salvar configurações')
        } finally {
            setIsLoading(false)
        }
    }

    const getIntegrationStatusColor = (status: string) => {
        switch (status) {
            case 'connected':
            case 'active':
            case 'online':
            case 'configured':
                return 'text-green-600 bg-green-50 dark:bg-green-900/20'
            case 'disconnected':
                return 'text-red-600 bg-red-50 dark:bg-red-900/20'
            case 'warning':
                return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
            default:
                return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
        }
    }

    const getHealthIcon = (health: string) => {
        switch (health) {
            case 'healthy': return '🟢'
            case 'unhealthy': return '🔴'
            case 'warning': return '🟡'
            default: return '🔘'
        }
    }

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'core': return '⚙️'
            case 'database': return '💾'
            case 'cache': return '⚡'
            case 'proxy': return '🔀'
            case 'monitoring': return '📊'
            case 'ci_cd': return '🚀'
            case 'notification': return '🔔'
            case 'cloud': return '☁️'
            default: return '🔧'
        }
    }

    const groupedIntegrations = integrations.reduce((acc, integration) => {
        if (!acc[integration.category]) {
            acc[integration.category] = []
        }
        acc[integration.category].push(integration)
        return acc
    }, {} as Record<string, typeof integrations>)

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
                        <p className="text-muted-foreground">
                            Gerencie configurações do sistema e preferências
                        </p>
                    </div>
                </div>

                {/* Settings Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Perfil do Usuário */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <User className="h-6 w-6 text-blue-500" />
                                <h2 className="text-lg font-semibold">Perfil do Usuário</h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setProfileModalOpen(true)}
                            >
                                <Edit3 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">Nome</Label>
                                <p className="text-sm text-muted-foreground">{profileData.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Email</Label>
                                <p className="text-sm text-muted-foreground font-mono">{profileData.email}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Papel</Label>
                                <p className="text-sm text-muted-foreground">{profileData.role}</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className="w-full"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sair do Sistema
                            </Button>
                        </div>
                    </Card>

                    {/* Sistema */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <Monitor className="h-6 w-6 text-green-500" />
                                <h2 className="text-lg font-semibold">Sistema</h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSystemModalOpen(true)}
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="auto-refresh" className="text-sm font-medium">
                                    Atualização Automática
                                </Label>
                                <Switch
                                    id="auto-refresh"
                                    checked={autoRefresh}
                                    onCheckedChange={(checked) => {
                                        setAutoRefresh(checked)
                                        handleConfigChange('auto_refresh', checked)
                                    }}
                                />
                            </div>

                            {/* Métricas do Sistema */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-medium text-muted-foreground">CPU</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${getUsageColor(systemMetrics.cpu.usage)}`}
                                                style={{ width: `${systemMetrics.cpu.usage}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono">{systemMetrics.cpu.usage}%</span>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-muted-foreground">Memória</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${getUsageColor(systemMetrics.memory.percentage)}`}
                                                style={{ width: `${systemMetrics.memory.percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono">{systemMetrics.memory.percentage}%</span>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-muted-foreground">Disco</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${getUsageColor(systemMetrics.disk.percentage)}`}
                                                style={{ width: `${systemMetrics.disk.percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono">{systemMetrics.disk.percentage}%</span>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-muted-foreground">Uptime</Label>
                                    <p className="text-xs font-mono">{systemMetrics.uptime.days}d {systemMetrics.uptime.hours}h</p>
                                </div>
                            </div>

                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Serviços</span>
                                    <span className="text-xs text-green-600">{systemServices.filter(s => s.status === 'running').length}/{systemServices.length} ativos</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Containers</span>
                                    <span className="text-xs text-muted-foreground">{systemMetrics.docker.containers} em execução</span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefreshData}
                                disabled={isLoading}
                                className="w-full"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                {isLoading ? 'Atualizando...' : 'Atualizar Dados'}
                            </Button>
                        </div>
                    </Card>

                    {/* Notificações */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <Bell className="h-6 w-6 text-yellow-500" />
                                <h2 className="text-lg font-semibold">Notificações</h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setNotificationModalOpen(true)}
                            >
                                <Bell className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="notifications" className="text-sm font-medium">
                                    Alertas do Sistema
                                </Label>
                                <Switch
                                    id="notifications"
                                    checked={notifications}
                                    onCheckedChange={(checked) => {
                                        setNotifications(checked)
                                        handleConfigChange('notifications', checked)
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Email</Label>
                                    <Badge variant={notificationSettings.emailNotifications ? "default" : "secondary"}>
                                        {notificationSettings.emailNotifications ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">SMS</Label>
                                    <Badge variant={notificationSettings.smsNotifications ? "default" : "secondary"}>
                                        {notificationSettings.smsNotifications ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Slack</Label>
                                    <Badge variant={notificationSettings.slackNotifications ? "default" : "secondary"}>
                                        {notificationSettings.slackNotifications ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Webhook</Label>
                                    <Badge variant={notificationSettings.webhookNotifications ? "default" : "secondary"}>
                                        {notificationSettings.webhookNotifications ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Histórico</span>
                                    <span className="text-xs text-muted-foreground">{notificationHistory.length} notificações</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Última notificação</span>
                                    <span className="text-xs text-green-600">Hoje 15:45</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Taxa de entrega</span>
                                    <span className="text-xs text-green-600">95%</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Segurança */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <Shield className="h-6 w-6 text-green-500" />
                                <h2 className="text-lg font-semibold">Segurança</h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSecurityModalOpen(true)}
                            >
                                <Key className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">Último Login</Label>
                                <p className="text-sm text-muted-foreground">Hoje às 14:30 (192.168.1.100)</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Token Status</Label>
                                <p className="text-sm text-green-600">✓ Ativo e válido</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-sm font-medium">2FA</Label>
                                    <Badge variant={securityData.twoFactorEnabled ? "default" : "secondary"}>
                                        {securityData.twoFactorEnabled ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Proteção</Label>
                                    <Badge variant={securityData.lockoutEnabled ? "default" : "secondary"}>
                                        {securityData.lockoutEnabled ? 'Ativa' : 'Inativa'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-sm font-medium">Sessão</Label>
                                    <p className="text-sm text-muted-foreground">Expira em {securityData.sessionTimeout} dias</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Alertas</Label>
                                    <Badge variant={securityData.loginAlerts ? "default" : "secondary"}>
                                        {securityData.loginAlerts ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Log de Segurança</span>
                                    <span className="text-xs text-muted-foreground">{securityLogs.length} registros</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Última atividade suspeita</span>
                                    <span className="text-xs text-red-600">25/01 22:45</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Backup & Restauração */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <Database className="h-6 w-6 text-red-500" />
                                <h2 className="text-lg font-semibold">Backup & Restauração</h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBackupModalOpen(true)}
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">Último Backup</Label>
                                <p className="text-sm text-muted-foreground">Hoje às 03:00</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Backup Automático</Label>
                                <Badge variant={systemSettings.autoBackup ? "default" : "secondary"}>
                                    {systemSettings.autoBackup ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Tamanho</Label>
                                <p className="text-sm text-muted-foreground">127 MB</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/logs')}
                                className="w-full"
                            >
                                Ver Logs
                            </Button>
                        </div>
                    </Card>

                    {/* Integrações */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <Wifi className="h-6 w-6 text-indigo-500" />
                                <h2 className="text-lg font-semibold">Integrações</h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIntegrationModalOpen(true)}
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {/* Core Integrations */}
                            <div className="grid grid-cols-2 gap-3">
                                {integrations.filter(i => i.category === 'core').slice(0, 4).map((integration) => (
                                    <div key={integration.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{integration.icon}</span>
                                            <div>
                                                <Label className="text-xs font-medium">{integration.name}</Label>
                                                <p className="text-xs text-muted-foreground">{integration.version}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm">{getHealthIcon(integration.health)}</span>
                                            <Badge variant={integration.status === 'connected' || integration.status === 'active' || integration.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                                                {integration.status === 'connected' ? 'OK' :
                                                 integration.status === 'active' ? 'ON' :
                                                 integration.status === 'online' ? 'UP' : 'OFF'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* External Integrations Summary */}
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Integrações Externas</span>
                                    <span className="text-xs text-muted-foreground">
                                        {integrations.filter(i => ['monitoring', 'ci_cd', 'notification', 'cloud'].includes(i.category) &&
                                          ['connected', 'configured', 'active'].includes(i.status)).length}/{integrations.filter(i => ['monitoring', 'ci_cd', 'notification', 'cloud'].includes(i.category)).length} ativas
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Slack</span>
                                    <Badge variant="default" className="text-xs">Configurado</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">GitHub/GitLab</span>
                                    <Badge variant="secondary" className="text-xs">Pendente</Badge>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIntegrationModalOpen(true)}
                                className="w-full"
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Gerenciar Integrações
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Informações do Sistema */}
                <Card className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Monitor className="h-6 w-6 text-green-500" />
                        <h2 className="text-lg font-semibold">Informações do Sistema</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <dt className="font-medium text-muted-foreground">Versão</dt>
                            <dd className="font-mono">NetPilot v1.0.0</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Usuário Ativo</dt>
                            <dd className="font-mono">admin@netpilot.local</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-muted-foreground">Ambiente</dt>
                            <dd className="font-mono">Produção</dd>
                        </div>
                    </div>
                </Card>

                {/* Modal de Perfil do Usuário */}
                <Modal
                    isOpen={profileModalOpen}
                    onClose={() => setProfileModalOpen(false)}
                    title="Editar Perfil"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="profile-name">Nome</Label>
                            <Input
                                id="profile-name"
                                value={profileData.name}
                                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                placeholder="Seu nome completo"
                            />
                        </div>
                        <div>
                            <Label htmlFor="profile-email">Email</Label>
                            <Input
                                id="profile-email"
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="profile-role">Papel</Label>
                            <Input
                                id="profile-role"
                                value={profileData.role}
                                disabled
                                placeholder="Administrador"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                O papel não pode ser alterado pelo próprio usuário
                            </p>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setProfileModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleProfileSave}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Salvar
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Modal de Segurança */}
                <Modal
                    isOpen={securityModalOpen}
                    onClose={() => setSecurityModalOpen(false)}
                    title="Configurações de Segurança"
                    size="xl"
                >
                    <div className="space-y-6">
                        {/* Alterar Senha */}
                        <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Key className="h-5 w-5 text-blue-500" />
                                Alterar Senha
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="current-password">Senha Atual</Label>
                                    <Input
                                        id="current-password"
                                        type="password"
                                        value={securityData.currentPassword}
                                        onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                                        placeholder="Digite sua senha atual"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="new-password">Nova Senha</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={securityData.newPassword}
                                            onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                                            placeholder="Digite a nova senha"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={securityData.confirmPassword}
                                            onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                                            placeholder="Confirme a nova senha"
                                        />
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                    <strong>Requisitos da senha:</strong> Mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos especiais.
                                </div>
                            </div>
                        </div>

                        {/* Autenticação de Dois Fatores */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-green-500" />
                                Autenticação de Dois Fatores (2FA)
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Ativar 2FA</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Adicione uma camada extra de segurança à sua conta
                                        </p>
                                    </div>
                                    <Switch
                                        checked={securityData.twoFactorEnabled}
                                        onCheckedChange={(checked) =>
                                            setSecurityData({...securityData, twoFactorEnabled: checked})
                                        }
                                    />
                                </div>
                                {securityData.twoFactorEnabled && (
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                        <p className="text-sm text-green-800 dark:text-green-200">
                                            ✓ 2FA está ativo. Use seu aplicativo autenticador para fazer login.
                                        </p>
                                        <Button variant="outline" size="sm" className="mt-2">
                                            Ver Códigos de Backup
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Configurações de Sessão */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-purple-500" />
                                Configurações de Sessão
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="session-timeout">Tempo de Expiração (dias)</Label>
                                    <Input
                                        id="session-timeout"
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={securityData.sessionTimeout}
                                        onChange={(e) => setSecurityData({...securityData, sessionTimeout: parseInt(e.target.value)})}
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Defina quando sua sessão expira automaticamente
                                    </p>
                                </div>
                                <div>
                                    <Label className="flex items-center justify-between">
                                        Alertas de Login
                                        <Switch
                                            checked={securityData.loginAlerts}
                                            onCheckedChange={(checked) =>
                                                setSecurityData({...securityData, loginAlerts: checked})
                                            }
                                        />
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Receber email sobre novos logins
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Proteção contra Ataques */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-red-500" />
                                Proteção contra Ataques
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Bloqueio de Conta</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Bloquear conta após tentativas inválidas
                                        </p>
                                    </div>
                                    <Switch
                                        checked={securityData.lockoutEnabled}
                                        onCheckedChange={(checked) =>
                                            setSecurityData({...securityData, lockoutEnabled: checked})
                                        }
                                    />
                                </div>

                                {securityData.lockoutEnabled && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="max-attempts">Máximo de Tentativas</Label>
                                            <Input
                                                id="max-attempts"
                                                type="number"
                                                min="3"
                                                max="10"
                                                value={securityData.maxLoginAttempts}
                                                onChange={(e) => setSecurityData({...securityData, maxLoginAttempts: parseInt(e.target.value)})}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="lockout-duration">Duração do Bloqueio (min)</Label>
                                            <Input
                                                id="lockout-duration"
                                                type="number"
                                                min="5"
                                                max="1440"
                                                value={securityData.lockoutDuration}
                                                onChange={(e) => setSecurityData({...securityData, lockoutDuration: parseInt(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="ip-whitelist">Lista de IPs Permitidos (opcional)</Label>
                                    <Textarea
                                        id="ip-whitelist"
                                        value={securityData.ipWhitelist}
                                        onChange={(e) => setSecurityData({...securityData, ipWhitelist: e.target.value})}
                                        placeholder="192.168.1.0/24, 10.0.0.0/8"
                                        className="min-h-[80px]"
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Um IP por linha. Deixe vazio para permitir qualquer IP.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Histórico de Segurança */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Monitor className="h-5 w-5 text-indigo-500" />
                                Histórico de Segurança
                            </h3>
                            <div className="max-h-64 overflow-y-auto border rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left p-3 font-medium">Ação</th>
                                            <th className="text-left p-3 font-medium">IP</th>
                                            <th className="text-left p-3 font-medium">Data/Hora</th>
                                            <th className="text-left p-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {securityLogs.map((log) => (
                                            <tr key={log.id} className="border-t">
                                                <td className="p-3">
                                                    <div>
                                                        <p className="font-medium">{log.action}</p>
                                                        <p className="text-xs text-muted-foreground">{log.userAgent}</p>
                                                    </div>
                                                </td>
                                                <td className="p-3 font-mono text-xs">{log.ip}</td>
                                                <td className="p-3 text-xs">{log.timestamp}</td>
                                                <td className="p-3">
                                                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                                                        {log.status === 'success' ? 'Sucesso' : 'Falha'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3 flex justify-between items-center text-sm text-muted-foreground">
                                <span>Últimas 4 atividades</span>
                                <Button variant="ghost" size="sm">
                                    Ver Histórico Completo
                                </Button>
                            </div>
                        </div>

                        {/* Ações de Emergência */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <X className="h-5 w-5 text-red-500" />
                                Ações de Emergência
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="text-left justify-start"
                                    onClick={handleRevokeAllSessions}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                                    Revogar Todas as Sessões
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-left justify-start"
                                    onClick={handleClearLoginHistory}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                                    Limpar Histórico de Login
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-left justify-start"
                                    onClick={handleReset2FA}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                                    Resetar Configurações 2FA
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-left justify-start"
                                    onClick={handleExportSecurityLog}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Exportar Log de Segurança
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setSecurityModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handlePasswordChange}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="h-4 w-4 mr-2" />
                                        Salvar Configurações
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Modal de Notificações */}
                <Modal
                    isOpen={notificationModalOpen}
                    onClose={() => setNotificationModalOpen(false)}
                    title="Sistema de Notificações"
                    size="xl"
                >
                    <div className="space-y-6">
                        {/* Canais de Comunicação */}
                        <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Bell className="h-5 w-5 text-blue-500" />
                                Canais de Comunicação
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Email</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Notificações por email
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={notificationSettings.emailNotifications}
                                                onCheckedChange={(checked) =>
                                                    setNotificationSettings({...notificationSettings, emailNotifications: checked})
                                                }
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleTestNotification('email')}
                                                disabled={!notificationSettings.emailNotifications || isLoading}
                                            >
                                                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Testar'}
                                            </Button>
                                        </div>
                                    </div>
                                    {notificationSettings.emailNotifications && (
                                        <div>
                                            <Label htmlFor="email-address">Endereço de Email</Label>
                                            <Input
                                                id="email-address"
                                                type="email"
                                                value={notificationSettings.emailAddress}
                                                onChange={(e) => setNotificationSettings({...notificationSettings, emailAddress: e.target.value})}
                                                placeholder="admin@netpilot.local"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>SMS</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Alertas via mensagem de texto
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={notificationSettings.smsNotifications}
                                                onCheckedChange={(checked) =>
                                                    setNotificationSettings({...notificationSettings, smsNotifications: checked})
                                                }
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleTestNotification('SMS')}
                                                disabled={!notificationSettings.smsNotifications || isLoading}
                                            >
                                                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Testar'}
                                            </Button>
                                        </div>
                                    </div>
                                    {notificationSettings.smsNotifications && (
                                        <div>
                                            <Label htmlFor="phone-number">Número de Telefone</Label>
                                            <Input
                                                id="phone-number"
                                                type="tel"
                                                value={notificationSettings.phoneNumber}
                                                onChange={(e) => setNotificationSettings({...notificationSettings, phoneNumber: e.target.value})}
                                                placeholder="+55 11 99999-9999"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Slack</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Notificações no Slack
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={notificationSettings.slackNotifications}
                                                onCheckedChange={(checked) =>
                                                    setNotificationSettings({...notificationSettings, slackNotifications: checked})
                                                }
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleTestNotification('Slack')}
                                                disabled={!notificationSettings.slackNotifications || isLoading}
                                            >
                                                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Testar'}
                                            </Button>
                                        </div>
                                    </div>
                                    {notificationSettings.slackNotifications && (
                                        <div>
                                            <Label htmlFor="slack-webhook">Webhook URL do Slack</Label>
                                            <Input
                                                id="slack-webhook"
                                                type="url"
                                                value={notificationSettings.slackWebhook}
                                                onChange={(e) => setNotificationSettings({...notificationSettings, slackWebhook: e.target.value})}
                                                placeholder="https://hooks.slack.com/services/..."
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Discord</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Notificações no Discord
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={notificationSettings.discordNotifications}
                                                onCheckedChange={(checked) =>
                                                    setNotificationSettings({...notificationSettings, discordNotifications: checked})
                                                }
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleTestNotification('Discord')}
                                                disabled={!notificationSettings.discordNotifications || isLoading}
                                            >
                                                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Testar'}
                                            </Button>
                                        </div>
                                    </div>
                                    {notificationSettings.discordNotifications && (
                                        <div>
                                            <Label htmlFor="discord-webhook">Webhook URL do Discord</Label>
                                            <Input
                                                id="discord-webhook"
                                                type="url"
                                                value={notificationSettings.discordWebhook}
                                                onChange={(e) => setNotificationSettings({...notificationSettings, discordWebhook: e.target.value})}
                                                placeholder="https://discord.com/api/webhooks/..."
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Webhook Customizado</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Webhook personalizado
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={notificationSettings.webhookNotifications}
                                                onCheckedChange={(checked) =>
                                                    setNotificationSettings({...notificationSettings, webhookNotifications: checked})
                                                }
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleTestNotification('Webhook')}
                                                disabled={!notificationSettings.webhookNotifications || isLoading}
                                            >
                                                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Testar'}
                                            </Button>
                                        </div>
                                    </div>
                                    {notificationSettings.webhookNotifications && (
                                        <div>
                                            <Label htmlFor="custom-webhook">URL do Webhook</Label>
                                            <Input
                                                id="custom-webhook"
                                                type="url"
                                                value={notificationSettings.customWebhook}
                                                onChange={(e) => setNotificationSettings({...notificationSettings, customWebhook: e.target.value})}
                                                placeholder="https://api.example.com/webhook"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tipos de Alertas */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Settings className="h-5 w-5 text-green-500" />
                                Tipos de Alertas
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Expiração de SSL</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Certificados SSL expirando
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.sslExpiry}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({...notificationSettings, sslExpiry: checked})
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Alertas do Sistema</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Status do sistema
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.systemAlerts}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({...notificationSettings, systemAlerts: checked})
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Status de Deploy</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Deployments e atualizações
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.deploymentStatus}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({...notificationSettings, deploymentStatus: checked})
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Logs de Erro</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Erros críticos
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.errorLogs}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({...notificationSettings, errorLogs: checked})
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Performance</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Alertas de performance
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.performanceAlerts}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({...notificationSettings, performanceAlerts: checked})
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Eventos de Segurança</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Tentativas de acesso
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.securityEvents}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({...notificationSettings, securityEvents: checked})
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Status de Backup</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Backups realizados
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.backupStatus}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({...notificationSettings, backupStatus: checked})
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Uso de Recursos</Label>
                                        <p className="text-sm text-muted-foreground">
                                            CPU, memória, disco
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.resourceUsage}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({...notificationSettings, resourceUsage: checked})
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Configurações Avançadas */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-purple-500" />
                                Configurações Avançadas
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Horário Silencioso</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Pausar notificações em horários específicos
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notificationSettings.quietHoursEnabled}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings({...notificationSettings, quietHoursEnabled: checked})
                                            }
                                        />
                                    </div>
                                    {notificationSettings.quietHoursEnabled && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label htmlFor="quiet-start">Início</Label>
                                                <Input
                                                    id="quiet-start"
                                                    type="time"
                                                    value={notificationSettings.quietHoursStart}
                                                    onChange={(e) => setNotificationSettings({...notificationSettings, quietHoursStart: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="quiet-end">Fim</Label>
                                                <Input
                                                    id="quiet-end"
                                                    type="time"
                                                    value={notificationSettings.quietHoursEnd}
                                                    onChange={(e) => setNotificationSettings({...notificationSettings, quietHoursEnd: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="max-notifications">Máximo por Hora</Label>
                                        <Input
                                            id="max-notifications"
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={notificationSettings.maxNotificationsPerHour}
                                            onChange={(e) => setNotificationSettings({...notificationSettings, maxNotificationsPerHour: parseInt(e.target.value)})}
                                        />
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Limite de notificações por hora
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="severity-filter">Severidade Mínima</Label>
                                        <select
                                            id="severity-filter"
                                            className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                                            value={notificationSettings.minimumSeverity}
                                            onChange={(e) => setNotificationSettings({...notificationSettings, minimumSeverity: e.target.value})}
                                        >
                                            <option value="info">Info</option>
                                            <option value="warning">Warning</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Escalação</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Reenviar após delay
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notificationSettings.escalationEnabled}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings({...notificationSettings, escalationEnabled: checked})
                                            }
                                        />
                                    </div>
                                    {notificationSettings.escalationEnabled && (
                                        <div>
                                            <Label htmlFor="escalation-delay">Delay (minutos)</Label>
                                            <Input
                                                id="escalation-delay"
                                                type="number"
                                                min="5"
                                                max="1440"
                                                value={notificationSettings.escalationDelay}
                                                onChange={(e) => setNotificationSettings({...notificationSettings, escalationDelay: parseInt(e.target.value)})}
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Rate Limiting</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Controle de taxa
                                            </p>
                                        </div>
                                        <Switch
                                            checked={notificationSettings.rateLimitingEnabled}
                                            onCheckedChange={(checked) =>
                                                setNotificationSettings({...notificationSettings, rateLimitingEnabled: checked})
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Histórico de Notificações */}
                        <div className="border-t pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium flex items-center gap-2">
                                    <Monitor className="h-5 w-5 text-indigo-500" />
                                    Histórico de Notificações
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleExportNotificationHistory}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Exportar
                                </Button>
                            </div>
                            <div className="max-h-64 overflow-y-auto border rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left p-3 font-medium">Tipo</th>
                                            <th className="text-left p-3 font-medium">Mensagem</th>
                                            <th className="text-left p-3 font-medium">Canal</th>
                                            <th className="text-left p-3 font-medium">Status</th>
                                            <th className="text-left p-3 font-medium">Data</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {notificationHistory.map((notification) => (
                                            <tr key={notification.id} className="border-t">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(notification.severity)}`}>
                                                            {notification.severity.toUpperCase()}
                                                        </span>
                                                        <span className="font-medium">{notification.type}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 max-w-xs">
                                                    <p className="truncate" title={notification.message}>
                                                        {notification.message}
                                                    </p>
                                                </td>
                                                <td className="p-3 capitalize">{notification.channel}</td>
                                                <td className="p-3">
                                                    <Badge variant={notification.status === 'sent' ? 'default' : 'destructive'}>
                                                        {notification.status === 'sent' ? 'Enviado' : 'Falha'}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-xs font-mono">{notification.timestamp}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Templates de Notificação */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Edit3 className="h-5 w-5 text-orange-500" />
                                Templates de Notificação
                            </h3>
                            <div className="space-y-3">
                                {notificationTemplates.map((template) => (
                                    <div key={template.id} className="p-4 border rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{template.name}</h4>
                                                <Badge variant={template.enabled ? 'default' : 'secondary'}>
                                                    {template.enabled ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                            </div>
                                            <Button variant="ghost" size="sm">
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <p><strong>Assunto:</strong> {template.subject}</p>
                                            <p><strong>Mensagem:</strong> {template.body}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setNotificationModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveNotificationSettings}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Bell className="h-4 w-4 mr-2" />
                                        Salvar Configurações
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Modal de Sistema */}
                <Modal
                    isOpen={systemModalOpen}
                    onClose={() => setSystemModalOpen(false)}
                    title="Configurações e Monitoramento do Sistema"
                    size="xl"
                >
                    <div className="space-y-6">
                        {/* Monitoramento em Tempo Real */}
                        <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Monitor className="h-5 w-5 text-blue-500" />
                                Monitoramento em Tempo Real
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium">CPU</Label>
                                        <span className="text-sm font-mono">{systemMetrics.cpu.usage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                                        <div
                                            className={`h-2 rounded-full ${getUsageColor(systemMetrics.cpu.usage)}`}
                                            style={{ width: `${systemMetrics.cpu.usage}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {systemMetrics.cpu.cores} cores • {systemMetrics.cpu.temperature}°C
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium">Memória</Label>
                                        <span className="text-sm font-mono">{systemMetrics.memory.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                                        <div
                                            className={`h-2 rounded-full ${getUsageColor(systemMetrics.memory.percentage)}`}
                                            style={{ width: `${systemMetrics.memory.percentage}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {systemMetrics.memory.used}GB / {systemMetrics.memory.total}GB
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium">Disco</Label>
                                        <span className="text-sm font-mono">{systemMetrics.disk.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                                        <div
                                            className={`h-2 rounded-full ${getUsageColor(systemMetrics.disk.percentage)}`}
                                            style={{ width: `${systemMetrics.disk.percentage}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {systemMetrics.disk.used}GB / {systemMetrics.disk.total}GB
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium">Network</Label>
                                        <span className="text-sm font-mono">{systemMetrics.network.connections}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <div>↓ {systemMetrics.network.inbound} MB/s</div>
                                        <div>↑ {systemMetrics.network.outbound} MB/s</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status dos Serviços */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Settings className="h-5 w-5 text-green-500" />
                                Status dos Serviços
                            </h3>
                            <div className="max-h-64 overflow-y-auto border rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left p-3 font-medium">Serviço</th>
                                            <th className="text-left p-3 font-medium">Status</th>
                                            <th className="text-left p-3 font-medium">Porta</th>
                                            <th className="text-left p-3 font-medium">Uptime</th>
                                            <th className="text-left p-3 font-medium">Memória</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {systemServices.map((service, index) => (
                                            <tr key={index} className="border-t">
                                                <td className="p-3 font-medium">{service.name}</td>
                                                <td className="p-3">
                                                    <Badge className={getStatusColor(service.status)}>
                                                        {service.status === 'running' ? 'Executando' : 'Parado'}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 font-mono text-xs">{service.port}</td>
                                                <td className="p-3 font-mono text-xs">{service.uptime}</td>
                                                <td className="p-3 font-mono text-xs">{service.memory}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Configurações de Backup e Manutenção */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Database className="h-5 w-5 text-purple-500" />
                                Backup e Manutenção
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Backup Automático</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Backups diários automáticos
                                            </p>
                                        </div>
                                        <Switch
                                            checked={systemSettings.autoBackup}
                                            onCheckedChange={(checked) =>
                                                setSystemSettings({...systemSettings, autoBackup: checked})
                                            }
                                        />
                                    </div>
                                    {systemSettings.autoBackup && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label htmlFor="backup-schedule">Horário</Label>
                                                <Input
                                                    id="backup-schedule"
                                                    type="time"
                                                    value={systemSettings.backupSchedule}
                                                    onChange={(e) => setSystemSettings({...systemSettings, backupSchedule: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="backup-retention">Retenção (dias)</Label>
                                                <Input
                                                    id="backup-retention"
                                                    type="number"
                                                    min="1"
                                                    max="365"
                                                    value={systemSettings.backupRetention}
                                                    onChange={(e) => setSystemSettings({...systemSettings, backupRetention: parseInt(e.target.value)})}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Modo Manutenção</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Bloquear acesso público
                                            </p>
                                        </div>
                                        <Switch
                                            checked={systemSettings.maintenanceMode}
                                            onCheckedChange={(checked) =>
                                                setSystemSettings({...systemSettings, maintenanceMode: checked})
                                            }
                                        />
                                    </div>
                                    {systemSettings.maintenanceMode && (
                                        <div>
                                            <Label htmlFor="maintenance-message">Mensagem de Manutenção</Label>
                                            <Textarea
                                                id="maintenance-message"
                                                value={systemSettings.maintenanceMessage}
                                                onChange={(e) => setSystemSettings({...systemSettings, maintenanceMessage: e.target.value})}
                                                placeholder="Digite a mensagem que será exibida..."
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="log-retention">Retenção de Logs (dias)</Label>
                                        <Input
                                            id="log-retention"
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={systemSettings.logRetention}
                                            onChange={(e) => setSystemSettings({...systemSettings, logRetention: parseInt(e.target.value)})}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="log-level">Nível de Log</Label>
                                        <select
                                            id="log-level"
                                            className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                                            value={systemSettings.logLevel}
                                            onChange={(e) => setSystemSettings({...systemSettings, logLevel: e.target.value})}
                                        >
                                            <option value="error">Error</option>
                                            <option value="warn">Warning</option>
                                            <option value="info">Info</option>
                                            <option value="debug">Debug</option>
                                            <option value="verbose">Verbose</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Modo Debug</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Logs detalhados
                                            </p>
                                        </div>
                                        <Switch
                                            checked={systemSettings.debugMode}
                                            onCheckedChange={(checked) =>
                                                setSystemSettings({...systemSettings, debugMode: checked})
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Compressão de Logs</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Comprimir logs antigos
                                            </p>
                                        </div>
                                        <Switch
                                            checked={systemSettings.logCompression}
                                            onCheckedChange={(checked) =>
                                                setSystemSettings({...systemSettings, logCompression: checked})
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configurações de Performance */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <RefreshCw className="h-5 w-5 text-orange-500" />
                                Performance
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="max-connections">Máximo de Conexões</Label>
                                        <Input
                                            id="max-connections"
                                            type="number"
                                            min="10"
                                            max="1000"
                                            value={systemSettings.maxConnections}
                                            onChange={(e) => setSystemSettings({...systemSettings, maxConnections: parseInt(e.target.value)})}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="connection-timeout">Timeout de Conexão (s)</Label>
                                        <Input
                                            id="connection-timeout"
                                            type="number"
                                            min="5"
                                            max="300"
                                            value={systemSettings.connectionTimeout}
                                            onChange={(e) => setSystemSettings({...systemSettings, connectionTimeout: parseInt(e.target.value)})}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Cache Habilitado</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Cache de aplicação
                                            </p>
                                        </div>
                                        <Switch
                                            checked={systemSettings.enableCaching}
                                            onCheckedChange={(checked) =>
                                                setSystemSettings({...systemSettings, enableCaching: checked})
                                            }
                                        />
                                    </div>
                                    {systemSettings.enableCaching && (
                                        <div>
                                            <Label htmlFor="cache-expiration">Expiração do Cache (s)</Label>
                                            <Input
                                                id="cache-expiration"
                                                type="number"
                                                min="60"
                                                max="86400"
                                                value={systemSettings.cacheExpiration}
                                                onChange={(e) => setSystemSettings({...systemSettings, cacheExpiration: parseInt(e.target.value)})}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="health-check-interval">Intervalo de Health Check (s)</Label>
                                        <Input
                                            id="health-check-interval"
                                            type="number"
                                            min="10"
                                            max="300"
                                            value={systemSettings.healthCheckInterval}
                                            onChange={(e) => setSystemSettings({...systemSettings, healthCheckInterval: parseInt(e.target.value)})}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="alert-threshold">Limite de Alerta (%)</Label>
                                        <Input
                                            id="alert-threshold"
                                            type="number"
                                            min="50"
                                            max="95"
                                            value={systemSettings.alertThreshold}
                                            onChange={(e) => setSystemSettings({...systemSettings, alertThreshold: parseInt(e.target.value)})}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Auto Scaling</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Escalabilidade automática
                                            </p>
                                        </div>
                                        <Switch
                                            checked={systemSettings.autoScaling}
                                            onCheckedChange={(checked) =>
                                                setSystemSettings({...systemSettings, autoScaling: checked})
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>HTTPS Obrigatório</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Forçar conexões seguras
                                            </p>
                                        </div>
                                        <Switch
                                            checked={systemSettings.forceHttps}
                                            onCheckedChange={(checked) =>
                                                setSystemSettings({...systemSettings, forceHttps: checked})
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Informações do Ambiente */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Monitor className="h-5 w-5 text-indigo-500" />
                                Informações do Ambiente
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-3 border rounded-lg">
                                    <Label className="text-xs font-medium text-muted-foreground">Node.js</Label>
                                    <p className="font-mono text-sm">{environmentInfo.nodeVersion}</p>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <Label className="text-xs font-medium text-muted-foreground">Docker</Label>
                                    <p className="font-mono text-sm">{environmentInfo.dockerVersion}</p>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <Label className="text-xs font-medium text-muted-foreground">OS</Label>
                                    <p className="font-mono text-sm">{environmentInfo.osVersion}</p>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <Label className="text-xs font-medium text-muted-foreground">Arquitetura</Label>
                                    <p className="font-mono text-sm">{environmentInfo.architecture}</p>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <Label className="text-xs font-medium text-muted-foreground">Hostname</Label>
                                    <p className="font-mono text-sm">{environmentInfo.hostname}</p>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <Label className="text-xs font-medium text-muted-foreground">Timezone</Label>
                                    <p className="font-mono text-sm">{environmentInfo.timezone}</p>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <Label className="text-xs font-medium text-muted-foreground">Kernel</Label>
                                    <p className="font-mono text-sm">{environmentInfo.kernelVersion}</p>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <Label className="text-xs font-medium text-muted-foreground">Uptime</Label>
                                    <p className="font-mono text-sm">{systemMetrics.uptime.days}d {systemMetrics.uptime.hours}h {systemMetrics.uptime.minutes}m</p>
                                </div>
                            </div>
                        </div>

                        {/* Ações do Sistema */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Settings className="h-5 w-5 text-red-500" />
                                Ações do Sistema
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleHealthCheck}
                                    disabled={isLoading}
                                    className="flex items-center gap-2"
                                >
                                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Monitor className="h-4 w-4" />}
                                    Health Check
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleCacheClear}
                                    disabled={isLoading}
                                    className="flex items-center gap-2"
                                >
                                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    Limpar Cache
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleSystemCleanup}
                                    disabled={isLoading}
                                    className="flex items-center gap-2"
                                >
                                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                                    Limpeza Sistema
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleSystemRestart}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                                >
                                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    Reiniciar Sistema
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setSystemModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveSystemSettings}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Settings className="h-4 w-4 mr-2" />
                                        Salvar Configurações
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Modal de Backup & Restauração */}
                <Modal
                    isOpen={backupModalOpen}
                    onClose={() => setBackupModalOpen(false)}
                    title="Backup & Restauração"
                    size="lg"
                >
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium mb-4">Criar Backup</h3>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Crie um backup completo do sistema incluindo configurações, logs e dados.
                                </p>
                                <Button
                                    onClick={handleBackupCreate}
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Criando Backup...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            Criar Backup Agora
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4">Backups Disponíveis</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">backup-2025-01-27.zip</p>
                                        <p className="text-sm text-muted-foreground">Hoje às 03:00 • 127 MB</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleBackupRestore}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Upload className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">backup-2025-01-26.zip</p>
                                        <p className="text-sm text-muted-foreground">Ontem às 03:00 • 124 MB</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Upload className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4">Configurações de Backup</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Backup Automático Diário</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Criar backup automaticamente às 03:00
                                        </p>
                                    </div>
                                    <Switch
                                        checked={systemSettings.autoBackup}
                                        onCheckedChange={(checked) =>
                                            setSystemSettings({...systemSettings, autoBackup: checked})
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setBackupModalOpen(false)}
                            >
                                Fechar
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Modal de Integrações */}
                <Modal
                    isOpen={integrationModalOpen}
                    onClose={() => setIntegrationModalOpen(false)}
                    title="Centro de Integrações"
                    size="xl"
                >
                    <div className="space-y-6">
                        {/* Visão Geral das Integrações */}
                        <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Wifi className="h-5 w-5 text-blue-500" />
                                Visão Geral
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="p-4 border rounded-lg text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {integrations.filter(i => ['connected', 'active', 'online', 'configured'].includes(i.status)).length}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Ativas</p>
                                </div>
                                <div className="p-4 border rounded-lg text-center">
                                    <p className="text-2xl font-bold text-red-600">
                                        {integrations.filter(i => i.status === 'disconnected').length}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Desconectadas</p>
                                </div>
                                <div className="p-4 border rounded-lg text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {integrations.filter(i => i.health === 'healthy').length}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Saudáveis</p>
                                </div>
                                <div className="p-4 border rounded-lg text-center">
                                    <p className="text-2xl font-bold text-gray-600">
                                        {integrations.length}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Total</p>
                                </div>
                            </div>
                        </div>

                        {/* Integrações por Categoria */}
                        {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
                            <div key={category} className="border-t pt-6">
                                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                    <span className="text-xl">{getCategoryIcon(category)}</span>
                                    {category === 'core' ? 'Sistema Principal' :
                                     category === 'database' ? 'Banco de Dados' :
                                     category === 'cache' ? 'Cache' :
                                     category === 'proxy' ? 'Proxy' :
                                     category === 'monitoring' ? 'Monitoramento' :
                                     category === 'ci_cd' ? 'CI/CD' :
                                     category === 'notification' ? 'Notificações' :
                                     category === 'cloud' ? 'Cloud' : category}
                                    <Badge variant="secondary" className="ml-2">
                                        {categoryIntegrations.length}
                                    </Badge>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {categoryIntegrations.map((integration) => (
                                        <div key={integration.id} className="p-4 border rounded-lg">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{integration.icon}</span>
                                                    <div>
                                                        <h4 className="font-medium">{integration.name}</h4>
                                                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Versão: {integration.version}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge className={getIntegrationStatusColor(integration.status)}>
                                                        {integration.status === 'connected' ? 'Conectado' :
                                                         integration.status === 'active' ? 'Ativo' :
                                                         integration.status === 'online' ? 'Online' :
                                                         integration.status === 'configured' ? 'Configurado' :
                                                         'Desconectado'}
                                                    </Badge>
                                                    <span className="text-lg">{getHealthIcon(integration.health)}</span>
                                                </div>
                                            </div>

                                            {/* Métricas da Integração */}
                                            {integration.metrics && (
                                                <div className="mb-3 p-2 bg-muted rounded">
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        {Object.entries(integration.metrics).map(([key, value]) => (
                                                            <div key={key} className="flex justify-between">
                                                                <span className="text-muted-foreground capitalize">
                                                                    {key.replace(/([A-Z])/g, ' $1')}:
                                                                </span>
                                                                <span className="font-mono">{value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Endpoint */}
                                            <div className="mb-3">
                                                <Label className="text-xs text-muted-foreground">Endpoint</Label>
                                                <p className="text-xs font-mono bg-muted p-1 rounded mt-1 truncate">
                                                    {integration.endpoint}
                                                </p>
                                            </div>

                                            {/* Última Verificação */}
                                            {integration.lastCheck && (
                                                <div className="mb-3">
                                                    <Label className="text-xs text-muted-foreground">Última Verificação</Label>
                                                    <p className="text-xs">{integration.lastCheck}</p>
                                                </div>
                                            )}

                                            {/* Ações */}
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleIntegrationTest(integration.id)}
                                                    disabled={isLoading}
                                                    className="flex-1"
                                                >
                                                    {isLoading ? (
                                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Monitor className="h-3 w-3" />
                                                    )}
                                                    Testar
                                                </Button>
                                                {['connected', 'active', 'online', 'configured'].includes(integration.status) ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleIntegrationDisconnect(integration.id)}
                                                        disabled={isLoading || integration.category === 'core'}
                                                        className="flex-1 text-red-600 hover:text-red-700"
                                                    >
                                                        {isLoading ? (
                                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <X className="h-3 w-3" />
                                                        )}
                                                        Desconectar
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleIntegrationConnect(integration.id)}
                                                        disabled={isLoading}
                                                        className="flex-1 text-green-600 hover:text-green-700"
                                                    >
                                                        {isLoading ? (
                                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Wifi className="h-3 w-3" />
                                                        )}
                                                        Conectar
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Configurações Avançadas */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Settings className="h-5 w-5 text-purple-500" />
                                Configurações Avançadas
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* GitHub */}
                                <div className="space-y-4">
                                    <h4 className="font-medium flex items-center gap-2">
                                        🐙 GitHub
                                    </h4>
                                    <div>
                                        <Label htmlFor="github-token">Token de Acesso</Label>
                                        <Input
                                            id="github-token"
                                            type="password"
                                            value={integrationSettings.githubToken}
                                            onChange={(e) => setIntegrationSettings({...integrationSettings, githubToken: e.target.value})}
                                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="github-org">Organização</Label>
                                        <Input
                                            id="github-org"
                                            value={integrationSettings.githubOrganization}
                                            onChange={(e) => setIntegrationSettings({...integrationSettings, githubOrganization: e.target.value})}
                                            placeholder="minha-organizacao"
                                        />
                                    </div>
                                </div>

                                {/* Slack */}
                                <div className="space-y-4">
                                    <h4 className="font-medium flex items-center gap-2">
                                        💬 Slack
                                    </h4>
                                    <div>
                                        <Label htmlFor="slack-webhook">Webhook URL</Label>
                                        <Input
                                            id="slack-webhook"
                                            value={integrationSettings.slackWebhookUrl}
                                            onChange={(e) => setIntegrationSettings({...integrationSettings, slackWebhookUrl: e.target.value})}
                                            placeholder="https://hooks.slack.com/services/..."
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="slack-channel">Canal</Label>
                                        <Input
                                            id="slack-channel"
                                            value={integrationSettings.slackChannel}
                                            onChange={(e) => setIntegrationSettings({...integrationSettings, slackChannel: e.target.value})}
                                            placeholder="#netpilot-alerts"
                                        />
                                    </div>
                                </div>

                                {/* AWS */}
                                <div className="space-y-4">
                                    <h4 className="font-medium flex items-center gap-2">
                                        ☁️ Amazon AWS
                                    </h4>
                                    <div>
                                        <Label htmlFor="aws-access-key">Access Key</Label>
                                        <Input
                                            id="aws-access-key"
                                            type="password"
                                            value={integrationSettings.awsAccessKey}
                                            onChange={(e) => setIntegrationSettings({...integrationSettings, awsAccessKey: e.target.value})}
                                            placeholder="AKIA..."
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="aws-region">Região</Label>
                                        <select
                                            id="aws-region"
                                            className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                                            value={integrationSettings.awsRegion}
                                            onChange={(e) => setIntegrationSettings({...integrationSettings, awsRegion: e.target.value})}
                                        >
                                            <option value="us-east-1">US East (N. Virginia)</option>
                                            <option value="us-west-2">US West (Oregon)</option>
                                            <option value="eu-west-1">Europe (Ireland)</option>
                                            <option value="sa-east-1">South America (São Paulo)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Prometheus */}
                                <div className="space-y-4">
                                    <h4 className="font-medium flex items-center gap-2">
                                        📊 Prometheus
                                    </h4>
                                    <div>
                                        <Label htmlFor="prometheus-url">URL do Servidor</Label>
                                        <Input
                                            id="prometheus-url"
                                            value={integrationSettings.prometheusUrl}
                                            onChange={(e) => setIntegrationSettings({...integrationSettings, prometheusUrl: e.target.value})}
                                            placeholder="http://localhost:9090"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="prometheus-interval">Intervalo de Scraping (s)</Label>
                                        <Input
                                            id="prometheus-interval"
                                            type="number"
                                            min="5"
                                            max="300"
                                            value={integrationSettings.prometheusInterval}
                                            onChange={(e) => setIntegrationSettings({...integrationSettings, prometheusInterval: parseInt(e.target.value)})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Webhooks de Sistema */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Bell className="h-5 w-5 text-orange-500" />
                                Webhooks do Sistema
                            </h3>
                            <div className="space-y-3">
                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">Webhook de Deploy</h4>
                                        <Badge variant="default">Ativo</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Disparado quando um novo deploy é realizado
                                    </p>
                                    <p className="text-xs font-mono bg-muted p-2 rounded">
                                        https://netpilot.meadadigital.com/webhooks/deploy
                                    </p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">Webhook de SSL</h4>
                                        <Badge variant="default">Ativo</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Disparado quando certificados SSL são renovados
                                    </p>
                                    <p className="text-xs font-mono bg-muted p-2 rounded">
                                        https://netpilot.meadadigital.com/webhooks/ssl
                                    </p>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">Webhook de Alertas</h4>
                                        <Badge variant="default">Ativo</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Disparado para eventos críticos do sistema
                                    </p>
                                    <p className="text-xs font-mono bg-muted p-2 rounded">
                                        https://netpilot.meadadigital.com/webhooks/alerts
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIntegrationModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveIntegrationSettings}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Wifi className="h-4 w-4 mr-2" />
                                        Salvar Configurações
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </MainLayout>
    )
}
