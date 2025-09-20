'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, User, Shield, Bell, Monitor } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
    // Proteção de autenticação
    const auth = useRequireAuth()
    if (!auth) return null
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-3">
                <Settings className="h-8 w-8 text-blue-500" />
                <h1 className="text-3xl font-bold">Configurações</h1>
            </div>

            {/* Settings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Perfil do Usuário */}
                <Card className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <User className="h-6 w-6 text-blue-500" />
                        <h2 className="text-lg font-semibold">Perfil do Usuário</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Gerencie suas informações pessoais e configurações de conta.
                    </p>
                    <Button variant="outline" size="sm">
                        Configurar Perfil
                    </Button>
                </Card>

                {/* Segurança */}
                <Card className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Shield className="h-6 w-6 text-green-500" />
                        <h2 className="text-lg font-semibold">Segurança</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Configure autenticação, senhas e tokens de acesso.
                    </p>
                    <Button variant="outline" size="sm">
                        Configurar Segurança
                    </Button>
                </Card>

                {/* Notificações */}
                <Card className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Bell className="h-6 w-6 text-yellow-500" />
                        <h2 className="text-lg font-semibold">Notificações</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Gerencie alertas de SSL, logs e eventos do sistema.
                    </p>
                    <Button variant="outline" size="sm">
                        Configurar Notificações
                    </Button>
                </Card>

                {/* Sistema */}
                <Card className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Monitor className="h-6 w-6 text-purple-500" />
                        <h2 className="text-lg font-semibold">Sistema</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Configurações gerais do NetPilot e preferências.
                    </p>
                    <Button variant="outline" size="sm">
                        Configurar Sistema
                    </Button>
                </Card>

                {/* Backup */}
                <Card className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Settings className="h-6 w-6 text-red-500" />
                        <h2 className="text-lg font-semibold">Backup & Restauração</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Configure backup automático e restauração de dados.
                    </p>
                    <Button variant="outline" size="sm">
                        Configurar Backup
                    </Button>
                </Card>

                {/* Integações */}
                <Card className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Monitor className="h-6 w-6 text-indigo-500" />
                        <h2 className="text-lg font-semibold">Integrações</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Conecte com serviços externos e APIs de terceiros.
                    </p>
                    <Button variant="outline" size="sm">
                        Ver Integrações
                    </Button>
                </Card>
            </div>

            {/* Status de Implementação */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Página de Configurações
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    Esta página está em desenvolvimento. As configurações serão implementadas
                    gradualmente conforme as necessidades do sistema.
                </p>
            </Card>
        </div>
    )
}
