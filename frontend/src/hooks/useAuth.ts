'use client'

import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth() {
  const { isAuthenticated, user, token, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  return {
    isAuthenticated,
    user,
    token,
    logout,
  }
}

export function useRequireAuth() {
  const auth = useAuth()

  if (!auth.isAuthenticated) {
    return null
  }

  return auth
}