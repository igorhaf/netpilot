# NetPilot - Services Documentation

## Blueprint Maintenance Protocol
- ID: services.md@v1
- Purpose: Define stable anchors and update policy for incremental, non-destructive edits.
- Stable Anchors: Keep service sections as "### [N]. [ServiceName]". Use method headings with backticked signatures.
- Update Policy: Prefer additive notes; for method contract changes, document version, rationale, and impact.
- Regeneration Rules:
  - Only update services explicitly referenced by the prompt.
  - Preserve unrelated service sections and examples.
  - Link to concrete files in `app/Services/` and related providers instead of duplicating long code.
- Cross-File Contracts: Keep behavior aligned with `COMMANDS.md` usage and `API.md` controllers that invoke services.
- Change Log: Record updates under "## Change Log".

## Overview
NetPilot uses service classes to encapsulate business logic for proxy management, SSL certificates, and system operations. Services follow single responsibility principle and provide clean interfaces for complex operations.

## Core Services

### 1. TraefikService
**File**: `app/Services/TraefikService.php`

**Purpose**: Manages Traefik dynamic configuration generation, file operations, and proxy reloading.

**Key Methods**:

#### `generateDynamicConfig(): array`
- Generates complete Traefik dynamic configuration from database
- Returns array of generated configuration files
- Processes all active domains, proxy rules, and SSL certificates

#### `saveDynamicConfig(array $config, string $filename): string`
- Saves configuration array to YAML file
- Creates dynamic config directory if needed
- Returns path to saved file

#### `applyConfiguration(): bool`
- Copies generated configs to Traefik dynamic directory
- Reloads Traefik via API or systemctl
- Returns success status

#### `buildDynamicYaml(): string`
- Builds YAML configuration from active ProxyRules
- Includes routers, services, and middlewares
- Handles SSL termination and redirects

#### `determineProtocol(int $port): string`
- Determines protocol (http/https/tcp) based on port number
- Uses standard port conventions
- Returns protocol string for Traefik config

**Configuration Structure**:
```yaml
http:
  routers:
    router-name:
      rule: "Host(`example.com`)"
      service: "service-name"
      entryPoints: ["web"]
  services:
    service-name:
      loadBalancer:
        servers:
          - url: "http://backend:8080"
  middlewares:
    redirect-https:
      redirectScheme:
        scheme: "https"
```

**Dependencies**:
- `SystemCommandService` for Traefik reloading
- `ProxyRule`, `Domain`, `SslCertificate` models

---

### 2. NginxService
**File**: `app/Services/NginxService.php`

**Purpose**: Alternative proxy service for Nginx configuration management.

**Key Methods**:

#### `generateConfiguration(Domain $domain): string`
- Generates Nginx server block for domain
- Includes SSL certificate paths
- Handles proxy_pass directives

#### `writeConfigFile(string $config, string $filename): string`
- Writes Nginx configuration to sites-available
- Creates necessary directories
- Returns path to config file

#### `enableSite(string $siteName): bool`
- Creates symlink in sites-enabled
- Enables Nginx site configuration
- Returns success status

#### `testConfiguration(): bool`
- Runs `nginx -t` to validate configuration
- Returns validation result
- Prevents invalid config deployment

#### `reloadNginx(): bool`
- Reloads Nginx service
- Uses systemctl or service command
- Returns reload success status

#### `deployConfiguration(): array`
- Complete deployment workflow
- Generates configs for all domains
- Tests and reloads Nginx
- Returns deployment results

**Nginx Configuration Template**:
```nginx
server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### 3. LetsEncryptService
**File**: `app/Services/LetsEncryptService.php`

**Purpose**: Comprehensive SSL certificate management using Let's Encrypt and Certbot.

**Key Methods**:

#### `issueCertificate(Domain $domain): bool`
- Issues new SSL certificate for domain
- Supports HTTP-01 and DNS-01 challenges
- Creates SslCertificate database record
- Returns issuance success status

#### `renewCertificate(SslCertificate $certificate): bool`
- Renews existing SSL certificate
- Checks renewal eligibility
- Updates certificate files and database
- Returns renewal success status

#### `revokeCertificate(SslCertificate $certificate): bool`
- Revokes SSL certificate with ACME CA
- Cleans up certificate files
- Updates database status
- Returns revocation success status

#### `renewExpiring(int $daysBefore = 30): array`
- Finds and renews certificates expiring soon
- Configurable days before expiration
- Batch renewal processing
- Returns renewal results

#### `validateDomain(string $domain): bool`
- Validates domain name format
- Checks DNS resolution
- Verifies domain accessibility
- Returns validation result

#### `validatePort(int $port): bool`
- Validates port accessibility
- Checks if port is open and reachable
- Returns port validation result

#### `prepareEnvironment(array $domains): bool`
- Prepares environment for certificate operations
- Sets up challenge directories
- Configures DNS if needed
- Returns preparation status

#### `applyCertificate(SslCertificate $certificate): bool`
- Applies certificate to proxy (Traefik/Nginx)
- Updates proxy configuration
- Reloads proxy service
- Returns application success

#### `cleanupExpiredCertificates(): int`
- Removes expired certificate files
- Cleans database records
- Frees up disk space
- Returns count of cleaned certificates

**Certificate Lifecycle**:
1. Domain validation
2. ACME challenge setup
3. Certificate issuance
4. File storage and database update
5. Proxy configuration update
6. Automatic renewal monitoring

**Challenge Types**:
- **HTTP-01**: Web-based validation
- **DNS-01**: DNS TXT record validation
- **TLS-ALPN-01**: TLS extension validation

---

### 4. SystemCommandService
**File**: `app/Services/SystemCommandService.php`

**Purpose**: Centralized system command execution with comprehensive logging.

**Key Methods**:

#### `execute(string $command, array $options = []): array`
- Executes shell commands safely
- Comprehensive logging to DeploymentLog
- Supports dry-run mode for development
- Returns structured result with output/error

#### `executeWithLogging(string $command, string $type, string $action): DeploymentLog`
- Executes command with automatic logging
- Creates DeploymentLog record
- Updates log with results
- Returns log instance

**Execution Options**:
```php
$options = [
    'timeout' => 300,        // Command timeout in seconds
    'cwd' => '/path/to/dir', // Working directory
    'env' => [],             // Environment variables
    'dry_run' => false       // Simulation mode
];
```

**Return Structure**:
```php
[
    'success' => true,
    'output' => 'Command output',
    'error' => null,
    'exit_code' => 0,
    'duration' => 1.5
]
```

**Logging Integration**:
- All commands logged to `deployment_logs` table
- Includes command, output, errors, duration
- Status tracking (running, success, failed)
- Searchable execution history

---

## Service Integration Patterns

### 1. Service Composition
Services work together to accomplish complex workflows:

```php
// SSL Certificate Renewal Workflow
$letsEncrypt = new LetsEncryptService();
$traefik = new TraefikService();

$renewed = $letsEncrypt->renewExpiring();
foreach ($renewed as $certificate) {
    $traefik->applyConfiguration();
}
```

### 2. Command Integration
Services use SystemCommandService for external operations:

```php
class TraefikService {
    public function reloadTraefik(): bool {
        return $this->systemCommand->execute('systemctl reload traefik')['success'];
    }
}
```

### 3. Configuration Management
Services read from centralized configuration:

```php
// Environment-based behavior
$isDryRun = config('app.env') !== 'production';
$traefikApiUrl = config('netpilot.api_url');
```

## Error Handling and Logging

### 1. Exception Management
- Services throw descriptive exceptions
- Exceptions logged with full context
- Graceful degradation for non-critical failures

### 2. Operation Logging
- All operations logged to DeploymentLog
- Structured logging with type/action/status
- Searchable logs via web interface

### 3. Validation and Safety
- Input validation before operations
- Dry-run mode for testing
- Rollback capabilities for critical operations

## Configuration and Environment

### Service Configuration
Services are configured via:
- Laravel configuration files (`config/`)
- Environment variables (`.env`)
- Database settings (dynamic configuration)

### Environment Modes
- **Production**: Full command execution
- **Development**: Dry-run simulation
- **Testing**: Mock external dependencies

## Performance and Optimization

### 1. Batch Operations
- Bulk certificate renewals
- Mass configuration updates
- Efficient file I/O operations

### 2. Caching Strategy
- Configuration caching
- Command result caching
- Database query optimization

### 3. Resource Management
- Memory-efficient processing
- Timeout management
- Resource cleanup

## Security Considerations

### 1. Command Injection Prevention
- Parameterized command execution
- Input sanitization
- Whitelist validation

### 2. File System Security
- Secure file permissions
- Path traversal prevention
- Temporary file cleanup

### 3. Certificate Security
- Secure key storage
- Certificate validation
- Access control

## Testing and Debugging

### 1. Service Testing
- Unit tests for each service method
- Integration tests for workflows
- Mock external dependencies

### 2. Debugging Tools
- Comprehensive logging
- Dry-run mode for safe testing
- Command execution tracing

### 3. Monitoring
- Operation status tracking
- Performance metrics
- Error rate monitoring
