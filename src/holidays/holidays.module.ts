import { Module } from '@nestjs/common';
import { HolidaysController } from './holidays.controller.js';
import { HolidaysService } from './holidays.service.js';

// Module สำหรับจัดการ Feature Financial Institutions Holidays
@Module({
    controllers: [HolidaysController],
    providers: [HolidaysService]
})
export class HolidaysModule {}
