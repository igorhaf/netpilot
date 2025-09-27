export interface User {
  id: string
  email: string
  role: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

export interface Project {
  id: string
  name: string
  description?: string
  isActive: boolean
  technologies?: string[]
  repository?: string
  documentation?: string
  aiSessionData?: string
  mainDomain?: string
  metadata?: Record<string, any>
  domains?: Domain[]
  createdAt: string
  updatedAt: string
}

export interface Domain {
  id: string
  name: string
  description?: string
  isActive: boolean
  isLocked?: boolean
  autoTls: boolean
  forceHttps: boolean
  blockExternalAccess: boolean
  enableWwwRedirect: boolean
  bindIp: string
  project?: Project
  projectId?: string
  proxyRules?: ProxyRule[]
  redirects?: Redirect[]
  sslCertificates?: SslCertificate[]
  createdAt: string
  updatedAt: string
}

export interface ProxyRule {
  id: string
  sourcePath: string
  targetUrl: string
  priority: number
  isActive: boolean
  isLocked: boolean
  maintainQueryStrings: boolean
  description?: string
  domain: Domain
  domainId: string
  createdAt: string
  updatedAt: string
}

export interface Redirect {
  id: string
  sourcePattern: string
  targetUrl: string
  type: 'permanent' | 'temporary'
  isActive: boolean
  priority: number
  description?: string
  domain: Domain
  domainId: string
  createdAt: string
  updatedAt: string
}

export interface SslCertificate {
  id: string
  primaryDomain: string
  sanDomains?: string[]
  status: 'valid' | 'expiring' | 'expired' | 'pending' | 'failed'
  expiresAt?: string
  autoRenew: boolean
  renewBeforeDays: number
  certificatePath?: string
  privateKeyPath?: string
  issuer?: string
  lastError?: string
  domain: Domain
  domainId: string
  createdAt: string
  updatedAt: string
}

export interface Log {
  id: string
  type: 'deployment' | 'ssl_renewal' | 'nginx_reload' | 'traefik_reload' | 'system'
  status: 'success' | 'failed' | 'running' | 'pending'
  action: string
  message?: string
  details?: string
  duration?: number
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export interface DashboardStats {
  domains: {
    total: number
    active: number
    inactive: number
  }
  proxyRules: {
    total: number
    active: number
    inactive: number
  }
  sslCertificates: {
    total: number
    valid: number
    expiring: number
    expired: number
  }
  logs: {
    total: number
    success: number
    failed: number
    running: number
  }
  systemStatus: {
    nginx: {
      status: string
      uptime: string
    }
    traefik: {
      status: string
      uptime: string
    }
    database: {
      status: string
      uptime: string
    }
  }
}

export interface CreateProjectDto {
  name: string
  description?: string
  isActive?: boolean
  technologies?: string[]
  repository?: string
  documentation?: string
  aiSessionData?: string
  mainDomain?: string
  metadata?: Record<string, any>
}

export interface CreateDomainDto {
  name: string
  description?: string
  isActive?: boolean
  autoTls?: boolean
  forceHttps?: boolean
  blockExternalAccess?: boolean
  enableWwwRedirect?: boolean
  bindIp?: string
  projectId: string
}

export interface CreateProxyRuleDto {
  sourcePath: string
  targetUrl: string
  priority: number
  isActive?: boolean
  isLocked?: boolean
  maintainQueryStrings?: boolean
  description?: string
  domainId: string
}

export interface CreateRedirectDto {
  sourcePattern: string
  targetUrl: string
  type: 'permanent' | 'temporary'
  isActive?: boolean
  priority?: number
  description?: string
  domainId: string
}

export interface CreateSslCertificateDto {
  primaryDomain: string
  sanDomains?: string[]
  autoRenew?: boolean
  renewBeforeDays?: number
  domainId: string
}

// Preset Library Types
export interface PresetFile {
  id: string
  name: string
  description?: string
  type: 'docker' | 'persona' | 'template' | 'script' | 'config'
  content: string
  language?: string
  filename?: string
  tags: string[]
  size: number
  createdAt: string
  updatedAt: string
}

export interface Stack {
  id: string
  name: string
  description: string
  technology: string
  color: string
  icon: string
  presets: PresetFile[]
  isActive: boolean
  version: string
  author?: string
  tags: string[]
  totalPresets: number
  totalSize: number
  createdAt: string
  updatedAt: string
}

export interface StackAssociation {
  id: string
  domainId: string
  stackId: string
  presetIds: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateStackDto {
  name: string
  description: string
  technology: string
  color: string
  icon: string
  version?: string
  author?: string
  tags: string[]
}

export interface CreatePresetDto {
  name: string
  description?: string
  type: 'docker' | 'persona' | 'template' | 'script' | 'config'
  content: string
  language?: string
  filename?: string
  tags: string[]
  stackId: string
}