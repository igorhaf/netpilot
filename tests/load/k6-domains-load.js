import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const domainOperationSuccessRate = new Rate('domain_operations_success');
const domainCreationDuration = new Trend('domain_creation_duration');
const domainListingDuration = new Trend('domain_listing_duration');
const apiErrorRate = new Rate('api_errors');
const concurrentDomainOperations = new Counter('concurrent_domain_operations');

// Test configuration
export const options = {
  scenarios: {
    // Scenario 1: Normal user browsing and CRUD operations
    normal_operations: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '3m', target: 10 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    // Scenario 2: Heavy read operations (dashboard/listing)
    heavy_reads: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
      exec: 'readOnlyOperations',
    },
    // Scenario 3: Spike test for domain creation
    spike_creation: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 5 },
        { duration: '30s', target: 100 }, // Spike
        { duration: '10s', target: 5 },
      ],
      gracefulRampDown: '30s',
      exec: 'domainCreationSpike',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
    domain_operations_success: ['rate>0.95'],
    domain_creation_duration: ['p(95)<2000'],
    domain_listing_duration: ['p(95)<500'],
    api_errors: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1';
let accessToken = null;

// Test data
const domainNames = [
  'test-load-001.example.com',
  'test-load-002.example.com',
  'test-load-003.example.com',
  'load-test-001.local',
  'load-test-002.local',
  'performance-001.test',
  'performance-002.test',
  'stress-test-001.local',
  'stress-test-002.local',
  'benchmark-001.example.org',
];

function authenticateUser() {
  const response = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'admin@netpilot.local',
    password: 'admin123',
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'auth_setup' },
  });

  if (response.status === 200) {
    const authData = JSON.parse(response.body);
    return authData.access_token;
  }

  throw new Error(`Authentication failed: ${response.status}`);
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
}

function createDomain(domainName) {
  const createStart = Date.now();

  const domainData = {
    name: domainName,
    description: `Load test domain - ${domainName}`,
    enabled: Math.random() > 0.5,
    autoSsl: Math.random() > 0.3,
    forceHttps: Math.random() > 0.2,
    blockExternal: Math.random() > 0.8,
    wwwRedirect: Math.random() > 0.7,
  };

  const response = http.post(`${BASE_URL}/domains`, JSON.stringify(domainData), {
    headers: getAuthHeaders(),
    tags: { name: 'domain_create' },
  });

  const createEnd = Date.now();
  domainCreationDuration.add(createEnd - createStart);
  concurrentDomainOperations.add(1);

  const success = check(response, {
    'domain creation status is 201': (r) => r.status === 201,
    'domain creation response has id': (r) => {
      try {
        return JSON.parse(r.body).id !== undefined;
      } catch {
        return false;
      }
    },
    'domain creation response has name': (r) => {
      try {
        return JSON.parse(r.body).name === domainName;
      } catch {
        return false;
      }
    },
  });

  domainOperationSuccessRate.add(success);

  if (!success) {
    apiErrorRate.add(1);
    console.error(`Domain creation failed: ${response.status} ${response.body}`);
    return null;
  }

  apiErrorRate.add(0);
  return JSON.parse(response.body);
}

function listDomains(page = 1, limit = 10, search = '') {
  const listStart = Date.now();

  let url = `${BASE_URL}/domains?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }

  const response = http.get(url, {
    headers: getAuthHeaders(),
    tags: { name: 'domain_list' },
  });

  const listEnd = Date.now();
  domainListingDuration.add(listEnd - listStart);

  const success = check(response, {
    'domain listing status is 200': (r) => r.status === 200,
    'domain listing has data array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).data);
      } catch {
        return false;
      }
    },
    'domain listing has pagination': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.total !== undefined && body.page !== undefined;
      } catch {
        return false;
      }
    },
  });

  domainOperationSuccessRate.add(success);

  if (!success) {
    apiErrorRate.add(1);
    return null;
  }

  apiErrorRate.add(0);
  return JSON.parse(response.body);
}

function getDomain(domainId) {
  const response = http.get(`${BASE_URL}/domains/${domainId}`, {
    headers: getAuthHeaders(),
    tags: { name: 'domain_get' },
  });

  const success = check(response, {
    'domain get status is 200': (r) => r.status === 200,
    'domain get response has details': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id && body.name;
      } catch {
        return false;
      }
    },
  });

  domainOperationSuccessRate.add(success);

  if (!success) {
    apiErrorRate.add(1);
    return null;
  }

  apiErrorRate.add(0);
  return JSON.parse(response.body);
}

function updateDomain(domainId, updates) {
  const response = http.put(`${BASE_URL}/domains/${domainId}`, JSON.stringify(updates), {
    headers: getAuthHeaders(),
    tags: { name: 'domain_update' },
  });

  const success = check(response, {
    'domain update status is 200': (r) => r.status === 200,
  });

  domainOperationSuccessRate.add(success);

  if (!success) {
    apiErrorRate.add(1);
    return null;
  }

  apiErrorRate.add(0);
  return JSON.parse(response.body);
}

function toggleDomain(domainId) {
  const response = http.patch(`${BASE_URL}/domains/${domainId}/toggle`, {}, {
    headers: getAuthHeaders(),
    tags: { name: 'domain_toggle' },
  });

  const success = check(response, {
    'domain toggle status is 200': (r) => r.status === 200,
  });

  domainOperationSuccessRate.add(success);

  if (!success) {
    apiErrorRate.add(1);
  } else {
    apiErrorRate.add(0);
  }

  return success;
}

function deleteDomain(domainId) {
  const response = http.del(`${BASE_URL}/domains/${domainId}`, {}, {
    headers: getAuthHeaders(),
    tags: { name: 'domain_delete' },
  });

  const success = check(response, {
    'domain delete status is 200': (r) => r.status === 200,
  });

  domainOperationSuccessRate.add(success);

  if (!success) {
    apiErrorRate.add(1);
  } else {
    apiErrorRate.add(0);
  }

  return success;
}

function getDomainStats() {
  const response = http.get(`${BASE_URL}/domains/stats`, {
    headers: getAuthHeaders(),
    tags: { name: 'domain_stats' },
  });

  const success = check(response, {
    'domain stats status is 200': (r) => r.status === 200,
    'domain stats has metrics': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.total !== undefined && body.enabled !== undefined;
      } catch {
        return false;
      }
    },
  });

  domainOperationSuccessRate.add(success);

  if (!success) {
    apiErrorRate.add(1);
  } else {
    apiErrorRate.add(0);
  }

  return success;
}

// Main test scenario - Full CRUD operations
export default function () {
  // 1. List domains (simulate dashboard load)
  const domainsData = listDomains(1, 20);
  if (!domainsData) return;

  sleep(1);

  // 2. Search domains
  if (Math.random() < 0.3) { // 30% of users search
    listDomains(1, 10, 'test');
    sleep(0.5);
  }

  // 3. Get domain stats
  if (Math.random() < 0.4) { // 40% of users check stats
    getDomainStats();
    sleep(0.5);
  }

  // 4. Create new domain
  if (Math.random() < 0.2) { // 20% of users create domains
    const domainName = domainNames[Math.floor(Math.random() * domainNames.length)] +
                      `-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newDomain = createDomain(domainName);
    if (newDomain) {
      sleep(1);

      // 5. View created domain
      getDomain(newDomain.id);
      sleep(0.5);

      // 6. Update domain
      if (Math.random() < 0.5) { // 50% chance to update
        updateDomain(newDomain.id, {
          description: `Updated description - ${Date.now()}`,
          enabled: !newDomain.enabled,
        });
        sleep(0.5);
      }

      // 7. Toggle domain
      if (Math.random() < 0.3) { // 30% chance to toggle
        toggleDomain(newDomain.id);
        sleep(0.5);
      }

      // 8. Delete domain (cleanup)
      if (Math.random() < 0.8) { // 80% chance to cleanup
        deleteDomain(newDomain.id);
      }
    }
  }

  // 9. Browse existing domains
  if (domainsData.data.length > 0 && Math.random() < 0.6) { // 60% chance to browse
    const randomDomain = domainsData.data[Math.floor(Math.random() * domainsData.data.length)];
    getDomain(randomDomain.id);
    sleep(0.5);
  }

  sleep(1); // Think time
}

// Read-only operations scenario
export function readOnlyOperations() {
  // Heavy read operations to stress the database
  listDomains(1, 50); // Larger page size
  sleep(0.2);

  listDomains(Math.floor(Math.random() * 5) + 1, 20); // Random page
  sleep(0.2);

  // Search operations
  const searchTerms = ['test', 'example', 'local', 'performance'];
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  listDomains(1, 10, searchTerm);
  sleep(0.2);

  // Stats check
  getDomainStats();
  sleep(0.3);
}

// Domain creation spike scenario
export function domainCreationSpike() {
  const domainName = `spike-test-${Date.now()}-${__VU}-${Math.floor(Math.random() * 10000)}`;

  const newDomain = createDomain(domainName);
  if (newDomain) {
    sleep(0.1);

    // Quick operations on created domain
    getDomain(newDomain.id);
    sleep(0.1);

    // Cleanup
    deleteDomain(newDomain.id);
  }

  sleep(0.2);
}

export function setup() {
  console.log('Setting up domain load test...');
  console.log(`Base URL: ${BASE_URL}`);

  // Authenticate once for the entire test
  accessToken = authenticateUser();
  console.log('Authentication successful');

  // Verify domains endpoint is accessible
  const response = http.get(`${BASE_URL}/domains?limit=1`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status !== 200) {
    throw new Error(`Domains API check failed: ${response.status}`);
  }

  console.log('Domains API verified');

  return {
    testStartTime: Date.now(),
    accessToken: accessToken,
  };
}

export function teardown(data) {
  const testDuration = (Date.now() - data.testStartTime) / 1000;
  console.log(`Domain load test completed in ${testDuration} seconds`);

  // Cleanup any remaining test domains
  console.log('Cleaning up test domains...');

  try {
    const response = http.get(`${BASE_URL}/domains?search=test-load&limit=100`, {
      headers: {
        'Authorization': `Bearer ${data.accessToken}`,
      },
    });

    if (response.status === 200) {
      const domains = JSON.parse(response.body).data;
      domains.forEach(domain => {
        if (domain.name.includes('test-load') || domain.name.includes('spike-test') ||
            domain.name.includes('load-test') || domain.name.includes('performance-') ||
            domain.name.includes('stress-test') || domain.name.includes('benchmark-')) {

          http.del(`${BASE_URL}/domains/${domain.id}`, {}, {
            headers: {
              'Authorization': `Bearer ${data.accessToken}`,
            },
          });
        }
      });
      console.log(`Cleaned up ${domains.length} test domains`);
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

export function handleSummary(data) {
  return {
    'domain-load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: `
====== Domain Operations Load Test Summary ======

Test Scenarios:
- Normal Operations: CRUD operations with realistic user behavior
- Heavy Reads: High-volume read operations and searches
- Spike Creation: Burst domain creation testing

Test Duration: ${data.metrics.iteration_duration?.avg || 0}ms average
Total Requests: ${data.metrics.http_reqs?.count || 0}
Failed Requests: ${(data.metrics.http_req_failed?.rate || 0) * 100}%

Domain Operation Metrics:
- Operation Success Rate: ${(data.metrics.domain_operations_success?.rate || 0) * 100}%
- Domain Creation Duration (95th percentile): ${data.metrics.domain_creation_duration?.p95 || 0}ms
- Domain Listing Duration (95th percentile): ${data.metrics.domain_listing_duration?.p95 || 0}ms
- API Error Rate: ${(data.metrics.api_errors?.rate || 0) * 100}%
- Concurrent Operations: ${data.metrics.concurrent_domain_operations?.count || 0}

Performance Metrics:
- Request Duration (95th percentile): ${data.metrics.http_req_duration?.p95 || 0}ms
- Request Duration (99th percentile): ${data.metrics.http_req_duration?.p99 || 0}ms
- Requests per second: ${data.metrics.http_reqs?.rate || 0}

Request Breakdown:
${Object.entries(data.metrics)
  .filter(([key]) => key.startsWith('http_req_duration{name:'))
  .map(([key, metric]) => {
    const name = key.match(/name:([^}]+)/)?.[1] || 'unknown';
    return `- ${name}: ${metric.count} requests, ${metric.avg?.toFixed(2)}ms avg`;
  }).join('\n')}

Thresholds:
${Object.entries(data.thresholds || {}).map(([key, threshold]) =>
  `- ${key}: ${threshold.ok ? '✓ PASSED' : '✗ FAILED'}`
).join('\n')}

==============================================
    `,
  };
}