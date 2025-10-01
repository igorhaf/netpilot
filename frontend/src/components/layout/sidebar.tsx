'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
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
  Menu,
  Network,
  ChevronRight,
  Server
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MenuItem {
  name: string
  href?: string
  icon: any
  submenu?: {
    name: string
    href: string
    icon: any
  }[]
}

const navigationItems: MenuItem[] = [
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
    name: 'Redes',
    icon: Network,
    submenu: [
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
      }
    ]
  },
  {
    name: 'Infra',
    icon: Server,
    submenu: [
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
      }
    ]
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
  const [openedSubmenu, setOpenedSubmenu] = useState<string | null>(null)

  // Tanto mobile quanto desktop respondem ao estado isOpen
  const sidebarClasses = isMobile
    ? `fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-white dark:bg-[rgb(0_0_0)] border-r border-gray-200 dark:border-[rgb(38_38_38/var(--tw-border-opacity,1))] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : `fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col bg-white dark:bg-[rgb(0_0_0)] border-r border-gray-200 dark:border-[rgb(38_38_38/var(--tw-border-opacity,1))] transform transition-transform duration-300 ease-in-out ${
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

  // Verifica se algum item do submenu está ativo
  const isSubmenuActive = (submenu?: { href: string }[]) => {
    if (!submenu) return false
    return submenu.some(item => pathname === item.href)
  }

  return (
    <div className={sidebarClasses}>
      {/* Header com Logo e Botão Hambúrguer */}
      <div className="flex h-20 items-center justify-between px-6 py-6 border-b border-gray-200 dark:border-[rgb(38_38_38/var(--tw-border-opacity,1))] bg-gray-50 dark:bg-gray-800/50">
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
      <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon

          // Item com submenu
          if (item.submenu) {
            const hasActiveItem = isSubmenuActive(item.submenu)
            const isOpened = openedSubmenu === item.name

            return (
              <div
                key={item.name}
                className="relative"
              >
                <div
                  onClick={() => setOpenedSubmenu(isOpened ? null : item.name)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group cursor-pointer',
                    hasActiveItem
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[rgb(3_7_18/var(--tw-bg-opacity,1))] hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      'h-4 w-4 transition-colors',
                      hasActiveItem
                        ? 'text-white'
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
                    )} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <ChevronRight className={cn(
                    'h-4 w-4 transition-transform duration-150',
                    isOpened ? 'rotate-90' : 'rotate-0',
                    hasActiveItem ? 'text-white' : 'text-gray-400'
                  )} />
                </div>

                {/* Submenu com animação */}
                <div className={cn(
                  'overflow-hidden transition-all duration-200 ease-out',
                  isOpened ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                )}>
                  <div className={cn(
                    'ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-4 transform transition-transform duration-200 ease-out',
                    isOpened ? 'translate-x-0' : '-translate-x-2'
                  )}>
                    {item.submenu.map((subItem) => {
                      const isActive = pathname === subItem.href
                      const SubIcon = subItem.icon

                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          onClick={handleLinkClick}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 group',
                            isActive
                              ? 'bg-primary/10 text-primary dark:bg-primary/20'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[rgb(3_7_18/var(--tw-bg-opacity,1))] hover:text-gray-900 dark:hover:text-white'
                          )}
                        >
                          <SubIcon className={cn(
                            'h-3.5 w-3.5 transition-colors',
                            isActive
                              ? 'text-primary'
                              : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'
                          )} />
                          <span className="truncate">{subItem.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          }

          // Item simples sem submenu
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href!}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[rgb(3_7_18/var(--tw-bg-opacity,1))] hover:text-gray-900 dark:hover:text-white'
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
      <div className="border-t border-gray-200 dark:border-[rgb(38_38_38/var(--tw-border-opacity,1))] p-4 bg-gray-50 dark:bg-gray-800/30">
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
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[rgb(3_7_18/var(--tw-bg-opacity,1))] hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="truncate">Configurações</span>
          </Link>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 px-4 py-3 h-auto text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[rgb(3_7_18/var(--tw-bg-opacity,1))] hover:text-gray-900 dark:hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="truncate">Sair</span>
          </Button>
        </div>
      </div>
    </div>
  )
}