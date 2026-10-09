import { createApp } from './bootstrap.js';

/**
 * ใช้ตอนรันในเครื่อง / Docker (listen port จริง)
 * บน Vercel จะไม่รันไฟล์นี้ แต่ใช้ api/index.ts แทน
 */
async function bootstrap() {
  const { expressApp } = await createApp();
  const port = process.env.PORT ?? 3000;
  expressApp.listen(port, () => {
    console.log(`Application is running on port ${port}`);
  });
}

await bootstrap();
