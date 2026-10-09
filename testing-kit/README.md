# Testing Kit — Mock BOT + k6 Load Test

ยิง load test ระบบได้โดย **ไม่กระทบ BOT API จริง**

## โครงสร้าง
```
testing-kit/
├── mock-bot/mock-bot.mjs    # จำลอง BOT API (Node ล้วน ไม่ต้องลง dep)
└── load-test/k6-load.js     # สคริปต์ k6
```

## ขั้นตอน (เปิด 3 terminal)

### 1) รัน mock BOT
```bash
cd testing-kit/mock-bot
node mock-bot.mjs
# -> Mock BOT API listening on http://localhost:9099
```
> ต้องใช้ Node 18+ (ใช้ ESM import + global URL/fetch)

### 2) ชี้แอปไป mock แล้วรันแอป
ใน `.env` ของโปรเจกต์ NestJS:
```dotenv
BOT_API_BASE_URL=http://localhost:9099
# ระหว่าง load test ตั้ง limit สูงๆ ถ้าอยากวัด capacity จริง (ไม่งั้นจะเจอ 429 เร็ว)
THROTTLE_LIMIT=100000
THROTTLE_TTL=60000
```
แล้ว:
```bash
npm run start:dev
```

### 3) รัน k6
ติดตั้ง k6 ก่อน (`brew install k6` บน macOS) แล้ว:
```bash
cd testing-kit/load-test
k6 run k6-load.js
```

## อ่านผล
- **status_200 / status_429 / status_other** — ตัวนับแยกสถานะ
- **http_req_duration p(95)** — ต้อง < 800ms (ปรับได้ใน options.thresholds)
- **checks** — ต้องผ่าน "ไม่มี 5xx" 100% (ถ้าเจอ 5xx = มีจุด crash ตอนโหลด)

## ทดสอบ rate limit แยก (ไม่ต้องใช้ k6)
ตั้ง `THROTTLE_LIMIT=60` กลับ แล้ว:
```bash
for i in $(seq 1 70); do curl -s -o /dev/null -w "%{http_code}\n" \
  http://localhost:3000/api/dashboard/categories; done | sort | uniq -c
# คาดหวัง ~60 ครั้ง 200 แล้วตามด้วย ~10 ครั้ง 429
```

## ทดสอบ "BOT ตอบพัง" (OWASP API #10)
แก้ `mock-bot.mjs` ให้บาง path ตอบ 500 หรือ JSON พัง แล้วยิงดูว่าแอป
คืน error สวยๆ (ไม่ใช่ 500 + stack) — ตรงนี้คือจุดที่ guard ใน service ทำงาน
