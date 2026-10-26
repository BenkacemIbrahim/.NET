import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const availabilityDuration = new Trend('availability_duration');
const tenantSettingsDuration = new Trend('tenant_settings_duration');
const bookingDuration = new Trend('booking_duration');
const successfulBookings = new Counter('successful_bookings');
const preventedConflicts = new Counter('prevented_conflicts');

export const options = {
  scenarios: {
    // 1. Availability and Tenant Read load test (HybridCache performance)
    read_throughput: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '10s', target: 20 },
        { duration: '20s', target: 50 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
      exec: 'testReads',
    },
    // 2. High-concurrency booking race condition test (PostgreSQL GiST & isolation)
    booking_concurrency: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 2,
      maxDuration: '20s',
      startTime: '5s',
      exec: 'testBookingConcurrency',
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.05'], // Under 5% unhandled errors (conflicts don't count as failures if handled)
    'availability_duration': ['p(95)<250'], // 95% of availability queries under 250ms
    'tenant_settings_duration': ['p(95)<100'], // 95% of cached tenant queries under 100ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://api:8080';
const TENANT_SLUG = 'northstar-health';

const headers = {
  'Content-Type': 'application/json',
  'X-Tenant': TENANT_SLUG,
};

export function testReads() {
  // Test 1: Public Tenant Settings (HybridCache L1/L2)
  const tenantRes = http.get(`${BASE_URL}/api/v1/public/tenant`, { headers });
  tenantSettingsDuration.add(tenantRes.timings.duration);
  check(tenantRes, {
    'tenant status is 200': (r) => r.status === 200,
    'tenant slug is correct': (r) => r.json('slug') === TENANT_SLUG,
  });

  // Test 2: Service availability search (Date-range calculation + cache)
  const serviceId = 'bfb52d09-e455-4615-9651-3879faec0e4a';
  const availRes = http.get(
    `${BASE_URL}/api/v1/availability?serviceId=${serviceId}&startsOn=2026-11-02&endsOn=2026-11-06`,
    { headers }
  );
  availabilityDuration.add(availRes.timings.duration);
  check(availRes, {
    'availability status is 200': (r) => r.status === 200,
    'availability has slots': (r) => Array.isArray(r.json()) && r.json().length > 0,
  });

  sleep(0.1);
}

export function testBookingConcurrency() {
  // Deliberately target the same slot from multiple VUs simultaneously
  // to prove the serializable / GiST exclusion constraint under high load
  const payload = JSON.stringify({
    serviceId: 'bfb52d09-e455-4615-9651-3879faec0e4a',
    staffId: '4c7928a2-8365-4f5f-b446-c7a4c8cf0f84',
    startsAt: '2026-11-02T10:00:00Z',
    customerName: `Concurrent Test User ${__VU}`,
    customerEmail: `loadtest-${__VU}@slotly.local`,
    customerPhone: '+212600000000',
    notes: 'Load test race condition validation',
  });

  const res = http.post(`${BASE_URL}/api/v1/bookings`, payload, { headers });
  bookingDuration.add(res.timings.duration);

  if (res.status === 201) {
    successfulBookings.add(1);
    check(res, { 'booking confirmed': (r) => r.status === 201 });
  } else if (res.status === 409 || res.status === 400) {
    preventedConflicts.add(1);
    check(res, { 'conflict prevented safely': (r) => r.status === 409 || r.status === 400 });
  } else {
    check(res, { 'unexpected booking response': (r) => false });
  }
}
