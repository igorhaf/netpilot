const https = require('https');
const http = require('http');

// Global variables to store authentication data
let globalAccessToken = null;
let globalRefreshToken = null;
let testUserCredentials = null;

/**
 * Initialize test data and authenticate a test user
 */
async function authenticateUser(context, events, done) {
  try {
    // Use existing token if valid
    if (globalAccessToken && !isTokenExpired(globalAccessToken)) {
      context.vars.accessToken = globalAccessToken;
      context.vars.refreshToken = globalRefreshToken;
      return done();
    }

    // Create or login test user
    const email = context.vars.testUserEmail || 'loadtest@netpilot.local';
    const password = context.vars.testUserPassword || 'loadtest123';

    // Try to register first (ignore if user exists)
    await registerUser(email, password, context);

    // Login to get tokens
    const tokens = await loginUser(email, password, context);

    globalAccessToken = tokens.access_token;
    globalRefreshToken = tokens.refresh_token;

    context.vars.accessToken = globalAccessToken;
    context.vars.refreshToken = globalRefreshToken;

    done();
  } catch (error) {
    console.error('Authentication failed:', error.message);
    done(error);
  }
}

/**
 * Create a test domain for use in other scenarios
 */
async function createTestDomain(context, events, done) {
  try {
    const domainName = `loadtest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.com`;

    const domainData = {
      domain: domainName,
      enabled: true,
      description: `Load test domain created at ${new Date().toISOString()}`
    };

    const domain = await makeAuthenticatedRequest(
      'POST',
      '/domains',
      domainData,
      context.vars.accessToken,
      context
    );

    context.vars.domainId = domain.id;
    context.vars.testDomainName = domain.domain;

    done();
  } catch (error) {
    console.error('Failed to create test domain:', error.message);
    done(error);
  }
}

/**
 * Setup SSL certificate for testing
 */
async function setupSSLCertificate(context, events, done) {
  try {
    if (!context.vars.domainId) {
      throw new Error('Domain ID not available. Run createTestDomain first.');
    }

    const sslData = {
      domainId: context.vars.domainId,
      provider: 'letsencrypt',
      challengeType: 'http-01',
      autoRenew: true
    };

    const certificate = await makeAuthenticatedRequest(
      'POST',
      '/ssl-certificates',
      sslData,
      context.vars.accessToken,
      context
    );

    context.vars.certificateId = certificate.id;
    done();
  } catch (error) {
    console.error('Failed to setup SSL certificate:', error.message);
    done(error);
  }
}

/**
 * Create multiple proxy rules for stress testing
 */
async function createMultipleProxyRules(context, events, done) {
  try {
    if (!context.vars.domainId) {
      throw new Error('Domain ID not available. Run createTestDomain first.');
    }

    const rulesToCreate = context.vars.proxyRuleCount || 5;
    const createdRules = [];

    for (let i = 0; i < rulesToCreate; i++) {
      const ruleData = {
        domainId: context.vars.domainId,
        sourcePath: `/api/v${i + 1}`,
        targetUrl: `http://backend-${i + 1}.local:${3001 + i}`,
        enabled: true,
        loadBalancingMethod: i % 2 === 0 ? 'round_robin' : 'least_connections',
        healthCheckUrl: `http://backend-${i + 1}.local:${3001 + i}/health`,
        timeoutSeconds: 30,
        retryAttempts: 3
      };

      const rule = await makeAuthenticatedRequest(
        'POST',
        '/proxy-rules',
        ruleData,
        context.vars.accessToken,
        context
      );

      createdRules.push(rule.id);
    }

    context.vars.proxyRuleIds = createdRules;
    done();
  } catch (error) {
    console.error('Failed to create multiple proxy rules:', error.message);
    done(error);
  }
}

/**
 * Simulate realistic user behavior with think times
 */
async function simulateRealisticUserFlow(context, events, done) {
  try {
    const actions = [
      { action: 'listDomains', thinkTime: 2000 },
      { action: 'viewDashboard', thinkTime: 5000 },
      { action: 'checkLogs', thinkTime: 3000 },
      { action: 'viewSystemStatus', thinkTime: 2000 }
    ];

    for (const step of actions) {
      await performAction(step.action, context);
      await sleep(step.thinkTime + Math.random() * 1000); // Add some randomness
    }

    done();
  } catch (error) {
    console.error('Failed to simulate user flow:', error.message);
    done(error);
  }
}

/**
 * Cleanup test data to prevent database bloat
 */
async function cleanupTestData(context, events, done) {
  try {
    // Clean up proxy rules
    if (context.vars.proxyRuleIds && Array.isArray(context.vars.proxyRuleIds)) {
      for (const ruleId of context.vars.proxyRuleIds) {
        try {
          await makeAuthenticatedRequest(
            'DELETE',
            `/proxy-rules/${ruleId}`,
            null,
            context.vars.accessToken,
            context
          );
        } catch (error) {
          // Ignore errors for cleanup
          console.warn(`Failed to cleanup proxy rule ${ruleId}:`, error.message);
        }
      }
    }

    // Clean up SSL certificate
    if (context.vars.certificateId) {
      try {
        await makeAuthenticatedRequest(
          'DELETE',
          `/ssl-certificates/${context.vars.certificateId}`,
          null,
          context.vars.accessToken,
          context
        );
      } catch (error) {
        console.warn(`Failed to cleanup SSL certificate:`, error.message);
      }
    }

    // Clean up test domain
    if (context.vars.domainId) {
      try {
        await makeAuthenticatedRequest(
          'DELETE',
          `/domains/${context.vars.domainId}?force=true`,
          null,
          context.vars.accessToken,
          context
        );
      } catch (error) {
        console.warn(`Failed to cleanup domain:`, error.message);
      }
    }

    done();
  } catch (error) {
    // Don't fail the test if cleanup fails
    console.warn('Cleanup failed:', error.message);
    done();
  }
}

/**
 * Generate performance metrics
 */
async function generateMetrics(context, events, done) {
  const startTime = Date.now();

  try {
    // Perform a series of operations and measure response times
    const operations = [
      { name: 'listDomains', endpoint: '/domains' },
      { name: 'getDashboardStats', endpoint: '/dashboard/stats?period=24h' },
      { name: 'getSystemStatus', endpoint: '/system/status' },
      { name: 'getLogs', endpoint: '/logs?limit=10' }
    ];

    const metrics = {};

    for (const op of operations) {
      const opStartTime = Date.now();

      try {
        await makeAuthenticatedRequest(
          'GET',
          op.endpoint,
          null,
          context.vars.accessToken,
          context
        );

        metrics[op.name] = {
          responseTime: Date.now() - opStartTime,
          success: true
        };
      } catch (error) {
        metrics[op.name] = {
          responseTime: Date.now() - opStartTime,
          success: false,
          error: error.message
        };
      }
    }

    // Emit custom metrics
    events.emit('customStat', 'operations.total_time', Date.now() - startTime);

    for (const [operation, data] of Object.entries(metrics)) {
      events.emit('customStat', `operations.${operation}.response_time`, data.responseTime);
      events.emit('customStat', `operations.${operation}.success`, data.success ? 1 : 0);
    }

    context.vars.performanceMetrics = metrics;
    done();
  } catch (error) {
    console.error('Failed to generate metrics:', error.message);
    done(error);
  }
}

// Helper functions

async function registerUser(email, password, context) {
  const userData = {
    email,
    password,
    name: 'Load Test User',
    role: 'user'
  };

  try {
    await makeRequest('POST', '/auth/register', userData, context);
  } catch (error) {
    // Ignore registration errors (user might already exist)
    if (!error.message.includes('409') && !error.message.includes('USER_ALREADY_EXISTS')) {
      throw error;
    }
  }
}

async function loginUser(email, password, context) {
  const loginData = { email, password };
  return await makeRequest('POST', '/auth/login', loginData, context);
}

async function makeRequest(method, path, data, context) {
  return new Promise((resolve, reject) => {
    const target = context.vars.$target || 'http://meadadigital.com:3001';
    const url = new URL(path, target);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Artillery LoadTest'
      }
    };

    const client = url.protocol === 'https:' ? https : http;

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsedData = responseData ? JSON.parse(responseData) : {};
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function makeAuthenticatedRequest(method, path, data, token, context) {
  return new Promise((resolve, reject) => {
    const target = context.vars.$target || 'http://meadadigital.com:3001';
    const url = new URL(path, target);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Artillery LoadTest'
      }
    };

    const client = url.protocol === 'https:' ? https : http;

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsedData = responseData ? JSON.parse(responseData) : {};
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function performAction(action, context) {
  const actionMap = {
    listDomains: () => makeAuthenticatedRequest('GET', '/domains', null, context.vars.accessToken, context),
    viewDashboard: () => makeAuthenticatedRequest('GET', '/dashboard/stats?period=24h', null, context.vars.accessToken, context),
    checkLogs: () => makeAuthenticatedRequest('GET', '/logs?limit=20', null, context.vars.accessToken, context),
    viewSystemStatus: () => makeAuthenticatedRequest('GET', '/system/status', null, context.vars.accessToken, context)
  };

  if (actionMap[action]) {
    return await actionMap[action]();
  } else {
    throw new Error(`Unknown action: ${action}`);
  }
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true; // Assume expired if we can't parse
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export functions for Artillery
module.exports = {
  authenticateUser,
  createTestDomain,
  setupSSLCertificate,
  createMultipleProxyRules,
  simulateRealisticUserFlow,
  cleanupTestData,
  generateMetrics
};