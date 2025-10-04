'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  FolderOpen,
  Globe,
  ArrowRight,
  RotateCcw,
  Shield,
  FileText,
  Terminal,
  Container,
  Clock,
  Zap,
  Library,
  Menu,
  Network,
  ChevronRight,
  Server,
  Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        name: 'Banco de Dados',
        href: '/database',
        icon: Database
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

  // Verifica se algum item do submenu está ativo
  const isSubmenuActive = useCallback((submenu?: { href: string }[]) => {
    if (!submenu) return false
    return submenu.some(item => pathname === item.href)
  }, [pathname])

  // Abre automaticamente o submenu se a rota atual está em um dos seus subitems
  useEffect(() => {
    navigationItems.forEach(item => {
      if (item.submenu && isSubmenuActive(item.submenu)) {
        setOpenedSubmenu(item.name)
      }
    })
  }, [pathname, isSubmenuActive])

  return (
    <div className={sidebarClasses}>
      {/* Header com Logo e Botão Hambúrguer */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-gray-200 dark:border-[rgb(38_38_38/var(--tw-border-opacity,1))] bg-gray-50 dark:bg-gray-800/50">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-xs">NP</span>
          </div>
          <span className="text-base font-semibold text-foreground">NetPilot</span>
        </div>

        {/* Botão Hambúrguer */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
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
                    'flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm font-normal transition-all duration-200 group cursor-pointer border border-transparent',
                    hasActiveItem
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[rgb(3_7_18/var(--tw-bg-opacity,1))] hover:text-gray-900 dark:hover:text-white hover:border-gray-300/50 dark:hover:border-gray-600/50'
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
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-normal transition-all duration-150 group border border-transparent',
                            isActive
                              ? 'bg-primary/10 text-primary dark:bg-primary/20'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[rgb(3_7_18/var(--tw-bg-opacity,1))] hover:text-gray-900 dark:hover:text-white hover:border-gray-300/50 dark:hover:border-gray-600/50'
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
                'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-normal transition-all duration-200 group border border-transparent',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[rgb(3_7_18/var(--tw-bg-opacity,1))] hover:text-gray-900 dark:hover:text-white hover:border-gray-300/50 dark:hover:border-gray-600/50'
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
    </div>
  )
}