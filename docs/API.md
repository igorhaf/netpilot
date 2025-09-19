# Documentação da API - NetPilot

## Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Rate Limiting](#rate-limiting)
- [Códigos de Status](#códigos-de-status)
- [Endpoints](#endpoints)
  - [Authentication](#authentication)
  - [Domains](#domains)
  - [Proxy Rules](#proxy-rules)
  - [Redirects](#redirects)
  - [SSL Certificates](#ssl-certificates)
  - [Logs](#logs)
  - [Dashboard](#dashboard)
  - [System](#system)
- [Webhooks](#webhooks)
- [SDKs](#sdks)

## Visão Geral

A API NetPilot é uma API RESTful que fornece endpoints para gerenciar domínios, regras de proxy, certificados SSL e muito mais. Todas as respostas são em formato JSON.

### Base URL
```
Development: http://meadadigital.com:3001/api/v1
Staging:     https://api-staging.meadadigital.com/api/v1
Production:  https://api.meadadigital.com/api/v1
```

### Versioning
A API usa versionamento na URL. A versão atual é `v1`.

### Content-Type
Todas as requisições que enviam dados devem usar `Content-Type: application/json`.

### OpenAPI/Swagger
- **Swagger UI**: `{base_url}/docs`
- **OpenAPI JSON**: `{base_url}/docs-json`

## Autenticação

### JWT Bearer Token

A API usa autenticação JWT com Bearer tokens. Após o login, você receberá um `access_token` e um `refresh_token`.

```bash
# Header de autenticação
Authorization: Bearer <access_token>
```

### Token Refresh

Quando o `access_token` expira, use o `refresh_token` para obter um novo.

```bash
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

### Token Expiration
- **Access Token**: 1 hora
- **Refresh Token**: 7 dias

## Rate Limiting

### Limites por Endpoint

| Endpoint Pattern | Limite | Janela |
|-----------------|--------|--------|
| `/auth/login` | 5 tentativas | 15 minutos |
| `/auth/*` | 10 requests | 1 minuto |
| `/api/v1/*` | 100 requests | 15 minutos |
| `/api/v1/ssl-certificates/generate` | 5 requests | 1 hora |

### Headers de Rate Limit

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Códigos de Status

### Success Codes
- `200 OK` - Sucesso geral
- `201 Created` - Recurso criado com sucesso
- `204 No Content` - Sucesso sem conteúdo de resposta

### Client Error Codes
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Token inválido ou ausente
- `403 Forbidden` - Sem permissão para o recurso
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (ex: domínio já existe)
- `422 Unprocessable Entity` - Validação falhou
- `429 Too Many Requests` - Rate limit excedido

### Server Error Codes
- `500 Internal Server Error` - Erro interno do servidor
- `502 Bad Gateway` - Erro de gateway
- `503 Service Unavailable` - Serviço indisponível

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "domain",
        "message": "Domain is required"
      }
    ],
    "timestamp": "2023-12-01T10:00:00Z",
    "path": "/api/v1/domains"
  }
}
```

## Endpoints

## Authentication

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@netpilot.local",
  "password": "admin123"
}
```

**Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "admin@netpilot.local",
    "role": "admin",
    "created_at": "2023-12-01T10:00:00Z"
  }
}
```

**Error Response (401)**:
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "strongPassword123",
  "name": "John Doe"
}
```

**Response (201)**:
```json
{
  "id": 2,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "created_at": "2023-12-01T10:00:00Z"
}
```

### Refresh Token

```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

**Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

### Get Profile

```http
GET /auth/me
Authorization: Bearer <access_token>
```

**Response (200)**:
```json
{
  "id": 1,
  "email": "admin@netpilot.local",
  "name": "Admin User",
  "role": "admin",
  "created_at": "2023-12-01T10:00:00Z",
  "last_login": "2023-12-01T11:00:00Z"
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response (204)**: No content

## Domains

### List Domains

```http
GET /domains
Authorization: Bearer <access_token>

Query Parameters:
- page (integer, default: 1)
- limit (integer, default: 10, max: 100)
- search (string) - Search by domain name
- enabled (boolean) - Filter by enabled status
- sort (string) - Sort field (domain, created_at, updated_at)
- order (string) - Sort order (asc, desc)
```

**Response (200)**:
```json
{
  "data": [
    {
      "id": 1,
      "domain": "example.com",
      "enabled": true,
      "user_id": 1,
      "proxy_rules_count": 2,
      "ssl_certificate": {
        "id": 1,
        "status": "active",
        "expires_at": "2024-03-01T00:00:00Z"
      },
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

### Get Domain

```http
GET /domains/{id}
Authorization: Bearer <access_token>
```

**Response (200)**:
```json
{
  "id": 1,
  "domain": "example.com",
  "enabled": true,
  "user_id": 1,
  "proxy_rules": [
    {
      "id": 1,
      "source_path": "/",
      "target_url": "http://meadadigital.com:3000",
      "enabled": true
    }
  ],
  "redirects": [],
  "ssl_certificate": {
    "id": 1,
    "status": "active",
    "expires_at": "2024-03-01T00:00:00Z"
  },
  "created_at": "2023-12-01T10:00:00Z",
  "updated_at": "2023-12-01T10:00:00Z"
}
```

### Create Domain

```http
POST /domains
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "domain": "newdomain.com",
  "enabled": true
}
```

**Validation Rules**:
- `domain`: required, must be valid domain format
- `enabled`: optional, boolean, default: true

**Response (201)**:
```json
{
  "id": 2,
  "domain": "newdomain.com",
  "enabled": true,
  "user_id": 1,
  "created_at": "2023-12-01T10:00:00Z",
  "updated_at": "2023-12-01T10:00:00Z"
}
```

**Error Response (422)**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "domain",
        "message": "Domain must be a valid domain format"
      }
    ]
  }
}
```

### Update Domain

```http
PUT /domains/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "domain": "updateddomain.com",
  "enabled": false
}
```

**Response (200)**:
```json
{
  "id": 1,
  "domain": "updateddomain.com",
  "enabled": false,
  "user_id": 1,
  "created_at": "2023-12-01T10:00:00Z",
  "updated_at": "2023-12-01T11:00:00Z"
}
```

### Delete Domain

```http
DELETE /domains/{id}
Authorization: Bearer <access_token>
```

**Response (204)**: No content

**Error Response (409)**:
```json
{
  "error": {
    "code": "DOMAIN_HAS_DEPENDENCIES",
    "message": "Cannot delete domain with active proxy rules or SSL certificates"
  }
}
```

### Toggle Domain Status

```http
PATCH /domains/{id}/toggle
Authorization: Bearer <access_token>
```

**Response (200)**:
```json
{
  "id": 1,
  "domain": "example.com",
  "enabled": false,
  "updated_at": "2023-12-01T11:00:00Z"
}
```

## Proxy Rules

### List Proxy Rules

```http
GET /proxy-rules
Authorization: Bearer <access_token>

Query Parameters:
- page (integer, default: 1)
- limit (integer, default: 10)
- domain_id (integer) - Filter by domain
- enabled (boolean) - Filter by enabled status
```

**Response (200)**:
```json
{
  "data": [
    {
      "id": 1,
      "domain_id": 1,
      "domain": {
        "id": 1,
        "domain": "example.com"
      },
      "source_path": "/api",
      "target_url": "http://meadadigital.com:3001",
      "enabled": true,
      "load_balancing_method": "round_robin",
      "health_check_url": "http://meadadigital.com:3001/health",
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

### Create Proxy Rule

```http
POST /proxy-rules
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "domain_id": 1,
  "source_path": "/api",
  "target_url": "http://meadadigital.com:3001",
  "enabled": true,
  "load_balancing_method": "round_robin",
  "health_check_url": "http://meadadigital.com:3001/health"
}
```

**Validation Rules**:
- `domain_id`: required, must exist in domains table
- `source_path`: required, must start with `/`
- `target_url`: required, must be valid URL
- `enabled`: optional, boolean, default: true
- `load_balancing_method`: optional, enum: `round_robin`, `least_connections`, `ip_hash`
- `health_check_url`: optional, must be valid URL

**Response (201)**:
```json
{
  "id": 2,
  "domain_id": 1,
  "source_path": "/api",
  "target_url": "http://meadadigital.com:3001",
  "enabled": true,
  "load_balancing_method": "round_robin",
  "health_check_url": "http://meadadigital.com:3001/health",
  "created_at": "2023-12-01T10:00:00Z",
  "updated_at": "2023-12-01T10:00:00Z"
}
```

### Update Proxy Rule

```http
PUT /proxy-rules/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "source_path": "/api/v2",
  "target_url": "http://meadadigital.com:3002",
  "enabled": true
}
```

**Response (200)**:
```json
{
  "id": 1,
  "domain_id": 1,
  "source_path": "/api/v2",
  "target_url": "http://meadadigital.com:3002",
  "enabled": true,
  "load_balancing_method": "round_robin",
  "health_check_url": "http://meadadigital.com:3002/health",
  "created_at": "2023-12-01T10:00:00Z",
  "updated_at": "2023-12-01T11:00:00Z"
}
```

### Delete Proxy Rule

```http
DELETE /proxy-rules/{id}
Authorization: Bearer <access_token>
```

**Response (204)**: No content

### Apply Configuration

```http
POST /proxy-rules/apply
Authorization: Bearer <access_token>
```

Aplica todas as regras de proxy ativas, gerando configurações do Nginx/Traefik.

**Response (200)**:
```json
{
  "message": "Configuration applied successfully",
  "applied_rules": 5,
  "generated_configs": [
    "nginx/example.com.conf",
    "traefik/dynamic.yml"
  ],
  "timestamp": "2023-12-01T11:00:00Z"
}
```

## Redirects

### List Redirects

```http
GET /redirects
Authorization: Bearer <access_token>

Query Parameters:
- page, limit, domain_id, enabled (same as proxy rules)
```

**Response (200)**:
```json
{
  "data": [
    {
      "id": 1,
      "domain_id": 1,
      "domain": {
        "id": 1,
        "domain": "example.com"
      },
      "source_path": "/old-path",
      "target_url": "https://example.com/new-path",
      "redirect_type": 301,
      "enabled": true,
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

### Create Redirect

```http
POST /redirects
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "domain_id": 1,
  "source_path": "/old-url",
  "target_url": "https://example.com/new-url",
  "redirect_type": 301,
  "enabled": true
}
```

**Validation Rules**:
- `domain_id`: required, must exist
- `source_path`: required, must start with `/`
- `target_url`: required, must be valid URL
- `redirect_type`: required, enum: 301, 302, 307, 308
- `enabled`: optional, boolean, default: true

**Response (201)**:
```json
{
  "id": 2,
  "domain_id": 1,
  "source_path": "/old-url",
  "target_url": "https://example.com/new-url",
  "redirect_type": 301,
  "enabled": true,
  "created_at": "2023-12-01T10:00:00Z",
  "updated_at": "2023-12-01T10:00:00Z"
}
```

## SSL Certificates

### List SSL Certificates

```http
GET /ssl-certificates
Authorization: Bearer <access_token>

Query Parameters:
- page, limit, domain_id
- status (string) - Filter by status: pending, active, expired, failed
- expires_soon (boolean) - Filter certificates expiring in 30 days
```

**Response (200)**:
```json
{
  "data": [
    {
      "id": 1,
      "domain_id": 1,
      "domain": {
        "id": 1,
        "domain": "example.com"
      },
      "certificate_path": "/ssl/example.com.crt",
      "private_key_path": "/ssl/example.com.key",
      "issuer": "Let's Encrypt",
      "expires_at": "2024-03-01T00:00:00Z",
      "auto_renew": true,
      "status": "active",
      "days_until_expiry": 89,
      "created_at": "2023-12-01T10:00:00Z",
      "updated_at": "2023-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

### Get SSL Certificate

```http
GET /ssl-certificates/{id}
Authorization: Bearer <access_token>
```

**Response (200)**:
```json
{
  "id": 1,
  "domain_id": 1,
  "domain": {
    "id": 1,
    "domain": "example.com"
  },
  "certificate_path": "/ssl/example.com.crt",
  "private_key_path": "/ssl/example.com.key",
  "issuer": "Let's Encrypt",
  "expires_at": "2024-03-01T00:00:00Z",
  "auto_renew": true,
  "status": "active",
  "certificate_details": {
    "subject": "CN=example.com",
    "san": ["example.com", "www.example.com"],
    "key_size": 2048,
    "signature_algorithm": "SHA256-RSA"
  },
  "renewal_history": [
    {
      "date": "2023-12-01T00:00:00Z",
      "status": "success",
      "provider": "letsencrypt"
    }
  ],
  "created_at": "2023-12-01T10:00:00Z",
  "updated_at": "2023-12-01T10:00:00Z"
}
```

### Generate SSL Certificate

```http
POST /ssl-certificates
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "domain_id": 1,
  "provider": "letsencrypt",
  "auto_renew": true
}
```

**Validation Rules**:
- `domain_id`: required, must exist and not have active certificate
- `provider`: optional, enum: `letsencrypt`, `custom`, default: `letsencrypt`
- `auto_renew`: optional, boolean, default: true

**Response (201)**:
```json
{
  "id": 2,
  "domain_id": 1,
  "status": "pending",
  "provider": "letsencrypt",
  "auto_renew": true,
  "challenge_token": "abc123...",
  "created_at": "2023-12-01T10:00:00Z"
}
```

**Error Response (409)**:
```json
{
  "error": {
    "code": "CERTIFICATE_ALREADY_EXISTS",
    "message": "Domain already has an active SSL certificate"
  }
}
```

### Renew SSL Certificate

```http
POST /ssl-certificates/{id}/renew
Authorization: Bearer <access_token>
```

**Response (200)**:
```json
{
  "message": "Certificate renewal initiated",
  "certificate_id": 1,
  "estimated_completion": "2023-12-01T10:05:00Z"
}
```

### Delete SSL Certificate

```http
DELETE /ssl-certificates/{id}
Authorization: Bearer <access_token>
```

**Response (204)**: No content

### Check Expiring Certificates

```http
GET /ssl-certificates/check-expiration
Authorization: Bearer <access_token>

Query Parameters:
- days (integer, default: 30) - Check certificates expiring in X days
```

**Response (200)**:
```json
{
  "expiring_certificates": [
    {
      "id": 1,
      "domain": "example.com",
      "expires_at": "2024-01-15T00:00:00Z",
      "days_until_expiry": 14,
      "auto_renew": true
    }
  ],
  "total_expiring": 1,
  "auto_renewal_scheduled": 1
}
```

### Bulk Renew Certificates

```http
POST /ssl-certificates/renew-expiring
Authorization: Bearer <access_token>
```

**Response (200)**:
```json
{
  "message": "Bulk renewal initiated",
  "certificates_scheduled": 3,
  "estimated_completion": "2023-12-01T10:15:00Z"
}
```

## Logs

### List Logs

```http
GET /logs
Authorization: Bearer <access_token>

Query Parameters:
- page, limit
- level (string) - Filter by log level: debug, info, warn, error
- start_date (ISO date) - Filter logs from date
- end_date (ISO date) - Filter logs until date
- search (string) - Search in log messages
- user_id (integer) - Filter by user
- context (string) - Filter by context (module)
```

**Response (200)**:
```json
{
  "data": [
    {
      "id": 1,
      "level": "info",
      "message": "Domain created successfully",
      "context": {
        "module": "domains",
        "action": "create",
        "domain_id": 1,
        "domain": "example.com"
      },
      "user_id": 1,
      "user": {
        "id": 1,
        "email": "admin@netpilot.local"
      },
      "created_at": "2023-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "total_pages": 2
  }
}
```

### Get System Logs

```http
GET /logs/system
Authorization: Bearer <access_token>

Query Parameters:
- service (string) - Filter by service: frontend, backend, traefik, nginx, db
- level, start_date, end_date, search
```

**Response (200)**:
```json
{
  "data": [
    {
      "timestamp": "2023-12-01T10:00:00Z",
      "level": "error",
      "service": "traefik",
      "message": "SSL certificate renewal failed for domain example.com",
      "details": {
        "domain": "example.com",
        "error": "DNS challenge failed",
        "attempt": 3
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "total_pages": 1
  }
}
```

### Get Deployment Logs

```http
GET /logs/deployment
Authorization: Bearer <access_token>

Query Parameters:
- deployment_id (string)
- status (string) - success, failed, in_progress
```

**Response (200)**:
```json
{
  "data": [
    {
      "id": "deploy_20231201_100000",
      "status": "success",
      "version": "v1.2.3",
      "started_at": "2023-12-01T10:00:00Z",
      "completed_at": "2023-12-01T10:05:00Z",
      "duration": 300,
      "steps": [
        {
          "step": "build",
          "status": "success",
          "duration": 120,
          "output": "Build completed successfully"
        },
        {
          "step": "deploy",
          "status": "success",
          "duration": 180,
          "output": "Deployment completed successfully"
        }
      ],
      "triggered_by": {
        "user_id": 1,
        "email": "admin@netpilot.local"
      }
    }
  ]
}
```

### Clear Logs

```http
DELETE /logs/clear
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "older_than_days": 30,
  "levels": ["debug", "info"]
}
```

**Response (200)**:
```json
{
  "message": "Logs cleared successfully",
  "deleted_count": 1500,
  "remaining_count": 2500
}
```

### Export Logs

```http
GET /logs/export
Authorization: Bearer <access_token>

Query Parameters:
- format (string) - json, csv, default: json
- start_date, end_date, level, search
```

**Response (200)**:
```json
{
  "export_url": "/downloads/logs_20231201_100000.json",
  "expires_at": "2023-12-01T11:00:00Z",
  "total_records": 1000
}
```

## Dashboard

### Get Dashboard Statistics

```http
GET /dashboard/stats
Authorization: Bearer <access_token>

Query Parameters:
- period (string) - 24h, 7d, 30d, 90d, default: 24h
```

**Response (200)**:
```json
{
  "period": "24h",
  "domains": {
    "total": 25,
    "active": 23,
    "inactive": 2,
    "with_ssl": 20,
    "ssl_expiring_soon": 2
  },
  "proxy_rules": {
    "total": 45,
    "active": 42,
    "inactive": 3
  },
  "ssl_certificates": {
    "total": 20,
    "active": 18,
    "expired": 1,
    "expiring_30_days": 3,
    "auto_renewal_enabled": 17
  },
  "traffic": {
    "total_requests": 125000,
    "unique_visitors": 8500,
    "bandwidth_gb": 12.5,
    "avg_response_time_ms": 145
  },
  "system": {
    "uptime_percentage": 99.9,
    "cpu_usage": 35.2,
    "memory_usage": 62.8,
    "disk_usage": 45.1
  },
  "errors": {
    "total_4xx": 150,
    "total_5xx": 5,
    "error_rate": 0.12
  }
}
```

### Get Traffic Analytics

```http
GET /dashboard/traffic
Authorization: Bearer <access_token>

Query Parameters:
- period (string) - 24h, 7d, 30d
- domain_id (integer) - Filter by specific domain
- group_by (string) - hour, day, week, default: hour
```

**Response (200)**:
```json
{
  "period": "24h",
  "group_by": "hour",
  "data": [
    {
      "timestamp": "2023-12-01T00:00:00Z",
      "requests": 5200,
      "unique_visitors": 320,
      "bandwidth_mb": 450,
      "avg_response_time_ms": 142,
      "status_codes": {
        "2xx": 4900,
        "3xx": 200,
        "4xx": 80,
        "5xx": 20
      }
    }
  ],
  "summary": {
    "total_requests": 125000,
    "peak_hour": "2023-12-01T14:00:00Z",
    "peak_requests": 8500
  }
}
```

### Get Performance Metrics

```http
GET /dashboard/performance
Authorization: Bearer <access_token>
```

**Response (200)**:
```json
{
  "response_times": {
    "p50": 120,
    "p90": 250,
    "p95": 350,
    "p99": 800
  },
  "throughput": {
    "requests_per_second": 145.2,
    "bandwidth_mbps": 12.5
  },
  "availability": {
    "uptime_percentage": 99.95,
    "downtime_minutes_24h": 0.7,
    "incidents_24h": 0
  },
  "resource_usage": {
    "cpu_percentage": 35.2,
    "memory_percentage": 62.8,
    "disk_percentage": 45.1,
    "network_io_mbps": 8.3
  }
}
```

### Get Top Domains

```http
GET /dashboard/top-domains
Authorization: Bearer <access_token>

Query Parameters:
- period (string) - 24h, 7d, 30d
- limit (integer, default: 10)
```

**Response (200)**:
```json
{
  "period": "24h",
  "data": [
    {
      "domain": "app.example.com",
      "requests": 45000,
      "unique_visitors": 2800,
      "bandwidth_gb": 5.2,
      "avg_response_time_ms": 132,
      "error_rate": 0.08
    }
  ]
}
```

## System

### Health Check

```http
GET /health
```

**Response (200)**:
```json
{
  "status": "ok",
  "timestamp": "2023-12-01T10:00:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "ok",
      "response_time_ms": 12
    },
    "redis": {
      "status": "ok",
      "response_time_ms": 2
    },
    "traefik": {
      "status": "ok",
      "response_time_ms": 8
    },
    "nginx": {
      "status": "ok",
      "response_time_ms": 5
    }
  }
}
```

### System Status

```http
GET /system/status
Authorization: Bearer <access_token>
```

**Response (200)**:
```json
{
  "system": {
    "hostname": "netpilot-server",
    "platform": "linux",
    "arch": "x64",
    "uptime": 86400,
    "load_average": [0.5, 0.7, 0.8]
  },
  "application": {
    "version": "1.0.0",
    "environment": "production",
    "node_version": "18.17.0",
    "started_at": "2023-12-01T00:00:00Z"
  },
  "services": {
    "database": {
      "status": "healthy",
      "connections": 15,
      "max_connections": 100
    },
    "redis": {
      "status": "healthy",
      "used_memory": "12MB",
      "connected_clients": 5
    }
  },
  "resources": {
    "cpu": {
      "usage_percentage": 35.2,
      "cores": 8
    },
    "memory": {
      "usage_percentage": 62.8,
      "total_gb": 16,
      "used_gb": 10.0,
      "free_gb": 6.0
    },
    "disk": {
      "usage_percentage": 45.1,
      "total_gb": 500,
      "used_gb": 225.5,
      "free_gb": 274.5
    }
  }
}
```

### System Metrics

```http
GET /system/metrics
Authorization: Bearer <access_token>
```

**Response (200)**:
```text
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 12500
http_requests_total{method="POST",status="201"} 450

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 8950
http_request_duration_seconds_bucket{le="0.5"} 12100

# HELP system_cpu_usage CPU usage percentage
# TYPE system_cpu_usage gauge
system_cpu_usage 35.2

# HELP system_memory_usage Memory usage percentage
# TYPE system_memory_usage gauge
system_memory_usage 62.8
```

## Webhooks

### Configure Webhook

```http
POST /webhooks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["domain.created", "ssl.renewed", "deployment.completed"],
  "secret": "your-webhook-secret",
  "enabled": true
}
```

### Webhook Events

#### Domain Events
- `domain.created`
- `domain.updated`
- `domain.deleted`
- `domain.enabled`
- `domain.disabled`

#### SSL Events
- `ssl.generated`
- `ssl.renewed`
- `ssl.expired`
- `ssl.failed`

#### Proxy Events
- `proxy.rule.created`
- `proxy.rule.updated`
- `proxy.rule.deleted`
- `proxy.config.applied`

#### System Events
- `deployment.started`
- `deployment.completed`
- `deployment.failed`
- `system.alert`

### Webhook Payload Example

```json
{
  "event": "domain.created",
  "timestamp": "2023-12-01T10:00:00Z",
  "data": {
    "domain": {
      "id": 1,
      "domain": "example.com",
      "enabled": true,
      "created_at": "2023-12-01T10:00:00Z"
    },
    "user": {
      "id": 1,
      "email": "admin@netpilot.local"
    }
  }
}
```

## SDKs

### JavaScript/TypeScript SDK

```bash
npm install @netpilot/sdk
```

```typescript
import NetPilot from '@netpilot/sdk';

const client = new NetPilot({
  baseUrl: 'https://api.meadadigital.com/api/v1',
  accessToken: 'your-access-token'
});

// List domains
const domains = await client.domains.list();

// Create domain
const newDomain = await client.domains.create({
  domain: 'example.com',
  enabled: true
});

// Generate SSL certificate
const certificate = await client.ssl.generate({
  domain_id: newDomain.id,
  provider: 'letsencrypt'
});
```

### Python SDK

```bash
pip install netpilot-sdk
```

```python
from netpilot import NetPilotClient

client = NetPilotClient(
    base_url='https://api.meadadigital.com/api/v1',
    access_token='your-access-token'
)

# List domains
domains = client.domains.list()

# Create domain
new_domain = client.domains.create({
    'domain': 'example.com',
    'enabled': True
})

# Generate SSL certificate
certificate = client.ssl.generate({
    'domain_id': new_domain['id'],
    'provider': 'letsencrypt'
})
```

### CLI Tool

```bash
npm install -g @netpilot/cli
```

```bash
# Configure
netpilot config set api_url https://api.meadadigital.com/api/v1
netpilot auth login

# Manage domains
netpilot domains list
netpilot domains create example.com
netpilot domains enable example.com

# Manage SSL
netpilot ssl list
netpilot ssl generate example.com
netpilot ssl renew example.com

# View logs
netpilot logs tail
netpilot logs search "error"
```

---

Para mais informações, consulte a [documentação completa](https://docs.netpilot.local) ou a [interface Swagger](https://api.meadadigital.com/api/docs).