# สรุปการแก้ช่องโหว่ (Security Hardening)

## ⚠️ ต้องลง dependency เพิ่มก่อนรัน

```bash
npm install class-validator class-transformer @nestjs/throttler helmet
```

> ซิปนี้ไม่มี `package.json` มาด้วย เลยคอมไพล์/รันเทสเช็กให้ไม่ได้
> หลังลง deps แล้วรัน `npm run build` + `npm test` ยืนยันอีกครั้ง

---

## สิ่งที่แก้ แต่ละจุดกันอะไร

### 1. เพิ่ม Global ValidationPipe — `src/main.ts`
```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
}));
```
- **กัน:** input ผิดชนิด/ผิดรูปแบบ และ field แปลกปลอม (mass assignment)
- `whitelist` ตัด field ที่ไม่ได้ประกาศทิ้ง, `forbidNonWhitelisted` ส่ง field เกินมา → 400
- `transform` แปลงชนิดให้ตรง DTO (เช่น query string → number)

### 2. ใส่ validation decorator ครบทุก DTO — `src/**/dto/*.ts`
- `business-request.dto.ts` → `@IsString @IsNotEmpty @MaxLength(200)`
- `analyze-bibor.dto.ts`, `analyze-interbank.dto.ts` → บังคับรูปแบบวันที่ `YYYY-MM-DD`
- `exchange-rate-query.dto.ts` → `year` 4 หลัก, `quarter` ∈ Q1–Q4
- `loan-search-query.dto.ts` → `purpose/confidence/bankType` เป็น enum, `amount` เป็นเลขบวกและมีเพดาน
- `holiday-query.dto.ts` → `year` 4 หลัก
- `indicator-query.dto.ts` → `page/size` เป็น int, **`size` สูงสุด 100**
- **กัน:** injection / type-confusion / ขอข้อมูลก้อนใหญ่เกิน (DoS)

### 3. กัน crash ที่ business-analysis — `business-analysis.service.ts`
- เช็ก `typeof businessName !== 'string'` ก่อน `.trim()`
- **กัน:** ส่ง `business_name` เป็น number/object/ว่าง แล้วทำให้ `.trim()` โยน TypeError → **500 → เปลี่ยนเป็น 400 ที่ถูกต้อง**

### 4. CORS allowlist + Helmet — `src/main.ts`
- เดิม `app.enableCors()` = เปิดทุก origin (`*`)
- ใหม่: อนุญาตเฉพาะ origin ใน env `CORS_ORIGINS` (ไม่ตั้ง = ปิด cross-origin), จำกัด method เหลือ GET/POST
- เพิ่ม `helmet()` ใส่ security headers (กัน clickjacking, MIME sniffing ฯลฯ)
- **กัน:** เว็บอื่นแอบเรียก API, การโจมตีผ่าน header

### 5. Rate limiting — `src/app.module.ts`
- เพิ่ม `ThrottlerModule` + `ThrottlerGuard` ทั้งแอป (default 60 req/60s ต่อ IP, ปรับผ่าน env `THROTTLE_TTL`/`THROTTLE_LIMIT`)
- **กัน:** DoS และการยิงทะลุไป BOT API ถี่จน **token โดนแบน**

### 6. Catch-all exception filter — `common/filters/http-exception.filter.ts`
- เปลี่ยน `@Catch(HttpException)` → `@Catch()` (ดักทุก exception)
- error ที่ไม่ใช่ HttpException → log ฝั่ง server, ตอบ client เป็น 500 กลางๆ ไม่มี stack
- **กัน:** stack trace / รายละเอียดภายในหลุดออกไปหาผู้โจมตี

### 7. ลบ log ที่รั่วข้อมูล — `bot-api/bot-api.service.ts`
- ลบ `console.log` ตอน boot ที่โชว์สถานะ token
- `searchAuthorizedCompany` เดิม `console.log(error.response.data)` ทั้งก้อน → เหลือ log แค่ status code ผ่าน `Logger`
- **กัน:** ข้อมูล upstream / ร่องรอยภายในหลุดใน log

### 8. Defensive guard ตอนกินข้อมูลจาก BOT (OWASP API #10)
- `loan-rates.service.ts`: `(b.bank_type_name_eng ?? '').includes(...)`
- `business-analysis.service.ts`: เช็ก `LicenseInformations` เป็น array และกรอง item ที่เป็น null
- **กัน:** BOT ส่งข้อมูล field หาย/ชนิดเพี้ยน แล้วทำให้ `.includes`/`.filter` crash → 500

---

## แนะนำทำต่อ (ยังไม่ได้ทำในรอบนี้)
- ตั้งค่า `CORS_ORIGINS`, `THROTTLE_*` ใน `.env` ให้ตรงกับ production
- อัปเดต `.spec.ts` บางไฟล์ให้ตรง response ใหม่ (filter เพิ่ม field `success: false`)
- เพิ่ม cache ชั้นหน้า BOT API (ลดจำนวน call จริง) — ช่วยทั้ง performance และลดโอกาส token โดนแบน
- ตรวจ feature ของเพื่อนที่ใช้ MongoDB เรื่อง NoSQL injection แยกต่างหาก
