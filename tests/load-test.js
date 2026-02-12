/**
 * K6 Load Testing Script
 * Tests API performance under load
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    errors: ['rate<0.1'], // Error rate should be less than 10%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  // Test homepage
  let response = http.get(BASE_URL);
  check(response, {
    'homepage status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test API health endpoint
  response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test projects list (requires auth)
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${__ENV.TEST_TOKEN}`,
  };

  response = http.get(`${BASE_URL}/api/projects`, { headers });
  check(response, {
    'projects list status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(2);
}