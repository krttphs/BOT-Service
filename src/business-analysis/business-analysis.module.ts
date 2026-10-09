import { Module } from '@nestjs/common';
import { BusinessAnalysisController } from './business-analysis.controller.js';
import { BusinessAnalysisService } from './business-analysis.service.js';

// Module สำหรับจัดการ Feature Business Analysis
@Module({
    controllers: [BusinessAnalysisController],
    providers: [BusinessAnalysisService]
})
export class BusinessAnalysisModule {}
