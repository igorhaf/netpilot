# NetPilot - Models Documentation

## Blueprint Maintenance Protocol
- ID: models.md@v1
- Purpose: Preserve structure and enable incremental updates without overwriting existing sections.
- Stable Anchors: Keep all existing headings. New model docs should use the pattern "### [N]. [ModelName] Model".
- Update Policy: Prefer additive notes. For breaking schema changes, include migration file name, date, and rationale.
- Regeneration Rules:
  - Only update the explicitly mentioned model sections in prompts.
  - Do not remove unrelated models or relationships.
  - Reference actual files in `app/Models/` and `database/migrations/` rather than duplicating large code snippets.
- Cross-File Contracts: Keep fields in sync with `MODELS.md` ↔ migration files in `database/migrations/` and any usage in `SERVICES.md`.
- Change Log: Record changes under "## Change Log" with date and summary.

## Overview
NetPilot uses Laravel Eloquent models to manage proxy configurations, domains, SSL certificates, and deployment logs. All models follow Laravel conventions and include proper relationships.

## Core Models

### 1. Domain Model
**File**: `app/Models/Domain.php`

**Purpose**: Represents domains that can have proxy rules, SSL certificates, and redirect rules.

**Fields**:
- `id` (bigint, primary key)
- `name` (string, unique) - Domain name (e.g., example.com)
- `description` (text, nullable) - Optional description
- `is_active` (boolean, default: true) - Whether domain is active
- `auto_ssl` (boolean, default: false) - Auto SSL certificate management
- `dns_records` (json, nullable) - DNS configuration data
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**:
```php
// One-to-many relationships
public function proxyRules(): HasMany // -> ProxyRule
public function sslCertificates(): HasMany // -> SslCertificate  
public function redirectRules(): HasMany // -> RedirectRule
public function routeRules(): HasMany // -> RouteRule
```

**Key Methods**:
- `getStatusAttribute()`: Computed status based on active rules and certificates
- `scopeActive()`: Query scope for active domains

---

### 2. ProxyRule Model
**File**: `app/Models/ProxyRule.php`

**Purpose**: Defines routing rules from source to target with protocol and priority.

**Fields**:
- `id` (bigint, primary key)
- `domain_id` (bigint, foreign key) - References domains.id
- `source_host` (string) - Source hostname
- `source_port` (integer) - Source port
- `target_host` (string) - Target hostname  
- `target_port` (integer) - Target port
- `protocol` (enum: http, https, tcp, udp) - Protocol type
- `headers` (json, nullable) - Custom headers
- `priority` (integer, default: 100) - Rule priority
- `is_active` (boolean, default: true) - Whether rule is active
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**:
```php
public function domain(): BelongsTo // -> Domain
```

**Key Methods**:
- `generateNginxConfig()`: Generates Nginx configuration snippet
- `scopeActive()`: Query scope for active rules

---

### 3. RouteRule Model
**File**: `app/Models/RouteRule.php`

**Purpose**: Advanced routing rules with path patterns and HTTP methods for Traefik.

**Fields**:
- `id` (bigint, primary key)
- `domain_id` (bigint, foreign key) - References domains.id
- `upstream_id` (bigint, foreign key) - References upstreams.id
- `path_pattern` (string, nullable) - Path matching pattern
- `http_method` (string, default: '*') - HTTP method filter
- `priority` (integer, default: 100) - Rule priority
- `is_active` (boolean, default: true) - Whether rule is active
- `strip_prefix` (boolean, default: false) - Strip path prefix
- `preserve_host` (boolean, default: true) - Preserve host header
- `timeout` (integer, nullable) - Request timeout in seconds
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**:
```php
public function domain(): BelongsTo // -> Domain
public function upstream(): BelongsTo // -> Upstream
```

---

### 4. Upstream Model
**File**: `app/Models/Upstream.php`

**Purpose**: Defines backend services that route rules can target.

**Fields**:
- `id` (bigint, primary key)
- `domain_id` (bigint, foreign key) - References domains.id
- `name` (string) - Upstream service name
- `target_url` (string) - Target URL (e.g., http://backend:8080)
- `weight` (integer, default: 100) - Load balancing weight
- `is_active` (boolean, default: true) - Whether upstream is active
- `health_check_path` (string, nullable) - Health check endpoint
- `health_check_interval` (integer, default: 30) - Health check interval in seconds
- `description` (text, nullable) - Optional description
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**:
```php
public function domain(): BelongsTo // -> Domain
public function routeRules(): HasMany // -> RouteRule
```

---

### 5. SslCertificate Model
**File**: `app/Models/SslCertificate.php`

**Purpose**: Manages SSL certificates with status, renewal, and Traefik configuration.

**Fields**:
- `id` (bigint, primary key)
- `domain_id` (bigint, foreign key) - References domains.id
- `domain_name` (string) - Primary domain name
- `san_domains` (json, nullable) - Subject Alternative Names
- `status` (enum: pending, active, expired, failed) - Certificate status
- `cert_path` (string, nullable) - Path to certificate file
- `key_path` (string, nullable) - Path to private key file
- `chain_path` (string, nullable) - Path to certificate chain
- `issued_at` (timestamp, nullable) - Certificate issue date
- `expires_at` (timestamp, nullable) - Certificate expiration date
- `auto_renew` (boolean, default: true) - Auto-renewal enabled
- `renew_days_before` (integer, default: 30) - Days before expiry to renew
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**:
```php
public function domain(): BelongsTo // -> Domain
```

**Key Methods**:
- `generateTraefikConfig()`: Generates Traefik TLS configuration
- `updateStatus()`: Updates certificate status
- `isExpiringSoon()`: Checks if certificate expires soon
- `scopeExpiring()`: Query scope for expiring certificates

---

### 6. RedirectRule Model
**File**: `app/Models/RedirectRule.php`

**Purpose**: Manages HTTP redirects with pattern matching and target URLs.

**Fields**:
- `id` (bigint, primary key)
- `domain_id` (bigint, foreign key) - References domains.id
- `source_pattern` (string) - Source URL pattern
- `target_url` (string) - Target redirect URL
- `redirect_type` (integer, default: 301) - HTTP redirect status code
- `priority` (integer, default: 100) - Rule priority
- `preserve_query` (boolean, default: true) - Preserve query parameters
- `is_active` (boolean, default: true) - Whether rule is active
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**:
```php
public function domain(): BelongsTo // -> Domain
```

---

### 7. DeploymentLog Model
**File**: `app/Models/DeploymentLog.php`

**Purpose**: Logs deployment operations, command executions, and system changes.

**Fields**:
- `id` (bigint, primary key)
- `type` (string) - Operation type (ssl_renewal, nginx_deploy, etc.)
- `action` (string) - Specific action performed
- `status` (enum: running, success, failed) - Operation status
- `payload` (json, nullable) - Operation parameters
- `output` (text, nullable) - Command output
- `error` (text, nullable) - Error messages
- `duration` (integer, nullable) - Execution duration in seconds
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Key Methods**:
- `isRunning()`: Check if operation is running
- `isSuccess()`: Check if operation succeeded
- `isFailed()`: Check if operation failed
- `markAsRunning()`: Set status to running
- `markAsSuccess()`: Set status to success with output
- `markAsFailed()`: Set status to failed with error

**Query Scopes**:
- `scopeRunning()`: Filter running operations
- `scopeSuccess()`: Filter successful operations
- `scopeFailed()`: Filter failed operations

---

## Model Relationships Overview

```
Domain (1) ──── (n) ProxyRule
   │
   ├── (n) RouteRule ──── (1) Upstream
   │
   ├── (n) SslCertificate
   │
   └── (n) RedirectRule

DeploymentLog (independent logging)
```

## Database Migrations

### Key Migration Files:
1. `create_domains_table.php` - Creates domains table
2. `create_proxy_rules_table.php` - Creates proxy_rules table
3. `create_route_rules_table.php` - Creates route_rules table
4. `create_upstreams_table.php` - Creates upstreams table
5. `create_ssl_certificates_table.php` - Creates ssl_certificates table
6. `create_redirect_rules_table.php` - Creates redirect_rules table
7. `create_deployment_logs_table.php` - Creates deployment_logs table

### Foreign Key Constraints:
- `proxy_rules.domain_id` → `domains.id`
- `route_rules.domain_id` → `domains.id`
- `route_rules.upstream_id` → `upstreams.id`
- `upstreams.domain_id` → `domains.id`
- `ssl_certificates.domain_id` → `domains.id`
- `redirect_rules.domain_id` → `domains.id`

## Model Usage Patterns

### 1. Creating a Domain with Rules
```php
$domain = Domain::create([
    'name' => 'example.com',
    'is_active' => true,
    'auto_ssl' => true
]);

$upstream = $domain->upstreams()->create([
    'name' => 'web-backend',
    'target_url' => 'http://backend:8080'
]);

$domain->routeRules()->create([
    'upstream_id' => $upstream->id,
    'path_pattern' => '/api',
    'priority' => 200
]);
```

### 2. SSL Certificate Management
```php
$expiring = SslCertificate::expiring()->get();
foreach ($expiring as $cert) {
    if ($cert->auto_renew) {
        // Trigger renewal process
    }
}
```

### 3. Deployment Logging
```php
$log = DeploymentLog::create([
    'type' => 'ssl_renewal',
    'action' => 'renew_certificate',
    'status' => 'running'
]);

$log->markAsSuccess('Certificate renewed successfully');
```

## Data Validation

### Model Validation Rules:
- **Domain names**: Must be valid FQDN format
- **Ports**: Must be between 1-65535
- **URLs**: Must be valid HTTP/HTTPS URLs
- **Priorities**: Integer values for ordering
- **Status enums**: Restricted to defined values

### Unique Constraints:
- Domain names must be unique
- Proxy rules: unique combination of source_host + source_port
- SSL certificates: one active cert per domain

## Performance Considerations

### Indexing Strategy:
- Primary keys (auto-indexed)
- Foreign keys (indexed for joins)
- `is_active` fields (for filtering)
- `status` fields (for status queries)
- `expires_at` (for SSL renewal queries)

### Query Optimization:
- Use eager loading for relationships
- Implement query scopes for common filters
- Cache frequently accessed data
- Use database transactions for related operations

## Change Log
- 2025-08-29: Added Blueprint Maintenance Protocol and Change Log to standardize incremental updates and prevent accidental overwrites.
