'use client'

import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth() {
  const { isAuthenticated, user, token, logout, isHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Só verifica autenticação após hidratação completa
    if (isHydrated && !isAuthenticated && typeof window !== 'undefined') {
      router.push('/login')
    }
  }, [isAuthenticated, isHydrated, router])

  return {
    isAuthenticated,
    user,
    token,
    logout,
    isHydrated,
  }
}

export function useRequireAuth() {
  const auth = useAuth()

  // Aguarda hidratação completa antes de verificar autenticação
  if (!auth.isHydrated) {
    return null // Loading durante hidratação
  }

  if (!auth.isAuthenticated) {
    return null
  }

  return auth
}