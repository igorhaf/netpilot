'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StatsRedirect({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)

  useEffect(() => {
    // Redirecionar para a página do container
    router.replace(`/docker/containers/${resolvedParams.id}`)
  }, [resolvedParams.id, router])

  return null
}
