import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy HH:mm') {
  return format(new Date(date), formatStr, { locale: ptBR })
}

export function formatDateShort(date: string | Date) {
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: ptBR
  })
}

export function getStatusColor(status: string | undefined) {
  if (!status) return 'text-gray-400'

  switch (status.toLowerCase()) {
    case 'active':
    case 'online':
    case 'valid':
    case 'success':
      return 'text-green-400'
    case 'inactive':
    case 'offline':
    case 'expired':
    case 'failed':
      return 'text-red-400'
    case 'expiring':
    case 'warning':
    case 'pending':
      return 'text-yellow-400'
    case 'running':
      return 'text-blue-400'
    default:
      return 'text-gray-400'
  }
}

export function getStatusBadge(status: string | undefined) {
  if (!status) return 'status-badge-inactive'

  switch (status.toLowerCase()) {
    case 'active':
    case 'online':
    case 'valid':
    case 'success':
      return 'status-badge-success'
    case 'inactive':
    case 'offline':
    case 'expired':
    case 'failed':
      return 'status-badge-error'
    case 'expiring':
    case 'warning':
    case 'pending':
      return 'status-badge-warning'
    default:
      return 'status-badge-inactive'
  }
}

export function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
  return `${(ms / 3600000).toFixed(1)}h`
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function validateDomain(domain: string) {
  const regex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/
  return regex.test(domain)
}

export function validateUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}