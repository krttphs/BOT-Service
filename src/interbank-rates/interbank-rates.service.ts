import { Injectable,
    BadRequestException,
    NotFoundException,

} from '@nestjs/common';

import { BotApiService, BotInterbankItem } from '../bot-api/bot-api.service.js';
import { AnalyzeInterbankDto } from './dto/analyze-interbank.dto.js';

interface RateRecord {
  weighted_average_interest_rate: number;
  max_interest_rate: number;
  min_interest_rate: number;
}

interface StatsResult {
  average_interest_rate: number;
  highest_interest_rate: number;
  lowest_interest_rate: number;
  spread: number;
}

const VALID_TERMS = ['O/N', 'T/N', 'OFS', 'Call', 'Term'];

// Service สำหรับจัดการการวิเคราะห์อัตราดอกเบี้ยระหว่างธนาคาร
@Injectable()
export class InterbankRatesService {
  constructor(private readonly botApiService: BotApiService) {}

  validateQuery(query: AnalyzeInterbankDto) {
    const { start_period, end_period, term_type } = query;

    if (!start_period || !end_period || !term_type) {
      throw new BadRequestException('start_period, end_period and term_type are required.');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_period) || !dateRegex.test(end_period)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD.');
    }

    if (!VALID_TERMS.includes(term_type)) {
      throw new BadRequestException(`Invalid term_type. Must be one of: ${VALID_TERMS.join(', ')}`);
    }

    const startDate = new Date(start_period);
    const endDate = new Date(end_period);
    if (startDate > endDate) {
      throw new BadRequestException('start_period must not be after end_period.');
    }

    return { start_period, end_period, term_type };
  }

  filterByTermType(data: BotInterbankItem[], termType: string): BotInterbankItem[] {
    return data.filter((item) => {
      const itemTermEng = (item.term_type_name_eng || item.term_type_eng || '').toUpperCase();
      const itemTermTh = (item.term_type_name_th || item.term_type_th || '').toUpperCase();
      const target = termType.trim().toUpperCase();

      if (target === itemTermEng || target === itemTermTh) return true;
      if (target === 'O/N') {
        return itemTermEng.includes('OVERNIGHT') || itemTermEng.includes('O/N') || itemTermTh.includes('ข้ามคืน');
      }
      if (target === 'T/N') {
        return itemTermEng.includes('TOM') || itemTermEng.includes('T/N');
      }
      if (target === 'OFS') {
        return itemTermEng.includes('OFFSHORE') || itemTermEng.includes('OFS');
      }
      return itemTermEng.includes(target) || itemTermTh.includes(target);
    });
  }

  formatData(filteredData: BotInterbankItem[]): RateRecord[] {
    return filteredData
      .map((item) => {
        const rawAvg =
          item.weighted_average_interest_rate ??
          item.weighted_avg_interbank_rate ??
          item.avg_rate;
        const rawMax = item.max_interest_rate ?? item.max_rate;
        const rawMin = item.min_interest_rate ?? item.min_rate;

        const avgRate = parseFloat(rawAvg ?? '');
        const maxRate = parseFloat(rawMax ?? '');
        const minRate = parseFloat(rawMin ?? '');

        if (Number.isNaN(avgRate)) return null;

        return {
          weighted_average_interest_rate: avgRate,
          max_interest_rate: Number.isNaN(maxRate) ? avgRate : maxRate,
          min_interest_rate: Number.isNaN(minRate) ? avgRate : minRate,
        };
      })
      .filter((r): r is RateRecord => r !== null);
  }

  calculateStatistics(records: RateRecord[]): StatsResult {
    const totalRecords = records.length;

    const avgRates = records.map((r) => r.weighted_average_interest_rate);
    const maxRates = records.map((r) => r.max_interest_rate);
    const minRates = records.map((r) => r.min_interest_rate);

    const sumAvg = avgRates.reduce((acc, val) => acc + val, 0);
    const averageInterestRate = sumAvg / totalRecords;
    const highestInterestRate = Math.max(...maxRates);
    const lowestInterestRate = Math.min(...minRates);
    const spread = highestInterestRate - lowestInterestRate;

    return {
      average_interest_rate: parseFloat(averageInterestRate.toFixed(4)),
      highest_interest_rate: parseFloat(highestInterestRate.toFixed(4)),
      lowest_interest_rate: parseFloat(lowestInterestRate.toFixed(4)),
      spread: parseFloat(spread.toFixed(4)),
    };
  }

  calculateTrend(records: RateRecord[]): string | null {
    if (records.length < 2) return null;
    const firstHalf = records.slice(0, Math.floor(records.length / 2));
    const secondHalf = records.slice(Math.floor(records.length / 2));
    const avgFirst = firstHalf.reduce((s, r) => s + r.weighted_average_interest_rate, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, r) => s + r.weighted_average_interest_rate, 0) / secondHalf.length;
    const diff = avgSecond - avgFirst;
    if (Math.abs(diff) < 0.001) return 'STABLE';
    return diff > 0 ? 'Rising' : 'Falling';
  }

  calculateVolatility(records: RateRecord[]): string | null {
    if (records.length < 2) return null;
    const rates = records.map((r) => r.weighted_average_interest_rate);
    const avg = rates.reduce((s, v) => s + v, 0) / rates.length;
    const variance = rates.reduce((s, v) => s + (v - avg) ** 2, 0) / rates.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < 0.01) return 'Low';
    if (stdDev < 0.05) return 'Medium';
    return 'High';
  }

  calculateRateChange(records: RateRecord[]): number | null {
    if (records.length < 2) return null;
    const first = records[0].weighted_average_interest_rate;
    const last = records[records.length - 1].weighted_average_interest_rate;
    return parseFloat((last - first).toFixed(4));
  }

  async analyze(query: AnalyzeInterbankDto) {
    const { start_period, end_period, term_type } = this.validateQuery(query);

    const rawData = await this.botApiService.fetchInterbankRates(start_period, end_period);

    const filteredData = this.filterByTermType(rawData, term_type);

    if (filteredData.length === 0) {
      throw new NotFoundException('Interbank rate data not found.');
    }

    const records = this.formatData(filteredData);
    const stats = this.calculateStatistics(records);

    const lastRecord = filteredData[filteredData.length - 1];
    const effectiveEndPeriod = lastRecord?.period || end_period;
    const insufficientDate = records.length < 5;

    return {
      success: true,
      ...stats,
      trend: this.calculateTrend(records),
      volatility: this.calculateVolatility(records),
      rate_change: this.calculateRateChange(records),
      total_records: records.length,
      effective_end_period: effectiveEndPeriod,
      data_source: 'Bank of Thailand',
      insufficient_date: insufficientDate,
      warning_message: insufficientDate
        ? `พบข้อมูลเพียง ${records.length} รายการ ซึ่งน้อยกว่าเกณฑ์มาตรฐาน ผลการวิเคราะห์อาจไม่แม่นยำ`
        : undefined,
    };
  }
}
