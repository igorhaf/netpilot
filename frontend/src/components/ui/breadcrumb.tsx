'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
        title="Dashboard"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <div key={index} className="flex items-center space-x-1">
            <ChevronRight className="h-4 w-4" />

            {item.href && !item.current ? (
              <Link
                href={item.href}
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </Link>
            ) : (
              <span className={cn(
                "flex items-center gap-2",
                item.current && "text-foreground font-medium"
              )}>
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}

// Hook para gerar breadcrumbs automaticamente baseado na rota
export function useBreadcrumbs(customItems?: BreadcrumbItem[]) {
  if (customItems) {
    return customItems
  }

  // Se não foram fornecidos items customizados, retorna array vazio
  // O componente que usa pode definir seus próprios breadcrumbs
  return []
}