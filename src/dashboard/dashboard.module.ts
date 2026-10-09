import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

// Module สำหรับจัดการ Feature Dashboard
@Module({
    controllers: [DashboardController],
    providers: [DashboardService]
})
export class DashboardModule {}
