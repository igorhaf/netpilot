'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './sidebar'
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/breadcrumb'

interface MainLayoutProps {
  children: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
}

export function MainLayout({ children, breadcrumbs }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

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
          <header className="h-16 bg-background border-b border-border flex items-center px-4 md:px-6 flex-shrink-0">
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
                <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">NP</span>
                </div>
                <h1 className="text-lg font-semibold text-foreground">
                  NetPilot
                </h1>
              </div>
            </div>
          </header>
        )}

        {/* Área principal de conteúdo */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="mb-6">
                <Breadcrumb items={breadcrumbs} />
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}