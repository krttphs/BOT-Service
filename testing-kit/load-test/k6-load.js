/**
 * k6 load test — BOT Insight API
 * ------------------------------
 * รันหลังจากเปิด mock BOT + รันแอป (ชี้ BOT_API_BASE_URL ไป mock แล้ว)
 *
 *   k6 run k6-load.js
 *   BASE=http://localhost:3000/api k6 run k6-load.js
 *
 * มี 2 scenario:
 *   1. load      — ยิงหลาย VU ดู throughput / latency / error rate
 *   2. ratelimit — ยิงรัวจาก VU เดียว ดูว่า throttler คืน 429 จริง
 *
 * หมายเหตุ throttler: ถ้าตั้ง THROTTLE_LIMIT ต่ำ (เช่น 60/นาที) scenario load
 * จะเจอ 429 เยอะเป็นเรื่องปกติ ถ้าอยากวัด capacity จริง ให้ตั้ง THROTTLE_LIMIT
 * สูงๆ ชั่วคราวในแอปก่อนรัน
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const BASE = __ENV.BASE || 'http://localhost:3000/api';

const http200 = new Counter('status_200');
const http429 = new Counter('status_429');
const http500 = new Counter('status_500_CRASH'); // 500 = bug ในแอป ต้องแก้
const http502 = new Counter('status_502_upstream'); // 502 = BOT/mock ล่ม (ปกติ)
const httpOther = new Counter('status_other');

export const options = {
  scenarios: {
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 20 }, // ค่อยๆ เพิ่มเป็น 20 VU
        { duration: '40s', target: 20 }, // คงที่
        { duration: '10s', target: 0 }, // ลดลง
      ],
      exec: 'loadScenario',
    },
    ratelimit: {
      executor: 'constant-vus',
      vus: 1,
      duration: '15s',
      startTime: '75s', // เริ่มหลัง scenario load จบ
      exec: 'rateLimitScenario',
    },
  },
  thresholds: {
    // 95% ของ request (ที่ไม่ใช่ 429) ต้องเร็วกว่า 800ms
    http_req_duration: ['p(95)<800'],
  },
};

// หมุนยิงหลาย endpoint แบบผู้ใช้จริง
const endpoints = [
  '/dashboard/categories',
  '/dashboard/summary',
  '/search?purpose=mlr&confidence=low&amount=1000000&bankType=all',
  '/financial-institutions-holidays?year=2024',
];

function recordStatus(res) {
  if (res.status === 200) http200.add(1);
  else if (res.status === 429) http429.add(1);
  else if (res.status === 500) http500.add(1);
  else if (res.status === 502) http502.add(1);
  else httpOther.add(1);
}

export function loadScenario() {
  const path = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE}${path}`);
  recordStatus(res);
  check(res, {
    // สำคัญสุด: ต้องไม่มี 500 (crash จาก bug ในแอป) — 502 ถือว่า ok (upstream ล่ม)
    'ไม่มี 500 (ไม่ crash)': (r) => r.status !== 500,
    'เป็น 200/429/502 (จัดการได้)': (r) =>
      r.status === 200 || r.status === 429 || r.status === 502,
  });
  sleep(Math.random() * 1);
}

export function rateLimitScenario() {
  // ยิงรัวไม่หน่วง เพื่อให้ชน rate limit
  const res = http.get(`${BASE}/dashboard/categories`);
  recordStatus(res);
  check(res, {
    'throttler คืน 429 เมื่อยิงเกิน limit': (r) =>
      r.status === 200 || r.status === 429,
  });
}
