import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'node:http';

// import "ของที่ compile แล้ว" จาก dist (nest build สร้างไว้ตอน buildCommand)
// เพื่อไม่ให้ Vercel/esbuild ไปคอมไพล์ decorator ใหม่จน metadata หาย
// ใช้ @ts-ignore (ไม่ใช่ @ts-expect-error) เพราะบน Vercel มี dist แล้ว import ไม่ error
// @ts-ignore
import { createApp } from '../dist/bootstrap.js';

type ExpressApp = (req: IncomingMessage, res: ServerResponse) => void;

let cached: ExpressApp | undefined;

// serverless handler: bootstrap ครั้งแรกแล้ว cache ไว้ใช้ซ้ำข้าม invocation
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (!cached) {
    const { expressApp } = await createApp();
    cached = expressApp as unknown as ExpressApp;
  }
  cached(req, res);
}