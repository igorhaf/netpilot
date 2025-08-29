# NetPilot - Console Commands Documentation

## Blueprint Maintenance Protocol
- ID: commands.md@v1
- Purpose: Keep command docs stable and incrementally maintainable without accidental overwrites.
- Stable Anchors: Preserve command sections as "### [N]. [command:name]" with exact headings.
- Update Policy: Prefer additive updates. When changing arguments/options, add a deprecation note and version tag.
- Regeneration Rules:
  - Only regenerate sections for commands explicitly mentioned in a prompt.
  - Do not remove or rename unrelated command headings.
  - Keep usage examples concise; reference files in `app/Console/Commands/`.
- Cross-File Contracts: Ensure examples align with `SERVICES.md` service APIs and `API.md` endpoints that leverage commands.
- Change Log: Document changes under "## Change Log".

## Overview
NetPilot provides comprehensive console commands for automation, maintenance, and management tasks. All commands are scheduled via Laravel's task scheduler and can be run manually via Artisan.

## Scheduled Commands

### Command Scheduling (Kernel.php)
**File**: `app/Console/Kernel.php`

```php
protected function schedule(Schedule $schedule): void
{
    // SSL Certificate Renewal - Daily at 2:00 AM
    $schedule->command('ssl:renew')
        ->dailyAt('02:00')
        ->withoutOverlapping()
        ->runInBackground();

    // Nginx Configuration Deployment - Every 5 minutes
    $schedule->command('nginx:deploy')
        ->everyFiveMinutes()
        ->withoutOverlapping()
        ->runInBackground();

    // Log Cleanup - Weekly on Sundays at 3:00 AM
    $schedule->command('logs:cleanup')
        ->weeklyOn(0, '03:00')
        ->withoutOverlapping();
}
```

## SSL Management Commands

### 1. ssl:renew
**File**: `app/Console/Commands/RenewSslCertificates.php`

**Purpose**: Renews SSL certificates that are expiring soon or forces renewal of all certificates.

**Usage**:
```bash
# Renew expiring certificates (default 30 days before expiry)
php artisan ssl:renew

# Force renew all certificates
php artisan ssl:renew --force

# Dry run (simulation mode)
php artisan ssl:renew --dry-run

# Custom expiry threshold
php artisan ssl:renew --days=15
```

**Options**:
- `--force`: Force renewal of all certificates regardless of expiry
- `--dry-run`: Simulate renewal without actual execution
- `--days=N`: Set custom days before expiry threshold (default: 30)

**Process Flow**:
1. Query certificates expiring within threshold
2. Validate domain accessibility
3. Execute Certbot renewal command
4. Update certificate files and database
5. Apply certificates to proxy configuration
6. Log all operations to DeploymentLog

**Error Handling**:
- Continues processing other certificates if one fails
- Detailed error logging for troubleshooting
- Email notifications for critical failures

---

### 2. ssl:issue
**File**: `app/Console/Commands/IssueSslCertificate.php`

**Purpose**: Issues new SSL certificates for specified domains.

**Usage**:
```bash
# Issue certificate for single domain
php artisan ssl:issue example.com

# Issue certificate with SAN domains
php artisan ssl:issue example.com --san=www.example.com,api.example.com

# Use DNS challenge
php artisan ssl:issue example.com --challenge=dns
```

**Options**:
- `--san=domains`: Comma-separated list of SAN domains
- `--challenge=type`: Challenge type (http, dns, tls-alpn)
- `--email=address`: Override default ACME email
- `--staging`: Use Let's Encrypt staging environment

---

## Proxy Management Commands

### 3. nginx:deploy
**File**: `app/Console/Commands/DeployNginx.php`

**Purpose**: Deploys Nginx configuration for all active domains.

**Usage**:
```bash
# Deploy all Nginx configurations
php artisan nginx:deploy

# Dry run deployment
php artisan nginx:deploy --dry-run

# Force deployment (skip change detection)
php artisan nginx:deploy --force
```

**Options**:
- `--dry-run`: Simulate deployment without actual changes
- `--force`: Deploy even if no changes detected

**Process Flow**:
1. Generate Nginx configuration for each active domain
2. Write configuration files to sites-available
3. Enable sites by creating symlinks
4. Test Nginx configuration validity
5. Reload Nginx service
6. Log deployment results

**Configuration Template**:
```nginx
server {
    listen 80;
    server_name {{ domain.name }};
    
    {% if domain.ssl_certificate %}
    listen 443 ssl;
    ssl_certificate {{ certificate.cert_path }};
    ssl_certificate_key {{ certificate.key_path }};
    {% endif %}
    
    {% for rule in domain.proxy_rules %}
    location {{ rule.path_pattern }} {
        proxy_pass {{ rule.target_url }};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    {% endfor %}
}
```

---

### 4. proxy:sync
**File**: `app/Console/Commands/SyncProxyConfig.php`

**Purpose**: Synchronizes Traefik dynamic configuration from database.

**Usage**:
```bash
# Sync all proxy configurations
php artisan proxy:sync

# Sync specific domain
php artisan proxy:sync --domain=example.com

# Validate configuration only
php artisan proxy:sync --validate
```

**Options**:
- `--domain=name`: Sync specific domain only
- `--validate`: Validate configuration without applying
- `--reload`: Force Traefik reload after sync

---

### 5. proxy:renew (Placeholder)
**File**: `app/Console/Commands/ProxyRenew.php`

**Purpose**: Placeholder for proxy configuration renewal logic.

**Current Status**: Not implemented - shows warning message

**Planned Features**:
- Refresh proxy configurations
- Update routing rules
- Reload proxy services

---

## Maintenance Commands

### 6. logs:cleanup
**File**: `app/Console/Commands/CleanupLogs.php`

**Purpose**: Cleans up old deployment logs to prevent database bloat.

**Usage**:
```bash
# Clean logs older than 30 days (default)
php artisan logs:cleanup

# Clean logs older than specific days
php artisan logs:cleanup --days=7

# Force cleanup without confirmation
php artisan logs:cleanup --force

# Dry run to see what would be deleted
php artisan logs:cleanup --dry-run
```

**Options**:
- `--days=N`: Number of days to retain logs (default: 30)
- `--force`: Skip confirmation prompt
- `--dry-run`: Show what would be deleted without actual deletion

**Process Flow**:
1. Query logs older than specified days
2. Display count of logs to be deleted
3. Request confirmation (unless --force)
4. Delete old log records
5. Report cleanup results

---

### 7. system:status
**File**: `app/Console/Commands/SystemStatus.php`

**Purpose**: Displays comprehensive system status and health checks.

**Usage**:
```bash
# Show system status
php artisan system:status

# Include detailed service status
php artisan system:status --detailed

# JSON output for monitoring
php artisan system:status --json
```

**Status Checks**:
- Database connectivity
- Proxy service status (Traefik/Nginx)
- SSL certificate status
- File system permissions
- Recent deployment logs
- System resource usage

---

## Development and Testing Commands

### 8. dev:seed-test-data
**File**: `app/Console/Commands/SeedTestData.php`

**Purpose**: Seeds database with test data for development.

**Usage**:
```bash
# Seed basic test data
php artisan dev:seed-test-data

# Include SSL certificates
php artisan dev:seed-test-data --with-ssl

# Clean existing data first
php artisan dev:seed-test-data --fresh
```

**Test Data Created**:
- Sample domains
- Proxy rules
- SSL certificates
- Deployment logs
- Redirect rules

---

### 9. dev:clear-configs
**File**: `app/Console/Commands/ClearConfigs.php`

**Purpose**: Clears generated proxy configuration files.

**Usage**:
```bash
# Clear all generated configs
php artisan dev:clear-configs

# Clear specific proxy type
php artisan dev:clear-configs --type=traefik
```

---

## Command Utilities and Helpers

### Base Command Class
**File**: `app/Console/Commands/BaseCommand.php`

**Shared Functionality**:
- Consistent output formatting
- Error handling and logging
- Dry-run mode support
- Progress indicators
- Confirmation prompts

### Command Traits
- `LogsOperations`: Standardized operation logging
- `ValidatesInput`: Input validation helpers
- `HandlesErrors`: Error handling and reporting

## Command Execution Patterns

### 1. Service Integration
Commands use service classes for business logic:

```php
class RenewSslCertificates extends Command
{
    public function handle(LetsEncryptService $letsEncrypt): int
    {
        $expiring = $letsEncrypt->renewExpiring($this->option('days'));
        // Process results...
        return 0;
    }
}
```

### 2. Logging Integration
All commands log operations via DeploymentLog:

```php
$log = DeploymentLog::create([
    'type' => 'ssl_renewal',
    'action' => 'renew_certificates',
    'status' => 'running'
]);

// Execute operation...

$log->markAsSuccess($output);
```

### 3. Error Handling
Consistent error handling across commands:

```php
try {
    // Command logic...
    $this->info('Operation completed successfully');
    return 0;
} catch (\Exception $e) {
    $this->error('Operation failed: ' . $e->getMessage());
    Log::error('Command failed', ['exception' => $e]);
    return 1;
}
```

## Monitoring and Alerting

### Command Monitoring
- Exit codes for success/failure detection
- Structured logging for monitoring systems
- Performance metrics collection
- Resource usage tracking

### Alert Integration
- Email notifications for critical failures
- Slack/Discord webhook support
- Custom alert thresholds
- Escalation procedures

## Security Considerations

### 1. Command Authorization
- Artisan commands run with application privileges
- Sensitive operations require confirmation
- Audit logging for security-critical commands

### 2. Input Validation
- Strict validation of command arguments
- Sanitization of user inputs
- Prevention of command injection

### 3. File System Security
- Secure file permissions for generated configs
- Temporary file cleanup
- Path traversal prevention

## Performance Optimization

### 1. Batch Processing
- Bulk operations for efficiency
- Memory-conscious processing
- Progress tracking for long operations

### 2. Resource Management
- Connection pooling for database operations
- Timeout management for external calls
- Cleanup of temporary resources

### 3. Caching Strategy
- Configuration caching
- Query result caching
- File system caching

## Troubleshooting Guide

### Common Issues
1. **Permission Errors**: Check file system permissions
2. **Service Unavailable**: Verify proxy service status
3. **Certificate Failures**: Check domain DNS and accessibility
4. **Database Locks**: Review concurrent command execution

### Debug Commands
```bash
# Enable verbose output
php artisan ssl:renew -v

# Show SQL queries
php artisan proxy:sync --debug

# Dry run for testing
php artisan nginx:deploy --dry-run
```

### Log Analysis
- Check `storage/logs/laravel.log` for application errors
- Review `deployment_logs` table for operation history
- Monitor system logs for service-related issues

## Change Log
- 2025-08-29: Added Blueprint Maintenance Protocol and Change Log to standardize safe, incremental updates.
