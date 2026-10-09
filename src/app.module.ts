import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { APP_GUARD } from '@nestjs/core';

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller.js';

import { AppService } from './app.service.js';

import { BotApiModule } from './bot-api/bot-api.module.js';

import { ExchangeRateModule } from './quarterly-exchange-rate/exchange-rate.module.js';

import { InterbankRatesModule } from './interbank-rates/interbank-rates.module.js';

import { BiborModule } from './bibor/bibor.module.js';

import { HolidaysModule } from './holidays/holidays.module.js';

import { LoanRatesModule } from './loan-rates/loan-rates.module.js';

import { BusinessAnalysisModule } from './business-analysis/business-analysis.module.js';

import { DashboardModule } from './dashboard/dashboard.module.js';

@Module({
  imports: [
    // โหลดค่าจากไฟล์ .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate limiting: กัน DoS และกันยิงทะลุไป BOT API ถี่เกินจน token โดนแบน
    // default 60 request / 60 วินาที ต่อ IP (ปรับผ่าน env ได้)
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL ?? 60_000),
        limit: Number(process.env.THROTTLE_LIMIT ?? 60),
      },
    ]),

    // Bot API Service (Global)
    BotApiModule,

    // นำ Feature ทั้งหมดเข้ามาใช้งาน
    ExchangeRateModule,
    InterbankRatesModule,
    BiborModule,
    HolidaysModule,
    LoanRatesModule,
    BusinessAnalysisModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // เปิด rate limit ให้ทุก route ทั้งแอป
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}