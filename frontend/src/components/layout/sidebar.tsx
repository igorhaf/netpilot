'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  FolderOpen,
  Globe,
  ArrowRight,
  RotateCcw,
  Shield,
  FileText,
  LogOut,
  Settings,
  Terminal,
  Container,
  Clock,
  Zap,
  Library,
  Menu
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3
  },
  {
    name: 'Projetos',
    href: '/projects',
    icon: FolderOpen
  },
  {
    name: 'Domínios',
    href: '/domains',
    icon: Globe
  },
  {
    name: 'Proxy Reverso',
    href: '/proxy-rules',
    icon: ArrowRight
  },
  {
    name: 'Redirecionamentos',
    href: '/redirects',
    icon: RotateCcw
  },
  {
    name: 'Certificados SSL',
    href: '/ssl-certificates',
    icon: Shield
  },
  {
    name: 'Docker',
    href: '/docker',
    icon: Container
  },
  {
    name: 'Filas de Processo',
    href: '/job-queues',
    icon: Clock
  },
  {
    name: 'Console SSH',
    href: '/console',
    icon: Terminal
  },
  {
    name: 'Terminal',
    href: '/terminal',
    icon: Terminal
  },
  {
    name: 'Logs',
    href: '/logs',
    icon: FileText
  },
  {
    name: 'Integrações',
    href: '/integrations',
    icon: Zap
  },
  {
    name: 'Biblioteca de Presets',
    href: '/preset-library',
    icon: Library
  }
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onToggle: () => void
  isMobile: boolean
}

export function Sidebar({ isOpen, onClose, onToggle, isMobile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  // Tanto mobile quanto desktop respondem ao estado isOpen
  const sidebarClasses = isMobile
    ? `fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : `fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`

  const handleLinkClick = () => {
    if (isMobile) {
      onClose()
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className={sidebarClasses}>
      {/* Header com Logo e Botão Hambúrguer */}
      <div className="flex h-20 items-center justify-between px-6 py-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-base">NP</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">NetPilot</span>
        </div>

        {/* Botão Hambúrguer */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-9 w-9 p-0"
          aria-label="Toggle menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-6">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon className={cn(
                'h-4 w-4 transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
              )} />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/30">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg mb-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-sm">
              {user?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.email}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group',
              pathname === '/settings'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="truncate">Configurações</span>
          </Link>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 px-4 py-3 h-auto text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="truncate">Sair</span>
          </Button>
        </div>
      </div>
    </div>
  )
}