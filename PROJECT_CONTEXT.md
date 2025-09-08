# NetPilot - Project Context

## Project Overview

NetPilot is a comprehensive Laravel-based system for managing reverse proxy configurations and SSL certificates. It provides automated management of Traefik and Nginx proxy servers with integrated Let's Encrypt SSL certificate handling.

## Current Development Status

**Date:** 2025-09-08  
**Version:** 1.0 (Development)  
**Status:** Feature Complete - Ready for Production Testing

## Key Capabilities

### Core Features
- **Domain Management**: Complete CRUD operations with DNS configuration support
- **Proxy Rules**: HTTP/HTTPS routing with priority-based rule management
- **SSL Automation**: Automated Let's Encrypt certificate issuance and renewal
- **Route Rules**: Advanced path-based routing with upstream service integration
- **Upstream Services**: Backend service management with health checks
- **Redirect Rules**: HTTP redirect management with pattern matching
- **Deployment Logging**: Comprehensive operation tracking and audit trails
- **Configuration Sync**: Real-time synchronization between database and proxy configs

### Technical Implementation
- **Backend**: Laravel 11 with PHP 8.2+
- **Frontend**: Vue.js 3 + Inertia.js + Tailwind CSS
- **Proxy Engines**: Traefik (primary) and Nginx (alternative)
- **SSL Provider**: Let's Encrypt via ACME protocol
- **Database**: MySQL/PostgreSQL/SQLite support
- **Containerization**: Docker with Laravel Sail

## Architecture Highlights

### Service Layer
- **TraefikService**: Dynamic configuration generation and deployment
- **NginxService**: Alternative proxy configuration management
- **LetsEncryptService**: SSL certificate lifecycle management
- **SystemCommandService**: Secure command execution with logging
- **ReconcilerService**: Periodic state synchronization and health checks

### Data Models
- **Domain**: Central entity linking all configurations
- **ProxyRule**: Source-to-target routing definitions
- **RouteRule**: Advanced path-based routing with HTTP method support
- **Upstream**: Backend service definitions with load balancing
- **SslCertificate**: SSL certificate management with auto-renewal
- **RedirectRule**: HTTP redirect configurations
- **DeploymentLog**: Operation audit trail
- **CertificateEvent**: SSL lifecycle event tracking

### Automation Features
- **Scheduled Tasks**: Daily SSL renewal, periodic config deployment, log cleanup
- **Real-time Sync**: Immediate configuration updates via web interface
- **Health Monitoring**: Service status tracking and alerting
- **Dry-run Mode**: Safe testing of operations before execution

## Security Considerations

- Authentication required for all operations
- CSRF protection on all forms
- Input validation and sanitization
- Secure command execution with controlled privileges
- SSL certificate validation and secure storage
- Audit logging for all system operations

## Documentation Quality

The project maintains comprehensive documentation with:
- **Blueprint Maintenance Protocol**: Prevents accidental overwrites
- **Cross-file Consistency**: Maintains alignment between docs and code
- **Change Tracking**: Dated change logs in each documentation file
- **User Guides**: Complete installation and usage documentation
- **Technical Specs**: Detailed API and architecture documentation

## Development Workflow

### Environment Support
- **Development**: Local development with Vite hot reload
- **Docker**: Laravel Sail containerized development
- **Production**: Optimized deployment with caching and SSL

### Quality Assurance
- Comprehensive validation at all layers
- Error handling with graceful degradation
- Extensive logging for troubleshooting
- Dry-run capabilities for safe testing

## Integration Points

### External Services
- **Let's Encrypt**: ACME protocol for SSL certificates
- **Traefik**: Dynamic configuration via file provider
- **Nginx**: Traditional configuration file management
- **Docker**: Container orchestration and networking

### Configuration Management
- Environment-based configuration
- Dynamic directory monitoring
- File-based configuration generation
- API-based service reloading

## Future Roadmap

### Planned Enhancements
- WebSocket proxy support
- Multi-tenant architecture
- Advanced monitoring and metrics
- API rate limiting
- Load balancer integration
- Backup and restore functionality

### Scalability Considerations
- Multi-proxy support architecture
- Batch operation capabilities
- Performance optimization for large deployments
- Monitoring and alerting integration

---

**Last Updated:** 2025-09-08  
**Maintainer:** NetPilot Development Team  
**License:** MIT
