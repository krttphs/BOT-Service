import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { BotApiService, BotLoanRateItem } from '../bot-api/bot-api.service.js';
import { LoanSearchQueryDto } from './dto/loan-search-query.dto.js';

export interface ProcessedBank {
  bank_name: string;
  type: string;
  rate: number;
  default_rate: number;
  penaltyGap: string;
  interestCost: number;
  period: string;
}

const VALID_PURPOSES = ['mor', 'mlr', 'mrr'];
const VALID_CONFIDENCE = ['low', 'high'];
const VALID_BANK_TYPES = ['all', 'thai', 'foreign'];

// Service สำหรับจัดการการค้นหาอัตราดอกเบี้ยเงินกู้
@Injectable()
export class LoanRatesService {
  constructor(private readonly botApiService: BotApiService) {}

  validateQuery(query: LoanSearchQueryDto) {
    const { purpose, confidence, amount, bankType } = query;

    if (!purpose || !VALID_PURPOSES.includes(purpose)) {
      throw new BadRequestException(`purpose must be one of: ${VALID_PURPOSES.join(', ')}`);
    }
    if (!confidence || !VALID_CONFIDENCE.includes(confidence)) {
      throw new BadRequestException(`confidence must be one of: ${VALID_CONFIDENCE.join(', ')}`);
    }
    if (!amount || amount <= 0) {
      throw new BadRequestException('amount must be greater than 0.');
    }
    if (!bankType || !VALID_BANK_TYPES.includes(bankType)) {
      throw new BadRequestException(`bankType must be one of: ${VALID_BANK_TYPES.join(', ')}`);
    }

    return { purpose, confidence, amount, bankType };
  }

  async searchLoanRates(params: LoanSearchQueryDto) {
    const { purpose, confidence, amount, bankType } = this.validateQuery(params);

    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 30);

    const endPeriod = today.toISOString().split('T')[0];
    const startPeriod = startDate.toISOString().split('T')[0];

    const banksData = await this.botApiService.fetchLoanRates(startPeriod, endPeriod);

    if (!Array.isArray(banksData) || banksData.length === 0) {
      throw new InternalServerErrorException('Loan rate data not found.');
    }

    const latestBanksMap = new Map<string, BotLoanRateItem>();
    banksData.forEach((bank) => {
      const current = latestBanksMap.get(bank.bank_name_th);
      if (!current || new Date(bank.period) > new Date(current.period)) {
        latestBanksMap.set(bank.bank_name_th, bank);
      }
    });

    let banks = Array.from(latestBanksMap.values());

    // ป้องกันกรณี BOT ส่งข้อมูลมาไม่ครบ field (bank_type_name_eng หาย)
    // ไม่ให้ .includes() โยน TypeError -> 500
    if (bankType === 'thai') {
      banks = banks.filter((b) =>
        (b.bank_type_name_eng ?? '').includes('registered in Thailand'),
      );
    } else if (bankType === 'foreign') {
      banks = banks.filter((b) =>
        (b.bank_type_name_eng ?? '').includes('Foreign'),
      );
    }

    const processedBanks: ProcessedBank[] = banks
      .filter(
        (b) => b[purpose] && b[purpose] !== '' && parseFloat(b[purpose]) > 0,
      )
      .map((b) => {
        const rate = parseFloat(b[purpose]);
        const defaultRate = parseFloat(b.default_rate) || rate;
        const penaltyGap = defaultRate - rate;
        const interestCost = amount * (rate / 100);

        return {
          bank_name: b.bank_name_th,
          type: b.bank_type_name_th,
          rate,
          default_rate: defaultRate,
          penaltyGap: penaltyGap.toFixed(2),
          interestCost,
          period: b.period,
        };
      });

    if (confidence === 'high') {
      processedBanks.sort((a, b) => a.rate - b.rate);
    } else {
      processedBanks.sort(
        (a, b) => parseFloat(a.penaltyGap) - parseFloat(b.penaltyGap),
      );
    }

    return {
      success: true,
      purpose,
      confidence,
      amount,
      bankType,
      data: processedBanks.slice(0, 5),
    };
  }
}
