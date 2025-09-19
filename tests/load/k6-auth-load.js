import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const loginSuccessRate = new Rate('login_success');
const loginDuration = new Trend('login_duration');
const authErrorRate = new Rate('auth_errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 20 }, // Ramp up to 20 users over 2 minutes
    { duration: '5m', target: 20 }, // Stay at 20 users for 5 minutes
    { duration: '2m', target: 50 }, // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 }, // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    { duration: '5m', target: 0 }, // Ramp down to 0 users over 5 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
    login_success: ['rate>0.9'], // Login success rate must be above 90%
    login_duration: ['p(95)<1000'], // 95% of logins must complete below 1s
    auth_errors: ['rate<0.05'], // Auth error rate must be below 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1';

// Test data
const testUsers = [
  { email: 'test1@netpilot.local', password: 'TestPassword123!' },
  { email: 'test2@netpilot.local', password: 'TestPassword123!' },
  { email: 'test3@netpilot.local', password: 'TestPassword123!' },
  { email: 'test4@netpilot.local', password: 'TestPassword123!' },
  { email: 'test5@netpilot.local', password: 'TestPassword123!' },
];

function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function login(user) {
  const loginStart = Date.now();

  const response = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'auth_login' },
  });

  const loginEnd = Date.now();
  loginDuration.add(loginEnd - loginStart);

  const success = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login response has access_token': (r) => JSON.parse(r.body).access_token !== undefined,
    'login response has user': (r) => JSON.parse(r.body).user !== undefined,
  });

  loginSuccessRate.add(success);

  if (!success) {
    authErrorRate.add(1);
    console.error(`Login failed for ${user.email}: ${response.status} ${response.body}`);
    return null;
  }

  authErrorRate.add(0);
  return JSON.parse(response.body);
}

function refreshToken(refreshToken) {
  const response = http.post(`${BASE_URL}/auth/refresh`, JSON.stringify({
    refresh_token: refreshToken,
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'auth_refresh' },
  });

  return check(response, {
    'refresh status is 200': (r) => r.status === 200,
    'refresh response has access_token': (r) => JSON.parse(r.body).access_token !== undefined,
  });
}

function getUserProfile(accessToken) {
  const response = http.get(`${BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    tags: { name: 'auth_me' },
  });

  return check(response, {
    'profile status is 200': (r) => r.status === 200,
    'profile response has user data': (r) => {
      const body = JSON.parse(r.body);
      return body.email !== undefined && body.id !== undefined;
    },
  });
}

function logout(accessToken) {
  const response = http.post(`${BASE_URL}/auth/logout`, {}, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    tags: { name: 'auth_logout' },
  });

  return check(response, {
    'logout status is 200': (r) => r.status === 200,
  });
}

function changePassword(accessToken, currentPassword, newPassword) {
  const response = http.post(`${BASE_URL}/auth/change-password`, JSON.stringify({
    currentPassword,
    newPassword,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    tags: { name: 'auth_change_password' },
  });

  return check(response, {
    'change password status is 200': (r) => r.status === 200,
  });
}

export default function () {
  const user = getRandomUser();

  // 1. Login
  const authData = login(user);
  if (!authData) {
    return; // Skip rest of test if login failed
  }

  sleep(1); // Simulate user reading time

  // 2. Get user profile (simulate dashboard load)
  getUserProfile(authData.access_token);

  sleep(2); // Simulate user interaction time

  // 3. Refresh token (simulate long session)
  if (Math.random() < 0.3) { // 30% of users refresh token
    refreshToken(authData.refresh_token);
    sleep(1);
  }

  // 4. Change password (simulate occasional password changes)
  if (Math.random() < 0.05) { // 5% of users change password
    changePassword(authData.access_token, user.password, 'NewPassword123!');
    // Note: In real test, you'd want to change it back or use different test users
    sleep(1);
  }

  // 5. Logout
  if (Math.random() < 0.7) { // 70% of users logout properly
    logout(authData.access_token);
  }

  sleep(1); // Think time between scenarios
}

export function setup() {
  console.log('Starting auth load test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test users: ${testUsers.length}`);

  // Pre-test: Verify API is accessible
  const healthCheck = http.get(`${BASE_URL.replace('/api/v1', '')}/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`API health check failed: ${healthCheck.status}`);
  }

  return { testStartTime: Date.now() };
}

export function teardown(data) {
  const testDuration = (Date.now() - data.testStartTime) / 1000;
  console.log(`Auth load test completed in ${testDuration} seconds`);
}

export function handleSummary(data) {
  return {
    'auth-load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: `
====== Auth Load Test Summary ======

Test Duration: ${data.metrics.iteration_duration.avg}ms average
Total Requests: ${data.metrics.http_reqs.count}
Failed Requests: ${data.metrics.http_req_failed.rate * 100}%

Auth Metrics:
- Login Success Rate: ${data.metrics.login_success?.rate * 100 || 0}%
- Login Duration (95th percentile): ${data.metrics.login_duration?.p95 || 0}ms
- Auth Error Rate: ${data.metrics.auth_errors?.rate * 100 || 0}%

Performance:
- Request Duration (95th percentile): ${data.metrics.http_req_duration.p95}ms
- Requests per second: ${data.metrics.http_reqs.rate}

Thresholds:
${Object.entries(data.thresholds).map(([key, threshold]) =>
  `- ${key}: ${threshold.passed ? '✓ PASSED' : '✗ FAILED'}`
).join('\n')}

=====================================
    `,
  };
}