import { createApp } from './bootstrap.js';

/**
 * รัน Nest server ฟังที่ $PORT
 * ใช้ได้ทั้ง local, Docker, และ Vercel Container
 * (Vercel ตั้ง $PORT ให้อัตโนมัติ — ต้อง bind 0.0.0.0 ไม่ใช่ localhost)
 */
async function bootstrap() {
  const { expressApp } = await createApp();
  const port = Number(process.env.PORT ?? 3000);
  expressApp.listen(port, '0.0.0.0', () => {
    console.log(`Application is running on port ${port}`);
  });
}

await bootstrap();
