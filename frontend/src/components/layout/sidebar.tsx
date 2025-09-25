'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
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
  Library
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3
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
  isMobile: boolean
}

export function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  // Tanto mobile quanto desktop respondem ao estado isOpen
  const sidebarClasses = isMobile
    ? `fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-sidebar border-r border-border transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`
    : `flex h-full w-64 flex-col bg-sidebar border-r border-border transform transition-transform duration-300 ease-in-out ${
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
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">NP</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-wide">NetPilot</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-medium text-sm">
              {user?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.email}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.role}
            </p>
          </div>
        </div>

        <div className="mt-2 space-y-1">
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}