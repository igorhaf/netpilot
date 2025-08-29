# NetPilot - System Architecture

## Blueprint Maintenance Protocol
- ID: architecture.md@v1
- Purpose: Prevent overwrites and keep this blueprint continuously maintainable per prompt.
- Stable Anchors: Use the exact section headings in this file as anchors. Add new sections using the pattern "## [Category] - [Topic]".
- Update Policy: Prefer additive updates. When changing semantics, append a note and date. Keep breaking edits small and localized.
- Regeneration Rules:
  - When a prompt asks to "regenerate" architecture docs, only update sections explicitly mentioned in the prompt.
  - Preserve all headings and anchors not explicitly targeted.
  - Keep examples minimal; link to source paths like `app/Infra/Traefik/TraefikProvider.php` rather than duplicating large snippets.
- Cross-File Contracts: Keep config references in sync with `config/app.php` and `config/netpilot.php`. If keys differ, document both and note the source of truth.
- Change Log: Append changes under "## Change Log" with date and a short summary.

## Overview
NetPilot is a Laravel-based proxy and SSL certificate management system that automates the configuration of Traefik and Nginx reverse proxies. The system provides a web interface for managing domains, proxy rules, SSL certificates, and deployment logs.

## Core Architecture

### Technology Stack
- **Backend**: Laravel 11 with PHP 8.2+
- **Frontend**: Vue.js 3 with Inertia.js
- **Database**: MySQL/PostgreSQL (configurable)
- **Proxy Engines**: Traefik (primary), Nginx (alternative)
- **SSL Management**: Let's Encrypt via Certbot
- **Styling**: Tailwind CSS
- **Build Tools**: Vite

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    NetPilot System                          │
├─────────────────────────────────────────────────────────────┤
│  Web Interface (Vue.js + Inertia)                          │
│  ├── Domain Management                                      │
│  ├── Proxy Rules Configuration                             │
│  ├── SSL Certificate Management                            │
│  ├── Redirect Rules                                        │
│  └── Deployment Logs                                       │
├─────────────────────────────────────────────────────────────┤
│  Laravel Backend                                            │
│  ├── Controllers (HTTP API)                                │
│  ├── Models (Eloquent ORM)                                 │
│  ├── Services (Business Logic)                             │
│  ├── Console Commands (Automation)                         │
│  └── Use Cases (Application Layer)                         │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                       │
│  ├── TraefikProvider (Config Generation)                   │
│  ├── SystemCommandService (Shell Execution)                │
│  └── Database (MySQL/PostgreSQL)                           │
├─────────────────────────────────────────────────────────────┤
│  External Systems                                           │
│  ├── Traefik (Reverse Proxy)                              │
│  ├── Nginx (Alternative Proxy)                             │
│  ├── Let's Encrypt (SSL Certificates)                      │
│  └── Docker (Containerization)                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Proxy Configuration Flow
```
User Input (Web UI) 
    ↓
Controllers (HTTP)
    ↓
Models (Database)
    ↓
TraefikProvider (Config Generation)
    ↓
Traefik Dynamic Config Files
    ↓
Traefik Reload (API/systemctl)
```

### 2. SSL Certificate Flow
```
Domain Configuration
    ↓
LetsEncryptService
    ↓
Certbot (ACME Challenge)
    ↓
Certificate Files
    ↓
Traefik/Nginx Configuration
    ↓
Proxy Reload
```

### 3. Deployment Logging Flow
```
System Operation
    ↓
SystemCommandService
    ↓
DeploymentLog (Database)
    ↓
Web Interface (Logs Page)
```

## Key Design Patterns

### 1. Service Layer Pattern
- **TraefikService**: Manages Traefik configuration generation and deployment
- **NginxService**: Handles Nginx configuration and management
- **LetsEncryptService**: SSL certificate lifecycle management
- **SystemCommandService**: Centralized system command execution

### 2. Use Case Pattern
- **SyncProxyConfig**: Orchestrates proxy configuration synchronization
- **CreateDomain**: Domain creation workflow
- **ToggleAutoTLS**: SSL automation toggle

### 3. Provider Pattern
- **TraefikProvider**: Generates Traefik-specific YAML configurations

### 4. Repository Pattern (via Eloquent)
- Models serve as repositories with relationships
- Active Record pattern for data persistence

## Configuration Management

### Environment Variables
```bash
# Proxy Configuration
PROXY_ENABLED=true
PROXY_NETWORK=proxy
PROXY_DYNAMIC_DIR=/path/to/traefik/dynamic

# Traefik Configuration
TRAEFIK_CHALLENGE=HTTP01
TRAEFIK_DNS_PROVIDER=cloudflare
TRAEFIK_ACME_EMAIL=admin@example.com
TRAEFIK_API_URL=http://traefik:8080

# SSL Configuration
TRAEFIK_ACME_CA_SERVER=https://acme-v02.api.letsencrypt.org/directory
```

### Configuration Files
- `config/app.php`: Application settings and proxy dynamic directory
- `config/netpilot.php`: NetPilot-specific configuration
- `config/database.php`: Database connection settings

## Security Considerations

### 1. Command Execution
- SystemCommandService provides controlled shell execution
- Dry-run mode for development environments
- Comprehensive logging of all system operations

### 2. SSL Certificate Management
- Automated renewal before expiration
- Secure storage of certificate files
- Support for multiple ACME challenge types

### 3. Access Control
- Laravel's built-in authentication system
- Middleware protection for sensitive operations
- Input validation and sanitization

## Scalability Features

### 1. Multi-Proxy Support
- Configurable proxy backend (Traefik/Nginx)
- Extensible provider pattern for additional proxies

### 2. Batch Operations
- Bulk SSL certificate renewal
- Mass configuration deployment
- Scheduled maintenance tasks

### 3. Monitoring and Logging
- Comprehensive deployment logging
- Operation status tracking
- Error reporting and debugging

## Development and Testing

### 1. Environment Modes
- **Production**: Full system command execution
- **Development**: Dry-run simulation mode
- **Testing**: Mock external dependencies

### 2. Code Organization
- Clean Architecture principles
- Separation of concerns
- Dependency injection

### 3. Extensibility
- Plugin-ready service architecture
- Configurable proxy backends
- Modular component design

## Deployment Architecture

### Docker Integration
- Traefik container for reverse proxy
- Application container with PHP/Laravel
- Database container (MySQL/PostgreSQL)
- Shared volumes for configuration files

### File System Layout
```
/app/
├── config/           # Laravel configuration
├── app/
│   ├── Models/       # Eloquent models
│   ├── Services/     # Business logic services
│   ├── Http/         # Controllers and middleware
│   └── Console/      # Artisan commands
├── resources/js/     # Vue.js frontend
├── docker/
│   └── traefik/      # Traefik configuration
└── storage/          # Logs and temporary files
```

## Performance Considerations

### 1. Configuration Generation
- Efficient YAML generation without external dependencies
- Batch processing for multiple domains
- Minimal file I/O operations

### 2. Database Optimization
- Proper indexing on frequently queried fields
- Relationship eager loading
- Query optimization for large datasets

### 3. Caching Strategy
- Laravel's built-in caching for configuration
- File-based caching for generated configs
- Database query result caching

## Change Log
- 2025-08-29: Added Blueprint Maintenance Protocol, regeneration rules, and change log section to harden against accidental overwrites and guide ongoing updates.
