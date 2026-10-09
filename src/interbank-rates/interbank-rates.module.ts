import { Module } from '@nestjs/common';
import { InterbankRatesController } from './interbank-rates.controller.js';
import { InterbankRatesService } from './interbank-rates.service.js';

// Module สำหรับจัดการ Feature Interbank Rates
@Module({
    controllers: [InterbankRatesController],
    providers: [InterbankRatesService]
})
export class InterbankRatesModule {}
