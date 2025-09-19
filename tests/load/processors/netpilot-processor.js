const crypto = require('crypto');

/**
 * Artillery processor for NetPilot load testing
 * Contains custom functions for validation and test data generation
 */

// Helper function to generate random strings
function randomString(length = 8) {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

// Helper function to generate random domains
function generateRandomDomain() {
  const domains = ['example.com', 'test.local', 'demo.org', 'netpilot.local'];
  const prefix = randomString(6);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${prefix}.${domain}`;
}

/**
 * Validate login response
 */
function validateLogin(req, res, context, ee, next) {
  if (res.statusCode !== 200) {
    console.error(`Login failed with status ${res.statusCode}:`, res.body);
    return next();
  }

  try {
    const body = JSON.parse(res.body);

    if (!body.access_token || !body.refresh_token || !body.user) {
      console.error('Login response missing required fields:', body);
      ee.emit('error', new Error('Invalid login response structure'));
    } else {
      console.log(`Login successful for user: ${body.user.email}`);
    }
  } catch (error) {
    console.error('Failed to parse login response:', error.message);
    ee.emit('error', error);
  }

  return next();
}

/**
 * Validate user profile response
 */
function validateProfile(req, res, context, ee, next) {
  if (res.statusCode !== 200) {
    console.error(`Profile fetch failed with status ${res.statusCode}:`, res.body);
    return next();
  }

  try {
    const body = JSON.parse(res.body);

    if (!body.id || !body.email) {
      console.error('Profile response missing required fields:', body);
      ee.emit('error', new Error('Invalid profile response structure'));
    } else {
      console.log(`Profile validated for user: ${body.email}`);
    }
  } catch (error) {
    console.error('Failed to parse profile response:', error.message);
    ee.emit('error', error);
  }

  return next();
}

/**
 * Validate token refresh response
 */
function validateRefresh(req, res, context, ee, next) {
  if (res.statusCode !== 200) {
    console.error(`Token refresh failed with status ${res.statusCode}:`, res.body);
    return next();
  }

  try {
    const body = JSON.parse(res.body);

    if (!body.access_token) {
      console.error('Refresh response missing access_token:', body);
      ee.emit('error', new Error('Invalid refresh response structure'));
    } else {
      console.log('Token refresh successful');
    }
  } catch (error) {
    console.error('Failed to parse refresh response:', error.message);
    ee.emit('error', error);
  }

  return next();
}

/**
 * Validate domains list response
 */
function validateDomainsList(req, res, context, ee, next) {
  if (res.statusCode !== 200) {
    console.error(`Domains list failed with status ${res.statusCode}:`, res.body);
    return next();
  }

  try {
    const body = JSON.parse(res.body);

    if (!body.data || !Array.isArray(body.data)) {
      console.error('Domains list response missing data array:', body);
      ee.emit('error', new Error('Invalid domains list response structure'));
    } else {
      console.log(`Domains list retrieved: ${body.data.length} domains, page ${body.page}/${body.totalPages}`);
    }
  } catch (error) {
    console.error('Failed to parse domains list response:', error.message);
    ee.emit('error', error);
  }

  return next();
}

/**
 * Validate domain stats response
 */
function validateStats(req, res, context, ee, next) {
  if (res.statusCode !== 200) {
    console.error(`Domain stats failed with status ${res.statusCode}:`, res.body);
    return next();
  }

  try {
    const body = JSON.parse(res.body);

    if (typeof body.total === 'undefined' || typeof body.enabled === 'undefined') {
      console.error('Domain stats response missing required fields:', body);
      ee.emit('error', new Error('Invalid domain stats response structure'));
    } else {
      console.log(`Domain stats: ${body.total} total, ${body.enabled} enabled`);
    }
  } catch (error) {
    console.error('Failed to parse domain stats response:', error.message);
    ee.emit('error', error);
  }

  return next();
}

/**
 * Validate SSL certificates response
 */
function validateCertificates(req, res, context, ee, next) {
  if (res.statusCode !== 200) {
    console.error(`SSL certificates failed with status ${res.statusCode}:`, res.body);
    return next();
  }

  try {
    const body = JSON.parse(res.body);

    if (!body.data || !Array.isArray(body.data)) {
      console.error('SSL certificates response missing data array:', body);
      ee.emit('error', new Error('Invalid SSL certificates response structure'));
    } else {
      console.log(`SSL certificates retrieved: ${body.data.length} certificates`);
    }
  } catch (error) {
    console.error('Failed to parse SSL certificates response:', error.message);
    ee.emit('error', error);
  }

  return next();
}

/**
 * Validate system health response
 */
function validateHealth(req, res, context, ee, next) {
  if (res.statusCode !== 200) {
    console.error(`System health check failed with status ${res.statusCode}:`, res.body);
    return next();
  }

  try {
    const body = JSON.parse(res.body);

    if (!body.status || !body.timestamp) {
      console.error('Health response missing required fields:', body);
      ee.emit('error', new Error('Invalid health response structure'));
    } else {
      console.log(`System health: ${body.status}`);
    }
  } catch (error) {
    console.error('Failed to parse health response:', error.message);
    ee.emit('error', error);
  }

  return next();
}

/**
 * Validate system metrics response
 */
function validateMetrics(req, res, context, ee, next) {
  if (res.statusCode !== 200) {
    console.error(`System metrics failed with status ${res.statusCode}:`, res.body);
    return next();
  }

  try {
    const body = JSON.parse(res.body);

    if (!body.cpu || !body.memory) {
      console.error('Metrics response missing required fields:', body);
      ee.emit('error', new Error('Invalid metrics response structure'));
    } else {
      console.log(`System metrics: CPU ${body.cpu.usage}%, Memory ${body.memory.usage}%`);
    }
  } catch (error) {
    console.error('Failed to parse metrics response:', error.message);
    ee.emit('error', error);
  }

  return next();
}

/**
 * Validate proxy rules response
 */
function validateProxyRules(req, res, context, ee, next) {
  if (res.statusCode !== 200) {
    console.error(`Proxy rules failed with status ${res.statusCode}:`, res.body);
    return next();
  }

  try {
    const body = JSON.parse(res.body);

    if (!body.data || !Array.isArray(body.data)) {
      console.error('Proxy rules response missing data array:', body);
      ee.emit('error', new Error('Invalid proxy rules response structure'));
    } else {
      console.log(`Proxy rules retrieved: ${body.data.length} rules`);
    }
  } catch (error) {
    console.error('Failed to parse proxy rules response:', error.message);
    ee.emit('error', error);
  }

  return next();
}

/**
 * Maybe create a domain (used for probabilistic domain creation)
 */
function maybeCreateDomain(context, ee, next) {
  // 20% chance to create a domain
  if (Math.random() < 0.2) {
    const domainName = generateRandomDomain();
    const timestamp = Date.now();

    context.vars.shouldCreateDomain = true;
    context.vars.newDomainName = domainName;
    context.vars.newDomainDescription = `Load test domain created at ${timestamp}`;
    context.vars.newDomainEnabled = Math.random() > 0.5;

    console.log(`Will create domain: ${domainName}`);
  } else {
    context.vars.shouldCreateDomain = false;
  }

  return next();
}

/**
 * Generate test user data
 */
function generateTestUser(context, ee, next) {
  const userId = randomString(8);
  const timestamp = Date.now();

  context.vars.testEmail = `loadtest-${userId}@netpilot.local`;
  context.vars.testPassword = `LoadTest123!${userId}`;
  context.vars.testName = `Load Test User ${userId}`;
  context.vars.timestamp = timestamp;

  return next();
}

/**
 * Setup test data for scenarios
 */
function setupTestData(context, ee, next) {
  // Set common test data
  context.vars.adminEmail = 'admin@netpilot.local';
  context.vars.adminPassword = 'admin123';
  context.vars.testDomain = generateRandomDomain();
  context.vars.timestamp = Date.now();

  return next();
}

/**
 * Cleanup test data after scenarios
 */
function cleanupTestData(context, ee, next) {
  // Log cleanup actions
  if (context.vars.createdDomainId) {
    console.log(`Should cleanup domain: ${context.vars.createdDomainId}`);
  }

  if (context.vars.createdUserId) {
    console.log(`Should cleanup user: ${context.vars.createdUserId}`);
  }

  return next();
}

/**
 * Log performance metrics
 */
function logPerformanceMetrics(req, res, context, ee, next) {
  const responseTime = res.timings?.total || 0;
  const endpoint = req.url || 'unknown';
  const method = req.method || 'GET';

  // Log slow requests
  if (responseTime > 1000) {
    console.warn(`Slow request detected: ${method} ${endpoint} took ${responseTime}ms`);
  }

  // Log errors
  if (res.statusCode >= 400) {
    console.error(`Error response: ${method} ${endpoint} returned ${res.statusCode}`);
  }

  return next();
}

/**
 * Generate random proxy rule data
 */
function generateProxyRuleData(context, ee, next) {
  const ruleId = randomString(6);
  const port = 3000 + Math.floor(Math.random() * 100);

  context.vars.ruleName = `load-test-rule-${ruleId}`;
  context.vars.sourcePath = `/api/v1/test-${ruleId}`;
  context.vars.targetUrl = `http://backend-${ruleId}.local:${port}`;
  context.vars.enabled = Math.random() > 0.3;

  return next();
}

module.exports = {
  validateLogin,
  validateProfile,
  validateRefresh,
  validateDomainsList,
  validateStats,
  validateCertificates,
  validateHealth,
  validateMetrics,
  validateProxyRules,
  maybeCreateDomain,
  generateTestUser,
  setupTestData,
  cleanupTestData,
  logPerformanceMetrics,
  generateProxyRuleData
};