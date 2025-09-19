# NetPilot Load Testing

This directory contains comprehensive load testing configurations for the NetPilot application using K6 and Artillery.

## Overview

The load testing suite includes:
- **K6 Tests**: Authentication and domain management load tests
- **Artillery Tests**: Comprehensive API load testing with custom scenarios
- **Lighthouse**: Frontend performance testing
- **Test Data**: CSV files with realistic test data

## Prerequisites

### K6 Installation
```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# macOS
brew install k6

# Windows
choco install k6
```

### Artillery Installation
```bash
npm install -g artillery@latest
```

### Lighthouse Installation
```bash
npm install -g lighthouse
```

## Test Files

### K6 Tests

#### Authentication Load Test (`k6-auth-load.js`)
Tests authentication endpoints with:
- Login/logout flows
- Token refresh operations
- User profile retrieval
- Password change operations
- Concurrent user simulation

**Usage:**
```bash
k6 run k6-auth-load.js
```

**Environment Variables:**
- `BASE_URL`: API base URL (default: http://localhost:3001/api/v1)

#### Domain Management Load Test (`k6-domains-load.js`)
Tests domain management with:
- CRUD operations on domains
- Bulk operations
- Search and filtering
- Statistics retrieval
- Concurrent domain operations

**Usage:**
```bash
k6 run k6-domains-load.js
```

**Scenarios:**
- `normal_operations`: Standard CRUD operations (10 VUs for 5 minutes)
- `heavy_reads`: High-volume read operations (50 VUs for 3 minutes)
- `spike_creation`: Burst domain creation testing (100 VUs for 1 minute)

### Artillery Tests

#### Comprehensive API Load Test (`artillery-config.yml`)
Multi-scenario load testing covering:
- Authentication flows (30% weight)
- Domain management (40% weight)
- SSL certificate operations (15% weight)
- System monitoring (10% weight)
- Proxy rules management (5% weight)

**Usage:**
```bash
artillery run artillery-config.yml
```

**Test Phases:**
1. **Warm-up** (60s): 5 req/s
2. **Normal load** (300s): 20 req/s
3. **Peak load** (180s): 50 req/s
4. **Spike test** (60s): 100 req/s
5. **Cool down** (120s): 10 req/s

**Custom Features:**
- Response validation functions
- Dynamic test data generation
- Performance metrics logging
- Automatic cleanup procedures

### Lighthouse Performance Test (`lighthouse-performance.js`)
Frontend performance testing with:
- Core Web Vitals measurement
- Accessibility auditing
- SEO optimization checks
- Progressive Web App validation
- Performance budget enforcement

**Usage:**
```bash
node lighthouse-performance.js
```

## Test Data

### Domain Test Data (`test-data/domains.csv`)
Contains 20 realistic domain configurations for load testing:
- Various TLDs (.com, .local, .test, .org)
- Mixed enabled/disabled states
- Descriptive naming patterns

### User Test Data (`test-data/users.csv`)
Contains 20 test user accounts:
- Admin and regular user accounts
- Consistent password patterns
- Various email domains

## Performance Thresholds

### K6 Thresholds
- **Response Time**: 95th percentile < 500ms, 99th percentile < 1000ms
- **Error Rate**: < 5%
- **Success Rate**: > 95%
- **Request Rate**: > 50 requests/second

### Artillery Thresholds
- **Response Time**: 95th percentile < 1000ms, 99th percentile < 2000ms
- **Success Rate**: > 80%
- **Auth Errors**: < 5%
- **Server Errors**: < 1%

### Lighthouse Thresholds
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 90

## Custom Processor Functions

The Artillery configuration includes custom JavaScript functions in `processors/netpilot-processor.js`:

### Validation Functions
- `validateLogin`: Validates authentication responses
- `validateDomainsList`: Validates domain listing responses
- `validateStats`: Validates statistics responses
- `validateHealth`: Validates system health responses

### Data Generation
- `generateTestUser`: Creates random user data
- `generateRandomDomain`: Creates random domain names
- `maybeCreateDomain`: Probabilistic domain creation (20% chance)

### Utilities
- `logPerformanceMetrics`: Logs slow requests and errors
- `setupTestData`: Initializes test data for scenarios
- `cleanupTestData`: Cleanup procedures for test data

## Running Load Tests

### Development Environment
```bash
# Start NetPilot services
docker-compose up -d

# Wait for services to be ready
sleep 30

# Run basic authentication load test
k6 run k6-auth-load.js

# Run domain management load test
k6 run k6-domains-load.js

# Run comprehensive Artillery test
artillery run artillery-config.yml

# Run frontend performance test
node lighthouse-performance.js
```

### Production Environment
```bash
# Set production environment variables
export BASE_URL="https://api.netpilot.com/api/v1"
export FRONTEND_URL="https://netpilot.com"

# Run production load tests
k6 run -e BASE_URL=$BASE_URL k6-auth-load.js
artillery run artillery-config.yml
```

### CI/CD Integration
```bash
# Run tests with JSON output for CI
k6 run --out json=auth-results.json k6-auth-load.js
k6 run --out json=domains-results.json k6-domains-load.js
artillery run artillery-config.yml --output artillery-results.json
```

## Test Results

### K6 Results
K6 generates detailed reports including:
- Request statistics (min, max, avg, percentiles)
- Error rates and types
- Virtual user metrics
- Custom metric values

### Artillery Results
Artillery provides:
- Summary statistics
- Request distribution by endpoint
- Error analysis
- Custom metric reporting
- JSON output for automation

### Lighthouse Results
Lighthouse generates:
- HTML performance reports
- JSON data for automation
- Core Web Vitals measurements
- Actionable improvement recommendations

## Monitoring and Alerting

### Performance Monitoring
- Set up alerts for response time degradation
- Monitor error rate spikes
- Track resource utilization during tests

### Continuous Testing
- Schedule regular load tests
- Integrate with CI/CD pipelines
- Baseline performance tracking

## Troubleshooting

### Common Issues

#### High Error Rates
```bash
# Check service logs
docker-compose logs backend
docker-compose logs frontend

# Verify database connections
docker-compose logs db
```

#### Slow Response Times
```bash
# Monitor resource usage
docker stats

# Check database performance
docker-compose exec db psql -U netpilot -c "SELECT * FROM pg_stat_activity;"
```

#### Test Data Conflicts
```bash
# Clean test data
docker-compose exec backend npm run test:cleanup
```

### Performance Optimization
1. **Database Optimization**: Add indexes for frequently queried fields
2. **Connection Pooling**: Optimize database connection pools
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Rate Limiting**: Tune rate limiting thresholds
5. **Load Balancing**: Configure proper load balancing strategies

## Best Practices

### Test Design
- Start with small load and gradually increase
- Test individual components before full system tests
- Use realistic test data patterns
- Include error scenarios in tests

### Monitoring
- Monitor both application and infrastructure metrics
- Set up proper alerting thresholds
- Log detailed performance metrics
- Track trends over time

### Maintenance
- Regularly update test data
- Review and adjust thresholds
- Clean up test artifacts
- Document test results and findings

## References

- [K6 Documentation](https://k6.io/docs/)
- [Artillery Documentation](https://artillery.io/docs/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [NetPilot API Documentation](http://localhost:3001/api/docs)