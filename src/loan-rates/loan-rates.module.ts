import { Module } from '@nestjs/common';
import { LoanRatesController } from './loan-rates.controller.js';
import { LoanRatesService } from './loan-rates.service.js';

// Module สำหรับจัดการ Feature Loan Rates
@Module({
    controllers: [LoanRatesController],
    providers: [LoanRatesService]
})
export class LoanRatesModule {}
