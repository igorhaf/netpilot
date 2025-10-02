'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, X, Settings, LogOut, ChevronDown, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/breadcrumb'
import { useAuthStore } from '@/store/auth'
import { Badge } from '@/components/ui/badge'

interface MainLayoutProps {
  children: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
}

export function MainLayout({ children, breadcrumbs }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, logout } = useAuthStore()

  // Detectar se está em mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Em mobile, sidebar começa fechado. No desktop, fica aberto por padrão
      if (mobile) {
        setSidebarOpen(false)
      } else {
        // No desktop, mantém o estado atual ou abre se for a primeira vez
        setSidebarOpen(true)
      }
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Overlay para mobile quando sidebar está aberto */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={toggleSidebar}
        isMobile={isMobile}
      />

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        !isMobile && sidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Header mínimo sempre visível quando sidebar está fechado */}
        {!sidebarOpen && (
          <header className="h-14 bg-background border-b border-border flex items-center px-4 md:px-6 flex-shrink-0">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo NetPilot quando sidebar fechado */}
            <div className="flex-1 ml-4">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">NP</span>
                </div>
                <h1 className="text-base font-semibold text-foreground">
                  NetPilot
                </h1>
              </div>
            </div>
          </header>
        )}

        {/* Header com breadcrumb e dropdown de usuário */}
        {sidebarOpen && (
          <header className="h-14 bg-background border-b border-border flex items-center px-4 md:px-6 flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              {/* Breadcrumbs */}
              <div className="flex-1">
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <Breadcrumb items={breadcrumbs} />
                )}
              </div>

              {/* Right section: Notifications + User Dropdown */}
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <button
                  className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Notificações"
                >
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {/* Badge de contagem de notificações */}
                  <span className="absolute top-1 right-1 h-4 w-4 bg-blue-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    3
                  </span>
                </button>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors h-10"
                >
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-semibold text-xs">
                      {user?.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {user?.email?.split('@')[0]}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {user?.role}
                    </Badge>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-border py-2 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-xs text-muted-foreground text-right">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        router.push('/settings')
                        setUserDropdownOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </button>
                    <button
                      onClick={() => {
                        handleLogout()
                        setUserDropdownOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Área principal de conteúdo */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}