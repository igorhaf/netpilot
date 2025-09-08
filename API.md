# NetPilot - API Documentation

## Blueprint Maintenance Protocol
- ID: api.md@v1
- Purpose: Keep API docs stable and incrementally maintainable without accidental overwrites.
- Stable Anchors: Preserve route group sections (e.g., "### [N]. [Area]") and endpoint headings (e.g., "#### [METHOD] /path").
- Update Policy: Prefer additive updates. When changing request/response schemas, include version tags and backward-compat notes.
- Regeneration Rules:
  - Only regenerate endpoints explicitly mentioned by a prompt.
  - Do not remove unrelated endpoints or sections.
  - Keep examples concise; point to controllers under `app/Http/Controllers/` and requests under `app/Http/Requests/`.
- Cross-File Contracts: Align with `routes/web.php`, validation in `Requests/`, and service behavior in `SERVICES.md`.
- Change Log: Record updates under "## Change Log".

## Overview
NetPilot provides a comprehensive web API through Laravel controllers and Inertia.js integration. The API handles domain management, proxy configuration, SSL certificates, and system operations.

## Route Structure
**File**: `routes/web.php`

All routes are protected by the `web` middleware group and include CSRF protection.

## Authentication & Authorization
- Laravel's built-in authentication system
- Session-based authentication
- CSRF token protection on all POST/PUT/DELETE requests
- Middleware protection for sensitive operations

## API Endpoints

### 1. Authentication

#### POST /api/v1/login
**Purpose**: Authenticate user and obtain API token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response**:
```json
{
  "token": "api-token",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### 2. Tenants

#### GET /api/v1/tenants
**Purpose**: List all tenants

**Success Response**:
```json
[
  {
    "id": 1,
    "name": "Tenant Name",
    "slug": "tenant-slug",
    "is_active": true,
    "created_at": "2025-09-08T16:00:00.000000Z",
    "updated_at": "2025-09-08T16:00:00.000000Z"
  }
]
```

### 3. Domain Management
**Controller**: `App\Http\Controllers\DomainsController`

#### GET /domains
**Purpose**: List all domains with pagination and filtering

**Query Parameters**:
- `search` (string): Search domains by name
- `status` (string): Filter by status (active/inactive)
- `page` (int): Page number for pagination

**Response**: Inertia page with domains data
```json
{
  "domains": {
    "data": [
      {
        "id": 1,
        "name": "example.com",
        "description": "Main website",
        "is_active": true,
        "auto_ssl": true,
        "status": "active",
        "proxy_rules_count": 3,
        "ssl_certificates_count": 1,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "current_page": 1,
    "total": 10
  }
}
```

#### GET /domains/create
**Purpose**: Show domain creation form

**Response**: Inertia page with form component

#### POST /domains
**Purpose**: Create new domain

**Request Body**:
```json
{
  "name": "example.com",
  "description": "Optional description",
  "is_active": true,
  "auto_ssl": false,
  "dns_records": {}
}
```

**Validation Rules**:
- `name`: required, string, unique, valid domain format
- `description`: nullable, string, max:1000
- `is_active`: boolean
- `auto_ssl`: boolean
- `dns_records`: nullable, json

**Response**: Redirect with success/error message

#### GET /domains/{domain}
**Purpose**: Show domain details

**Response**: Inertia page with domain data and related records

#### GET /domains/{domain}/edit
**Purpose**: Show domain edit form

**Response**: Inertia page with populated form

#### PUT /domains/{domain}
**Purpose**: Update existing domain

**Request Body**: Same as POST /domains

**Response**: Redirect with success/error message

#### DELETE /domains/{domain}
**Purpose**: Delete domain and related records

**Response**: Redirect with success/error message

### 4. Proxy Rules Management
**Controller**: `App\Http\Controllers\ProxyController`

#### GET /proxy
**Purpose**: List all proxy rules

**Query Parameters**:
- `domain_id` (int): Filter by domain
- `protocol` (string): Filter by protocol
- `is_active` (bool): Filter by status

**Response**: Inertia page with proxy rules data

#### POST /proxy/{proxyRule}/toggle
**Purpose**: Toggle proxy rule active status

**Response**: JSON response with updated status
```json
{
  "success": true,
  "is_active": false,
  "message": "Proxy rule deactivated"
}
```

#### POST /proxy/deploy
**Purpose**: Deploy proxy configuration

**Response**: Redirect with deployment results

#### GET /proxy/create
**Purpose**: Show proxy rule creation form

**Response**: Inertia page with form and domain options

#### POST /proxy
**Purpose**: Create new proxy rule

**Request Body**:
```json
{
  "domain_id": 1,
  "source_host": "example.com",
  "source_port": 80,
  "target_host": "backend",
  "target_port": 8080,
  "protocol": "http",
  "priority": 100,
  "headers": {},
  "is_active": true
}
```

**Validation Rules**:
- `domain_id`: required, exists:domains,id
- `source_host`: required, string
- `source_port`: required, integer, between:1,65535
- `target_host`: required, string
- `target_port`: required, integer, between:1,65535
- `protocol`: required, in:http,https,tcp,udp
- `priority`: integer, min:1
- `is_active`: boolean

#### GET /proxy/{proxy}/edit
**Purpose**: Show proxy rule edit form

**Response**: Inertia page with populated form

#### PUT /proxy/{proxy}
**Purpose**: Update proxy rule

**Request Body**: Same as POST /proxy

#### DELETE /proxy/{proxy}
**Purpose**: Delete proxy rule

**Response**: Redirect with success/error message

### 5. SSL Certificate Management
**Controller**: `App\Http\Controllers\SslController`

#### GET /ssl
**Purpose**: List SSL certificates with status

**Response**: Inertia page with certificates data
```json
{
  "certificates": [
    {
      "id": 1,
      "domain_name": "example.com",
      "status": "active",
      "expires_at": "2024-12-01T00:00:00Z",
      "auto_renew": true,
      "days_until_expiry": 45
    }
  ]
}
```

#### GET /ssl/create
**Purpose**: Show SSL certificate request form

**Response**: Inertia page with form and domain options

#### POST /ssl
**Purpose**: Request new SSL certificate

**Request Body**:
```json
{
  "domain_id": 1,
  "san_domains": ["www.example.com", "api.example.com"],
  "challenge_type": "http",
  "auto_renew": true
}
```

**Validation Rules**:
- `domain_id`: required, exists:domains,id
- `san_domains`: array of valid domain names
- `challenge_type`: in:http,dns,tls-alpn
- `auto_renew`: boolean

#### POST /ssl/{certificate}/renew
**Purpose**: Manually renew SSL certificate

**Response**: JSON response with renewal status

#### POST /ssl/{certificate}/toggle
**Purpose**: Toggle auto-renewal setting

**Response**: JSON response with updated setting

#### POST /ssl/renew-all
**Purpose**: Renew all expiring certificates

**Response**: Redirect with batch renewal results

#### POST /ssl/deploy
**Purpose**: Deploy SSL certificates to proxy

**Response**: Redirect with deployment results

#### DELETE /ssl/{certificate}
**Purpose**: Revoke and delete SSL certificate

**Response**: Redirect with success/error message

### 6. Upstream Services
**Controller**: `App\Http\Controllers\UpstreamsController`

#### GET /api/v1/upstreams
**Purpose**: List upstream services

**Success Response**:
```json
[
  {
    "id": 1,
    "tenant_id": 1,
    "domain_id": 1,
    "name": "backend-service",
    "target_url": "http://backend:80",
    "is_active": true,
    "is_healthy": true,
    "created_at": "2025-09-08T16:00:00.000000Z",
    "updated_at": "2025-09-08T16:00:00.000000Z"
  }
]
```

### 7. Route Rules (Path-based)
**Controller**: `App\Http\Controllers\RoutesController`

#### GET /routes
**Purpose**: Listar regras de rota avançadas

#### GET /routes/create
**Purpose**: Exibir formulário de criação

#### POST /routes
**Purpose**: Criar nova regra de rota

#### GET /routes/{route}
**Purpose**: Detalhes da regra

#### GET /routes/{route}/edit
**Purpose**: Formulário de edição

#### PUT /routes/{route}
**Purpose**: Atualizar regra de rota

#### DELETE /routes/{route}
**Purpose**: Remover regra de rota

### 8. Deployment Logs
**Controller**: `App\Http\Controllers\LogsController`

#### GET /logs
**Purpose**: Display deployment logs with filtering

**Query Parameters**:
- `type` (string): Filter by operation type
- `status` (string): Filter by status (running/success/failed)
- `search` (string): Search in output/error text
- `from_date` (date): Filter from date
- `to_date` (date): Filter to date

**Response**: Inertia page with logs data
```json
{
  "logs": {
    "data": [
      {
        "id": 1,
        "type": "ssl_renewal",
        "action": "renew_certificate",
        "status": "success",
        "duration": 15,
        "created_at": "2024-01-01T12:00:00Z",
        "output": "Certificate renewed successfully"
      }
    ],
    "current_page": 1,
    "total": 50
  }
}
```

#### POST /logs/clear
**Purpose**: Clear old deployment logs

**Request Body**:
```json
{
  "days": 30,
  "confirm": true
}
```

**Response**: Redirect with cleanup results

### 9. Configuration Sync
**Controller**: `App\Http\Controllers\SyncController`

#### GET /sync
**Purpose**: Show configuration sync page

**Response**: Inertia page with sync interface

#### POST /sync
**Purpose**: Trigger proxy configuration synchronization

**Response**: Redirect with sync results
- Generates Traefik dynamic configuration
- Writes configuration files
- Returns count of generated files

### 10. WAF Management API

#### POST /api/v1/waf
**Purpose**: Create WAF rule

**Request Body**:
```json
{
  "name": "Block XSS",
  "expression": "http.request.uri contains \"<script>\""
}
```

#### PUT /api/v1/waf/{ruleId}
**Purpose**: Update WAF rule

**Request Body**:
```json
{
  "expression": "http.request.uri contains \"<script>\" or http.request.uri contains \"javascript:\""
}
```

### 11. Domains

#### GET /api/v1/domains
**Purpose**: List all domains

**Success Response**:
```json
[
  {
    "id": 1,
    "tenant_id": 1,
    "name": "example.com",
    "description": "Primary domain",
    "is_active": true,
    "auto_ssl": true,
    "status": "active",
    "created_at": "2025-09-08T16:00:00.000000Z",
    "updated_at": "2025-09-08T16:00:00.000000Z"
  }
]
```

### 12. Proxy Rules

#### GET /api/v1/proxy-rules
**Purpose**: List all proxy rules

**Success Response**:
```json
[
  {
    "id": 1,
    "tenant_id": 1,
    "domain_id": 1,
    "source_host": "example.com",
    "source_port": "443",
    "target_host": "backend",
    "target_port": "80",
    "protocol": "http",
    "is_active": true,
    "created_at": "2025-09-08T16:00:00.000000Z",
    "updated_at": "2025-09-08T16:00:00.000000Z"
  }
]
```

### 13. SSL Certificates

#### GET /api/v1/ssl-certificates
**Purpose**: List all SSL certificates

**Success Response**:
```json
[
  {
    "id": 1,
    "tenant_id": 1,
    "domain_id": 1,
    "domain_name": "example.com",
    "status": "valid",
    "issuer": "Let's Encrypt",
    "expires_at": "2025-12-08T16:00:00.000000Z",
    "auto_renew": true,
    "created_at": "2025-09-08T16:00:00.000000Z",
    "updated_at": "2025-09-08T16:00:00.000000Z"
  }
]
```

## Response Formats

### Success Responses
Successful operations return appropriate HTTP status codes:
- `200 OK`: Successful GET requests
- `201 Created`: Successful resource creation
- `302 Found`: Successful redirects after POST/PUT/DELETE

### Error Responses
Error responses include validation errors and system errors:

#### Validation Errors (422 Unprocessable Entity)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["The name field is required."],
    "email": ["The email must be a valid email address."]
  }
}
```

#### System Errors (500 Internal Server Error)
```json
{
  "message": "Server Error",
  "error": "Detailed error message for debugging"
}
```

## Flash Messages
The application uses Laravel's session flash messages for user feedback:

### Success Messages
```php
return redirect()->back()->with('success', 'Operation completed successfully');
```

### Error Messages
```php
return redirect()->back()->with('error', 'Operation failed: ' . $error->getMessage());
```

### Info Messages
```php
return redirect()->back()->with('info', 'Configuration updated');
```

## Middleware Stack

### Web Middleware Group
- `EncryptCookies`: Cookie encryption
- `AddQueuedCookiesToResponse`: Queue cookie handling
- `StartSession`: Session management
- `ShareErrorsFromSession`: Validation error sharing
- `VerifyCsrfToken`: CSRF protection
- `SubstituteBindings`: Route model binding

### Custom Middleware
- `HandleInertiaRequests`: Inertia.js integration
- `TrustProxies`: Proxy header handling

## Rate Limiting
API endpoints are protected by Laravel's rate limiting:
- Default: 60 requests per minute per IP
- Authentication endpoints: 5 attempts per minute
- Bulk operations: 10 requests per minute

## CORS Configuration
Cross-Origin Resource Sharing is configured for:
- Same-origin requests (default)
- Configurable origins for API access
- Credential support for authenticated requests

## Security Headers
Security headers are automatically applied:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## API Versioning
Current API version: v1 (implicit)
Future versioning strategy:
- URL-based versioning (`/api/v2/`)
- Header-based versioning
- Backward compatibility maintenance

## Monitoring and Logging
All API requests are logged with:
- Request method and URL
- Response status and duration
- User identification (if authenticated)
- Error details for failed requests

## Testing
API endpoints are tested with:
- Feature tests for complete workflows
- Unit tests for individual methods
- Integration tests for external services
- Performance tests for bulk operations

## Documentation Tools
- API documentation generated from code comments
- Postman collection for manual testing
- OpenAPI/Swagger specification (planned)
- Interactive API explorer (planned)

## Change Log
- 2025-08-29: Added Blueprint Maintenance Protocol and Change Log to standardize safe, incremental updates.
- 2025-08-31: Added Upstreams and Route Rules endpoint sections; renumbered sections accordingly.
- 2025-09-08: Updated API documentation with comprehensive REST API documentation.
- 2025-09-09: Added WAF API documentation.
