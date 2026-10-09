# สอน Deploy NestJS (backend) ขึ้น Vercel — ฉบับละเอียด

## 0. เข้าใจก่อนว่ากำลังทำอะไร

Vercel ไม่ได้รัน server ค้างแบบ `npm run start:dev` แต่รันแบบ **serverless function**
(เด้งขึ้นมาตอนมี request → ทำงาน → ดับ) เลยต้องมี "ตัวกลาง" แปลง NestJS
ให้เป็น function ที่ Vercel เรียกได้ → นั่นคือไฟล์ `api/index.ts`

กลไกทั้งหมด:
```
request → Vercel → api/index.ts (handler) → createApp() → NestJS → ตอบกลับ
```

---

## 1. ไฟล์ในชุดนี้ วางที่ไหน (วางใน repo backend)

```
<repo>/
├── vercel.json            ← ใหม่ (วางที่ root)
├── api/
│   └── index.ts           ← ใหม่ (serverless entry — Vercel เรียกไฟล์นี้)
└── src/
    ├── bootstrap.ts        ← ใหม่ (สร้าง Nest app, ใช้ร่วมกัน local+vercel)
    └── main.ts             ← แทนที่ของเดิม (local/Docker เรียกไฟล์นี้)
```

**แต่ละไฟล์ทำอะไร (ไว้ตอบอาจารย์ได้):**
- `src/bootstrap.ts` — รวมการตั้งค่า Nest (ValidationPipe, Helmet, CORS, filter) ไว้ที่เดียว คืน express app ที่ init แล้ว **ไม่มี listen()**
- `src/main.ts` — เรียก `createApp()` แล้ว `listen()` → ใช้ตอนรันในเครื่อง
- `api/index.ts` — เรียก `createApp()` จาก **dist/** (ที่ build แล้ว) แล้ว cache ไว้ → ใช้บน Vercel
- `vercel.json` — สั่ง build + route ทุก path เข้า function

> ทำไม api/index.ts import จาก `dist/` ไม่ใช่ `src/`? เพราะ `nest build` (tsc) ทำ
> decorator metadata ไว้ครบ ถ้าให้ Vercel (esbuild) คอมไพล์ src ใหม่ metadata จะหาย → DI พัง

---

## 2. เตรียม repo

### 2.1 ตรวจว่า build ได้ในเครื่องก่อน
```cmd
npm run build
```
ต้องได้โฟลเดอร์ `dist/` มี `dist/main.js` และ `dist/bootstrap.js`

### 2.2 (ถ้า repo ยังมี frontend Next.js ติดอยู่)
ไม่ต้องลบก็ได้ — แค่ตอนตั้งค่าบน Vercel เลือก **Framework Preset = Other**
เพื่อไม่ให้ Vercel นึกว่าเป็นโปรเจกต์ Next.js (ดูขั้น 4)

ถ้าอยากสะอาดจริงๆ ค่อยลบ frontend (next.config.ts, app/, deps next/react/tailwind) ทีหลัง

### 2.3 push ขึ้น GitHub
```cmd
git add -A
git commit -m "add vercel serverless entry"
git push
```

---

## 3. สมัคร/เชื่อม Vercel

1. ไปที่ https://vercel.com → Sign up ด้วย GitHub
2. **Add New → Project** → เลือก repo backend ของคุณ → Import

---

## 4. ตั้งค่า Project (สำคัญสุด)

ก่อนกด Deploy ตั้งค่าตามนี้:

| ช่อง | ใส่อะไร |
|---|---|
| **Framework Preset** | **Other** ← สำคัญ! กันไม่ให้มันไป build เป็น Next.js |
| **Build Command** | ปล่อยว่าง (ใช้ค่าจาก vercel.json แล้ว) |
| **Output Directory** | ปล่อยว่าง |
| **Install Command** | ปล่อยว่าง (`npm install` อัตโนมัติ) |

### Environment Variables (กด Add ทีละตัว)
```
BOT_API_BASE_URL       = https://gateway.api.bot.or.th
CORS_ORIGINS           = (URL frontend จริง ถ้ามี / เว้นว่างได้)
THROTTLE_TTL           = 60000
THROTTLE_LIMIT         = 60
BOT_API_TOKEN_SeriesList = <token>
BOT_API_TOKEN_Bibor      = <token>
BOT_API_TOKEN_Loan       = <token>
BOT_API_TOKEN_Holidays   = <token>
BOT_API_TOKEN_Interbank  = <token>
BOT_API_TOKEN_ExchangRate= <token>   ← สะกดตก e ตาม code
BOT_API_TOKEN_License    = <token>
```
> อย่า push ไฟล์ `.env` ขึ้น git — ใส่ค่าในหน้า Vercel แทน

---

## 5. Deploy

กด **Deploy** → รอ build เสร็จ → ได้ URL เช่น `https://bot-system-xxx.vercel.app`

ทดสอบ:
```
https://bot-system-xxx.vercel.app/api/dashboard/categories
```
ได้ JSON = สำเร็จ 🎉

---

## 6. ถ้าพัง — ดูตรงไหน

- หน้า Vercel → โปรเจกต์ → **Deployments** → คลิก deployment → **Build Logs** / **Runtime Logs**
- error บ่อย:
  - `No exports found` / 500 ตอนเรียก → มักเป็น ESM/import path → ส่ง log มา
  - build fail ที่ nest build → รัน `npm run build` ในเครื่องให้ผ่านก่อน
  - Vercel ไป build เป็น Next → ยังไม่ได้ตั้ง Framework = Other

---

## 7. ข้อจำกัดบน serverless (เขียนในรายงาน)
- **Rate limit (throttler)** เก็บใน memory → แต่ละ instance คนละ memory → นับไม่แม่น
  (production จริงควรใช้ Upstash Redis)
- **Cold start** request แรกหลังพักช้าหน่อย
- **ถ้าเริ่มใช้ Mongo** ต้อง cache connection ข้าม invocation
```
