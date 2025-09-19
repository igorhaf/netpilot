import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTimeThreshold = new Trend('response_time_threshold');
const successfulOperations = new Counter('successful_operations');
const failedOperations = new Counter('failed_operations');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Sustained load
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Sustained load
    { duration: '2m', target: 50 }, // Spike to 50 users
    { duration: '3m', target: 50 }, // Sustained spike
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should complete in under 2s
    http_req_failed: ['rate<0.05'],    // Error rate should be less than 5%
    error_rate: ['rate<0.05'],         // Custom error rate
    checks: ['rate>0.9'],              // 90% of checks should pass
  },
  ext: {
    loadimpact: {
      projectID: 3595593,
      name: "NetPilot Performance Test"
    }
  }
};

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1`;

// Test data
let authToken = null;
let testDomainId = null;
let testProxyRuleId = null;

export function setup() {
  console.log('Setting up test environment...');

  // Register and authenticate test user
  const registerResponse = http.post(`${API_BASE}/auth/register`, JSON.stringify({
    email: `perftest-${Date.now()}@netpilot.local`,
    password: 'perftest123',
    name: 'Performance Test User',
    role: 'user'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

  if (registerResponse.status !== 201 && registerResponse.status !== 409) {
    console.error('Failed to register test user:', registerResponse.status, registerResponse.body);
    return null;
  }

  // Login to get auth token
  const loginResponse = http.post(`${API_BASE}/auth/login`, JSON.stringify({
    email: `perftest-${Date.now()}@netpilot.local`,
    password: 'perftest123'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

  if (loginResponse.status !== 200) {
    // Try with a generic test user
    const fallbackLogin = http.post(`${API_BASE}/auth/login`, JSON.stringify({
      email: 'admin@netpilot.local',
      password: 'admin123'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

    if (fallbackLogin.status !== 200) {
      console.error('Failed to authenticate:', fallbackLogin.status, fallbackLogin.body);
      return null;
    }

    authToken = JSON.parse(fallbackLogin.body).access_token;
  } else {
    authToken = JSON.parse(loginResponse.body).access_token;
  }

  console.log('Setup completed successfully');
  return { authToken };
}

export default function(data) {
  if (!data || !data.authToken) {
    console.error('Setup failed, skipping test');
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.authToken}`
  };

  group('Authentication Flow', function() {
    // Test login performance
    group('Login Performance', function() {
      const startTime = Date.now();

      const loginResponse = http.post(`${API_BASE}/auth/login`, JSON.stringify({
        email: 'admin@netpilot.local',
        password: 'admin123'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

      const duration = Date.now() - startTime;
      responseTimeThreshold.add(duration);

      const loginSuccess = check(loginResponse, {
        'login status is 200': (r) => r.status === 200,
        'login response time < 1000ms': (r) => r.timings.duration < 1000,
        'login has access token': (r) => JSON.parse(r.body).access_token !== undefined,
      });

      if (loginSuccess) {
        successfulOperations.add(1);
      } else {
        failedOperations.add(1);
        errorRate.add(1);
      }
    });

    // Test token refresh
    group('Token Refresh', function() {
      const refreshResponse = http.post(`${API_BASE}/auth/refresh`, null, {
        headers: authHeaders
      });

      check(refreshResponse, {
        'refresh status is 200': (r) => r.status === 200,
        'refresh response time < 500ms': (r) => r.timings.duration < 500,
      });
    });

    // Test user profile retrieval
    group('Get Profile', function() {
      const profileResponse = http.get(`${API_BASE}/auth/me`, {
        headers: authHeaders
      });

      check(profileResponse, {
        'profile status is 200': (r) => r.status === 200,
        'profile response time < 300ms': (r) => r.timings.duration < 300,
        'profile has user data': (r) => JSON.parse(r.body).email !== undefined,
      });
    });
  });

  group('Domain Management', function() {
    let domainId = null;

    // Create domain
    group('Create Domain', function() {
      const domainName = `perf-test-${__VU}-${__ITER}-${Date.now()}.com`;

      const createResponse = http.post(`${API_BASE}/domains`, JSON.stringify({
        domain: domainName,
        enabled: true,
        description: `Performance test domain for VU ${__VU}`
      }), {
        headers: authHeaders
      });

      const createSuccess = check(createResponse, {
        'domain create status is 201': (r) => r.status === 201,
        'domain create response time < 1000ms': (r) => r.timings.duration < 1000,
        'domain create has ID': (r) => JSON.parse(r.body).id !== undefined,
      });

      if (createSuccess && createResponse.status === 201) {
        domainId = JSON.parse(createResponse.body).id;
        successfulOperations.add(1);
      } else {
        failedOperations.add(1);
        errorRate.add(1);
      }
    });

    // List domains
    group('List Domains', function() {
      const listResponse = http.get(`${API_BASE}/domains?page=1&limit=10`, {
        headers: authHeaders
      });

      check(listResponse, {
        'domain list status is 200': (r) => r.status === 200,
        'domain list response time < 500ms': (r) => r.timings.duration < 500,
        'domain list has data': (r) => JSON.parse(r.body).data !== undefined,
      });
    });

    // Get domain details
    if (domainId) {
      group('Get Domain Details', function() {
        const detailResponse = http.get(`${API_BASE}/domains/${domainId}`, {
          headers: authHeaders
        });

        check(detailResponse, {
          'domain detail status is 200': (r) => r.status === 200,
          'domain detail response time < 300ms': (r) => r.timings.duration < 300,
          'domain detail has correct ID': (r) => JSON.parse(r.body).id === domainId,
        });
      });

      // Update domain
      group('Update Domain', function() {
        const updateResponse = http.put(`${API_BASE}/domains/${domainId}`, JSON.stringify({
          description: `Updated performance test domain for VU ${__VU} at ${Date.now()}`,
          enabled: false
        }), {
          headers: authHeaders
        });

        check(updateResponse, {
          'domain update status is 200': (r) => r.status === 200,
          'domain update response time < 800ms': (r) => r.timings.duration < 800,
        });
      });

      // Toggle domain
      group('Toggle Domain', function() {
        const toggleResponse = http.patch(`${API_BASE}/domains/${domainId}/toggle`, null, {
          headers: authHeaders
        });

        check(toggleResponse, {
          'domain toggle status is 200': (r) => r.status === 200,
          'domain toggle response time < 400ms': (r) => r.timings.duration < 400,
        });
      });
    }

    // Clean up - delete domain
    if (domainId) {
      group('Delete Domain', function() {
        const deleteResponse = http.del(`${API_BASE}/domains/${domainId}`, null, {
          headers: authHeaders
        });

        check(deleteResponse, {
          'domain delete status is 204': (r) => r.status === 204,
          'domain delete response time < 600ms': (r) => r.timings.duration < 600,
        });
      });
    }
  });

  group('Proxy Rules Management', function() {
    let testDomainId = null;
    let proxyRuleId = null;

    // Create test domain for proxy rules
    const domainResponse = http.post(`${API_BASE}/domains`, JSON.stringify({
      domain: `proxy-test-${__VU}-${__ITER}.com`,
      enabled: true
    }), {
      headers: authHeaders
    });

    if (domainResponse.status === 201) {
      testDomainId = JSON.parse(domainResponse.body).id;

      // Create proxy rule
      group('Create Proxy Rule', function() {
        const ruleResponse = http.post(`${API_BASE}/proxy-rules`, JSON.stringify({
          domainId: testDomainId,
          sourcePath: `/api/v${__VU}`,
          targetUrl: `http://backend-${__VU}.local:3001`,
          enabled: true,
          loadBalancingMethod: 'round_robin',
          healthCheckUrl: `http://backend-${__VU}.local:3001/health`,
          timeoutSeconds: 30,
          retryAttempts: 3
        }), {
          headers: authHeaders
        });

        const ruleSuccess = check(ruleResponse, {
          'proxy rule create status is 201': (r) => r.status === 201,
          'proxy rule create response time < 800ms': (r) => r.timings.duration < 800,
        });

        if (ruleSuccess && ruleResponse.status === 201) {
          proxyRuleId = JSON.parse(ruleResponse.body).id;
        }
      });

      // List proxy rules
      group('List Proxy Rules', function() {
        const listResponse = http.get(`${API_BASE}/proxy-rules?domainId=${testDomainId}`, {
          headers: authHeaders
        });

        check(listResponse, {
          'proxy rule list status is 200': (r) => r.status === 200,
          'proxy rule list response time < 400ms': (r) => r.timings.duration < 400,
        });
      });

      // Test proxy rule
      if (proxyRuleId) {
        group('Test Proxy Rule', function() {
          const testResponse = http.post(`${API_BASE}/proxy-rules/${proxyRuleId}/test`, null, {
            headers: authHeaders
          });

          check(testResponse, {
            'proxy rule test status is 200': (r) => r.status === 200,
            'proxy rule test response time < 2000ms': (r) => r.timings.duration < 2000,
          });
        });

        // Update proxy rule
        group('Update Proxy Rule', function() {
          const updateResponse = http.put(`${API_BASE}/proxy-rules/${proxyRuleId}`, JSON.stringify({
            targetUrl: `http://updated-backend-${__VU}.local:3001`,
            loadBalancingMethod: 'least_connections'
          }), {
            headers: authHeaders
          });

          check(updateResponse, {
            'proxy rule update status is 200': (r) => r.status === 200,
            'proxy rule update response time < 600ms': (r) => r.timings.duration < 600,
          });
        });
      }

      // Apply configuration
      group('Apply Proxy Configuration', function() {
        const applyResponse = http.post(`${API_BASE}/proxy-rules/apply`, null, {
          headers: authHeaders
        });

        check(applyResponse, {
          'proxy config apply status is 200': (r) => r.status === 200,
          'proxy config apply response time < 3000ms': (r) => r.timings.duration < 3000,
        });
      });

      // Cleanup
      if (proxyRuleId) {
        http.del(`${API_BASE}/proxy-rules/${proxyRuleId}`, null, { headers: authHeaders });
      }
      if (testDomainId) {
        http.del(`${API_BASE}/domains/${testDomainId}`, null, { headers: authHeaders });
      }
    }
  });

  group('Dashboard and Monitoring', function() {
    // Dashboard stats
    group('Dashboard Stats', function() {
      const statsResponse = http.get(`${API_BASE}/dashboard/stats?period=24h`, {
        headers: authHeaders
      });

      check(statsResponse, {
        'dashboard stats status is 200': (r) => r.status === 200,
        'dashboard stats response time < 1000ms': (r) => r.timings.duration < 1000,
        'dashboard stats has domains data': (r) => JSON.parse(r.body).domains !== undefined,
      });
    });

    // Traffic analytics
    group('Traffic Analytics', function() {
      const trafficResponse = http.get(`${API_BASE}/dashboard/traffic?period=24h&groupBy=hour`, {
        headers: authHeaders
      });

      check(trafficResponse, {
        'traffic analytics status is 200': (r) => r.status === 200,
        'traffic analytics response time < 800ms': (r) => r.timings.duration < 800,
      });
    });

    // System status
    group('System Status', function() {
      const statusResponse = http.get(`${API_BASE}/system/status`, {
        headers: authHeaders
      });

      check(statusResponse, {
        'system status status is 200': (r) => r.status === 200,
        'system status response time < 500ms': (r) => r.timings.duration < 500,
        'system status has system data': (r) => JSON.parse(r.body).system !== undefined,
      });
    });

    // Health check (no auth required)
    group('Health Check', function() {
      const healthResponse = http.get(`${BASE_URL}/health`);

      check(healthResponse, {
        'health check status is 200': (r) => r.status === 200,
        'health check response time < 200ms': (r) => r.timings.duration < 200,
        'health check status is ok': (r) => JSON.parse(r.body).status === 'ok',
      });
    });

    // Logs
    group('Logs', function() {
      const logsResponse = http.get(`${API_BASE}/logs?page=1&limit=20&level=info`, {
        headers: authHeaders
      });

      check(logsResponse, {
        'logs status is 200': (r) => r.status === 200,
        'logs response time < 600ms': (r) => r.timings.duration < 600,
      });
    });
  });

  // Think time between iterations
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

export function teardown(data) {
  console.log('Tearing down test environment...');

  if (data && data.authToken) {
    // Logout
    http.post(`${API_BASE}/auth/logout`, null, {
      headers: {
        'Authorization': `Bearer ${data.authToken}`
      }
    });
  }

  console.log('Teardown completed');
}

export function handleSummary(data) {
  return {
    'k6-performance-report.html': htmlReport(data),
    'k6-performance-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}